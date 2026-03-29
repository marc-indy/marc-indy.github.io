// SFX_ANALYSIS_BONUS — Bonus analyse approfondie : ding délicat
// Sine wave, 880Hz, decay rapide, 150ms
export const SFX_ANALYSIS_BONUS = {
    key: 'SFX_ANALYSIS_BONUS',
    volume: 0.5,
    priority: 'LOW',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 0.15;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 880;
        // Slight upper harmonic for bell quality
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 880 * 3;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.volume, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.005);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.4);
        osc.connect(gain).connect(dest);
        osc2.connect(gain2).connect(dest);
        osc.start(now);
        osc.stop(now + dur + 0.01);
        osc2.start(now);
        osc2.stop(now + dur * 0.5);
    }
};
