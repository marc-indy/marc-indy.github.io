// SFX_GAUGE_WARNING — Short alert chime
// Triangle wave, 2 ascending tones
export const SFX_GAUGE_WARNING = {
    key: 'SFX_GAUGE_WARNING',
    volume: 0.6,
    priority: 'HIGH',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(800, now + 0.1);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume, now);
        gain.gain.setValueAtTime(this.volume, now + 0.08);
        gain.gain.setValueAtTime(0, now + 0.09);
        gain.gain.setValueAtTime(this.volume, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain).connect(dest);
        osc.start(now);
        osc.stop(now + 0.2);
    }
};
