// SFX_SCORE_TICK — Rapid tick
// Tiny click, very short
export const SFX_SCORE_TICK = {
    key: 'SFX_SCORE_TICK',
    volume: 0.3,
    priority: 'LOW',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 0.02;
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 4000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(gain).connect(dest);
        osc.start(now);
        osc.stop(now + dur);
    }
};
