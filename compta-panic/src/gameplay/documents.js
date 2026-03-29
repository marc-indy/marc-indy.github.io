// src/gameplay/documents.js — Document generation, rarity, special events, deck logic

import {
    DOCUMENTS,
    RARITY_COLORS,
    RARITY_WEIGHTS,
    ICON_KEYS,
    computeTags,
    createDecisionActions,
    createTimeoutOutcome,
} from '../data/document-data.js';

/** @typedef {import('../data/document-data.js').Rarity} Rarity */

const recentDocIds = []; // last 3 shown
const MAX_RECENT = 3;

export function initDocuments() {
    recentDocIds.length = 0;
}

function lerpWeights(tour) {
    // Early = tours 1-4, Late = tours 5+
    // Linear interpolation between early and late weights
    const t = Math.min(1, Math.max(0, (tour - 1) / 4)); // 0 at tour 1, 1 at tour 5+
    const result = {};
    for (const rarity of /** @type {Rarity[]} */ (['commun', 'inhabituel', 'rare', 'legendaire'])) {
        result[rarity] = RARITY_WEIGHTS.early[rarity] + t * (RARITY_WEIGHTS.late[rarity] - RARITY_WEIGHTS.early[rarity]);
    }
    return result;
}

function pickRarity(tour) {
    const weights = lerpWeights(tour);
    const total = weights.commun + weights.inhabituel + weights.rare + weights.legendaire;
    let roll = Math.random() * total;

    for (const rarity of /** @type {Rarity[]} */ (['commun', 'inhabituel', 'rare', 'legendaire'])) {
        roll -= weights[rarity];
        if (roll <= 0) return rarity;
    }
    return 'commun';
}

/**
 * Builds the eligible pool for the current document pick.
 * - All docs in DOCUMENTS are eligible (seasonal/memory docs removed in v1.1).
 * @returns {Array}
 */
function buildPool() {
    return DOCUMENTS;
}

function pickDocumentFromPool(rarity, pool) {
    const filtered = pool.filter(d => d.rarity === rarity && !recentDocIds.includes(d.id));
    if (filtered.length === 0) {
        const fallback = pool.filter(d => d.rarity === rarity);
        if (fallback.length === 0) return pool[0] || DOCUMENTS[0];
        return fallback[Math.floor(Math.random() * fallback.length)];
    }
    return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * @param {number} tour
 */
export function getNextDocument(tour) {
    const pool = buildPool();

    const rarity = pickRarity(tour);
    let docDef = pickDocumentFromPool(rarity, pool);

    recentDocIds.push(docDef.id);
    if (recentDocIds.length > MAX_RECENT) {
        recentDocIds.shift();
    }

    const decisionActions = createDecisionActions(docDef);
    const timeoutOutcome = createTimeoutOutcome(docDef);

    return {
        id: docDef.id,
        type: docDef.type,
        rarity: docDef.rarity,
        title: docDef.title,
        body: docDef.body,
        iconKey: ICON_KEYS[docDef.type] || 'sprite_icon_facture',
        headerColor: RARITY_COLORS[docDef.rarity] || '#FFFFFF',
        onAccept: { ...docDef.onAccept },
        onReject: { ...docDef.onReject },
        decisionActions,
        accept: decisionActions.accept,
        reject: decisionActions.reject,
        timeoutOutcome,
    };
}

// Export for testing
export const _internals = {
    lerpWeights,
    pickRarity,
    buildPool,
    recentDocIds,
};

// ── V3 Extensions ─────────────────────────────────────────────────────────────



/**
 * V3-2.2 Compute document tags from data.
 * Delegates to computeTags from document-data.js.
 * @param {object} doc
 * @returns {string[]}
 */
export function getDocumentTags(doc) {
    return computeTags(doc);
}

/**
 * V3-4 VIP penalty: if a VIP document is refused, apply extra satisfaction loss.
 * @param {object} doc
 * @returns {{ penalty: number, message: string }|null}
 */
export function getVipRefusalPenalty(doc) {
    if (!doc.vip) return null;
    return { penalty: -15, message: 'CLIENT VIP PERDU !' };
}

/**
 * V3-2 Doc queue management: build a preview queue of upcoming docs.
 * @param {number} count - how many previews (default 3 for S2+)
 * @param {number} tour
 * @param {string|null} seasonId
 * @returns {Array} - array of mini-doc previews { id, type, rarity, iconKey, tag }
 */
export function buildDocQueue(count, tour, seasonId) {
    const pool = buildPool();
    const queue = [];
    for (let i = 0; i < count; i++) {
        const rarity = pickRarity(tour);
        const doc = pickDocumentFromPool(rarity, pool);
        const tags = computeTags(doc);
        queue.push({
            id: doc.id,
            type: doc.type,
            rarity: doc.rarity,
            iconKey: ICON_KEYS[doc.type] || 'sprite_icon_facture',
            tag: tags.length > 0 ? tags[0] : null,
            headerColor: RARITY_COLORS[doc.rarity] || '#FFFFFF',
        });
    }
    return queue;
}


