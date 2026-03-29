// src/data/music-data.js — 4 tracks v1 + 5 tracks v3

/**
 * @typedef {Object} MusicTrack
 * @property {'sine'|'square'|'sawtooth'|'triangle'} wave
 * @property {Array<{note: string, duration: number, volume: number}|null>} notes
 * @property {number} volume
 */

/**
 * @typedef {Object} MusicParams
 * @property {number} bpm
 * @property {number} bars
 * @property {boolean} loop
 * @property {MusicTrack[]} tracks
 */

// Helper: note name → frequency
const NOTE_FREQ = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
};

export { NOTE_FREQ };

/** @type {Record<string, MusicParams>} */
export const MUSIC_DATA = {
    MUSIC_TITLE: {
        bpm: 120,
        bars: 8,
        loop: true,
        tracks: [
            // Melody — square wave, 32 beats (8 bars × 4 beats)
            {
                wave: 'square',
                volume: 0.15,
                notes: [
                    // Bar 1
                    { note: 'C4', duration: 0.5, volume: 0.8 },
                    { note: 'E4', duration: 0.5, volume: 0.7 },
                    { note: 'G4', duration: 0.5, volume: 0.8 },
                    { note: 'E4', duration: 0.5, volume: 0.6 },
                    { note: 'C4', duration: 0.5, volume: 0.8 },
                    { note: 'D4', duration: 0.5, volume: 0.7 },
                    { note: 'E4', duration: 0.5, volume: 0.8 },
                    null,
                    // Bar 2
                    { note: 'F4', duration: 0.5, volume: 0.7 },
                    { note: 'E4', duration: 0.5, volume: 0.7 },
                    { note: 'D4', duration: 0.5, volume: 0.6 },
                    { note: 'C4', duration: 0.5, volume: 0.8 },
                    { note: 'G4', duration: 1.0, volume: 0.9 },
                    { note: 'C5', duration: 0.5, volume: 0.8 },
                    { note: 'B4', duration: 0.5, volume: 0.7 },
                    // Bar 3
                    { note: 'A4', duration: 0.5, volume: 0.7 },
                    { note: 'G4', duration: 0.5, volume: 0.7 },
                    { note: 'A4', duration: 0.5, volume: 0.6 },
                    { note: 'B4', duration: 0.5, volume: 0.8 },
                    { note: 'C5', duration: 0.5, volume: 0.8 },
                    { note: 'A4', duration: 0.5, volume: 0.7 },
                    { note: 'G4', duration: 0.5, volume: 0.7 },
                    null,
                    // Bar 4
                    { note: 'G4', duration: 0.5, volume: 0.7 },
                    { note: 'F4', duration: 0.5, volume: 0.6 },
                    { note: 'E4', duration: 0.5, volume: 0.6 },
                    { note: 'D4', duration: 0.5, volume: 0.5 },
                    { note: 'C4', duration: 1.0, volume: 0.8 },
                    null,
                    null,
                    // Bar 5
                    { note: 'E4', duration: 0.5, volume: 0.8 },
                    { note: 'G4', duration: 0.5, volume: 0.7 },
                    { note: 'C5', duration: 0.5, volume: 0.8 },
                    { note: 'G4', duration: 0.5, volume: 0.6 },
                    { note: 'E4', duration: 0.5, volume: 0.8 },
                    { note: 'F4', duration: 0.5, volume: 0.7 },
                    { note: 'G4', duration: 0.5, volume: 0.8 },
                    null,
                    // Bar 6
                    { note: 'A4', duration: 0.5, volume: 0.7 },
                    { note: 'G4', duration: 0.5, volume: 0.7 },
                    { note: 'F4', duration: 0.5, volume: 0.6 },
                    { note: 'E4', duration: 0.5, volume: 0.8 },
                    { note: 'D4', duration: 1.0, volume: 0.8 },
                    { note: 'E4', duration: 0.5, volume: 0.7 },
                    { note: 'G4', duration: 0.5, volume: 0.7 },
                    // Bar 7
                    { note: 'F4', duration: 0.5, volume: 0.7 },
                    { note: 'E4', duration: 0.5, volume: 0.6 },
                    { note: 'D4', duration: 0.5, volume: 0.6 },
                    { note: 'E4', duration: 0.5, volume: 0.7 },
                    { note: 'F4', duration: 0.5, volume: 0.7 },
                    { note: 'G4', duration: 0.5, volume: 0.8 },
                    { note: 'A4', duration: 0.5, volume: 0.7 },
                    null,
                    // Bar 8
                    { note: 'G4', duration: 0.5, volume: 0.7 },
                    { note: 'E4', duration: 0.5, volume: 0.6 },
                    { note: 'D4', duration: 0.5, volume: 0.5 },
                    { note: 'C4', duration: 0.5, volume: 0.7 },
                    { note: 'C4', duration: 1.0, volume: 0.8 },
                    null,
                    null,
                ],
            },
            // Bass — triangle wave, 32 beats
            {
                wave: 'triangle',
                volume: 0.12,
                notes: [
                    // Bar 1
                    { note: 'C3', duration: 1.0, volume: 0.6 },
                    { note: 'G3', duration: 1.0, volume: 0.6 },
                    { note: 'C3', duration: 1.0, volume: 0.6 },
                    { note: 'G3', duration: 1.0, volume: 0.6 },
                    // Bar 2
                    { note: 'F3', duration: 1.0, volume: 0.6 },
                    { note: 'C3', duration: 1.0, volume: 0.6 },
                    { note: 'G3', duration: 1.0, volume: 0.6 },
                    { note: 'C3', duration: 1.0, volume: 0.5 },
                    // Bar 3
                    { note: 'A3', duration: 1.0, volume: 0.5 },
                    { note: 'E3', duration: 1.0, volume: 0.5 },
                    { note: 'A3', duration: 1.0, volume: 0.5 },
                    { note: 'G3', duration: 1.0, volume: 0.5 },
                    // Bar 4
                    { note: 'G3', duration: 1.0, volume: 0.5 },
                    { note: 'F3', duration: 1.0, volume: 0.5 },
                    { note: 'E3', duration: 1.0, volume: 0.5 },
                    { note: 'C3', duration: 1.0, volume: 0.6 },
                    // Bar 5
                    { note: 'C3', duration: 1.0, volume: 0.6 },
                    { note: 'E3', duration: 1.0, volume: 0.6 },
                    { note: 'G3', duration: 1.0, volume: 0.6 },
                    { note: 'E3', duration: 1.0, volume: 0.6 },
                    // Bar 6
                    { note: 'F3', duration: 1.0, volume: 0.6 },
                    { note: 'G3', duration: 1.0, volume: 0.6 },
                    { note: 'A3', duration: 1.0, volume: 0.5 },
                    { note: 'G3', duration: 1.0, volume: 0.5 },
                    // Bar 7
                    { note: 'D3', duration: 1.0, volume: 0.5 },
                    { note: 'F3', duration: 1.0, volume: 0.5 },
                    { note: 'G3', duration: 1.0, volume: 0.6 },
                    { note: 'A3', duration: 1.0, volume: 0.5 },
                    // Bar 8
                    { note: 'G3', duration: 1.0, volume: 0.5 },
                    { note: 'E3', duration: 1.0, volume: 0.5 },
                    { note: 'C3', duration: 1.0, volume: 0.6 },
                    { note: 'C3', duration: 1.0, volume: 0.6 },
                ],
            },
            // Pad — sine wave, sustained chords for harmonic fill
            {
                wave: 'sine',
                volume: 0.06,
                notes: [
                    // Bar 1-2: C major
                    { note: 'E4', duration: 2.0, volume: 0.5 },
                    { note: 'G4', duration: 2.0, volume: 0.5 },
                    { note: 'E4', duration: 2.0, volume: 0.5 },
                    { note: 'G4', duration: 2.0, volume: 0.5 },
                    // Bar 3-4: Am → G
                    { note: 'A4', duration: 2.0, volume: 0.5 },
                    { note: 'E4', duration: 2.0, volume: 0.5 },
                    { note: 'G4', duration: 2.0, volume: 0.5 },
                    { note: 'D4', duration: 2.0, volume: 0.4 },
                    // Bar 5-6: C → F
                    { note: 'E4', duration: 2.0, volume: 0.5 },
                    { note: 'G4', duration: 2.0, volume: 0.5 },
                    { note: 'F4', duration: 2.0, volume: 0.5 },
                    { note: 'A4', duration: 2.0, volume: 0.5 },
                    // Bar 7-8: Dm → C
                    { note: 'F4', duration: 2.0, volume: 0.5 },
                    { note: 'A4', duration: 2.0, volume: 0.5 },
                    { note: 'E4', duration: 2.0, volume: 0.5 },
                    { note: 'G4', duration: 2.0, volume: 0.4 },
                ],
            },
        ],
    },

    MUSIC_GAMEPLAY_CALM: {
        bpm: 130,
        bars: 12,
        loop: true,
        tracks: [
            {
                wave: 'sine',
                volume: 0.12,
                notes: [
                    { note: 'C5', duration: 0.25, volume: 0.7 },
                    { note: 'E5', duration: 0.25, volume: 0.6 },
                    { note: 'G4', duration: 0.25, volume: 0.5 },
                    { note: 'C5', duration: 0.25, volume: 0.7 },
                    null,
                    { note: 'D5', duration: 0.25, volume: 0.6 },
                    { note: 'B4', duration: 0.25, volume: 0.5 },
                    { note: 'G4', duration: 0.5, volume: 0.6 },
                    { note: 'A4', duration: 0.25, volume: 0.7 },
                    { note: 'C5', duration: 0.25, volume: 0.6 },
                    { note: 'E5', duration: 0.5, volume: 0.8 },
                    null,
                    { note: 'F5', duration: 0.25, volume: 0.6 },
                    { note: 'E5', duration: 0.25, volume: 0.5 },
                    { note: 'D5', duration: 0.25, volume: 0.5 },
                    { note: 'C5', duration: 0.5, volume: 0.7 },
                ],
            },
            {
                wave: 'triangle',
                volume: 0.10,
                notes: [
                    { note: 'C3', duration: 0.5, volume: 0.5 },
                    null,
                    { note: 'G3', duration: 0.5, volume: 0.5 },
                    null,
                    { note: 'C3', duration: 0.5, volume: 0.5 },
                    null,
                    { note: 'E3', duration: 0.5, volume: 0.5 },
                    null,
                    { note: 'F3', duration: 0.5, volume: 0.5 },
                    null,
                    { note: 'G3', duration: 0.5, volume: 0.5 },
                    null,
                    { note: 'A3', duration: 0.5, volume: 0.5 },
                    null,
                    { note: 'G3', duration: 0.5, volume: 0.5 },
                    null,
                ],
            },
        ],
    },

    MUSIC_GAMEPLAY_TENSE: {
        bpm: 150,
        bars: 8,
        loop: true,
        tracks: [
            {
                wave: 'sawtooth',
                volume: 0.10,
                notes: [
                    { note: 'E4', duration: 0.25, volume: 0.8 },
                    { note: 'E4', duration: 0.25, volume: 0.6 },
                    null,
                    { note: 'E4', duration: 0.25, volume: 0.8 },
                    { note: 'G4', duration: 0.25, volume: 0.7 },
                    null,
                    { note: 'A4', duration: 0.25, volume: 0.8 },
                    { note: 'G4', duration: 0.25, volume: 0.6 },
                    { note: 'E4', duration: 0.25, volume: 0.8 },
                    { note: 'D4', duration: 0.25, volume: 0.7 },
                    null,
                    { note: 'E4', duration: 0.5, volume: 0.9 },
                    { note: 'B4', duration: 0.25, volume: 0.8 },
                    { note: 'A4', duration: 0.25, volume: 0.7 },
                    { note: 'G4', duration: 0.25, volume: 0.8 },
                    { note: 'E4', duration: 0.25, volume: 0.7 },
                ],
            },
            {
                wave: 'square',
                volume: 0.08,
                notes: [
                    { note: 'E3', duration: 0.25, volume: 0.6 },
                    null,
                    { note: 'E3', duration: 0.25, volume: 0.6 },
                    null,
                    { note: 'G3', duration: 0.25, volume: 0.6 },
                    null,
                    { note: 'A3', duration: 0.25, volume: 0.6 },
                    null,
                    { note: 'E3', duration: 0.25, volume: 0.6 },
                    null,
                    { note: 'D3', duration: 0.25, volume: 0.6 },
                    null,
                    { note: 'E3', duration: 0.5, volume: 0.7 },
                    null,
                    { note: 'B3', duration: 0.25, volume: 0.6 },
                    null,
                ],
            },
        ],
    },

    MUSIC_GAMEOVER: {
        bpm: 90,
        bars: 2,
        loop: false,
        tracks: [
            {
                wave: 'sawtooth',
                volume: 0.15,
                notes: [
                    { note: 'G4', duration: 0.5, volume: 0.8 },
                    { note: 'F4', duration: 0.5, volume: 0.7 },
                    { note: 'E4', duration: 0.5, volume: 0.7 },
                    { note: 'D4', duration: 0.5, volume: 0.6 },
                    { note: 'C4', duration: 1.5, volume: 0.5 },
                    null,
                    null,
                    null,
                ],
            },
            {
                wave: 'triangle',
                volume: 0.12,
                notes: [
                    { note: 'C3', duration: 1.0, volume: 0.5 },
                    null,
                    { note: 'G3', duration: 1.0, volume: 0.4 },
                    null,
                    { note: 'C3', duration: 2.0, volume: 0.3 },
                    null,
                    null,
                    null,
                ],
            },
        ],
    },
};

