// SFX_CARD_TIMEOUT — Buzzer, harsh
// Square wave, dissonant
export const SFX_CARD_TIMEOUT = {
    key: 'SFX_CARD_TIMEOUT',
    volume: 0.8,
    priority: 'HIGH',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 0.4;
        const osc1 = ctx.createOscillator();
        osc1.type = 'square';
        osc1.frequency.value = 200;
        const osc2 = ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.value = 247;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.5, now);
        gain.gain.setValueAtTime(this.volume * 0.5, now + dur * 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(dest);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + dur);
        osc2.stop(now + dur);
    }
};
