// SFX_BUTTON_TAP — Soft click
// Very short high-freq tick
export const SFX_BUTTON_TAP = {
    key: 'SFX_BUTTON_TAP',
    volume: 0.4,
    priority: 'LOW',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 0.04;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 3500;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(gain).connect(dest);
        osc.start(now);
        osc.stop(now + dur);
    }
};
