// src/gameplay/game-state.js — Gauges, score, combo, cadence, and game-over logic

import { DEATH_MESSAGES } from '../data/document-data.js';

const INTERNAL_INITIAL_GAUGES = { argent: 50, satisfaction: 50, conformite: 50 };
const INITIAL_GAUGES = { ...INTERNAL_INITIAL_GAUGES, legal: INTERNAL_INITIAL_GAUGES.conformite };
const GAUGE_MIN = 0;
const GAUGE_MAX = 100;
const SAFE_LOW = 20;
const SAFE_HIGH = 80;
const WARNING_LOW = 10;
const WARNING_HIGH = 90;

const INTERVAL_BY_TOUR = [4000, 3880, 3750, 3600, 3440, 3260, 3060, 2860, 2660, 2440, 2240];
const BASE_INTERVAL = INTERVAL_BY_TOUR[0];
const MIN_INTERVAL = 2240;
const TOUR_DURATION_MS = 30000;

const COMBO_STEP = 2;
const COMBO_MULT_STEP = 0.25;
const COMBO_MAX_MULT = 2.5;

const BASE_POINTS = 40;
const SAFE_ZONE_BONUS = 35;
const QUALITY_POINTS = {
    good: 80,
    risky: 10,
    bad: -40,
};

export const CONSTANTS = {
    BASE_INTERVAL,
    COMBO_MAX_MULT,
    COMBO_STEP,
    GAUGE_MAX,
    GAUGE_MIN,
    INITIAL_GAUGES,
    MIN_INTERVAL,
    SAFE_HIGH,
    SAFE_LOW,
    WARNING_HIGH,
    WARNING_LOW,
};

let state = null;

function isConformiteGauge(key) {
    return key === 'conformite' || key === 'legal';
}

function isGaugeGameOver(key, value) {
    if (isConformiteGauge(key)) {
        return value <= 0;
    }

    return value <= 0 || value >= 100;
}

function clampGauge(value) {
    return Math.max(GAUGE_MIN, Math.min(GAUGE_MAX, value));
}

function getZone(key, value) {
    if (isConformiteGauge(key)) {
        if (value <= WARNING_LOW - 1) return 'danger';
        if (value <= SAFE_LOW - 1) return 'warning';
        return 'safe';
    }

    if (value <= WARNING_LOW - 1 || value >= WARNING_HIGH + 1) return 'danger';
    if (value <= SAFE_LOW - 1 || value >= SAFE_HIGH + 1) return 'warning';
    return 'safe';
}

function computeZones(gauges) {
    return {
        argent: getZone('argent', gauges.argent),
        satisfaction: getZone('satisfaction', gauges.satisfaction),
        conformite: getZone('conformite', gauges.conformite),
    };
}

function computeComboMultiplier(streak) {
    return Math.min(COMBO_MAX_MULT, 1 + Math.floor(streak / COMBO_STEP) * COMBO_MULT_STEP);
}

function allGaugesSafe(zones) {
    return zones.argent === 'safe' && zones.satisfaction === 'safe' && zones.conformite === 'safe';
}

function cloneState() {
    const gauges = { ...state.gauges, legal: state.gauges.conformite };
    const gaugeZones = { ...state.gaugeZones, legal: state.gaugeZones.conformite };

    return {
        ...state,
        gauges,
        gaugeZones,
        lastThreeResults: [...state.lastThreeResults],
        lastThreeLegalDeltas: [...state.lastThreeLegalDeltas],
        docQueue: [...state.docQueue],
    };
}

function syncComboAliases() {
    state.combo = state.stableTriageStreak;
    state.longestCombo = state.bestStableTriageStreak;
}

function applyGaugeEffects(effects) {
    for (const key of ['argent', 'satisfaction', 'conformite']) {
        const effect = effects[key] || 0;
        const nextValue = isConformiteGauge(key)
            ? state.gauges[key] - effect
            : state.gauges[key] + effect;
        state.gauges[key] = clampGauge(nextValue);
    }
    state.gaugeZones = computeZones(state.gauges);
}

function normalizeResolutionInput(resolution) {
    if (resolution && typeof resolution === 'object' && resolution.gaugeEffects) {
        return {
            actionKey: resolution.actionKey || 'accept',
            label: resolution.label || resolution.actionKey || 'accept',
            quality: resolution.quality || 'risky',
            gaugeEffects: {
                argent: resolution.gaugeEffects.argent || 0,
                satisfaction: resolution.gaugeEffects.satisfaction || 0,
                conformite: resolution.gaugeEffects.conformite ?? resolution.gaugeEffects.legal ?? 0,
            },
        };
    }

    return {
        actionKey: 'accept',
        label: 'accept',
        quality: 'risky',
        gaugeEffects: {
            argent: resolution?.argent || 0,
            satisfaction: resolution?.satisfaction || 0,
            conformite: resolution?.conformite ?? resolution?.legal ?? 0,
        },
    };
}

