import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Giveaway, Participant, OverlaySettings, AppSettings, GtbEvent, GtbGuess, GtbStatus } from '../shared/types.js';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(customPath?: string): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = customPath || process.env.DATABASE_PATH || './data/giveaway.db';

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  dbInstance = new DatabaseSync(dbPath);
  initDatabase(dbInstance);
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function initDatabase(db: DatabaseSync): void {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS giveaways (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      prize TEXT NOT NULL,
      keyword TEXT NOT NULL,
      status TEXT NOT NULL,
      winner_id TEXT,
      winner_username TEXT,
      participant_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      opened_at TEXT,
      closed_at TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      giveaway_id TEXT NOT NULL,
      kick_user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      joined_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      UNIQUE(giveaway_id, kick_user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_participants_giveaway 
      ON participants (giveaway_id, status);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_logs (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      is_bot INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS gtb_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      prize TEXT NOT NULL,
      keyword TEXT NOT NULL DEFAULT '!gtb',
      status TEXT NOT NULL DEFAULT 'open',
      final_balance REAL,
      winner_id TEXT,
      winner_username TEXT,
      winner_guess REAL,
      winner_diff REAL,
      created_at TEXT NOT NULL,
      closed_at TEXT,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS gtb_guesses (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      kick_user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      guess REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(event_id, kick_user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_gtb_guesses_event
      ON gtb_guesses (event_id);
  `);

  try { db.exec(`ALTER TABLE giveaways ADD COLUMN wheel_enabled INTEGER DEFAULT 0;`); } catch {}
  try { db.exec(`ALTER TABLE giveaways ADD COLUMN wheel_amounts TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE giveaways ADD COLUMN rolled_prize TEXT;`); } catch {}
}

// ---------------- Database Access Operations ----------------

export const dbOps = {
  // Giveaways
  getActiveGiveaway(db: DatabaseSync): Giveaway | null {
    const row = db.prepare(`
      SELECT * FROM giveaways 
      WHERE status IN ('draft', 'open', 'closed', 'drawing')
      ORDER BY created_at DESC 
      LIMIT 1
    `).get() as any;

    if (!row) return null;
    return mapGiveawayRow(row);
  },

  getGiveawayById(db: DatabaseSync, id: string): Giveaway | null {
    const row = db.prepare(`SELECT * FROM giveaways WHERE id = ?`).get(id) as any;
    if (!row) return null;
    return mapGiveawayRow(row);
  },

  createGiveaway(db: DatabaseSync, giveaway: Omit<Giveaway, 'participantCount'>): Giveaway {
    db.prepare(`
      INSERT INTO giveaways (id, title, prize, keyword, status, created_at, wheel_enabled, wheel_amounts)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      giveaway.id,
      giveaway.title,
      giveaway.prize,
      giveaway.keyword,
      giveaway.status,
      giveaway.createdAt,
      giveaway.wheelEnabled ? 1 : 0,
      giveaway.wheelAmounts ? JSON.stringify(giveaway.wheelAmounts) : null
    );

    return {
      ...giveaway,
      winnerId: null,
      winnerUsername: null,
      participantCount: 0,
      openedAt: null,
      closedAt: null,
      completedAt: null,
      rolledPrize: null,
    };
  },

  updateGiveawayStatus(
    db: DatabaseSync,
    id: string,
    status: Giveaway['status'],
    timestamps?: { openedAt?: string; closedAt?: string; completedAt?: string }
  ): void {
    if (timestamps?.openedAt) {
      db.prepare(`UPDATE giveaways SET status = ?, opened_at = ? WHERE id = ?`).run(status, timestamps.openedAt, id);
    } else if (timestamps?.closedAt) {
      db.prepare(`UPDATE giveaways SET status = ?, closed_at = ? WHERE id = ?`).run(status, timestamps.closedAt, id);
    } else if (timestamps?.completedAt) {
      db.prepare(`UPDATE giveaways SET status = ?, completed_at = ? WHERE id = ?`).run(status, timestamps.completedAt, id);
    } else {
      db.prepare(`UPDATE giveaways SET status = ? WHERE id = ?`).run(status, id);
    }
  },

  updateGiveawayRolledPrize(db: DatabaseSync, id: string, rolledPrize: string): void {
    db.prepare(`UPDATE giveaways SET rolled_prize = ?, prize = ? WHERE id = ?`).run(rolledPrize, rolledPrize, id);
  },

  setGiveawayWinner(
    db: DatabaseSync,
    id: string,
    winnerId: string,
    winnerUsername: string,
    completedAt: string,
    rolledPrize?: string
  ): void {
    if (rolledPrize) {
      db.prepare(`
        UPDATE giveaways 
        SET status = 'completed', winner_id = ?, winner_username = ?, completed_at = ?, rolled_prize = ?, prize = ?
        WHERE id = ?
      `).run(winnerId, winnerUsername, completedAt, rolledPrize, rolledPrize, id);
    } else {
      db.prepare(`
        UPDATE giveaways 
        SET status = 'completed', winner_id = ?, winner_username = ?, completed_at = ?
        WHERE id = ?
      `).run(winnerId, winnerUsername, completedAt, id);
    }
  },

  updateGiveawayKeyword(db: DatabaseSync, id: string, keyword: string): void {
    db.prepare(`UPDATE giveaways SET keyword = ? WHERE id = ?`).run(keyword, id);
  },

  getGiveawayHistory(db: DatabaseSync, limit = 50): Giveaway[] {
    const rows = db.prepare(`
      SELECT * FROM giveaways 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit) as any[];

    return rows.map(mapGiveawayRow);
  },

  // Participants
  getParticipants(db: DatabaseSync, giveawayId: string): Participant[] {
    const rows = db.prepare(`
      SELECT * FROM participants 
      WHERE giveaway_id = ? 
      ORDER BY joined_at ASC
    `).all(giveawayId) as any[];

    return rows.map(mapParticipantRow);
  },

  getActiveParticipants(db: DatabaseSync, giveawayId: string): Participant[] {
    const rows = db.prepare(`
      SELECT * FROM participants 
      WHERE giveaway_id = ? AND status = 'active'
      ORDER BY joined_at ASC
    `).all(giveawayId) as any[];

    return rows.map(mapParticipantRow);
  },

  addParticipant(
    db: DatabaseSync,
    participant: { id: string; giveawayId: string; kickUserId: string; username: string; joinedAt: string }
  ): boolean {
    try {
      const stmt = db.prepare(`
        INSERT INTO participants (id, giveaway_id, kick_user_id, username, joined_at, status)
        VALUES (?, ?, ?, ?, ?, 'active')
        ON CONFLICT(giveaway_id, kick_user_id) DO UPDATE SET
          status = 'active',
          username = excluded.username,
          joined_at = excluded.joined_at
        WHERE status = 'removed'
      `);

      const result = stmt.run(
        participant.id,
        participant.giveawayId,
        participant.kickUserId,
        participant.username,
        participant.joinedAt
      ) as any;

      if (result && typeof result.changes === 'number' && result.changes === 0) {
        return false; // Already entered
      }

      // Increment count
      db.prepare(`
        UPDATE giveaways 
        SET participant_count = (SELECT COUNT(*) FROM participants WHERE giveaway_id = ? AND status = 'active')
        WHERE id = ?
      `).run(participant.giveawayId, participant.giveawayId);

      return true;
    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return false; // Already entered
      }
      throw err;
    }
  },

  removeParticipant(db: DatabaseSync, giveawayId: string, participantId: string): boolean {
    const result = db.prepare(`
      UPDATE participants 
      SET status = 'removed' 
      WHERE id = ? AND giveaway_id = ?
    `).run(participantId, giveawayId);

    if (result.changes > 0) {
      db.prepare(`
        UPDATE giveaways 
        SET participant_count = (SELECT COUNT(*) FROM participants WHERE giveaway_id = ? AND status = 'active')
        WHERE id = ?
      `).run(giveawayId, giveawayId);
      return true;
    }
    return false;
  },

  // Settings
  getSetting<T>(db: DatabaseSync, key: string, defaultValue: T): T {
    const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as any;
    if (!row) return defaultValue;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return row.value as unknown as T;
    }
  },

  saveSetting(db: DatabaseSync, key: string, value: any): void {
    const strVal = typeof value === 'string' ? value : JSON.stringify(value);
    db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, strVal);
  },

  // Chat Logs
  addChatLog(db: DatabaseSync, log: { id: string; username: string; content: string; timestamp: string; isBot: boolean }): void {
    db.prepare(`
      INSERT INTO chat_logs (id, username, content, timestamp, is_bot)
      VALUES (?, ?, ?, ?, ?)
    `).run(log.id, log.username, log.content, log.timestamp, log.isBot ? 1 : 0);
  },

  getRecentChatLogs(db: DatabaseSync, limit = 50): any[] {
    return db.prepare(`
      SELECT * FROM chat_logs 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(limit) as any[];
  },

  // ---------------- Guess The Balance (GTB) ----------------
  getActiveGtbEvent(db: DatabaseSync): GtbEvent | null {
    const row = db.prepare(`
      SELECT e.*, (SELECT COUNT(*) FROM gtb_guesses g WHERE g.event_id = e.id) as guess_count
      FROM gtb_events e
      WHERE e.status IN ('open', 'closed')
      ORDER BY e.created_at DESC
      LIMIT 1
    `).get() as any;
    if (!row) return null;
    return mapGtbEventRow(row);
  },

  getLatestGtbEvent(db: DatabaseSync): GtbEvent | null {
    const row = db.prepare(`
      SELECT e.*, (SELECT COUNT(*) FROM gtb_guesses g WHERE g.event_id = e.id) as guess_count
      FROM gtb_events e
      ORDER BY e.created_at DESC
      LIMIT 1
    `).get() as any;
    if (!row) return null;
    return mapGtbEventRow(row);
  },

  getGtbEventById(db: DatabaseSync, id: string): GtbEvent | null {
    const row = db.prepare(`
      SELECT e.*, (SELECT COUNT(*) FROM gtb_guesses g WHERE g.event_id = e.id) as guess_count
      FROM gtb_events e
      WHERE e.id = ?
    `).get(id) as any;
    if (!row) return null;
    return mapGtbEventRow(row);
  },

  createGtbEvent(db: DatabaseSync, event: Omit<GtbEvent, 'guessCount'>): GtbEvent {
    db.prepare(`
      INSERT INTO gtb_events (id, title, prize, keyword, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(event.id, event.title, event.prize, event.keyword, event.status, event.createdAt);

    return {
      ...event,
      finalBalance: null,
      winnerId: null,
      winnerUsername: null,
      winnerGuess: null,
      winnerDiff: null,
      guessCount: 0,
      closedAt: null,
      resolvedAt: null,
    };
  },

  updateGtbEventStatus(
    db: DatabaseSync,
    id: string,
    status: GtbStatus,
    timestamps?: { closedAt?: string; resolvedAt?: string }
  ): void {
    const parts = ['status = ?'];
    const values: any[] = [status];

    if (timestamps?.closedAt) {
      parts.push('closed_at = ?');
      values.push(timestamps.closedAt);
    }
    if (timestamps?.resolvedAt) {
      parts.push('resolved_at = ?');
      values.push(timestamps.resolvedAt);
    }

    values.push(id);
    db.prepare(`UPDATE gtb_events SET ${parts.join(', ')} WHERE id = ?`).run(...values);
  },

  resolveGtbEvent(
    db: DatabaseSync,
    id: string,
    finalBalance: number,
    winnerId: string,
    winnerUsername: string,
    winnerGuess: number,
    winnerDiff: number
  ): void {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE gtb_events
      SET status = 'resolved',
          final_balance = ?,
          winner_id = ?,
          winner_username = ?,
          winner_guess = ?,
          winner_diff = ?,
          resolved_at = ?
      WHERE id = ?
    `).run(finalBalance, winnerId, winnerUsername, winnerGuess, winnerDiff, now, id);
  },

  getGtbGuesses(db: DatabaseSync, eventId: string): GtbGuess[] {
    const rows = db.prepare(`
      SELECT * FROM gtb_guesses
      WHERE event_id = ?
      ORDER BY updated_at ASC
    `).all(eventId) as any[];

    return rows.map(mapGtbGuessRow);
  },

  upsertGtbGuess(db: DatabaseSync, guess: GtbGuess): { isNew: boolean; guess: GtbGuess } {
    const existing = db.prepare(`
      SELECT * FROM gtb_guesses WHERE event_id = ? AND kick_user_id = ?
    `).get(guess.eventId, guess.kickUserId) as any;

    if (existing) {
      // Viewer already guessed: predictions are final and cannot be changed
      return {
        isNew: false,
        guess: mapGtbGuessRow(existing),
      };
    } else {
      db.prepare(`
        INSERT INTO gtb_guesses (id, event_id, kick_user_id, username, guess, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        guess.id,
        guess.eventId,
        guess.kickUserId,
        guess.username,
        guess.guess,
        guess.createdAt,
        guess.updatedAt
      );

      return { isNew: true, guess };
    }
  },

  getRecentGtbEvents(db: DatabaseSync, limit = 10): GtbEvent[] {
    const rows = db.prepare(`
      SELECT e.*, (SELECT COUNT(*) FROM gtb_guesses g WHERE g.event_id = e.id) as guess_count
      FROM gtb_events e
      ORDER BY e.created_at DESC
      LIMIT ?
    `).all(limit) as any[];

    return rows.map(mapGtbEventRow);
  }
};

function mapGiveawayRow(row: any): Giveaway {
  let wheelAmounts: string[] | undefined = undefined;
  if (row.wheel_amounts) {
    try {
      wheelAmounts = JSON.parse(row.wheel_amounts);
    } catch {}
  }

  return {
    id: row.id,
    title: row.title,
    prize: row.prize,
    keyword: row.keyword,
    status: row.status,
    winnerId: row.winner_id,
    winnerUsername: row.winner_username,
    participantCount: Number(row.participant_count || 0),
    createdAt: row.created_at,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    completedAt: row.completed_at,
    wheelEnabled: Boolean(row.wheel_enabled),
    wheelAmounts,
    rolledPrize: row.rolled_prize || null,
  };
}

function mapParticipantRow(row: any): Participant {
  return {
    id: row.id,
    giveawayId: row.giveaway_id,
    kickUserId: row.kick_user_id,
    username: row.username,
    joinedAt: row.joined_at,
    status: row.status,
  };
}

function mapGtbEventRow(row: any): GtbEvent {
  return {
    id: row.id,
    title: row.title,
    prize: row.prize,
    keyword: row.keyword || '!gtb',
    status: row.status as GtbStatus,
    finalBalance: row.final_balance !== null && row.final_balance !== undefined ? Number(row.final_balance) : null,
    winnerId: row.winner_id,
    winnerUsername: row.winner_username,
    winnerGuess: row.winner_guess !== null && row.winner_guess !== undefined ? Number(row.winner_guess) : null,
    winnerDiff: row.winner_diff !== null && row.winner_diff !== undefined ? Number(row.winner_diff) : null,
    guessCount: Number(row.guess_count || 0),
    createdAt: row.created_at,
    closedAt: row.closed_at,
    resolvedAt: row.resolved_at,
  };
}

function mapGtbGuessRow(row: any): GtbGuess {
  return {
    id: row.id,
    eventId: row.event_id,
    kickUserId: row.kick_user_id,
    username: row.username,
    guess: Number(row.guess),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
