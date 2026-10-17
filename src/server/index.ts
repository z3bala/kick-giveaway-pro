import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';

import { getDatabase, closeDatabase } from './db.js';
import { KickBotService } from './services/kickBot.js';
import { GiveawayService } from './services/giveawayService.js';
import { SocketManager } from './sockets/socketManager.js';
import { createGiveawayRouter } from './routes/giveaway.js';
import { createKickRouter } from './routes/kick.js';
import { createSettingsRouter } from './routes/settings.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();
  const server = http.createServer(app);

  // Trust reverse proxy (Render, Cloudflare, etc.) for secure headers and cookies
  app.set('trust proxy', true);

  // Security & parsing middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Secret', 'Kick-Event-Type', 'Kick-Event-Signature'],
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Initialize SQLite persistence
  const db = getDatabase();

  // Initialize Real-time Socket Manager
  const socketManager = new SocketManager(server);

  // Initialize Kick Bot Service
  const kickBot = new KickBotService({
    channelSlug: process.env.KICK_CHANNEL_SLUG || 'demo_channel',
    broadcasterId: process.env.KICK_BROADCASTER_ID,
    accessToken: process.env.KICK_ACCESS_TOKEN,
    clientId: process.env.KICK_CLIENT_ID,
    clientSecret: process.env.KICK_CLIENT_SECRET,
    webhookSecret: process.env.KICK_WEBHOOK_SECRET,
    botReplyEnabled: process.env.BOT_REPLY_ENABLED !== 'false',
    botAnnounceWinner: process.env.BOT_ANNOUNCE_WINNER !== 'false',
    botChatCooldownMs: Number(process.env.BOT_CHAT_COOLDOWN_MS || 1500),
  });

  // Initialize Central Giveaway Service
  const giveawayService = new GiveawayService(db, kickBot, {
    emitEvent: (event: string, data: any) => socketManager.broadcast(event, data),
  });

  // Link GiveawayService with SocketManager for on-connect sync
  socketManager.setGiveawayService(giveawayService);

  // Mount API Routers
  app.use('/api/giveaway', createGiveawayRouter(giveawayService));
  app.use('/api/kick', createKickRouter(kickBot, giveawayService));
  app.use('/api/settings', createSettingsRouter(giveawayService));

  // Health check endpoint for cloud monitoring / pingers
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      kick: kickBot.getState().status,
      activeGiveaway: giveawayService.getActiveGiveaway()?.status || 'idle',
    });
  });

  // Serve static client assets in production
  const clientDist = path.resolve(__dirname, '../../dist/client');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return { app, server, db, kickBot, giveawayService, socketManager };
}

// Start server if this is the entry script
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('index.ts') || 
  process.argv[1].endsWith('index.js')
);

if (isMainModule || process.env.NODE_ENV !== 'test') {
  const PORT = Number(process.env.PORT || 3001);
  const HOST = process.env.HOST || '0.0.0.0';

  const { server, kickBot } = createApp();

  server.listen(PORT, HOST, () => {
    const appUrl = process.env.APP_URL || 'https://kick-giveaway-pro.onrender.com';
    console.log(`\n======================================================`);
    console.log(`🚀 KICK GIVEAWAY PRO — Server Running`);
    console.log(`📡 URL: ${appUrl}`);
    console.log(`🎮 Dashboard: ${appUrl}`);
    console.log(`🎬 OBS Overlay: ${appUrl}/overlay`);
    console.log(`🔌 Mode: ${process.env.NODE_ENV || 'production'}`);
    console.log(`======================================================\n`);

    // Initiate Kick Bot connection if channel is specified
    if (process.env.KICK_CHANNEL_SLUG && process.env.KICK_CHANNEL_SLUG !== 'demo_channel') {
      console.log(`[KickBot] Connecting to Kick channel: ${process.env.KICK_CHANNEL_SLUG}...`);
      kickBot.connect().catch((err) => {
        console.warn(`[KickBot] Auto-connect deferred:`, err.message);
      });
    }
  });

  const shutdown = () => {
    console.log('\n[Server] Gracefully shutting down...');
    server.close(() => {
      closeDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
