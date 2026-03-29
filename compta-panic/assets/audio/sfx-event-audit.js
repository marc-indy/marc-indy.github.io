// SFX_EVENT_AUDIT — Gavel bang
// Sharp low thud
export const SFX_EVENT_AUDIT = {
    key: 'SFX_EVENT_AUDIT',
    volume: 0.8,
    priority: 'HIGH',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 0.25;
        // Low thud
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + dur);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        // Impact crack
        const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain).connect(dest);
        noise.connect(noiseGain).connect(dest);
        osc.start(now);
        osc.stop(now + dur);
        noise.start(now);
        noise.stop(now + 0.04);
    }
};
