// MUSIC_GAMEPLAY_TENSE — Urgent staccato strings, panic mode
// 150 BPM, 30s loop. Staccato strings, urgent bass, snare rolls.
export const MUSIC_GAMEPLAY_TENSE = {
    key: 'MUSIC_GAMEPLAY_TENSE',
    bpm: 150,
    duration: 30,
    loop: true,
    volume: 0.45,

    play(ctx, dest) {
        const now = ctx.currentTime;
        const bpm = this.bpm;
        const beatDur = 60 / bpm;
        const barDur = beatDur * 4;
        const totalBars = Math.floor(this.duration / barDur);
        const masterGain = ctx.createGain();
        masterGain.gain.value = this.volume;
        masterGain.connect(dest);

        // --- Staccato Strings (sawtooth, filtered) ---
        // Dm chord arpeggios — tense, minor key
        const stringNotes = [
            // [semitone from D4, dur beats, beat offset]
            [0, 0.25, 0], [3, 0.25, 0.25], [7, 0.25, 0.5], [12, 0.25, 0.75],
            [0, 0.25, 1], [3, 0.25, 1.25], [7, 0.25, 1.5], [12, 0.25, 1.75],
            [5, 0.25, 2], [8, 0.25, 2.25], [12, 0.25, 2.5], [5, 0.25, 2.75],
            [3, 0.25, 3], [7, 0.25, 3.25], [10, 0.25, 3.5], [3, 0.25, 3.75],
        ];
        const stringBase = 293.66; // D4
        for (let bar = 0; bar < totalBars; bar++) {
            stringNotes.forEach(([semi, dur, beatOff]) => {
                const t = now + bar * barDur + beatOff * beatDur;
                if (t - now >= this.duration) return;
                const freq = stringBase * Math.pow(2, semi / 12);
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                const lp = ctx.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.value = 2000;
                const g = ctx.createGain();
                const noteDur = dur * beatDur;
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(0.08, t + 0.005);
                g.gain.setValueAtTime(0.08, t + noteDur * 0.5);
                g.gain.linearRampToValueAtTime(0, t + noteDur);
                osc.connect(lp).connect(g).connect(masterGain);
                osc.start(t);
                osc.stop(t + noteDur + 0.01);
            });
        }

        // --- Urgent Bass (rhythmic octaves) ---
        const bassPattern = [0, 0, 5, 5, 7, 7, 10, 10]; // Dm based
        const bassBase = 73.42; // D2
        for (let bar = 0; bar < totalBars; bar++) {
            for (let eighth = 0; eighth < 8; eighth++) {
                const t = now + bar * barDur + eighth * beatDur * 0.5;
                if (t - now >= this.duration) continue;
                const semi = bassPattern[eighth];
                const osc = ctx.createOscillator();
                osc.type = 'square';
                osc.frequency.value = bassBase * Math.pow(2, semi / 12);
                const lp = ctx.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.value = 400;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(0.18, t + 0.005);
                g.gain.exponentialRampToValueAtTime(0.001, t + beatDur * 0.4);
                osc.connect(lp).connect(g).connect(masterGain);
                osc.start(t);
                osc.stop(t + beatDur * 0.5);
            }
        }

        // --- Snare Rolls ---
        for (let bar = 0; bar < totalBars; bar++) {
            for (let sixteenth = 0; sixteenth < 16; sixteenth++) {
                const t = now + bar * barDur + sixteenth * beatDur * 0.25;
                if (t - now >= this.duration) continue;
                // Full snare on key beats, ghost notes elsewhere
                const isAccent = sixteenth % 4 === 2 || sixteenth % 4 === 0;
                const nBuf = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
                const nData = nBuf.getChannelData(0);
                for (let i = 0; i < nData.length; i++) {
                    nData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nData.length, 2);
                }
                const src = ctx.createBufferSource();
                src.buffer = nBuf;
                const bp = ctx.createBiquadFilter();
                bp.type = 'bandpass';
                bp.frequency.value = 3000;
                bp.Q.value = 0.5;
                const g = ctx.createGain();
                g.gain.setValueAtTime(isAccent ? 0.12 : 0.04, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
                src.connect(bp).connect(g).connect(masterGain);
                src.start(t);
                src.stop(t + 0.03);
            }
        }

        return { gain: masterGain };
    }
};
