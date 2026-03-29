// src/data/sfx-data.js — 21 SFX v1 + 3 SFX v2 + 21 SFX v3
import { SFX_SEASON_WIN } from '../../assets/audio/sfx-season-win.js';
import { SFX_ANALYSIS_BONUS } from '../../assets/audio/sfx-analysis-bonus.js';

/**
 * @typedef {Object} SFXParams
 * @property {'sine'|'square'|'sawtooth'|'triangle'|'noise'} wave
 * @property {number} freq - Start frequency Hz
 * @property {number} [freqEnd] - End frequency Hz (slide)
 * @property {number} duration - Seconds
 * @property {number} volume - 0–1
 * @property {number} [decay] - Exponential decay rate
 * @property {number} [duty] - Square wave duty cycle
 * @property {{type: string, freq: number, Q?: number}} [filter]
 */

/** @type {Record<string, SFXParams>} */
export const SFX_DATA = {
    SFX_SWIPE_LEFT: {
        wave: 'noise',
        freq: 400,
        freqEnd: 200,
        duration: 0.15,
        volume: 0.7,
        decay: 8,
        filter: { type: 'lowpass', freq: 2000, Q: 1 },
    },
    SFX_SWIPE_RIGHT: {
        wave: 'square',
        freq: 300,
        freqEnd: 150,
        duration: 0.12,
        volume: 0.7,
        decay: 10,
        duty: 0.5,
        filter: { type: 'lowpass', freq: 1500, Q: 2 },
    },
    SFX_CARD_ENTER: {
        wave: 'noise',
        freq: 800,
        freqEnd: 400,
        duration: 0.18,
        volume: 0.5,
        decay: 6,
        filter: { type: 'highpass', freq: 600, Q: 0.5 },
    },
    SFX_CARD_TIMEOUT: {
        wave: 'square',
        freq: 200,
        freqEnd: 100,
        duration: 0.4,
        volume: 0.8,
        decay: 4,
        duty: 0.3,
    },
    SFX_GAUGE_WARNING: {
        wave: 'sine',
        freq: 880,
        freqEnd: 660,
        duration: 0.2,
        volume: 0.6,
        decay: 5,
    },
    SFX_GAUGE_DANGER: {
        wave: 'square',
        freq: 440,
        freqEnd: 880,
        duration: 0.3,
        volume: 0.9,
        decay: 3,
        duty: 0.4,
    },
    SFX_GAUGE_RECOVER: {
        wave: 'sine',
        freq: 440,
        freqEnd: 880,
        duration: 0.25,
        volume: 0.5,
        decay: 4,
    },
    SFX_COMBO_INCREMENT: {
        wave: 'sine',
        freq: 1200,
        freqEnd: 1600,
        duration: 0.08,
        volume: 0.5,
        decay: 10,
    },
    SFX_COMBO_MILESTONE: {
        wave: 'square',
        freq: 600,
        freqEnd: 1200,
        duration: 0.35,
        volume: 0.7,
        decay: 3,
        duty: 0.5,
    },
    SFX_COMBO_BREAK: {
        wave: 'noise',
        freq: 2000,
        freqEnd: 100,
        duration: 0.4,
        volume: 0.6,
        decay: 3,
        filter: { type: 'highpass', freq: 500, Q: 1 },
    },
    SFX_GAMEOVER: {
        wave: 'sawtooth',
        freq: 440,
        freqEnd: 80,
        duration: 1.2,
        volume: 1.0,
        decay: 1.5,
        filter: { type: 'lowpass', freq: 3000, Q: 2 },
    },
    SFX_BUTTON_TAP: {
        wave: 'sine',
        freq: 1000,
        duration: 0.05,
        volume: 0.4,
        decay: 15,
    },
    SFX_TITLE_START: {
        wave: 'square',
        freq: 500,
        freqEnd: 1000,
        duration: 0.3,
        volume: 0.7,
        decay: 3,
        duty: 0.5,
    },
    SFX_SCORE_TICK: {
        wave: 'sine',
        freq: 2000,
        duration: 0.03,
        volume: 0.3,
        decay: 20,
    },
    SFX_PAPER_AMBIENT: {
        wave: 'noise',
        freq: 600,
        freqEnd: 300,
        duration: 2.0,
        volume: 0.2,
        decay: 0.5,
        filter: { type: 'lowpass', freq: 1000, Q: 0.3 },
    },

    // === V2 — SFX plugin format ===
    [SFX_SEASON_WIN.key]: SFX_SEASON_WIN,
    [SFX_ANALYSIS_BONUS.key]: SFX_ANALYSIS_BONUS,

    // === V3 — 26 SFX additions ===
    SFX_HEARTBEAT: { wave: 'sine', freq: 60, freqEnd: 50, duration: 0.4, volume: 0.6, decay: 2, filter: { type: 'lowpass', freq: 200, Q: 1 } },
    SFX_STAMP_ACCEPT: { wave: 'noise', freq: 500, freqEnd: 200, duration: 0.1, volume: 0.7, decay: 12, filter: { type: 'lowpass', freq: 1500, Q: 1 } },
    SFX_STAMP_REJECT: { wave: 'noise', freq: 600, freqEnd: 150, duration: 0.12, volume: 0.7, decay: 10, filter: { type: 'lowpass', freq: 1200, Q: 1 } },
    SFX_STAMP_FINAL: { wave: 'noise', freq: 800, freqEnd: 100, duration: 0.3, volume: 1.0, decay: 4, filter: { type: 'lowpass', freq: 2000, Q: 2 } },
    SFX_DESK_SLAM: { wave: 'noise', freq: 300, freqEnd: 50, duration: 0.5, volume: 1.0, decay: 3, filter: { type: 'lowpass', freq: 600, Q: 1 } },
    SFX_CHAMPAGNE_POP: { wave: 'noise', freq: 2000, freqEnd: 800, duration: 0.25, volume: 0.8, decay: 5, filter: { type: 'highpass', freq: 1000, Q: 2 } },
    SFX_PHONE_BOSS: { wave: 'sine', freq: 1200, freqEnd: 1600, duration: 0.2, volume: 0.7, decay: 6 },
    SFX_PHONE_HANGUP: { wave: 'square', freq: 400, freqEnd: 100, duration: 0.15, volume: 0.5, decay: 8, duty: 0.3 },
    SFX_PHONE_LOOP: { wave: 'sine', freq: 1400, freqEnd: 1800, duration: 0.8, volume: 0.4, decay: 1 },
    SFX_AVALANCHE_START: { wave: 'noise', freq: 1000, freqEnd: 300, duration: 0.6, volume: 0.8, decay: 2, filter: { type: 'lowpass', freq: 2000, Q: 1 } },
    SFX_AVALANCHE_SUCCESS: { wave: 'sine', freq: 500, freqEnd: 1200, duration: 0.5, volume: 0.7, decay: 2 },
    SFX_AVALANCHE_FAIL: { wave: 'sawtooth', freq: 300, freqEnd: 80, duration: 0.6, volume: 0.8, decay: 2 },
    SFX_KNOCK_KNOCK: { wave: 'noise', freq: 400, freqEnd: 200, duration: 0.08, volume: 0.9, decay: 15, filter: { type: 'lowpass', freq: 800, Q: 2 } },
    SFX_HUISSIER_EXIT: { wave: 'noise', freq: 200, freqEnd: 100, duration: 0.4, volume: 0.5, decay: 3, filter: { type: 'lowpass', freq: 500, Q: 1 } },
    SFX_TRIBUNAL_INTRO: { wave: 'sine', freq: 150, freqEnd: 300, duration: 1.0, volume: 0.6, decay: 1 },
    SFX_TRIBUNAL_GAVEL: { wave: 'noise', freq: 600, freqEnd: 100, duration: 0.2, volume: 1.0, decay: 6, filter: { type: 'lowpass', freq: 1000, Q: 2 } },
    SFX_STAGIAIRE_SUCCESS: { wave: 'sine', freq: 800, freqEnd: 1400, duration: 0.3, volume: 0.6, decay: 4 },
    SFX_STAGIAIRE_FAIL: { wave: 'square', freq: 300, freqEnd: 150, duration: 0.3, volume: 0.5, decay: 4, duty: 0.3 },
    SFX_FOLDER_OPEN: { wave: 'noise', freq: 800, freqEnd: 400, duration: 0.12, volume: 0.5, decay: 10, filter: { type: 'lowpass', freq: 2000, Q: 0.5 } },
    SFX_DRAWER_OPEN: { wave: 'noise', freq: 500, freqEnd: 200, duration: 0.2, volume: 0.6, decay: 6, filter: { type: 'lowpass', freq: 1000, Q: 0.5 } },
    SFX_VIP_LOST: { wave: 'sawtooth', freq: 500, freqEnd: 200, duration: 0.4, volume: 0.7, decay: 3, filter: { type: 'lowpass', freq: 1500, Q: 1 } },
};

/** All SFX key names for contract testing */
export const SFX_KEYS = Object.keys(SFX_DATA);
