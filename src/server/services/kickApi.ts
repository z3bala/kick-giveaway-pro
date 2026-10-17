/**
 * Client for interacting with the official Kick Developer REST API (https://docs.kick.com).
 */
export class KickApiClient {
  private baseUrl = 'https://api.kick.com';

  constructor(
    private clientId?: string,
    private clientSecret?: string,
    private accessToken?: string
  ) {}

  public setAccessToken(token: string) {
    this.accessToken = token;
  }

  public setCredentials(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Get channel info by slug (broadcaster_user_id, slug, etc.)
   */
  public async getChannelBySlug(slug: string): Promise<{ broadcaster_user_id?: string; slug: string; id?: string } | null> {
    if (!this.accessToken) {
      // If no token is provided, fall back to Kick's public channel endpoint
      try {
        const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KickGiveawayPro/1.0',
            'Accept': 'application/json',
          },
        });
        if (!res.ok) return null;
        const data = (await res.json()) as any;
        return {
          broadcaster_user_id: String(data.user_id || data.id || ''),
          slug: data.slug || slug,
          id: String(data.id || ''),
        };
      } catch {
        return null;
      }
    }

    try {
      const res = await fetch(`${this.baseUrl}/public/v1/channels?slug=${encodeURIComponent(slug)}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Kick API channel query failed (${res.status}): ${errText}`);
      }

      const data = (await res.json()) as any;
      const channel = Array.isArray(data) ? data[0] : (data.data ? data.data[0] : data);
      if (!channel) return null;

      return {
        broadcaster_user_id: String(channel.broadcaster_user_id || channel.id || ''),
        slug: channel.slug || slug,
        id: String(channel.id || ''),
      };
    } catch (err: any) {
      console.error('[KickApiClient] Failed to fetch channel info:', err.message);
      return null;
    }
  }

  /**
   * Send a chat message into a Kick channel chatroom.
   * Target endpoint: POST /public/v1/chat
   */
  public async sendChatMessage(broadcasterUserId: string, content: string): Promise<boolean> {
    if (!this.accessToken) {
      console.warn('[KickApiClient] Cannot send chat message: No Kick access token configured.');
      return false;
    }

    try {
      const res = await fetch(`${this.baseUrl}/public/v1/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          type: 'user',
          content: content.slice(0, 500),
          broadcaster_user_id: broadcasterUserId ? Number(broadcasterUserId) : undefined,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[KickApiClient] Send message failed (${res.status}): ${errText}`);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error('[KickApiClient] Network error sending chat message:', err.message);
      return false;
    }
  }

  /**
   * Fetch Kick's public key for webhook signature verification
   */
  public async getPublicKey(): Promise<string | null> {
    try {
      const res = await fetch(`${this.baseUrl}/public/v1/public-key`, {
        headers: { 'Accept': 'text/plain, application/json' },
      });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }
}