/** All music key names for contract testing */
export const MUSIC_KEYS = Object.keys(MUSIC_DATA);

// === V3 — 5 music additions ===
MUSIC_DATA.MUSIC_TRIBUNAL = {
    bpm: 80, bars: 8, loop: true,
    tracks: [
        {
            wave: 'sine', volume: 0.18, notes: [
                { note: 'A3', duration: 1.0, volume: 0.6 }, null, { note: 'E3', duration: 1.0, volume: 0.6 }, null,
                { note: 'A3', duration: 1.0, volume: 0.5 }, null, { note: 'D4', duration: 1.0, volume: 0.7 }, null,
                { note: 'C4', duration: 1.0, volume: 0.6 }, null, { note: 'B3', duration: 1.0, volume: 0.5 }, null,
                { note: 'A3', duration: 1.0, volume: 0.6 }, null, { note: 'E3', duration: 1.0, volume: 0.5 }, null,
                { note: 'A3', duration: 1.0, volume: 0.6 }, null, { note: 'C4', duration: 1.0, volume: 0.7 }, null,
                { note: 'B3', duration: 1.0, volume: 0.5 }, null, { note: 'A3', duration: 1.0, volume: 0.6 }, null,
                { note: 'G3', duration: 1.0, volume: 0.5 }, null, { note: 'F3', duration: 1.0, volume: 0.4 }, null,
                { note: 'E3', duration: 2.0, volume: 0.6 }, null, null, null,
            ]
        },
        {
            wave: 'triangle', volume: 0.12, notes: [
                { note: 'A3', duration: 2.0, volume: 0.4 }, null, null, null,
                { note: 'D3', duration: 2.0, volume: 0.4 }, null, null, null,
                { note: 'E3', duration: 2.0, volume: 0.4 }, null, null, null,
                { note: 'A3', duration: 2.0, volume: 0.4 }, null, null, null,
                { note: 'A3', duration: 2.0, volume: 0.4 }, null, null, null,
                { note: 'D3', duration: 2.0, volume: 0.4 }, null, null, null,
                { note: 'E3', duration: 2.0, volume: 0.4 }, null, null, null,
                { note: 'A3', duration: 2.0, volume: 0.3 }, null, null, null,
            ]
        },
    ],
};

