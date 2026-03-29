// SFX_TITLE_START — Enthusiastic "Allez!"
// Ascending chord + noise burst
export const SFX_TITLE_START = {
    key: 'SFX_TITLE_START',
    volume: 0.7,
    priority: 'HIGH',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 0.5;
        // Ascending chord arpeggio
        const notes = [440, 554, 659, 880]; // A4 C#5 E5 A5
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const gain = ctx.createGain();
            const t = now + i * 0.06;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(this.volume * 0.4, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + dur - i * 0.06);
            osc.connect(gain).connect(dest);
            osc.start(t);
            osc.stop(t + dur - i * 0.06);
        });
        // Excitement noise burst
        const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 5000;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        noise.connect(hp).connect(noiseGain).connect(dest);
        noise.start(now);
        noise.stop(now + 0.08);
    }
};
