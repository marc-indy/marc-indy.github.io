// SFX_SEASON_WIN — Victoire de saison : fanfare courte 3 notes
// Square wave, C4→E4→G4 (accord parfait majeur), 400ms total
export const SFX_SEASON_WIN = {
    key: 'SFX_SEASON_WIN',
    volume: 0.7,
    priority: 'HIGH',
    play(ctx, dest) {
        const now = ctx.currentTime;
        // C4=261.63 E4=329.63 G4=392.00
        const notes = [261.63, 329.63, 392.00];
        notes.forEach((freq, i) => {
            const t = now + i * 0.13;
            const osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = freq;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(this.volume * 0.65, t + 0.01);
            gain.gain.setValueAtTime(this.volume * 0.65, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
            osc.connect(gain).connect(dest);
            osc.start(t);
            osc.stop(t + 0.30);
        });
        // Final chord ring — all three together at end
        notes.forEach((freq) => {
            const t = now + 0.39;
            const osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = freq;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(this.volume * 0.35, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
            osc.connect(gain).connect(dest);
            osc.start(t);
            osc.stop(t + 0.24);
        });
    }
};
