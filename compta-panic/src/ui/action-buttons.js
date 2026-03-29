// src/ui/action-buttons.js — Gameplay buttons, tap hit-testing, and debug helpers

import { getImageAsset } from '../engine/assets.js';

const DEBUG_STATE_TOKENS = {
    TITLE: 'title',
    GAMEPLAY: 'gameplay',
    PAUSE: 'pause',
    GAME_OVER: 'gameOver',
    HOW_TO_PLAY: 'howToPlay',
    COLLECTION: 'collection',
    VICTORY: 'victory',
};

export function drawPauseButton(ctx) {
    const pauseImage = getImageAsset('ui_btn_pause');

    ctx.save();
    if (pauseImage) {
        ctx.drawImage(pauseImage, 8, 8, 40, 40);
    } else {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(28, 28, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⏸', 28, 28);
    }
    ctx.restore();
}

export function handleTapButtons(tap, canvas, cardAnim, currentDocument, deps) {
    if (tap.x < 48 && tap.y < 48) {
        deps.transitionTo(deps.PAUSE);
        deps.resetInput();
        return true;
    }

    return false;
}

export function drawDebugPanel(ctx, gs, w, h, currentState, currentDocument) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(w - 220, h - 200, 210, 190);
    ctx.fillStyle = '#00FF00';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';

    const lines = [
        `State: ${currentState}`,
        `Tour: ${gs.tour}`,
        `Argent: ${gs.gauges.argent.toFixed(1)} [${gs.gaugeZones.argent}]`,
        `Satisfaction: ${gs.gauges.satisfaction.toFixed(1)} [${gs.gaugeZones.satisfaction}]`,
        `Conformité: ${gs.gauges.conformite.toFixed(1)} [${gs.gaugeZones.conformite}]`,
        `Score: ${gs.score}`,
        `Combo: ${gs.combo} (×${gs.comboMultiplier.toFixed(1)})`,
        `Docs: ${gs.documentsProcessed}`,
        `Interval: ${gs.documentInterval}ms`,
        `Elapsed: ${(gs.elapsedMs / 1000).toFixed(1)}s`,
        `Doc: ${currentDocument ? currentDocument.title : 'none'}`,
    ];

    for (let index = 0; index < lines.length; index += 1) {
        ctx.fillText(lines[index], w - 215, h - 185 + index * 15);
    }
    ctx.restore();
}

export function setupDebug(getUiStateFn, getGameStateFn, setGaugeDirectFn) {
    if (typeof window === 'undefined') return;

    window.__debug = {
        getState: () => toDebugStateToken(getUiStateFn()),
        getGameState: () => getGameStateFn(),
        getPlayerPos: () => null,
        getCameraPos: () => null,
        getEntityCount: () => 0,
        getAliveCount: () => 0,
        getPlayerMesh: () => null,
        getSceneChildCount: () => 0,
        getVisibleOverlays: () => getVisibleOverlayNames(document),
        forceGauge: (key, value) => {
            setGaugeDirectFn(key, value);
        },
        forceTour: (tour) => {
            console.log(`Debug: force tour ${tour} — use ~ panel during gameplay`);
        },
        toggleInvincibility: () => {
            console.log('Debug: invincibility toggling not implemented in minimal build');
        },
    };
}

export function toDebugStateToken(uiState) {
    const rawState = typeof uiState === 'string' ? uiState : '';
    return DEBUG_STATE_TOKENS[rawState] ?? rawState.toLowerCase();
}

export function getVisibleOverlayNames(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return [];

    return Array.from(root.querySelectorAll('[data-overlay]'))
        .filter((element) => isOverlayVisible(element))
        .map((element) => element.getAttribute('data-overlay'))
        .filter(Boolean);
}

function isOverlayVisible(element) {
    if (!element) return false;
    if (element.hidden) return false;
    if (element.getAttribute?.('aria-hidden') === 'true') return false;
    if (element.style?.display === 'none') return false;
    if (element.style?.visibility === 'hidden') return false;
    return true;
}