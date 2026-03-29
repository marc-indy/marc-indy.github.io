// SFX_PAPER_AMBIENT — Paper rustling loop
// Subtle filtered noise, gentle
export const SFX_PAPER_AMBIENT = {
    key: 'SFX_PAPER_AMBIENT',
    volume: 0.2,
    priority: 'LOW',
    loop: true,
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 2.0; // Loop length
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        // Gentle rustling with volume modulation
        for (let i = 0; i < data.length; i++) {
            const t = i / ctx.sampleRate;
            const envelope = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 3.0));
            data[i] = (Math.random() * 2 - 1) * 0.1 * envelope;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        noise.loop = true;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2500;
        bp.Q.value = 0.5;
        const gain = ctx.createGain();
        gain.gain.value = this.volume;
        noise.connect(bp).connect(gain).connect(dest);
        noise.start(now);
        return { source: noise, gain };
    }
};
