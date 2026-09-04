const express = require('express');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const cors = require('cors');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());
app.use(cors());

let sock;
let isConnected = false;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('Scan the QR code below to link WhatsApp:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to', lastDisconnect.error, ', reconnecting:', shouldReconnect);
            isConnected = false;
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ WhatsApp Web session established!');
            isConnected = true;
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

connectToWhatsApp();

app.post('/api/send-welcome', async (req, res) => {
    try {
        const { phone, name } = req.body;
        
        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        if (!isConnected) {
            return res.status(503).json({ error: 'WhatsApp is not connected yet.' });
        }

        // Format phone number to JID
        let jid = phone.replace(/[^0-9]/g, '');
        if (!jid.startsWith('91')) {
            jid = '91' + jid; // Default to India if not specified
        }
        jid = jid + '@s.whatsapp.net';

        const firstName = name ? name.split(' ')[0] : 'there';
        
        const message = `🚀 *Welcome to ThinkCAT, ${firstName}!*

We are thrilled to support your CAT prep journey. You now have access to our official past-year question archive! 

🤝 *Join our Private Community*
Discuss strategies and resolve doubts with fellow 99+ percentile aspirants:
https://chat.whatsapp.com/F9U9dyyluGM7I1ez9KnJYt

⭐ *When you're ready for the real deal:*
Upgrade to *ThinkCAT Pro* to unlock the authentic TCS iON Exam Simulator and 27 full-length sectional mocks to build your exam stamina.

We're rooting for you!
- Balaji Rao`;

        await sock.sendMessage(jid, { text: message });
        
        res.json({ success: true, message: 'Welcome message sent!' });
    } catch (error) {
        console.error('Failed to send WhatsApp message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: isConnected ? 'connected' : 'disconnected' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
