import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HTTPServer } from 'node:http';
import type { GiveawayService } from '../services/giveawayService.js';

export class SocketManager {
  private io: SocketIOServer;
  private giveawayService: GiveawayService | null = null;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupListeners();
  }

  public setGiveawayService(service: GiveawayService): void {
    this.giveawayService = service;
  }

  private setupListeners(): void {
    this.io.on('connection', (socket: Socket) => {
      const clientType = socket.handshake.query.type || 'dashboard';
      const token = socket.handshake.query.token as string | undefined;

      // Send initial state snapshot immediately to newly connected client
      if (this.giveawayService) {
        const state = this.giveawayService.getStateSnapshot();
        socket.emit('state.sync', state);
      }

      // Handle client requesting a manual sync
      socket.on('request.sync', () => {
        if (this.giveawayService) {
          socket.emit('state.sync', this.giveawayService.getStateSnapshot());
        }
      });

      socket.on('disconnect', () => {
        // clean up if needed
      });
    });
  }

  /**
   * Broadcast an event to all connected sockets (dashboards & overlays)
   */
  public broadcast(event: string, payload: any): void {
    this.io.emit(event, payload);
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}
