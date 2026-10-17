/**
 * Procedural Web Audio API sound generator for CS-style roll animations.
 * Eliminates need for external MP3 files, avoiding CORS, 404s, or loading delays in OBS.
 */
class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private volume = 0.8;

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setConfig(enabled: boolean, volume: number): void {
    this.isMuted = !enabled;
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Classic case-opening mechanical click/tick when a card crosses the center reticle
   */
  public playCardTick(): void {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Sharp mechanical transient click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(3, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore audio context errors in quiet mode
    }
  }

  /**
   * Celebratory chime & fanfare chord when the winner settles and is revealed
   */
  public playWinnerChime(): void {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 triumphant chord

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        const startTime = now + idx * 0.08;
        const endTime = startTime + 0.8;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.22 * this.volume, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(endTime);
      });
    } catch {}
  }
}

export const sfx = new SoundEffectsManager();
