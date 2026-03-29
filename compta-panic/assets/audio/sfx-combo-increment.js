// SFX_COMBO_INCREMENT — Cash register ding
// High sine with sharp attack
export const SFX_COMBO_INCREMENT = {
    key: 'SFX_COMBO_INCREMENT',
    volume: 0.5,
    priority: 'MEDIUM',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 0.2;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2200, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + dur);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(gain).connect(dest);
        osc.start(now);
        osc.stop(now + dur);
    }
};
