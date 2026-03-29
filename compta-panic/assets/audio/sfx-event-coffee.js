// SFX_EVENT_COFFEE — Coffee pour, sip
// Filtered noise, gentle
export const SFX_EVENT_COFFEE = {
    key: 'SFX_EVENT_COFFEE',
    volume: 0.5,
    priority: 'MEDIUM',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 0.6;
        // Pouring noise (filtered low noise)
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / data.length;
            data[i] = (Math.random() * 2 - 1) * 0.5 * Math.sin(t * Math.PI);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(600, now);
        lp.frequency.linearRampToValueAtTime(1200, now + dur * 0.4);
        lp.frequency.linearRampToValueAtTime(400, now + dur);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.volume, now + 0.1);
        gain.gain.setValueAtTime(this.volume * 0.8, now + dur * 0.7);
        gain.gain.linearRampToValueAtTime(0, now + dur);
        noise.connect(lp).connect(gain).connect(dest);
        noise.start(now);
        noise.stop(now + dur);
        // Sip sound (brief higher pitched burst at end)
        const sipOsc = ctx.createOscillator();
        sipOsc.type = 'sine';
        sipOsc.frequency.value = 300;
        const sipGain = ctx.createGain();
        sipGain.gain.setValueAtTime(0, now + dur * 0.75);
        sipGain.gain.linearRampToValueAtTime(0.15, now + dur * 0.8);
        sipGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        sipOsc.connect(sipGain).connect(dest);
        sipOsc.start(now + dur * 0.75);
        sipOsc.stop(now + dur);
    }
};
