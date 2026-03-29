// src/gameplay/v3-systems-updater.js — Visual effects update logic (v1.1 — stripped to effects only)

const HIGHPASS_BY_INTENSITY = [0, 800, 1200, 2000];

export function updateV3Systems(delta, gs, deps) {
    // V3: Update visual effects
    deps.updateSwipeEffects(delta);
    const maxIntensity = deps.getMaxDangerIntensity(gs.gauges);
    deps.updateDangerVignette(maxIntensity / 3, delta);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const canvasW = deps.canvas ? deps.canvas.width / dpr : 480;
    const canvasH = deps.canvas ? deps.canvas.height / dpr : 854;
    deps.updateComboSparkles(gs.comboMultiplier, delta, canvasW, canvasH);

    // V3: Desk chaos level
    const chaosLevel = deps.computeDeskChaosLevel(gs.tour, gs.documentsProcessed);
    deps.updateDeskChaos(chaosLevel);
    deps.setStateDeskChaos(chaosLevel);

    // V3: Danger crescendo — highpass filter on music
    if (deps.audioInitialized) {
        deps.setHighpassFreq(HIGHPASS_BY_INTENSITY[maxIntensity] ?? 0);
    }
}
