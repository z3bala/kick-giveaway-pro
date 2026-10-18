# 🎮 KICK GIVEAWAY PRO

A complete, production-quality giveaway management bot and animated **CS-style horizontal name-roll OBS overlay** built specifically for Kick livestreaming channels.

Features a real-time streamer dashboard, automated Kick chat message listener, cryptographic zero-modulo-bias winner selection, transparent Browser Source overlay for OBS Studio, SQLite persistence, and zero-cost cloud deployment architecture.

---

## 🌟 Key Features

- **Real-Time Kick Chat Integration**:
  - Connects to your Kick channel chat via WebSocket gateway (`Pusher cluster us2`) for live chat ingestion without requiring a public static IP or webhook tunnel during local streams.
  - Supports official Kick Developer API (`POST https://api.kick.com/public/v1/chat`) for sending automated entry confirmations and winner announcements.
  - Official Webhook receiver (`POST /api/kick/webhook`) verifying `Kick-Event-Signature` for cloud webhook deployments.
  - Anti-flood queue and configurable cooldown (e.g., 1500ms) to prevent chat spam and platform rate limiting.
- **CS-Style Horizontal Name Roll Animation**:
  - Original case-opening style horizontal strip animation with smooth `requestAnimationFrame` gliding physics.
  - Fixed center target reticle with animated arrows and pulsing indicator line.
  - Realistic physics: instant acceleration, high-speed cruise, and prolonged cinematic deceleration (`cubic-bezier` / custom exponential glide) stopping precisely on the winning card.
  - Procedural Web Audio API sound synthesizer (mechanical card-tick clicks as cards pass center, plus celebratory victory fanfare chime). Zero external audio files required!
  - Confetti burst celebration (`canvas-confetti`) with prominent winner username and prize display.
- **Dedicated Standalone OBS Overlay (`/overlay`)**:
  - 100% transparent background by default for seamless layering on 1080p OBS scenes.
  - Real-time synchronization with automatic WebSocket reconnection.
  - Responsive layout scaling with configurable zoom and accent color customization.
- **Cryptographic Winner Selection Integrity**:
  - Uniform random selection using `crypto.randomInt(0, count)` from Node.js crypto (rejection sampling with **zero modulo bias**).
  - Selected and frozen *before* the animation begins; frontend cannot alter or influence the draw.
- **Slot Battle Tournament System (`!Pslot`)**:
  - Live 8-player and 16-player single-elimination slot battle brackets for stream competitions.
  - Triggered via Kick chat command: `!Pslot [slot name]` (e.g., `!Pslot Gates of Olympus`, `!Pslot Lilith's Curse`).
  - Strict authorization: only channel broadcaster and moderators can create, reset, or manage tournaments.
  - Full manual streamer match control: you decide who wins every slot battle directly from the website.
  - Automatic progression: winners advance to their exact next-round position; losers are eliminated.
  - Mistake correction: downstream match invalidation protection with confirmation safeguards.
  - Exact Kick chat announcements:
    - Tournament start: `🏆 Slot Battle has started!`
    - Matchup progression: `⚔️ Ahmed vs Mohamed`
    - Final match: `🏆 FINAL: Ahmed vs Karim`
    - Champion declaration: `👑 Ahmed wins the Slot Battle!`
  - Dedicated OBS Studio live tournament overlay (`/overlay/slot-tournament`).
- **Persistent SQLite Storage**:
  - Built-in SQLite database storing active giveaways, participants, Guess The Balance events, and Slot Battle tournaments.
  - Server restart resilience: previous records, bracket matchups, and announcement states are preserved across restarts.
- **Built-In Chat Simulator & Test Suite**:
  - Test giveaways offline or before streaming: simulate single or batch viewers entering with `!join` or `!Pslot`, verify duplicate rejection, and test the OBS overlay.

---

