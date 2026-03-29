// SFX_EVENT_BONUS — Coin shower/jackpot
// Rapid ascending pings
export const SFX_EVENT_BONUS = {
    key: 'SFX_EVENT_BONUS',
    volume: 0.7,
    priority: 'HIGH',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const notes = [1047, 1175, 1319, 1480, 1568, 1760, 1976, 2093]; // C6 to C7
        const interval = 0.05;
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const gain = ctx.createGain();
            const t = now + i * interval;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(this.volume * 0.5, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            osc.connect(gain).connect(dest);
            osc.start(t);
            osc.stop(t + 0.15);
        });
    }
};
