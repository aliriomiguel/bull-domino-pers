/**
 * Procedural Web Audio Sound Engine for Domino Clash Royale
 * Zero external audio assets; 100% reliable synthesized tactile sounds.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // Lazy init on first user gesture
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('domino_sound_muted');
      if (saved !== null) {
        this.muted = saved === 'true';
      }
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('domino_sound_muted', muted ? 'true' : 'false');
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Crisp, weighty tactile domino clack on the table
   */
  public playTileClack(isDouble: boolean = false) {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Wood/ivory resonant frequency
    const baseFreq = isDouble ? 280 : 380;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq * (0.95 + Math.random() * 0.1), t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isDouble ? 1800 : 2600, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.08);

    gain.gain.setValueAtTime(isDouble ? 0.7 : 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    // High snap noise
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'square';
    snapOsc.frequency.setValueAtTime(1400, t);
    snapOsc.frequency.exponentialRampToValueAtTime(300, t + 0.02);
    snapGain.gain.setValueAtTime(0.2, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
    snapOsc.start(t);
    snapOsc.stop(t + 0.03);
  }

  /**
   * Tactile slide/draw sound from boneyard
   */
  public playTileDraw() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.12);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Turn notification ping
   */
  public playTurnPing() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.setValueAtTime(880, t + 0.07); // A5

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  /**
   * Classic domino "Knock / Pass" sound (double wood tap)
   */
  public playKnockPass() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [0, 0.11].forEach((delay) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, t + delay);
      osc.frequency.exponentialRampToValueAtTime(80, t + delay + 0.06);

      gain.gain.setValueAtTime(0.35, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + delay);
      osc.stop(t + delay + 0.07);
    });
  }

  /**
   * Grand victory fanfare
   */
  public playVictoryFanfare() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Major chord arpeggio: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.1);

      gain.gain.setValueAtTime(0, t + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.25, t + idx * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.1);
      osc.stop(t + idx * 0.1 + 0.65);
    });
  }

  /**
   * Round blocked sound
   */
  public playBlockedSound() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(196, t); // G3
    osc.frequency.exponentialRampToValueAtTime(130.81, t + 0.3); // C3

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.36);
  }
}

export const sound = new SoundEngine();
