// SFX_GAUGE_RECOVER — Relief chime, ascending
// Sine wave arpeggio up
export const SFX_GAUGE_RECOVER = {
    key: 'SFX_GAUGE_RECOVER',
    volume: 0.5,
    priority: 'MEDIUM',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const notes = [523, 659, 784]; // C5 E5 G5
        const noteDur = 0.1;
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const gain = ctx.createGain();
            const t = now + i * noteDur;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(this.volume, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, t + noteDur + 0.1);
            osc.connect(gain).connect(dest);
            osc.start(t);
            osc.stop(t + noteDur + 0.1);
        });
    }
};
