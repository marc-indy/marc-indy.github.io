// src/engine/audio.js — Web Audio engine: SFX playback, music generation, crossfade

let audioCtx = null;
let sfxRegistry = {};
let musicRegistry = {};
let currentMusicKey = null;
let currentMusicNodes = [];
let musicGain = null;
let sfxGain = null;
let masterGain = null;
let initialized = false;

const NOTE_FREQ = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
};

export function initAudio() {
    if (initialized) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 1.0;
        masterGain.connect(audioCtx.destination);

        musicGain = audioCtx.createGain();
        musicGain.gain.value = 0.5;
        musicGain.connect(masterGain);

        sfxGain = audioCtx.createGain();
        sfxGain.gain.value = 0.8;
        sfxGain.connect(masterGain);

        initialized = true;
    } catch (e) {
        console.warn('Audio initialization failed:', e);
    }
}

export function registerSFX(sfxData) {
    sfxRegistry = { ...sfxRegistry, ...sfxData };
}

export function registerMusic(musicData) {
    musicRegistry = { ...musicRegistry, ...musicData };
}

export function playSFX(key) {
    if (!audioCtx || !initialized) return;
    const params = sfxRegistry[key];
    if (!params) {
        console.warn(`SFX key not found: ${key}`);
        return;
    }

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Plugin format : l'asset a une méthode play(ctx, dest)
    if (typeof params.play === 'function') {
        params.play(audioCtx, sfxGain);
        return;
    }

    if (params.wave === 'noise') {
        playNoiseSFX(params, now);
    } else {
        playToneSFX(params, now);
    }
}

function playToneSFX(params, now) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = params.wave;
    osc.frequency.setValueAtTime(params.freq, now);
    if (params.freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, params.freqEnd), now + params.duration);
    }

    gain.gain.setValueAtTime(params.volume, now);
    if (params.decay) {
        gain.gain.exponentialRampToValueAtTime(0.001, now + params.duration);
    }

    osc.connect(gain);

    // Filter
    if (params.filter) {
        const filter = audioCtx.createBiquadFilter();
        filter.type = params.filter.type;
        filter.frequency.value = params.filter.freq;
        if (params.filter.Q) filter.Q.value = params.filter.Q;
        gain.connect(filter);
        filter.connect(sfxGain);
    } else {
        gain.connect(sfxGain);
    }

    osc.start(now);
    osc.stop(now + params.duration);
}

function playNoiseSFX(params, now) {
    const bufferSize = Math.floor(audioCtx.sampleRate * params.duration);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(params.volume, now);
    if (params.decay) {
        gain.gain.exponentialRampToValueAtTime(0.001, now + params.duration);
    }

    source.connect(gain);

    if (params.filter) {
        const filter = audioCtx.createBiquadFilter();
        filter.type = params.filter.type;
        filter.frequency.value = params.filter.freq;
        if (params.filter.Q) filter.Q.value = params.filter.Q;
        gain.connect(filter);
        filter.connect(sfxGain);
    } else {
        gain.connect(sfxGain);
    }

    source.start(now);
    source.stop(now + params.duration);
}

export function playMusic(key) {
    if (!audioCtx || !initialized) return;
    const params = musicRegistry[key];
    if (!params) {
        console.warn(`Music key not found: ${key}`);
        return;
    }

    stopMusic();
    currentMusicKey = key;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    scheduleMusic(params);
}