MUSIC_DATA.MUSIC_BOSS_CALL = {
    bpm: 100, bars: 4, loop: true,
    tracks: [
        {
            wave: 'square', volume: 0.12, notes: [
                { note: 'E4', duration: 0.25, volume: 0.7 }, { note: 'E4', duration: 0.25, volume: 0.5 },
                { note: 'G4', duration: 0.25, volume: 0.7 }, null,
                { note: 'E4', duration: 0.25, volume: 0.6 }, { note: 'E4', duration: 0.25, volume: 0.4 },
                { note: 'A4', duration: 0.25, volume: 0.7 }, null,
                { note: 'G4', duration: 0.25, volume: 0.7 }, { note: 'E4', duration: 0.25, volume: 0.5 },
                { note: 'D4', duration: 0.5, volume: 0.6 }, null,
                { note: 'C4', duration: 0.5, volume: 0.7 }, null,
                { note: 'D4', duration: 0.5, volume: 0.5 }, null,
            ]
        },
        {
            wave: 'triangle', volume: 0.1, notes: [
                { note: 'C3', duration: 1.0, volume: 0.5 }, null, null, null,
                { note: 'A3', duration: 1.0, volume: 0.4 }, null, null, null,
                { note: 'F3', duration: 1.0, volume: 0.4 }, null, null, null,
                { note: 'G3', duration: 1.0, volume: 0.5 }, null, null, null,
            ]
        },
    ],
};

