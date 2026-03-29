// SFX_GAUGE_DANGER — Alarm klaxon
// Alternating square waves, urgent
export const SFX_GAUGE_DANGER = {
    key: 'SFX_GAUGE_DANGER',
    volume: 0.9,
    priority: 'CRITICAL',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 0.5;
        const osc = ctx.createOscillator();
        osc.type = 'square';
        // Alternating high/low for klaxon
        const freqArr = [880, 660, 880, 660, 880];
        const step = dur / freqArr.length;
        freqArr.forEach((f, i) => {
            osc.frequency.setValueAtTime(f, now + i * step);
        });
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.6, now);
        gain.gain.setValueAtTime(this.volume * 0.6, now + dur * 0.85);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2000;
        osc.connect(lp).connect(gain).connect(dest);
        osc.start(now);
        osc.stop(now + dur);
    }
};
