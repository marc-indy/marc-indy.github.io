// SFX_SWIPE_LEFT — Paper crumple, short
// Noise burst with fast decay
export const SFX_SWIPE_LEFT = {
    key: 'SFX_SWIPE_LEFT',
    volume: 0.7,
    priority: 'HIGH',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 0.12;
        // Noise buffer
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        // Bandpass filter for paper character
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 3000;
        bp.Q.value = 0.8;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        noise.connect(bp).connect(gain).connect(dest);
        noise.start(now);
        noise.stop(now + dur);
    }
};
