// src/ui/hud.js — Canvas HUD: gauges, score, combo, timer, and event overlays

import { getImageAsset } from '../engine/assets.js';

let ctx = null;
let canvasW = 0;
let canvasH = 0;

let displayedGauges = { argent: 50, satisfaction: 50, conformite: 50 };
let displayedScore = 0;

const GAUGE_CONFIGS = [
    { key: 'argent', icon: '💰', safeColor: '#27AE60' },
    { key: 'satisfaction', icon: '😊', safeColor: '#3498DB' },
    { key: 'conformite', icon: '⚖️', safeColor: '#16A085' },
];

const GAUGE_W = 200;
const GAUGE_H = 20;
const GAUGE_RADIUS = 10;
const GAUGE_X = 40;
const GAUGE_START_Y = 0.12;
const GAUGE_GAP = 32;
const COMBO_STEP = 2;

function getGaugeIconAssetKey(gaugeKey) {
    if (gaugeKey === 'conformite') {
        return 'ui_icon_legal';
    }

    return `ui_icon_${gaugeKey}`;
}

export function initHUD(context) {
    ctx = context;
    resetDisplayedValues();
}

export function drawHUD(hudState) {
    if (!ctx) return;

    const dpr = Math.min(2, (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1);
    canvasW = ctx.canvas.width / dpr;
    canvasH = ctx.canvas.height / dpr;

    const gaugeW = Math.min(GAUGE_W, canvasW * 0.55);

    for (const key of ['argent', 'satisfaction', 'conformite']) {
        const target = hudState.gauges[key].value;
        displayedGauges[key] += (target - displayedGauges[key]) * 0.15;
    }
    displayedScore += (hudState.score - displayedScore) * 0.1;

    for (let index = 0; index < GAUGE_CONFIGS.length; index += 1) {
        const config = GAUGE_CONFIGS[index];
        const gaugeData = hudState.gauges[config.key];
        const y = canvasH * GAUGE_START_Y + index * GAUGE_GAP;
        drawGauge(GAUGE_X, y, gaugeW, GAUGE_H, displayedGauges[config.key], gaugeData.zone, config);
    }

    drawDecisionLegend(canvasW * 0.12, canvasH * 0.12 + GAUGE_CONFIGS.length * GAUGE_GAP + 14);

    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 22px "Nunito", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`${Math.round(displayedScore)}`, canvasW - 16, 16);

    const streakCount = hudState.combo || hudState.stableTriageStreak || 0;
    if (streakCount > 0) {
        drawComboBadge(streakCount, hudState.comboMultiplier);
    }

    if (hudState.objectiveProgress) {
        drawObjectiveProgress(hudState.objectiveProgress);
    }
}