MUSIC_DATA.MUSIC_GAMEPLAY_LOFI = {
    bpm: 85, bars: 8, loop: true,
    tracks: [
        {
            wave: 'triangle', volume: 0.14, notes: [
                { note: 'E4', duration: 0.75, volume: 0.5 }, null, { note: 'G4', duration: 0.5, volume: 0.4 }, null,
                { note: 'A4', duration: 0.75, volume: 0.5 }, null, { note: 'G4', duration: 0.5, volume: 0.4 }, null,
                { note: 'E4', duration: 0.5, volume: 0.4 }, null, { note: 'D4', duration: 0.75, volume: 0.5 }, null,
                { note: 'C4', duration: 0.75, volume: 0.4 }, null, { note: 'D4', duration: 0.5, volume: 0.4 }, null,
                { note: 'E4', duration: 0.75, volume: 0.5 }, null, { note: 'G4', duration: 0.5, volume: 0.4 }, null,
                { note: 'A4', duration: 0.5, volume: 0.5 }, null, { note: 'B4', duration: 0.5, volume: 0.4 }, null,
                { note: 'A4', duration: 0.5, volume: 0.4 }, null, { note: 'G4', duration: 0.75, volume: 0.5 }, null,
                { note: 'E4', duration: 1.0, volume: 0.4 }, null, null, null,
            ]
        },
        {
            wave: 'sine', volume: 0.1, notes: [
                { note: 'C3', duration: 2.0, volume: 0.3 }, null, null, null,
                { note: 'A3', duration: 2.0, volume: 0.3 }, null, null, null,
                { note: 'F3', duration: 2.0, volume: 0.3 }, null, null, null,
                { note: 'G3', duration: 2.0, volume: 0.3 }, null, null, null,
                { note: 'C3', duration: 2.0, volume: 0.3 }, null, null, null,
                { note: 'A3', duration: 2.0, volume: 0.3 }, null, null, null,
                { note: 'D3', duration: 2.0, volume: 0.3 }, null, null, null,
                { note: 'G3', duration: 2.0, volume: 0.3 }, null, null, null,
            ]
        },
    ],
};

