// SFX_SWIPE_RIGHT — Rubber stamp thud
// Low freq square wave, sharp attack
export const SFX_SWIPE_RIGHT = {
    key: 'SFX_SWIPE_RIGHT',
    volume: 0.7,
    priority: 'HIGH',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 0.15;
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + dur);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        // Add a noise layer for realism
        const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        const noiseData = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseData.length);
        }
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuf;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 400;
        osc.connect(gain).connect(dest);
        noiseSrc.connect(lp).connect(noiseGain).connect(dest);
        osc.start(now);
        osc.stop(now + dur);
        noiseSrc.start(now);
        noiseSrc.stop(now + 0.05);
    }
};
