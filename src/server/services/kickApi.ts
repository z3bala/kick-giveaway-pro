/**
 * Client for interacting with the official Kick Developer REST API (https://docs.kick.com).
 */
export interface SendChatMessageResult {
  success: boolean;
  status?: number;
  error?: string;
  data?: any;
}

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

  public getAccessToken(): string | undefined {
    return this.accessToken;
  }

  public setCredentials(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Request App Access Token from Kick identity server using Client Credentials flow
   */
  public async fetchTokenWithClientCredentials(): Promise<string | null> {
    if (!this.clientId || !this.clientSecret) {
      console.warn('[KickApiClient] Missing clientId or clientSecret for token exchange.');
      return null;
    }

    try {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const res = await fetch('https://id.kick.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[KickApiClient] Token request failed (${res.status}):`, errText);
        return null;
      }

      const data = (await res.json()) as any;
      if (data.access_token) {
        this.accessToken = data.access_token;
        console.log('[KickApiClient] Successfully obtained Kick access token via client_credentials.');
        return data.access_token;
      }
      return null;
    } catch (err: any) {
      console.error('[KickApiClient] Error in client credentials flow:', err.message);
      return null;
    }
  }

  /**
   * Exchange OAuth authorization code for User Access Token (chat:write scope)
   */
  public async exchangeAuthCode(code: string, redirectUri: string, codeVerifier?: string): Promise<string | null> {
    if (!this.clientId || !this.clientSecret) {
      console.warn('[KickApiClient] Missing clientId or clientSecret for code exchange.');
      return null;
    }

    try {
      const params: Record<string, string> = {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri,
      };

      if (codeVerifier) {
        params.code_verifier = codeVerifier;
      }

      const body = new URLSearchParams(params);

      const res = await fetch('https://id.kick.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[KickApiClient] Auth code exchange failed (${res.status}):`, errText);
        return null;
      }

      const data = (await res.json()) as any;
      if (data.access_token) {
        this.accessToken = data.access_token;
        console.log('[KickApiClient] Successfully exchanged authorization code for Kick access token.');
        return data.access_token;
      }
      return null;
    } catch (err: any) {
      console.error('[KickApiClient] Error in auth code exchange:', err.message);
      return null;
    }
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
   * Requires OAuth User Access Token with 'chat:write' scope.
   */
  public async sendChatMessage(broadcasterUserId: string, content: string): Promise<SendChatMessageResult> {
    if (!this.accessToken) {
      const err = 'No Kick access token configured. Please click "Authorize with Kick (1-Click)" in Settings with your bot account.';
      console.warn(`[KickApiClient] Cannot send chat message: ${err}`);
      return { success: false, status: 401, error: err };
    }

    try {
      const cleanContent = content.slice(0, 500);
      const bId = broadcasterUserId ? Number(broadcasterUserId) : undefined;

      // Primary attempt: type 'user' (Kick standard public API chat specification)
      const payloadUser = {
        type: 'user',
        content: cleanContent,
        broadcaster_user_id: bId,
      };

      let res = await fetch(`${this.baseUrl}/public/v1/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payloadUser),
      });

      // If rejected with 400 or 422, try secondary format: type 'bot'
      if (!res.ok && (res.status === 400 || res.status === 422)) {
        const payloadBot = {
          type: 'bot',
          content: cleanContent,
          broadcaster_user_id: bId,
        };
        const resBot = await fetch(`${this.baseUrl}/public/v1/chat`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payloadBot),
        });
        if (resBot.ok) {
          res = resBot;
        }
      }

      const resText = await res.text();
      let resJson: any = null;
      try { resJson = JSON.parse(resText); } catch {}

      if (!res.ok) {
        let errorMsg = `Kick API returned HTTP ${res.status}: ${resText}`;
        if (res.status === 401) {
          errorMsg = 'Kick returned 401 Unauthorized. The Kick Access Token is missing the `chat:write` scope or expired. Please click "Authorize with Kick (1-Click)" in Settings with your bot account.';
          console.warn(`[KickApiClient] ${errorMsg}`);
        } else {
          console.error(`[KickApiClient] Send message failed (${res.status}): ${resText}`);
        }
        return { success: false, status: res.status, error: errorMsg, data: resJson };
      }

      console.log(`[KickApiClient] Successfully sent chat message to broadcaster ${broadcasterUserId}: "${cleanContent.slice(0, 60)}..."`);
      return { success: true, status: res.status, data: resJson };
    } catch (err: any) {
      console.error('[KickApiClient] Network error sending chat message:', err.message);
      return { success: false, error: err.message };
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

  /**
   * Automatically subscribe to official Kick chat.message.sent webhook events
   */
  public async subscribeToChatEvents(broadcasterUserId: string | number): Promise<boolean> {
    // If we don't have a token, attempt to fetch one via client credentials first
    if (!this.accessToken && this.clientId && this.clientSecret) {
      await this.fetchTokenWithClientCredentials();
    }

    if (!this.accessToken) {
      console.warn('[KickApiClient] Cannot subscribe to events: No access token available.');
      return false;
    }

    try {
      const res = await fetch(`${this.baseUrl}/public/v1/events/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          event: 'chat.message.sent',
          method: 'webhook',
          broadcaster_user_id: Number(broadcasterUserId),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log(`[KickApiClient] Active webhook subscription confirmed for broadcaster ${broadcasterUserId} (chat.message.sent)!`);
        return true;
      } else {
        console.warn(`[KickApiClient] Event subscription notice (${res.status}):`, data);
        return false;
      }
    } catch (err: any) {
      console.error('[KickApiClient] Failed to register event subscription:', err.message);
      return false;
    }
  }
}
