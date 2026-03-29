// SFX_EVENT_CLIENT — Angry grunt/shout
// Noise + low growl
export const SFX_EVENT_CLIENT = {
    key: 'SFX_EVENT_CLIENT',
    volume: 0.7,
    priority: 'HIGH',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 0.35;
        // Growl oscillator
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.05);
        osc.frequency.linearRampToValueAtTime(100, now + dur);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 500;
        bp.Q.value = 2;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        // Noise burst for shout texture
        const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 2000;
        noiseFilter.Q.value = 1;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(bp).connect(gain).connect(dest);
        noise.connect(noiseFilter).connect(noiseGain).connect(dest);
        osc.start(now);
        osc.stop(now + dur);
        noise.start(now);
        noise.stop(now + 0.15);
    }
};
