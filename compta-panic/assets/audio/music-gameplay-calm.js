// MUSIC_GAMEPLAY_CALM — Cheerful xylophone office theme
// 130 BPM, 45s loop. Xylophone, plucky bass, hi-hat.
export const MUSIC_GAMEPLAY_CALM = {
    key: 'MUSIC_GAMEPLAY_CALM',
    bpm: 130,
    duration: 45,
    loop: true,
    volume: 0.4,

    play(ctx, dest) {
        const now = ctx.currentTime;
        const bpm = this.bpm;
        const beatDur = 60 / bpm;
        const barDur = beatDur * 4;
        const totalBars = Math.floor(this.duration / barDur);
        const masterGain = ctx.createGain();
        masterGain.gain.value = this.volume;
        masterGain.connect(dest);

        // --- Xylophone Melody ---
        const melodyBars = [
            // [semitone from C5, duration beats, beat offset]
            [0, 0.5, 0], [2, 0.5, 0.5], [4, 0.5, 1], [7, 1, 1.5], [4, 0.5, 2.5], [2, 0.5, 3], [0, 0.5, 3.5],
            [5, 0.5, 4], [7, 0.5, 4.5], [9, 1, 5], [7, 0.5, 6], [5, 0.5, 6.5], [4, 0.5, 7], [2, 0.5, 7.5],
            [0, 0.5, 8], [4, 0.5, 8.5], [7, 0.5, 9], [12, 1, 9.5], [9, 0.5, 10.5], [7, 1, 11],
            [5, 0.5, 12], [4, 0.5, 12.5], [2, 1, 13], [0, 1.5, 14],
        ];
        const xyloBase = 523.25; // C5
        melodyBars.forEach(([semi, dur, startBeat]) => {
            for (let rep = 0; rep < totalBars; rep += 4) {
                const t = now + rep * barDur + startBeat * beatDur;
                if (t - now >= this.duration) return;
                const freq = xyloBase * Math.pow(2, semi / 12);
                // Xylophone: sine with fast decay
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                // Harmonic overtone for bell-like quality
                const osc2 = ctx.createOscillator();
                osc2.type = 'sine';
                osc2.frequency.value = freq * 3;
                const g = ctx.createGain();
                const noteDur = dur * beatDur;
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(0.15, t + 0.005);
                g.gain.exponentialRampToValueAtTime(0.001, t + noteDur + 0.05);
                const g2 = ctx.createGain();
                g2.gain.setValueAtTime(0, t);
                g2.gain.linearRampToValueAtTime(0.04, t + 0.005);
                g2.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 0.5);
                osc.connect(g).connect(masterGain);
                osc2.connect(g2).connect(masterGain);
                osc.start(t);
                osc.stop(t + noteDur + 0.1);
                osc2.start(t);
                osc2.stop(t + noteDur + 0.1);
            }
        });

        // --- Plucky Bass ---
        const bassNotes = [0, 0, 5, 5, 7, 7, 3, 3]; // C3 pattern
        const bassBase = 130.81; // C3
        for (let bar = 0; bar < totalBars; bar++) {
            for (let beat = 0; beat < 4; beat += 2) {
                const t = now + bar * barDur + beat * beatDur;
                if (t - now >= this.duration) continue;
                const semi = bassNotes[(bar * 2 + beat / 2) % bassNotes.length];
                const osc = ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.value = bassBase * Math.pow(2, semi / 12);
                const g = ctx.createGain();
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(0.18, t + 0.01);
                g.gain.exponentialRampToValueAtTime(0.001, t + beatDur * 1.5);
                osc.connect(g).connect(masterGain);
                osc.start(t);
                osc.stop(t + beatDur * 2);
            }
        }

        // --- Hi-Hat ---
        for (let bar = 0; bar < totalBars; bar++) {
            for (let eighth = 0; eighth < 8; eighth++) {
                const t = now + bar * barDur + eighth * beatDur * 0.5;
                if (t - now >= this.duration) continue;
                const nBuf = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
                const nData = nBuf.getChannelData(0);
                for (let i = 0; i < nData.length; i++) {
                    nData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nData.length, 4);
                }
                const src = ctx.createBufferSource();
                src.buffer = nBuf;
                const hp = ctx.createBiquadFilter();
                hp.type = 'highpass';
                hp.frequency.value = 8000;
                const g = ctx.createGain();
                const accent = eighth % 2 === 0 ? 0.08 : 0.04;
                g.gain.setValueAtTime(accent, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
                src.connect(hp).connect(g).connect(masterGain);
                src.start(t);
                src.stop(t + 0.02);
            }
        }

        return { gain: masterGain };
    }
};
