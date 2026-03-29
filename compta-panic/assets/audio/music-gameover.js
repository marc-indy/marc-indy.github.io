// MUSIC_GAMEOVER — Sad trombone, comedic defeat
// 90 BPM, 8s one-shot. Sad trombone, deflating synth.
export const MUSIC_GAMEOVER = {
    key: 'MUSIC_GAMEOVER',
    bpm: 90,
    duration: 8,
    loop: false,
    volume: 0.5,

    play(ctx, dest) {
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.value = this.volume;
        masterGain.connect(dest);

        // --- Sad Trombone (descending "wah-wah-wah-waaah") ---
        const tromboneNotes = [
            { freq: 233.08, start: 0, dur: 0.6 },    // Bb3
            { freq: 207.65, start: 0.7, dur: 0.6 },   // Ab3
            { freq: 196.00, start: 1.4, dur: 0.6 },   // G3
            { freq: 174.61, start: 2.1, dur: 2.0 },   // F3 (long, descending)
        ];
        tromboneNotes.forEach(({ freq, start, dur }) => {
            const t = now + start;
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t);
            if (dur > 1) {
                // Last note slides down
                osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + dur);
            }
            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.setValueAtTime(800, t);
            lp.frequency.linearRampToValueAtTime(400, t + dur);
            // Vibrato
            const vibrato = ctx.createOscillator();
            vibrato.type = 'sine';
            vibrato.frequency.value = 5;
            const vibGain = ctx.createGain();
            vibGain.gain.value = dur > 1 ? 8 : 3;
            vibrato.connect(vibGain).connect(osc.frequency);
            vibrato.start(t);
            vibrato.stop(t + dur);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.2, t + 0.05);
            g.gain.setValueAtTime(0.2, t + dur * 0.7);
            g.gain.linearRampToValueAtTime(0, t + dur);
            osc.connect(lp).connect(g).connect(masterGain);
            osc.start(t);
            osc.stop(t + dur + 0.01);
        });

        // --- Deflating Synth (slide down) ---
        const deflateStart = now + 4.5;
        const deflateDur = 3.0;
        const defOsc = ctx.createOscillator();
        defOsc.type = 'sine';
        defOsc.frequency.setValueAtTime(400, deflateStart);
        defOsc.frequency.exponentialRampToValueAtTime(50, deflateStart + deflateDur);
        const defGain = ctx.createGain();
        defGain.gain.setValueAtTime(0, deflateStart);
        defGain.gain.linearRampToValueAtTime(0.1, deflateStart + 0.1);
        defGain.gain.exponentialRampToValueAtTime(0.001, deflateStart + deflateDur);
        defOsc.connect(defGain).connect(masterGain);
        defOsc.start(deflateStart);
        defOsc.stop(deflateStart + deflateDur);

        // --- Single cymbal crash at start ---
        const crashBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
        const crashData = crashBuf.getChannelData(0);
        for (let i = 0; i < crashData.length; i++) {
            crashData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / crashData.length, 2);
        }
        const crashSrc = ctx.createBufferSource();
        crashSrc.buffer = crashBuf;
        const crashHp = ctx.createBiquadFilter();
        crashHp.type = 'highpass';
        crashHp.frequency.value = 4000;
        const crashGain = ctx.createGain();
        crashGain.gain.setValueAtTime(0.15, now);
        crashGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        crashSrc.connect(crashHp).connect(crashGain).connect(masterGain);
        crashSrc.start(now);
        crashSrc.stop(now + 1.5);

        return { gain: masterGain };
    }
};
