# Deploying NoiseWatch on Railway

NoiseWatch is fully configured and ready for 1-click deployment on [Railway](https://railway.app).

---

## Method 1: Deploy via GitHub (Recommended - 2 Minutes)

1. **Push your code to GitHub**:
   If you have not already, push this project repository to your GitHub account:
   ```bash
   git add .
   git commit -m "Configure NoiseWatch for Railway deployment"
   git push origin main
   ```

2. **Open Railway Dashboard**:
   - Go to [railway.app](https://railway.app) and log in (or sign up with GitHub).
   - Click **"New Project"** -> **"Deploy from GitHub repo"**.
   - Select your **`noisewatch`** repository.

3. **Railway Auto-Detection**:
   - Railway will automatically detect the Node.js environment, run `npm run build` (`tsc`), and start the app with `npm run start` (`node dist/server.js`).

4. **Set Environment Variables (Optional but Recommended)**:
   In your Railway project service -> **Variables** tab, set:
   - `SESSION_SECRET`: Any random secure secret string (e.g. `nw_prod_sec_9384729104`).
   - `ADMIN_USERNAME`: Your preferred admin login (e.g. `admin` or your name).
   - `ADMIN_EMAIL`: `manish3singh7@gmail.com`
   - `ADMIN_PASSWORD`: Your secret admin password (e.g. `YourMasterPassword123`).
   - `PORT`: Railway automatically injects `$PORT`, no manual configuration needed!

5. **Generate a Public Domain**:
   - In Railway, click on your service -> **Settings** tab.
   - Under **Networking**, click **"Generate Domain"**.
   - Your live public URL will be active immediately (e.g. `https://noisewatch-production.up.railway.app`).

---

## Method 2: Deploy via Railway CLI

If you prefer using the command line:

1. **Install the Railway CLI**:
   ```bash
   npm i -g @railway/cli
   ```

2. **Log in to Railway**:
   ```bash
   railway login
   ```

3. **Initialize and Link**:
   ```bash
   railway init
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

5. **Generate Domain**:
   ```bash
   railway domain
   ```

---

## Included Railway Configurations

- **`railway.json`**: Configures the Nixpacks build system and start command.
- **`Dockerfile`**: Lightweight, multi-stage Alpine Docker container for instant containerized deployment.
- **`dist/` Path Resilience**: `server.ts` resolves templates, static assets, and persistent JSON storage whether running in development (`tsx server.ts`) or production (`node dist/server.js`).
