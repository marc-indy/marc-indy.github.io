// src/data/collection.js — Persist seen documents across sessions via localStorage

import { DOCUMENTS } from './document-data.js';

const STORAGE_KEY = 'compta-panic-collection';

/** @type {Set<string>|null} */
let cachedSeen = null;

/** @type {Record<string, number>|null} */
let cachedCounts = null;

function loadData() {
    if (cachedSeen) return;
    cachedSeen = new Set();
    cachedCounts = {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            if (Array.isArray(data)) {
                // Legacy format: plain array of IDs
                for (const id of data) {
                    if (typeof id === 'string') {
                        cachedSeen.add(id);
                        cachedCounts[id] = 1;
                    }
                }
            } else if (data && typeof data === 'object') {
                if (Array.isArray(data.seenDocs)) {
                    for (const id of data.seenDocs) {
                        if (typeof id === 'string') cachedSeen.add(id);
                    }
                }
                if (data.docSeenCounts && typeof data.docSeenCounts === 'object') {
                    cachedCounts = { ...data.docSeenCounts };
                }
            }
        }
    } catch (e) { /* localStorage unavailable */ }
}

function persist() {
    try {
        loadData();
        const data = {
            seenDocs: [...cachedSeen],
            docSeenCounts: { ...cachedCounts },
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* localStorage unavailable */ }
}

/** @returns {Set<string>} IDs of all documents the player has seen */
export function getSeenDocIds() {
    loadData();
    return new Set(cachedSeen);
}

/** Mark a document as seen, increment count, and persist */
export function markDocSeen(docId) {
    loadData();
    cachedSeen.add(docId);
    cachedCounts[docId] = (cachedCounts[docId] || 0) + 1;
    persist();
    return [];
}

/** @returns {{ seen: number, total: number }} */
export function getCollectionStats() {
    loadData();
    return { seen: cachedSeen.size, total: DOCUMENTS.length };
}

/**
 * Get how many times a doc has been seen.
 * @param {string} docId
 * @returns {number}
 */
export function getDocSeenCount(docId) {
    loadData();
    return cachedCounts[docId] || 0;
}

/** Reset the in-memory cache (useful for testing or fresh load) */
export function _resetCache() {
    cachedSeen = null;
    cachedCounts = null;
}