function drawComboBadge(streakCount, comboMultiplier) {
    const comboState = getComboDescriptor(streakCount, comboMultiplier);
    const comboText = `×${comboMultiplier.toFixed(1)}`;
    const fontSize = Math.round(18 + Math.min(14, streakCount * 1.5));
    const pulse = 1 + 0.05 * Math.sin(performance.now() / 200) * Math.min(1, streakCount / 5);

    drawHudBadge('ui_streak_badge', canvasW - 158, 78, 136, 48, 0.96);

    ctx.save();
    ctx.translate(canvasW - 16, 92);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = comboState.color;
    ctx.font = `bold ${fontSize}px "Nunito", sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(comboText, 0, 0);
    ctx.restore();

    ctx.fillStyle = '#7F8C8D';
    ctx.font = '13px "Nunito", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(comboState.label, canvasW - 16, 92 + fontSize / 2 + 4);

    ctx.fillStyle = comboState.color;
    ctx.font = '11px "Nunito", sans-serif';
    ctx.fillText(comboState.hint, canvasW - 16, 92 + fontSize / 2 + 20);
}

function getComboDescriptor(streakCount, comboMultiplier) {
    const remainder = streakCount % COMBO_STEP;
    const nextStepIn = remainder === 0 ? COMBO_STEP : COMBO_STEP - remainder;
    return {
        label: `Série stable ${streakCount}`,
        hint: comboMultiplier >= 2 ? `palier chaud, prochain boost dans ${nextStepIn}` : `prochain boost dans ${nextStepIn}`,
        color: comboMultiplier >= 2 ? '#FF6B00' : '#F1C40F',
    };
}

function drawDecisionLegend(x, y) {
    const legendWidth = Math.min(220, canvasW - x - 20);
    const chipY = y + 22;
    const chipHeight = 22;
    const gap = 12;
    const chipWidth = (legendWidth - gap) / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(255,248,231,0.9)';
    roundRectPath(ctx, x - 8, y - 8, legendWidth + 16, 58, 14);
    ctx.fill();

    ctx.fillStyle = '#7F8C8D';
    ctx.font = 'bold 11px "Nunito", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('DÉCISION', x, y + 4);

    const chips = [
        { label: 'Refuser', hint: 'Q / ←', fill: '#E74C3C', text: '#FFFFFF' },
        { label: 'Accepter', hint: 'D / →', fill: '#2ECC71', text: '#FFFFFF' },
    ];

    for (let index = 0; index < chips.length; index += 1) {
        const chip = chips[index];
        const chipX = x + index * (chipWidth + gap);
        ctx.fillStyle = chip.fill;
        roundRectPath(ctx, chipX, chipY, chipWidth, chipHeight, 11);
        ctx.fill();

        ctx.fillStyle = chip.text;
        ctx.font = 'bold 11px "Nunito", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(chip.label, chipX + chipWidth / 2, chipY + 8);

        ctx.globalAlpha = 0.85;
        ctx.font = '10px "Nunito", sans-serif';
        ctx.fillText(chip.hint, chipX + chipWidth / 2, chipY + 16);
        ctx.globalAlpha = 1;
    }
    ctx.restore();
}

function drawObjectiveProgress(objective) {
    const barW = 120;
    const barH = 10;
    const barX = canvasW / 2 - barW / 2;
    const barY = 10;

    ctx.fillStyle = 'rgba(44,62,80,0.5)';
    roundRectPath(ctx, barX, barY, barW, barH, 5);
    ctx.fill();

    const fillW = Math.max(0, Math.min(1, objective.percent)) * barW;
    if (fillW > 0) {
        ctx.fillStyle = objective.percent >= 1 ? '#27AE60' : '#3498DB';
        roundRectPath(ctx, barX, barY, fillW, barH, 5);
        ctx.fill();
    }

    ctx.fillStyle = '#7F8C8D';
    ctx.font = '12px "Nunito", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(objective.label, canvasW / 2, barY + barH + 4);
}

function drawGauge(x, y, w, h, value, zone, config) {
    const now = Date.now();
    const icon = getImageAsset(getGaugeIconAssetKey(config.key));

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    if (icon) {
        ctx.drawImage(icon, x - 30, y - 2, 24, 24);
    } else {
        ctx.font = '16px sans-serif';
        ctx.fillText(config.icon, x - 28, y + h / 2);
    }

    const frame = getImageAsset('ui_gauge_frame');
    if (frame) {
        ctx.drawImage(frame, x - 2, y - 2, w + 4, h + 4);
    } else {
        ctx.fillStyle = '#E8E8E8';
        roundRectPath(ctx, x, y, w, h, GAUGE_RADIUS);
        ctx.fill();
    }

    const fillW = Math.max(0, (value / 100) * w);
    let fillColor = config.safeColor;
    if (zone === 'warning') {
        fillColor = '#E67E22';
    } else if (zone === 'danger') {
        fillColor = Math.floor(now / 250) % 2 === 0 ? '#E74C3C' : '#C0392B';
    }

    if (fillW > 0) {
        ctx.fillStyle = fillColor;
        roundRectPath(ctx, x, y, fillW, h, GAUGE_RADIUS);
        ctx.fill();
    }

    if (zone === 'warning' || zone === 'danger') {
        ctx.strokeStyle = zone === 'warning' ? '#E67E22' : '#E74C3C';
        ctx.lineWidth = 2;
        ctx.globalAlpha = zone === 'warning'
            ? Math.max(0, Math.min(1, 0.3 + 0.2 * Math.sin(now / 250)))
            : 0.8;
        roundRectPath(ctx, x - 1, y - 1, w + 2, h + 2, GAUGE_RADIUS + 1);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

}

function drawHudBadge(assetKey, x, y, width, height, alpha = 1) {
    const badge = getImageAsset(assetKey);
    if (!badge) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(badge, x, y, width, height);
    ctx.restore();
}

function roundRectPath(targetCtx, x, y, w, h, r) {
    const radius = Math.max(0, Math.min(r, Math.min(w / 2, h / 2)));
    targetCtx.beginPath();
    targetCtx.moveTo(x + radius, y);
    targetCtx.lineTo(x + w - radius, y);
    targetCtx.quadraticCurveTo(x + w, y, x + w, y + radius);
    targetCtx.lineTo(x + w, y + h - radius);
    targetCtx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    targetCtx.lineTo(x + radius, y + h);
    targetCtx.quadraticCurveTo(x, y + h, x, y + h - radius);
    targetCtx.lineTo(x, y + radius);
    targetCtx.quadraticCurveTo(x, y, x + radius, y);
    targetCtx.closePath();
}

export function resetDisplayedValues() {
    displayedGauges = { argent: 50, satisfaction: 50, conformite: 50 };
    displayedScore = 0;
}

export function drawDocQueuePreview(docQueue = []) {
    if (!ctx || docQueue.length === 0) return;

    const miniW = 80;
    const miniH = 50;
    const gap = 8;
    const totalW = docQueue.length * (miniW + gap) - gap;
    const startX = canvasW / 2 - totalW / 2;
    const y = canvasH * 0.04;

    ctx.globalAlpha = 0.7;
    for (let index = 0; index < docQueue.length; index += 1) {
        const doc = docQueue[index];
        const x = startX + index * (miniW + gap);

        ctx.fillStyle = '#FFFFFF';
        roundRectPath(ctx, x, y, miniW, miniH, 4);
        ctx.fill();

        ctx.fillStyle = doc.headerColor || '#A0A0A0';
        ctx.fillRect(x, y, miniW, 4);

        const icon = getImageAsset(doc.iconKey);
        if (icon) {
            ctx.drawImage(icon, x + miniW / 2 - 8, y + 10, 16, 16);
        }

        if (doc.tag) {
            ctx.font = '8px "Nunito", sans-serif';
            ctx.fillStyle = '#2C3E50';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(doc.tag, x + miniW / 2, y + 30, miniW - 4);
        }
    }
    ctx.globalAlpha = 1;
}

export const _internals = {
    getGaugeIconAssetKey,
    getComboDescriptor,
};