import type { Giveaway, Participant, OverlaySettings, AppSettings, StateSyncPayload } from '../../shared/types.js';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const adminSecret = localStorage.getItem('kgp_admin_secret');
    if (adminSecret) {
      headers['Authorization'] = `Bearer ${adminSecret}`;
    }

    return headers;
  }

  public setAdminSecret(secret: string): void {
    if (secret) {
      localStorage.setItem('kgp_admin_secret', secret);
    } else {
      localStorage.removeItem('kgp_admin_secret');
    }
  }

  public getAdminSecret(): string {
    return localStorage.getItem('kgp_admin_secret') || '';
  }

  public async getActiveState(): Promise<StateSyncPayload> {
    const res = await fetch('/api/giveaway/active');
    if (!res.ok) throw new Error(`Failed to fetch active state: ${res.statusText}`);
    return res.json();
  }

  public async createGiveaway(data: {
    title: string;
    prize: string;
    keyword: string;
    wheelEnabled?: boolean;
    wheelAmounts?: string[];
  }): Promise<Giveaway> {
    const res = await fetch('/api/giveaway/create', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create giveaway');
    return json.giveaway;
  }

  public async updateGiveawayWheel(wheelEnabled: boolean, wheelAmounts?: string[]): Promise<Giveaway> {
    const res = await fetch('/api/giveaway/wheel', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ wheelEnabled, wheelAmounts }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update wheel settings');
    return json.giveaway;
  }

  public async openGiveaway(giveawayId?: string): Promise<Giveaway> {
    const res = await fetch('/api/giveaway/open', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ giveawayId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to open giveaway');
    return json.giveaway;
  }

  public async closeGiveaway(giveawayId?: string): Promise<Giveaway> {
    const res = await fetch('/api/giveaway/close', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ giveawayId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to close giveaway');
    return json.giveaway;
  }

  public async updateKeyword(keyword: string): Promise<Giveaway> {
    const res = await fetch('/api/giveaway/keyword', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ keyword }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update keyword');
    return json.giveaway;
  }

  public async startDraw(): Promise<any> {
    const res = await fetch('/api/giveaway/draw', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to start draw');
    return json.drawData;
  }

  public async revealWinner(): Promise<{ winner: Participant; giveaway: Giveaway }> {
    const res = await fetch('/api/giveaway/reveal', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to reveal winner');
    return json;
  }

  public async resetGiveaway(): Promise<void> {
    const res = await fetch('/api/giveaway/reset', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Failed to reset giveaway');
    }
  }

  public async removeParticipant(participantId: string): Promise<void> {
    const res = await fetch('/api/giveaway/participants/remove', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ participantId }),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Failed to remove participant');
    }
  }

  public async manualAddParticipant(username: string): Promise<Participant> {
    const res = await fetch('/api/giveaway/participants/manual', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to add participant');
    return json.participant;
  }

  public async simulateChat(username: string, message: string): Promise<any> {
    const res = await fetch('/api/kick/simulate-chat', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username, message }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to simulate chat message');
    return json;
  }

  public async connectKick(channelSlug?: string): Promise<any> {
    const res = await fetch('/api/kick/connect', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ channelSlug }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to connect Kick bot');
    return json;
  }

  public async disconnectKick(): Promise<any> {
    const res = await fetch('/api/kick/disconnect', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to disconnect Kick bot');
    return json;
  }

  public async sendCustomChatMessage(message: string, type: 'bot' | 'user' = 'bot'): Promise<any> {
    const res = await fetch('/api/kick/test-chat', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ message, type }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to send message to Kick chat');
    return json;
  }

  public async updateOverlaySettings(settings: Partial<OverlaySettings>): Promise<OverlaySettings> {
    const res = await fetch('/api/settings/overlay', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update overlay settings');
    return json.settings;
  }

  public async updateAppSettings(settings: Partial<AppSettings> & { kickClientSecret?: string; kickAccessToken?: string; adminSecret?: string }): Promise<AppSettings> {
    const res = await fetch('/api/settings/app', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update app settings');
    return json.settings;
  }

  public async getHistory(): Promise<Giveaway[]> {
    const res = await fetch('/api/giveaway/history');
    if (!res.ok) throw new Error('Failed to fetch giveaway history');
    const json = await res.json();
    return json.history || [];
  }
}

export const api = new ApiClient();