## 📐 Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │              KICK PLATFORM                   │
                      │  • dev.kick.com Public API (chat:write)      │
                      │  • Pusher WebSocket Gateway (chat.message)   │
                      │  • Official Webhooks (chat.message.sent)     │
                      └──────────────────────▲───────────────────────┘
                                             │
                                   OAuth / WebSocket
                                             │
                      ┌──────────────────────▼───────────────────────┐
                      │          KICK GIVEAWAY PRO BACKEND           │
                      │                                              │
                      │  • Express HTTP & REST API                   │
                      │  • Socket.IO Real-Time Event Engine          │
                      │  • Giveaway Lifecycle State Machine          │
                      │  • crypto.randomInt Winner Selection         │
                      │  • Native Node SQLite Persistence            │
                      └──────────────┬────────────────▲──────────────┘
                                     │                │
                         Socket.IO State Sync   Socket.IO State Sync
                                     │                │
            ┌────────────────────────▼───┐        ┌───┴────────────────────────┐
            │     STREAMER DASHBOARD     │        │     OBS BROWSER SOURCE     │
            │(https://kick-giveaway-pro. │        │(https://kick-giveaway-pro. │
            │      onrender.com)         │        │   onrender.com/overlay)    │
            │  • Overview & Stat Cards   │        │                            │
            │  • Lifecycle Controls      │        │  • Transparent Background  │
            │  • Live Participants Table │        │  • Live Status Badge       │
            │  • Overlay Preview Studio  │        │  • CS-Style Horizontal Roll│
            │  • Chat Simulator Panel    │        │  • Web Audio SFX Engine    │
            │  • Giveaway Archive        │        │  • Winner Card & Confetti  │
            └────────────────────────────┘        └────────────────────────────┘
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: v20 or higher (v24 recommended for built-in SQLite support)
- **npm**: v10 or higher

### Installation & Run

1. **Clone or navigate to the repository:**
   ```bash
   cd kick-giveaway-pro
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *(By default, `.env` includes sensible defaults for testing and local development).*

4. **Run the production server:**
   ```bash
   # Build the frontend and backend:
   npm run build

   # Start the server:
   npm run start
   ```

   *Alternatively, for hot-reloading development:*
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - **Streamer Dashboard:** [https://kick-giveaway-pro.onrender.com](https://kick-giveaway-pro.onrender.com)
   - **OBS Studio Overlay:** [https://kick-giveaway-pro.onrender.com/overlay](https://kick-giveaway-pro.onrender.com/overlay)

---

## 🔑 Official Kick Developer API Setup

To enable your bot to send chat messages, confirm entries, and announce winners in your Kick channel chat:

### 1. Register an Application on Kick
1. Navigate to the official **Kick Developer Portal**: [https://dev.kick.com](https://dev.kick.com)
2. Log in with your Kick streamer or bot account.
3. Click **Create Application**.
4. Set the **Redirect URL** to: `https://kick-giveaway-pro.onrender.com/api/kick/callback`
5. Copy your **Client ID** and **Client Secret**.

### 2. Request Permissions (Scopes)
Ensure your application requests the following scopes:
- `chat:write` — Allows the bot to send entry confirmations and winner announcements.
- `channel:read` — Allows querying channel broadcaster ID and metadata.
- `events:subscribe` — Allows webhook event subscriptions (optional for webhook mode).

### 3. Generate OAuth Access Token
Generate an OAuth access token with the `chat:write` and `channel:read` scopes.

### 4. Configure in Dashboard
1. Open the **Settings** tab in the Kick Giveaway Pro dashboard.
2. Enter your **Channel Slug** (e.g., `frixen1`).
3. Enter your **Client ID**, **Client Secret**, and **OAuth Access Token**.
4. Click **Save Configuration**.
5. Click **Connect Now** to establish the chat stream connection.

> **Note**: Even without Kick credentials, you can fully test and run giveaways using the built-in **Chat Simulator**!

---

## 🎬 OBS Studio Setup Guide

Follow these steps to add the giveaway overlay to OBS Studio:

1. **Open OBS Studio**.
2. In the **Sources** panel, click the **`+`** icon and select **Browser**.
3. Name the source (e.g., `Kick Giveaway Overlay`) and click **OK**.
4. Configure the Browser Source settings:
   - **URL**: `https://kick-giveaway-pro.onrender.com/overlay?token=streamer-obs-overlay-key-2026`
   - **Width**: `1920`
   - **Height**: `1080`
   - **FPS**: `60`
   - **Custom CSS**: Leave empty (the overlay has full built-in transparency).
   - ✅ Check **"Shutdown source when not visible"** (optional, recommended for scene hygiene).
   - ✅ Check **"Refresh browser when scene becomes active"**.
5. Click **OK**.
6. The overlay will be completely invisible when idle, and will automatically display when a giveaway is opened, drawing, or won!

### Slot Battle Tournament OBS Overlay

To display the live interactive tournament bracket on stream:

