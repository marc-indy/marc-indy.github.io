// SFX_CARD_ENTER — Paper slide/whoosh
// Filtered noise sweep
export const SFX_CARD_ENTER = {
    key: 'SFX_CARD_ENTER',
    volume: 0.5,
    priority: 'MEDIUM',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 0.25;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / data.length;
            data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(800, now);
        hp.frequency.linearRampToValueAtTime(4000, now + dur);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.volume, now + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + dur);
        noise.connect(hp).connect(gain).connect(dest);
        noise.start(now);
        noise.stop(now + dur);
    }
};
