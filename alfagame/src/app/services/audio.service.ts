import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  sucesso() {
    const ctx = this.getCtx();
    // Ascending arpeggio: C5 → E5 → G5
    [[523.25, 0], [659.25, 0.12], [783.99, 0.24]].forEach(([freq, delay]) => {
      this.tone(ctx, freq, delay, 0.18);
    });
  }

  erro() {
    const ctx = this.getCtx();
    // Short descending buzz
    [[220, 0], [196, 0.1]].forEach(([freq, delay]) => {
      this.tone(ctx, freq, delay, 0.14, 'sawtooth');
    });
  }

  private tone(
    ctx: AudioContext,
    freq: number,
    delayS: number,
    durS: number,
    type: OscillatorType = 'sine'
  ) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const start = ctx.currentTime + delayS;
    gain.gain.setValueAtTime(0.25, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + durS);
    osc.start(start);
    osc.stop(start + durS + 0.05);
  }
}