function scheduleMusic(params) {
    // Plugin format : l'asset a une méthode play(ctx, dest) autonome
    if (typeof params.play === 'function') {
        params.play(audioCtx, musicGain);
        // Loop géré en interne par l'asset — on stocke un handle factice
        if (params.loop && params.duration) {
            const loopTimeout = setTimeout(() => {
                if (currentMusicKey === null) return;
                const key = currentMusicKey;
                currentMusicNodes = [];
                if (musicRegistry[key]) scheduleMusic(musicRegistry[key]);
            }, params.duration * 1000);
            currentMusicNodes._loopTimeout = loopTimeout;
        }
        return;
    }

    const now = audioCtx.currentTime;
    const beatDuration = 60 / params.bpm;
    const totalDuration = params.bars * 4 * beatDuration;

    for (const track of params.tracks) {
        let time = now;
        for (const note of track.notes) {
            if (note === null) {
                time += beatDuration;
                continue;
            }
            const freq = NOTE_FREQ[note.note];
            if (!freq) {
                time += note.duration * beatDuration;
                continue;
            }

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = track.wave;
            osc.frequency.setValueAtTime(freq, time);

            const vol = note.volume * track.volume;
            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + note.duration * beatDuration);

            osc.connect(gain);
            gain.connect(musicGain);

            osc.start(time);
            osc.stop(time + note.duration * beatDuration);

            currentMusicNodes.push(osc);
            time += note.duration * beatDuration;
        }
    }

    // Loop scheduling
    if (params.loop) {
        const loopTimeout = setTimeout(() => {
            if (currentMusicKey === null) return;
            const currentKey = currentMusicKey;
            currentMusicNodes = [];
            if (musicRegistry[currentKey]) {
                scheduleMusic(musicRegistry[currentKey]);
            }
        }, totalDuration * 1000);
        currentMusicNodes._loopTimeout = loopTimeout;
    }
}

export function stopMusic() {
    for (const node of currentMusicNodes) {
        try { node.stop(); } catch (e) { /* already stopped */ }
    }
    if (currentMusicNodes._loopTimeout) {
        clearTimeout(currentMusicNodes._loopTimeout);
    }
    currentMusicNodes = [];
    currentMusicKey = null;
}

export function crossfadeMusic(toKey, durationMs) {
    if (!audioCtx || !initialized) return;
    if (!musicRegistry[toKey]) return;
    if (currentMusicKey === toKey) return;

    const durationSec = durationMs / 1000;
    const now = audioCtx.currentTime;

    // Fade out current
    if (musicGain) {
        musicGain.gain.linearRampToValueAtTime(0, now + durationSec / 2);
    }

    setTimeout(() => {
        stopMusic();
        if (musicGain) {
            musicGain.gain.setValueAtTime(0, audioCtx.currentTime);
            musicGain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + durationSec / 2);
        }
        playMusic(toKey);
    }, (durationSec / 2) * 1000);
}

export function setMusicVolume(vol) {
    if (musicGain) musicGain.gain.value = Math.max(0, Math.min(1, vol));
}

export function setSFXVolume(vol) {
    if (sfxGain) sfxGain.gain.value = Math.max(0, Math.min(1, vol));
}

// === V3 — Dynamic highpass filter for danger crescendo ===
let dangerHighpass = null;

/**
 * Set dynamic highpass filter frequency on the music bus.
 * 0 = bypass (no filter). Values > 0 insert a highpass filter.
 * @param {number} hz — cutoff frequency in Hz. 0 disables.
 */
export function setHighpassFreq(hz) {
    if (!audioCtx || !initialized) return;

    if (hz <= 0) {
        // Remove filter — reconnect music gain directly to master
        if (dangerHighpass) {
            try { musicGain.disconnect(dangerHighpass); } catch (e) { /* ok */ }
            try { dangerHighpass.disconnect(masterGain); } catch (e) { /* ok */ }
            dangerHighpass = null;
        }
        try { musicGain.disconnect(); } catch (e) { /* ok */ }
        musicGain.connect(masterGain);
        return;
    }

    if (!dangerHighpass) {
        dangerHighpass = audioCtx.createBiquadFilter();
        dangerHighpass.type = 'highpass';
        dangerHighpass.Q.value = 1;
        // Rewire: musicGain → highpass → masterGain
        try { musicGain.disconnect(); } catch (e) { /* ok */ }
        musicGain.connect(dangerHighpass);
        dangerHighpass.connect(masterGain);
    }

    dangerHighpass.frequency.setValueAtTime(hz, audioCtx.currentTime);
}

/**
 * Get current highpass frequency (0 if bypassed).
 * @returns {number}
 */
export function getHighpassFreq() {
    if (!dangerHighpass) return 0;
    return dangerHighpass.frequency.value;
}

export function isInitialized() {
    return initialized;
}