MUSIC_DATA.MUSIC_GAMEPLAY_CHIPTUNE = {
    bpm: 140, bars: 8, loop: true,
    tracks: [
        {
            wave: 'square', volume: 0.1, notes: [
                { note: 'C5', duration: 0.25, volume: 0.7 }, { note: 'E5', duration: 0.25, volume: 0.6 },
                { note: 'G5', duration: 0.25, volume: 0.7 }, { note: 'E5', duration: 0.25, volume: 0.6 },
                { note: 'C5', duration: 0.25, volume: 0.7 }, { note: 'D5', duration: 0.25, volume: 0.6 },
                { note: 'E5', duration: 0.5, volume: 0.7 }, null,
                { note: 'G4', duration: 0.25, volume: 0.6 }, { note: 'A4', duration: 0.25, volume: 0.6 },
                { note: 'B4', duration: 0.25, volume: 0.7 }, { note: 'C5', duration: 0.25, volume: 0.7 },
                { note: 'B4', duration: 0.25, volume: 0.6 }, { note: 'A4', duration: 0.25, volume: 0.6 },
                { note: 'G4', duration: 0.5, volume: 0.7 }, null,
                { note: 'C5', duration: 0.25, volume: 0.7 }, { note: 'E5', duration: 0.25, volume: 0.6 },
                { note: 'G5', duration: 0.25, volume: 0.7 }, { note: 'A5', duration: 0.25, volume: 0.7 },
                { note: 'G5', duration: 0.25, volume: 0.6 }, { note: 'E5', duration: 0.25, volume: 0.6 },
                { note: 'C5', duration: 0.5, volume: 0.7 }, null,
                { note: 'B4', duration: 0.25, volume: 0.6 }, { note: 'A4', duration: 0.25, volume: 0.6 },
                { note: 'G4', duration: 0.5, volume: 0.7 }, null,
                { note: 'E4', duration: 0.25, volume: 0.5 }, { note: 'F4', duration: 0.25, volume: 0.5 },
                { note: 'G4', duration: 0.5, volume: 0.6 }, null,
            ]
        },
        {
            wave: 'triangle', volume: 0.08, notes: [
                { note: 'C3', duration: 0.5, volume: 0.5 }, null,
                { note: 'G3', duration: 0.5, volume: 0.5 }, null,
                { note: 'C3', duration: 0.5, volume: 0.5 }, null,
                { note: 'G3', duration: 0.5, volume: 0.5 }, null,
                { note: 'A3', duration: 0.5, volume: 0.5 }, null,
                { note: 'E3', duration: 0.5, volume: 0.5 }, null,
                { note: 'A3', duration: 0.5, volume: 0.5 }, null,
                { note: 'E3', duration: 0.5, volume: 0.5 }, null,
                { note: 'F3', duration: 0.5, volume: 0.5 }, null,
                { note: 'C3', duration: 0.5, volume: 0.5 }, null,
                { note: 'G3', duration: 0.5, volume: 0.5 }, null,
                { note: 'D3', duration: 0.5, volume: 0.5 }, null,
                { note: 'E3', duration: 0.5, volume: 0.5 }, null,
                { note: 'G3', duration: 0.5, volume: 0.5 }, null,
                { note: 'C4', duration: 1.0, volume: 0.4 }, null, null, null,
            ]
        },
    ],
};

