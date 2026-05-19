# 🚀 AWS EC2 & LM Studio Connectivity Troubleshooting Guide

This guide details steps to fix connectivity issues between your React frontend, Express backend, and LM Studio server running on AWS EC2.

---

## 🔍 Root Causes and Solutions

### 1. Injected Environment is Empty (`injected env (0)`)
* **Symptom**: When running `node server.js`, the log says:
  ```
  injected env (0) from .env
  LM Studio → undefined
  ❌ Failed to fetch models from LM Studio: Invalid URL
  ```
* **Why this happens**: 
  1. The `.env` file does not exist on your EC2 instance (since `.env` is listed in `.gitignore` and is not committed to GitHub).
  2. The server was started from the `/backend` folder or another working directory, and the relative path `dotenv.config()` lookup failed to resolve it.
* **The Fix (Done!)**: We have updated `backend/server.js` to look up the `.env` file using an absolute path relative to `server.js` (`__dirname`).
* **Your Action**: You MUST create a `.env` file on your AWS EC2 instance. 
  1. SSH into your EC2 instance.
  2. Navigate to your backend directory:
     ```bash
     cd ~/voiceass/backend
     ```
  3. Create/edit the `.env` file:
     ```bash
     nano .env
     ```
  4. Paste the following configuration (replace the IP with your laptop's Tailscale IP, or your server IP):
     ```env
     PORT=5000
     NODE_ENV=production
     LM_STUDIO_BASE_URL=http://100.125.177.92:1234
     LM_STUDIO_MODEL=local-model
     ```
  5. Save the file (`Ctrl + O`, `Enter`, then `Ctrl + X`).

---

### 2. LM Studio Server Unreachable (Tailscale Routing)
* **Symptom**: The backend returns a `500` status with `Could not fetch models from LM Studio` or `LM Studio request failed`.
* **Why this happens**: 
  - `100.125.177.92` is a private **Tailscale VPN IP**. 
  - If your AWS EC2 instance is **not authenticated on your Tailscale network**, it has no path to route traffic to your local laptop!
* **The Fix**:
  1. **Install Tailscale on your EC2 instance**:
     ```bash
     curl -fsSL https://tailscale.com/install.sh | sh
     ```
  2. **Authenticate the EC2 node**:
     ```bash
     sudo tailscale up
     ```
     Copy the login URL printed in your terminal, paste it in your laptop's browser, and log in to add the EC2 instance to your network.
  3. **Verify the connection**:
     Try pinging your laptop from the EC2 terminal:
     ```bash
     ping 100.125.177.92
     ```
  4. **Allow Network Connections in LM Studio**:
     On your laptop, make sure LM Studio's sidebar setting for **"Cross-Origin Resource Sharing (CORS)"** is enabled and **"Allow Network Connections"** is checked.

---

### 3. AWS Security Group blocks Inbound Traffic (Port 5000)
* **Symptom**: You open `http://<YOUR-EC2-PUBLIC-IP>:5000` in your web browser, but it fails to load ("Site Can't Be Reached" / Timeout).
* **Why this happens**: AWS EC2 Security Groups block all incoming traffic by default, except for SSH (Port 22).
* **The Fix**:
  1. Log into your **AWS Console** and go to **EC2 Instances**.
  2. Click on your active instance, and select the **Security** tab at the bottom.
  3. Click on your **Security Group** (e.g., `sg-xxxxxxxx`).
  4. Click **Edit inbound rules**.
  5. Click **Add rule** and configure:
     * **Type**: Custom TCP
     * **Port Range**: `5000`
     * **Source**: `Anywhere-IPv4` (`0.0.0.0/0`)
     * **Description**: Express Backend & Statically Served Frontend
  6. Click **Save rules**.

---

### 4. Local Development Frontend Connecting to the Wrong Backend
* **Symptom**: You run `npm run dev` on your local laptop, but clicking "Start Session" fails or points to `localhost:5000` instead of AWS.
* **Why this happens**: Vite's proxy is hardcoded to look for the backend on your local computer (`localhost:5000`).
* **The Fix (Done!)**: We have implemented support for a dynamic base URL (`VITE_API_URL`) in the frontend api client.
* **Your Action**: If you want your locally-run frontend to connect to your remote AWS server:
  1. In your `frontend` directory on your laptop, create a file named `.env.local`:
     ```env
     VITE_API_URL=http://<YOUR-EC2-PUBLIC-IP>:5000
     ```
  2. Restart your local Vite server (`npm run dev`). Vite will now direct all API requests straight to your EC2 instance!

---

## 🏃‍♂️ Verification Steps

Once you've set up `.env` and connected Tailscale, verify the server is running correctly:

1. **Start the backend manually to inspect logs**:
   ```bash
   node server.js
   ```
   You should see:
   ```
   ╔══════════════════════════════════════════════╗
   ║  NOVA  –  EC2 Server  :5000                  ║
   ║  LM Studio → http://100.125.177.92:1234      ║
   ╚══════════════════════════════════════════════╝
   ```

2. **Test health endpoint from terminal or browser**:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return JSON with status `"ok"` and your configured LM Studio URL.