1. In OBS Studio, add a new **Browser** Source named `Slot Battle Overlay`.
2. Configure settings:
   - **URL**: `http://localhost:3001/overlay/slot-tournament?token=streamer-obs-overlay-key-2026` *(or your deployment URL)*
   - **Width**: `1920`
   - **Height**: `1080`
   - **FPS**: `60`
   - **Custom CSS**: Leave empty (includes full transparency and high-contrast esports theme).
3. The overlay updates in real-time via WebSockets as you select winners in the dashboard—no OBS refresh needed!

---

## 🎲 Cryptographic Winner Selection Integrity

Winner integrity is guaranteed through mathematical principles:

1. **Zero Modulo Bias**: Standard `rand() % N` introduces modulo bias when the integer range is not an exact divisor of the random source. We utilize Node.js `crypto.randomInt(0, eligibleCount)`, which implements cryptographically secure rejection sampling under the hood to ensure an exact uniform distribution across all entrants.
2. **Pre-Determined Draw**: The winner is selected and stored in the database *before* the animation begins. The CS-style roll only reveals the result and cannot be manipulated by client timing, DOM inspection, or network jitter.
3. **Participant Snapshot**: The eligible entrants are snapshotted at the moment of draw. Any chat entries received after registration closes or during the draw are discarded.
4. **Database Record**: Each completed giveaway persists the winning user ID, username, giveaway ID, entrant count, and timestamp in SQLite.

---

## ☁️ Zero-Cost Cloud Deployment Strategy

This application is engineered to run completely **free of cost** on modern cloud hosting platforms without requiring paid databases or subscriptions:

| Platform | Recommended Tier | Web Service | Storage Strategy | Limitations & Considerations |
| :--- | :--- | :--- | :--- | :--- |
| **Render.com** | Free Web Service | Node.js (via `render.yaml`) | Persistent Disk (1 GB free) or SQLite | Free instances spin down after 15 min of inactivity. Keep alive during streams via health check pinger. |
| **Railway** | Starter / Free Credits | Docker (via `Dockerfile`) | Persistent Volume Mount | Generous monthly execution limits. |
| **Fly.io** | Free Allowance | Fly Machine (via `fly.toml`) | 1 GB Free Volume Mount | Minimal latency, continuous container execution. |
| **Local Streamer PC** | Self-Hosted (Free) | Local Node.js / Docker | Local disk (`./data/giveaway.db`) | **0ms latency**, highest reliability during live streams, 100% uptime with no sleep cycles. |

### Free-Tier Inactivity / Sleep Mitigation
If deploying to Render free tier:
- The server will sleep after 15 minutes without HTTP requests.
- To prevent sleeping during live streams, set up a free scheduled ping (e.g. using UptimeRobot or Cron-job.org) targeting `https://<your-app>.onrender.com/api/health` every 10 minutes while live.
- WebSocket connections automatically reconnect with exponential backoff if a restart occurs.

---

## 🧪 Automated Testing

Kick Giveaway Pro includes a comprehensive test suite built with **Vitest** and **Supertest**:

```bash
# Run all unit and integration tests:
npm test

# Run tests in watch mode:
npm run test:watch
```

Test coverage includes:
- **Unit**: Cryptographic uniform winner selection and modulo bias elimination (`winnerPicker.test.ts`).
- **Unit**: Giveaway lifecycle state transitions, duplicate prevention, and closed rejection (`giveawayService.test.ts`).
- **Unit**: KickBot message parsing, connection events, and anti-flood rate limits (`kickBot.test.ts`).
- **Integration**: Full end-to-end REST API lifecycle, admin authorization enforcement, and webhook processing (`api.test.ts`).

---

## 🛠️ Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Chat commands (`!join`) not entering** | Giveaway status is not `open`. | Click **Open Entries** in Dashboard to enable registration. |
| **Duplicate entry rejected** | Viewer already registered. | The system enforces strict 1-entry-per-viewer to ensure fairness. |
| **No audio in OBS Browser Source** | OBS Browser audio unhooked or muted. | In OBS source properties, check **"Control audio via OBS"** and adjust in the Audio Mixer. |
| **Overlay has black background** | Browser source background issue. | Overlay is transparent by default. Ensure OBS Browser Source does not override with custom CSS `background: black`. |
| **Kick Bot status: `error`** | Invalid channel slug or network timeout. | Check that the channel name in Settings is spelled correctly without special characters. |
| **Cannot perform dashboard action** | `ADMIN_SECRET` configured but session key not entered. | Click **Set Admin Key** in top header and enter your secret passphrase. |
