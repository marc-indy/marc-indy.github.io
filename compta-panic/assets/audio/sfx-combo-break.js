// SFX_COMBO_BREAK — Glass shatter
// Noise burst + high freq decay
export const SFX_COMBO_BREAK = {
    key: 'SFX_COMBO_BREAK',
    volume: 0.6,
    priority: 'HIGH',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 0.3;
        // Noise burst
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(3000, now);
        hp.frequency.linearRampToValueAtTime(8000, now + dur);
        // High freq shimmer
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4000, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + dur);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.15, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        noise.connect(hp).connect(gain).connect(dest);
        osc.connect(oscGain).connect(dest);
        noise.start(now);
        noise.stop(now + dur);
        osc.start(now);
        osc.stop(now + dur);
    }
};