MUSIC_DATA.MUSIC_VICTORY_EPIC = {
    bpm: 130, bars: 4, loop: false,
    tracks: [
        {
            wave: 'square', volume: 0.15, notes: [
                { note: 'C5', duration: 0.25, volume: 0.8 }, { note: 'E5', duration: 0.25, volume: 0.8 },
                { note: 'G5', duration: 0.5, volume: 0.9 }, null,
                { note: 'A5', duration: 0.5, volume: 0.9 }, null,
                { note: 'G5', duration: 0.5, volume: 0.8 }, null,
                { note: 'E5', duration: 0.25, volume: 0.7 }, { note: 'G5', duration: 0.25, volume: 0.8 },
                { note: 'A5', duration: 0.5, volume: 0.9 }, null,
                { note: 'B5', duration: 0.75, volume: 1.0 }, null, null, null,
            ]
        },
        {
            wave: 'sawtooth', volume: 0.1, notes: [
                { note: 'C4', duration: 1.0, volume: 0.5 }, null, null, null,
                { note: 'F4', duration: 1.0, volume: 0.5 }, null, null, null,
                { note: 'G4', duration: 1.0, volume: 0.5 }, null, null, null,
                { note: 'C5', duration: 2.0, volume: 0.6 }, null, null, null,
            ]
        },
    ],
};
