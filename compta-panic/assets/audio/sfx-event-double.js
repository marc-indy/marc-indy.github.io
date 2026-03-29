// SFX_EVENT_DOUBLE — Drum roll
// Rapid noise bursts
export const SFX_EVENT_DOUBLE = {
    key: 'SFX_EVENT_DOUBLE',
    volume: 0.7,
    priority: 'HIGH',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const hits = 12;
        const totalDur = 0.6;
        const hitDur = 0.04;
        for (let i = 0; i < hits; i++) {
            const t = now + (i / hits) * totalDur;
            // Accelerating hits — spacing decreases
            const buf = ctx.createBuffer(1, ctx.sampleRate * hitDur, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let j = 0; j < data.length; j++) {
                data[j] = (Math.random() * 2 - 1) * (1 - j / data.length);
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buf;
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 200 + i * 30;
            bp.Q.value = 1;
            const gain = ctx.createGain();
            const vol = this.volume * (0.3 + 0.7 * (i / hits));
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + hitDur);
            noise.connect(bp).connect(gain).connect(dest);
            noise.start(t);
            noise.stop(t + hitDur);
        }
        // Final hit — louder
        const finalT = now + totalDur;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 150;
        const finalGain = ctx.createGain();
        finalGain.gain.setValueAtTime(this.volume, finalT);
        finalGain.gain.exponentialRampToValueAtTime(0.001, finalT + 0.15);
        osc.connect(finalGain).connect(dest);
        osc.start(finalT);
        osc.stop(finalT + 0.15);
    }
};
