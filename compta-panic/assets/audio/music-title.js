// MUSIC_TITLE — Upbeat synth office theme
// 120 BPM, 30s loop. Synth keys, light bass, snap percussion.
export const MUSIC_TITLE = {
    key: 'MUSIC_TITLE',
    bpm: 120,
    duration: 30,
    loop: true,
    volume: 0.5,

    play(ctx, dest) {
        const now = ctx.currentTime;
        const bpm = this.bpm;
        const beatDur = 60 / bpm;
        const barDur = beatDur * 4;
        const totalBars = Math.floor(this.duration / barDur);
        const masterGain = ctx.createGain();
        masterGain.gain.value = this.volume;
        masterGain.connect(dest);

        // --- Synth Keys (melody) ---
        const melodyNotes = [
            // Bar pattern: C major pentatonic quirky office theme
            // [semitone offset from C4, duration in beats, start beat]
            [0, 0.5, 0], [4, 0.5, 0.5], [7, 1, 1], [12, 0.5, 2], [9, 0.5, 2.5], [7, 1, 3],
            [5, 0.5, 4], [7, 0.5, 4.5], [9, 1, 5], [4, 0.5, 6], [0, 0.5, 6.5], [2, 1, 7],
            [4, 0.5, 8], [7, 0.5, 8.5], [12, 1, 9], [11, 0.5, 10], [9, 0.5, 10.5], [7, 1, 11],
            [5, 0.5, 12], [4, 0.5, 12.5], [2, 1, 13], [0, 1.5, 14],
        ];
        const baseFreq = 261.63; // C4
        melodyNotes.forEach(([semi, dur, startBeat]) => {
            for (let bar = 0; bar < totalBars; bar += 4) {
                const t = now + bar * barDur + startBeat * beatDur;
                if (t - now >= this.duration) return;
                const freq = baseFreq * Math.pow(2, semi / 12);
                const osc = ctx.createOscillator();
                osc.type = 'square';
                osc.frequency.value = freq;
                const lp = ctx.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.value = 1500;
                const g = ctx.createGain();
                const noteDur = dur * beatDur;
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(0.12, t + 0.01);
                g.gain.setValueAtTime(0.12, t + noteDur * 0.7);
                g.gain.linearRampToValueAtTime(0, t + noteDur);
                osc.connect(lp).connect(g).connect(masterGain);
                osc.start(t);
                osc.stop(t + noteDur + 0.01);
            }
        });

        // --- Bass Line ---
        const bassPattern = [0, 0, 5, 5, 7, 7, 5, 3]; // semitones from C3
        const bassFreq = 130.81; // C3
        for (let bar = 0; bar < totalBars; bar++) {
            for (let beat = 0; beat < 4; beat++) {
                const t = now + bar * barDur + beat * beatDur;
                if (t - now >= this.duration) continue;
                const semi = bassPattern[(bar * 4 + beat) % bassPattern.length];
                const osc = ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.value = bassFreq * Math.pow(2, semi / 12);
                const g = ctx.createGain();
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(0.15, t + 0.01);
                g.gain.exponentialRampToValueAtTime(0.001, t + beatDur * 0.9);
                osc.connect(g).connect(masterGain);
                osc.start(t);
                osc.stop(t + beatDur);
            }
        }

        // --- Snap Percussion ---
        for (let bar = 0; bar < totalBars; bar++) {
            for (let beat = 0; beat < 4; beat++) {
                // Snaps on beats 1 and 3
                if (beat % 2 !== 1) continue;
                const t = now + bar * barDur + beat * beatDur;
                if (t - now >= this.duration) continue;
                const nBuf = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
                const nData = nBuf.getChannelData(0);
                for (let i = 0; i < nData.length; i++) {
                    nData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nData.length, 3);
                }
                const src = ctx.createBufferSource();
                src.buffer = nBuf;
                const hp = ctx.createBiquadFilter();
                hp.type = 'highpass';
                hp.frequency.value = 5000;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.2, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
                src.connect(hp).connect(g).connect(masterGain);
                src.start(t);
                src.stop(t + 0.03);
            }
        }

        return { gain: masterGain };
    }
};
