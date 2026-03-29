// src/gameplay/escalation.js — Tour escalation table, pressure-reactive spawning, speed modifiers

/**
 * @typedef {Object} TourTwists
 * @property {number} driftMultiplier — 1 or 2
 * @property {boolean} rareDocsCommon
 */

/**
 * Returns the cumulative tour twists for a given tour number.
 * @param {number} tour
 * @returns {TourTwists}
 */
export function getTourTwists(tour) {
    return {
        driftMultiplier: tour >= 4 ? 2 : 1,
        rareDocsCommon: tour >= 5,
    };
}

/**
 * Computes the speed modifier based on gauge danger states.
 * Docs spawn faster when gauges are in danger/warning zones.
 * @param {{ argent: number, satisfaction: number, conformite?: number, legal?: number }} gauges
 * @returns {number} Multiplier < 1.0 means faster spawning
 */
export function getSpeedModifier(gauges) {
    let modifier = 1.0;
    const conformite = gauges.conformite ?? gauges.legal ?? 50;
    const gaugeEntries = [
        ['argent', gauges.argent],
        ['satisfaction', gauges.satisfaction],
        ['conformite', conformite],
    ];

    let dangerCount = 0;
    for (const [key, value] of gaugeEntries) {
        if (isGaugeInDanger(key, value)) dangerCount++;
    }

    if (dangerCount >= 1) modifier *= 0.8;
    if (dangerCount >= 2) modifier *= 0.85;

    return modifier;
}

function isGaugeInDanger(gaugeKey, value) {
    if (gaugeKey === 'conformite' || gaugeKey === 'legal') {
        return value <= 9;
    }

    return value <= 9 || value >= 91;
}

const TOUR_MIN_CHAOS = [0, 0, 1, 2, 2, 3, 4, 5];

/**
 * Computes the desk chaos level from tour and documents processed.
 * Returns a value 0–5.
 * @param {number} tour
 * @param {number} documentsProcessed
 * @returns {number}
 */
export function computeDeskChaosLevel(tour, documentsProcessed) {
    const fromFormula = Math.min(5, Math.max(
        Math.floor(tour / 1.5),
        Math.floor(documentsProcessed / 15)
    ));

    // Tour-based minimum from V3-6.4
    const tourMin = TOUR_MIN_CHAOS[Math.min(tour, TOUR_MIN_CHAOS.length - 1)];

    return Math.max(fromFormula, tourMin);
}

/**
 * Computes gauge danger intensity for danger crescendo visuals.
 * Returns a discrete level: 0 (safe), 1 (warning), 2 (danger), 3 (critical).
 * @param {number} value — gauge value 0–100
 * @param {string} gaugeKey
 * @returns {number}
 */
export function gaugeDangerIntensity(value, gaugeKey = 'argent') {
    if (gaugeKey === 'conformite' || gaugeKey === 'legal') {
        if (value <= 5) return 3;
        if (value <= 10) return 2;
        if (value < 20) return 1;
        return 0;
    }

    const distFromEdge = Math.min(value, 100 - value);
    if (distFromEdge <= 5) return 3;   // critical
    if (distFromEdge <= 10) return 2;  // danger
    if (distFromEdge < 20) return 1;   // warning
    return 0;                          // safe
}

/**
 * Returns the maximum danger intensity across all 3 gauges.
 * @param {{ argent: number, satisfaction: number, conformite?: number, legal?: number }} gauges
 * @returns {number}
 */
export function getMaxDangerIntensity(gauges) {
    const conformite = gauges.conformite ?? gauges.legal ?? 50;
    return Math.max(
        gaugeDangerIntensity(gauges.argent, 'argent'),
        gaugeDangerIntensity(gauges.satisfaction, 'satisfaction'),
        gaugeDangerIntensity(conformite, 'conformite')
    );
}

/**
 * Count how many gauges are in danger zone (≤9 or ≥91).
 * @param {{ argent: number, satisfaction: number, conformite?: number, legal?: number }} gauges
 * @returns {number}
 */
export function countDangerGauges(gauges) {
    let count = 0;
    const conformite = gauges.conformite ?? gauges.legal ?? 50;
    for (const [key, value] of [
        ['argent', gauges.argent],
        ['satisfaction', gauges.satisfaction],
        ['conformite', conformite],
    ]) {
        if (isGaugeInDanger(key, value)) count++;
    }
    return count;
}

let initialized = false;

export function initEscalation() {
    initialized = true;
}

export function isEscalationInitialized() {
    return initialized;
}