function computeScoreAdded(routeQuality, newZones) {
    const qualityPoints = QUALITY_POINTS[routeQuality] ?? 0;
    const safeZoneBonus = routeQuality === 'good' && allGaugesSafe(newZones) ? SAFE_ZONE_BONUS : 0;
    const total = BASE_POINTS + qualityPoints + safeZoneBonus;
    return Math.max(0, Math.round(total * state.comboMultiplier));
}

function updateStreak(routeQuality) {
    const previousCombo = state.combo;

    if (routeQuality === 'good') {
        state.stableTriageStreak += 1;
        state.bestStableTriageStreak = Math.max(state.bestStableTriageStreak, state.stableTriageStreak);
        state.comboMultiplier = computeComboMultiplier(state.stableTriageStreak);
    } else if (routeQuality === 'bad') {
        state.stableTriageStreak = 0;
        state.comboMultiplier = 1;
    }

    syncComboAliases();
    return previousCombo !== state.combo;
}

function getDeathMessage(gauge, value) {
    const key = `${gauge}_${value <= 0 ? 0 : 100}`;
    const options = DEATH_MESSAGES[key] || ['La boîte s\'effondre.'];
    const index = Math.floor(Math.random() * options.length);
    return options[index];
}

export function initGameState() {
    state = {
        gauges: { ...INTERNAL_INITIAL_GAUGES },
        gaugeZones: computeZones(INTERNAL_INITIAL_GAUGES),
        score: 0,
        combo: 0,
        stableTriageStreak: 0,
        comboMultiplier: 1,
        tour: 1,
        documentInterval: BASE_INTERVAL,
        documentsProcessed: 0,
        longestCombo: 0,
        bestStableTriageStreak: 0,
        elapsedMs: 0,
        lastThreeResults: [],
        lastThreeLegalDeltas: [],
        analysisStartMs: 0,
        deskChaosLevel: 0,
        quickReadMode: false,
        docQueue: [],
    };
    return cloneState();
}

export function getGameState() {
    if (!state) return initGameState();
    return cloneState();
}

export function resetGameState() {
    return initGameState();
}

export function _setGaugeDirect(key, value) {
    const normalizedKey = key === 'legal' ? 'conformite' : key;
    if (!state || !(normalizedKey in state.gauges)) return;
    state.gauges[normalizedKey] = clampGauge(value);
    state.gaugeZones = computeZones(state.gauges);
}

export function processDocument(resolution) {
    if (!state) initGameState();

    const normalized = normalizeResolutionInput(resolution);
    const previousZones = { ...state.gaugeZones };
    const previousCombo = state.combo;

    applyGaugeEffects(normalized.gaugeEffects);

    let comboChanged = false;
    let scoreAdded = 0;
    let streakBroken = false;

    state.documentsProcessed += 1;
    comboChanged = updateStreak(normalized.quality);
    streakBroken = normalized.quality === 'bad' && previousCombo > 0;
    scoreAdded = computeScoreAdded(normalized.quality, state.gaugeZones);
    state.score += scoreAdded;

    return {
        actionKey: normalized.actionKey,
        routeQuality: normalized.quality,
        scoreAdded,
        comboChanged,
        streakBroken,
        gameOver: isGameOver(),
        newZones: { ...state.gaugeZones },
        previousZones,
        combo: state.combo,
        comboMultiplier: state.comboMultiplier,
    };
}

export function updateGameState(deltaMs) {
    if (!state) initGameState();

    const previousTour = state.tour;
    state.elapsedMs += deltaMs;
    state.tour = Math.floor(state.elapsedMs / TOUR_DURATION_MS) + 1;
    state.documentInterval = INTERVAL_BY_TOUR[state.tour - 1] ?? MIN_INTERVAL;

    return {
        gameOver: isGameOver(),
        scoreAdded: 0,
        tourChanged: previousTour !== state.tour,
        backlogChanged: false,
    };
}

export function isGameOver() {
    if (!state) return false;
    return Object.entries(state.gauges).some(([key, value]) => isGaugeGameOver(key, value));
}

export function getDeathCause() {
    if (!state) return null;

    for (const gauge of ['argent', 'satisfaction', 'conformite']) {
        const value = state.gauges[gauge];
        if (isGaugeGameOver(gauge, value)) {
            return {
                gauge,
                value: value <= 0 ? 0 : 100,
                message: getDeathMessage(gauge, value),
            };
        }
    }

    return null;
}

export function recordResult(actionKey, legalDelta) {
    if (!state) initGameState();
    state.lastThreeResults.push(actionKey);
    state.lastThreeLegalDeltas.push(legalDelta);
    if (state.lastThreeResults.length > 3) state.lastThreeResults.shift();
    if (state.lastThreeLegalDeltas.length > 3) state.lastThreeLegalDeltas.shift();
}

export function setAnalysisStart() {
    if (!state) initGameState();
    state.analysisStartMs = performance.now();
}

export function checkAnalysisBonus() {
    return false;
}

export function setDeskChaosLevel(level) {
    if (!state) initGameState();
    state.deskChaosLevel = level;
}
