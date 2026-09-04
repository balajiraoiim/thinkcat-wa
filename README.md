# ThinkCAT WhatsApp Microservice

This is a lightweight Node.js microservice using Baileys to send automated WhatsApp messages. It is designed to be hosted for **free** on Render.com.

## How to deploy on Render (100% Free)

1. **Push to GitHub**: Push this folder (`whatsapp-microservice`) to a new GitHub repository.
2. **Create Render App**: Go to [Render.com](https://render.com) and create a new **Web Service**.
3. **Connect Repository**: Connect the GitHub repository you just created.
4. **Configuration**:
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: **Free**
5. **Authenticate WhatsApp**:
   - Once the service deploys, click on **Logs** in the Render dashboard.
   - You will see a large QR code printed in the terminal logs.
   - Open WhatsApp on your phone -> Linked Devices -> Link a Device.
   - Scan the QR code on your computer screen.
   - *Note: Once scanned, Baileys saves the session in the `auth_info_baileys` folder so you don't need to scan it again.*

## Connecting to Vercel
Once deployed, Render will give you a URL (e.g. `https://thinkcat-wa.onrender.com`).
Go to your main Vercel project settings and add this environment variable:
`WHATSAPP_MICROSERVICE_URL=https://thinkcat-wa.onrender.com/api/send-welcome`
