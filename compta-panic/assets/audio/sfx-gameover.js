// SFX_GAMEOVER — Dramatic descending + crash
// Descending saw + noise burst
export const SFX_GAMEOVER = {
    key: 'SFX_GAMEOVER',
    volume: 1.0,
    priority: 'CRITICAL',
    play(ctx, dest) {
        const now = ctx.currentTime;
        // Descending saw
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.8);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(this.volume * 0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(2000, now);
        lp.frequency.exponentialRampToValueAtTime(200, now + 1.0);
        osc.connect(lp).connect(oscGain).connect(dest);
        osc.start(now);
        osc.stop(now + 1.0);
        // Crash noise at 0.6s
        const crashDur = 0.5;
        const buf = ctx.createBuffer(1, ctx.sampleRate * crashDur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(this.volume * 0.7, now + 0.6);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
        noise.connect(noiseGain).connect(dest);
        noise.start(now + 0.6);
        noise.stop(now + 1.1);
    }
};
