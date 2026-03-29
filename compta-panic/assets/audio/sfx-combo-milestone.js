// SFX_COMBO_MILESTONE — Triumphant fanfare
// Chord of sines, major
export const SFX_COMBO_MILESTONE = {
    key: 'SFX_COMBO_MILESTONE',
    volume: 0.7,
    priority: 'HIGH',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 0.5;
        const freqs = [523, 659, 784, 1047]; // C5 E5 G5 C6 — major chord
        freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const gain = ctx.createGain();
            const start = now + i * 0.04;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(this.volume * 0.4, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
            osc.connect(gain).connect(dest);
            osc.start(start);
            osc.stop(start + dur);
        });
    }
};
