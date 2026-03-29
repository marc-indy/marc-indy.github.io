// src/ui/gameplay-renderer.js — Render pipeline for GAMEPLAY state (v1.1)

import { renderDeskChaos, renderSwipeTrail, renderStamps, renderDangerVignette, renderComboSparkles } from '../engine/visual-effects.js';

/**
 * Render V3 effects layers (desk chaos, swipe trail, stamps, vignette, sparkles, environment).
 */
export function renderV3EffectsLayers(ctx, canvas) {
    // V3: Render desk chaos background layer
    renderDeskChaos(ctx);

    // V3: Render swipe trail particles
    renderSwipeTrail(ctx);

    // V3: Render stamp VFX
    renderStamps(ctx);

    // V3: Render danger vignette overlay
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    renderDangerVignette(ctx, w, h);

    // V3: Render combo sparkles
    renderComboSparkles(ctx);
}

/**
 * Render V3 HUD additions: doc queue preview.
 */
export function renderV3HUDAdditions(ctx, delta, gs) {
    void ctx;
    void delta;
    void gs;
}

/**
 * Render combo visual effects on the canvas.
 */
export function renderComboEffects(ctx, gs, w, h) {
    if (gs.comboMultiplier >= 3.0) {
        ctx.save();
        ctx.strokeStyle = '#F1C40F';
        ctx.globalAlpha = 0.4 + 0.2 * Math.sin(performance.now() / 400);
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, w - 4, h - 4);
        ctx.restore();
    } else if (gs.comboMultiplier >= 2.0) {
        ctx.save();
        ctx.strokeStyle = '#F1C40F';
        ctx.globalAlpha = 0.2 + 0.1 * Math.sin(performance.now() / 600);
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, w - 4, h - 4);
        ctx.restore();
    }
}
