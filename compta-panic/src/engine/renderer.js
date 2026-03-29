// src/engine/renderer.js — Canvas 2D: card drawing, particles, shake, animations, background

import { getImageAsset } from './assets.js';

const CARD_W = 360;     // V3: was 320
const CARD_H = 500;     // V3: was 420
const CARD_RADIUS = 16;
const HEADER_H = 48;
const TAG_BAR_H = 28;   // V3: tag bar under header
const TITLE_LINE_H = 22;
const TITLE_MAX_LINES = 2;
const MAX_PARTICLES = 60;

let canvas = null;
let ctx = null;
let reducedMotion = false;

// Particles pool
let particles = [];

// Screen shake
let shakeIntensity = 0;
let shakeDuration = 0;
let shakeDecay = 0;
let shakeX = 0;
let shakeY = 0;

// Background floating papers
let bgPapers = [];

// Coffee steam particles
let steamParticles = [];
let steamTimer = 0;

const HEADER_ASSET_KEYS = {
    commun: 'sprite_card_header_commun',
    inhabituel: 'sprite_card_header_inhabituel',
    rare: 'sprite_card_header_rare',
    legendaire: 'sprite_card_header_legendaire',
};

export function initRenderer(canvasEl, context) {
    canvas = canvasEl;
    ctx = context;
    reducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    particles = [];
    bgPapers = [];
    steamParticles = [];
    steamTimer = 0;
    shakeIntensity = 0;
    shakeDuration = 0;
    shakeDecay = 0;
    shakeX = 0;
    shakeY = 0;

    // Init background papers
    for (let i = 0; i < 3; i++) {
        bgPapers.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.2,
            rotation: Math.random() * 360,
            size: 20 + Math.random() * 15,
        });
    }
}

export function renderFrame(delta, renderState) {
    if (!ctx || !canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    // Update shake
    updateShake(delta);

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Clear
    ctx.fillStyle = '#FFF8E7';
    ctx.fillRect(-10, -10, w + 20, h + 20);

    // Background
    drawBackground(delta, w, h);

    // Background tint
    if (renderState.backgroundTint && renderState.backgroundTint.opacity > 0) {
        ctx.fillStyle = renderState.backgroundTint.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, renderState.backgroundTint.opacity));
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
    }

    // Card
    if (renderState.card) {
        drawCard(renderState.card);
    }

    // Particles
    updateAndDrawParticles(delta);

    ctx.restore();
}

function drawBackground(delta, w, h) {
    const deskImage = getImageAsset('bg_desk');
    if (deskImage) {
        ctx.drawImage(deskImage, 0, 0, w, h);
    }

    // Desk surface and edge (fallback when no desk image)
    if (!deskImage) {
        ctx.fillStyle = '#F5E6C8';
        ctx.fillRect(0, h * 0.6, w, h * 0.4);

        ctx.strokeStyle = '#D4C4A8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.6);
        ctx.lineTo(w, h * 0.6);
        ctx.stroke();
    }

    // Floating papers (background)
    const paperSprite = getImageAsset('sprite_paper_particle');
    ctx.fillStyle = '#F0EBE0';
    for (const paper of bgPapers) {
        paper.x += paper.vx;
        paper.y += paper.vy;
        // Wrap around
        if (paper.x < -30) paper.x = w + 30;
        if (paper.x > w + 30) paper.x = -30;
        if (paper.y < -30) paper.y = h + 30;
        if (paper.y > h + 30) paper.y = -30;

        ctx.save();
        ctx.translate(paper.x, paper.y);
        ctx.rotate((paper.rotation * Math.PI) / 180);
        ctx.globalAlpha = 0.3;
        if (paperSprite) {
            ctx.drawImage(paperSprite, -paper.size / 2, -paper.size * 0.7, paper.size, paper.size * 1.4);
        } else {
            ctx.fillRect(-paper.size / 2, -paper.size * 0.7, paper.size, paper.size * 1.4);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // Coffee steam
    steamTimer += delta;
    if (steamTimer > 500) {
        steamTimer -= 500;
        steamParticles.push({
            x: w * 0.85 + (Math.random() - 0.5) * 10,
            y: h * 0.55,
            vy: -0.5,
            alpha: 0.3,
            age: 0,
            lifetime: 2000,
        });
    }
    for (let i = steamParticles.length - 1; i >= 0; i--) {
        const s = steamParticles[i];
        s.y += s.vy;
        s.age += delta;
        s.alpha = Math.max(0, Math.min(1, 0.3 * (1 - s.age / s.lifetime)));
        if (s.age >= s.lifetime) {
            steamParticles.splice(i, 1);
            continue;
        }
        if (isNaN(s.x) || isNaN(s.y)) continue;
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(0, 3), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (!deskImage) {
        // Coffee mug fallback when authored desk art is unavailable.
        ctx.fillStyle = '#8B6914';
        const mugX = w * 0.85;
        const mugY = h * 0.58;
        ctx.beginPath();
        ctx.arc(mugX, mugY, Math.max(0, 15), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6B4F0A';
        ctx.beginPath();
        ctx.arc(mugX, mugY, Math.max(0, 11), 0, Math.PI * 2);
        ctx.fill();
    }
}

export function drawCard(card) {
    if (!ctx) return;
    if (isNaN(card.x) || isNaN(card.y)) return;

    const alpha = Math.max(0, Math.min(1, card.opacity));
    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(card.x, card.y);
    ctx.rotate((card.rotation * Math.PI) / 180);
    ctx.scale(card.scale, card.scale);

    const halfW = CARD_W / 2;
    const halfH = CARD_H / 2;

    // Card shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    roundRect(ctx, -halfW + 4, -halfH + 4, CARD_W, CARD_H, CARD_RADIUS);
    ctx.fill();

    const cardBackground = getImageAsset('sprite_card_bg');
    if (cardBackground) {
        ctx.drawImage(cardBackground, -halfW, -halfH, CARD_W, CARD_H);
    } else {
        ctx.fillStyle = '#FFFFFF';
        roundRect(ctx, -halfW, -halfH, CARD_W, CARD_H, CARD_RADIUS);
        ctx.fill();
    }

    // Card border
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    roundRect(ctx, -halfW, -halfH, CARD_W, CARD_H, CARD_RADIUS);
    ctx.stroke();

    const headerAsset = getImageAsset(getCardHeaderAssetKey(card.rarity));
    if (headerAsset) {
        ctx.drawImage(headerAsset, -halfW, -halfH, CARD_W, HEADER_H);
    } else {
        ctx.fillStyle = card.headerColor || '#A0A0A0';
        roundRectTop(ctx, -halfW, -halfH, CARD_W, HEADER_H, CARD_RADIUS);
        ctx.fill();
    }

    // Rarity & type labels on header
    if (card.rarity) {
        const rarityLabels = { commun: 'COMMUN', inhabituel: 'INHABITUEL', rare: 'RARE', legendaire: 'LÉGENDAIRE' };
        ctx.font = 'bold 11px "Nunito", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(rarityLabels[card.rarity] || card.rarity.toUpperCase(), -halfW + 12, -halfH + HEADER_H / 2);
    }
    if (card.type) {
        ctx.font = '10px "Nunito", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(card.type.replace(/_/g, ' '), halfW - 12, -halfH + HEADER_H / 2);
    }

    const cardIcon = getImageAsset(card.iconKey);
    const titleMaxWidth = cardIcon ? CARD_W - 96 : CARD_W - 40;
    const titleLines = wrapTextLines(card.title || '', titleMaxWidth, text => ctx.measureText(text).width, TITLE_MAX_LINES);
    const titleBlockHeight = Math.max(32, titleLines.length * TITLE_LINE_H);
    const titleTopY = -halfH + HEADER_H + 18;

    if (cardIcon) {
        ctx.drawImage(cardIcon, -halfW + 18, titleTopY - 2, 30, 30);
    }

    // Title text sits on the paper body so the rarity strip remains readable.
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 20px "Nunito", sans-serif';
    ctx.textAlign = cardIcon ? 'left' : 'center';
    ctx.textBaseline = 'middle';
    titleLines.forEach((line, index) => {
        ctx.fillText(
            line,
            cardIcon ? -halfW + 60 : 0,
            titleTopY + 12 + index * TITLE_LINE_H,
            titleMaxWidth,
        );
    });

    ctx.strokeStyle = 'rgba(140, 118, 95, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-halfW + 24, titleTopY + titleBlockHeight + 12);
    ctx.lineTo(halfW - 24, titleTopY + titleBlockHeight + 12);
    ctx.stroke();

    // Body text
    ctx.fillStyle = '#7F8C8D';
    ctx.font = '14px "Courier Prime", monospace';
    ctx.textAlign = 'center';
    const bodyLines = (card.body || '').split('\n');
    const lineHeight = 20;
    const startY = titleTopY + titleBlockHeight + 34;
    for (let i = 0; i < Math.min(bodyLines.length, 3); i++) {
        ctx.fillText(bodyLines[i], 0, startY + i * lineHeight, CARD_W - 30);
    }

    // Timer bar above card
    if (card.timerPercent !== undefined && card.timerPercent > 0) {
        const barW = CARD_W - 20;
        const barH = 6;
        const barY = -halfH - 14;
        const pct = Math.max(0, Math.min(1, card.timerPercent));

        // Background
        ctx.fillStyle = '#E0E0E0';
        roundRect(ctx, -barW / 2, barY, barW, barH, 3);
        ctx.fill();

        // Fill with gradient color
        const fillW = barW * pct;
        if (fillW > 0) {
            let fillColor;
            if (pct > 0.5) fillColor = '#27AE60';
            else if (pct > 0.25) fillColor = '#F1C40F';
            else fillColor = '#E74C3C';
            ctx.fillStyle = fillColor;
            roundRect(ctx, -barW / 2, barY, fillW, barH, 3);
            ctx.fill();
        }
    }

    // Accept/Reject labels
    if (card.showAcceptLabel && card.labelOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, card.labelOpacity));
        ctx.translate(60, -30);
        ctx.rotate((-10 * Math.PI) / 180);
        const acceptLabel = getImageAsset('ui_label_accepte');
        if (acceptLabel) {
            ctx.drawImage(acceptLabel, -60, -20, 120, 40);
        } else {
            ctx.font = 'bold 28px "Nunito", sans-serif';
            ctx.fillStyle = '#2ECC71';
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.strokeText('ACCEPTÉ', 0, 0);
            ctx.fillText('ACCEPTÉ', 0, 0);
        }
        ctx.restore();
    }

    if (card.showRejectLabel && card.labelOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, card.labelOpacity));
        ctx.translate(-60, -30);
        ctx.rotate((10 * Math.PI) / 180);
        const rejectLabel = getImageAsset('ui_label_refuse');
        if (rejectLabel) {
            ctx.drawImage(rejectLabel, -60, -20, 120, 40);
        } else {
            ctx.font = 'bold 28px "Nunito", sans-serif';
            ctx.fillStyle = '#E74C3C';
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.strokeText('REFUSÉ', 0, 0);
            ctx.fillText('REFUSÉ', 0, 0);
        }
        ctx.restore();
    }

    ctx.restore();
}

function getCardHeaderAssetKey(rarity) {
    return HEADER_ASSET_KEYS[rarity] || HEADER_ASSET_KEYS.commun;
}

function wrapTextLines(text, maxWidth, measureText, maxLines = 2) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [];

    const lines = [];
    let currentLine = words[0];
    let nextWordIndex = 1;
    let didOverflow = false;

    while (nextWordIndex < words.length) {
        const candidate = `${currentLine} ${words[nextWordIndex]}`;
        if (measureText(candidate) <= maxWidth) {
            currentLine = candidate;
            nextWordIndex += 1;
            continue;
        }

        lines.push(currentLine);
        currentLine = words[nextWordIndex];
        nextWordIndex += 1;

        if (lines.length === maxLines - 1) {
            didOverflow = true;
            break;
        }
    }

    const remainingWords = [currentLine, ...words.slice(nextWordIndex)].filter(Boolean);
    lines.push(trimLineToWidth(remainingWords.join(' '), maxWidth, measureText, didOverflow ? '...' : ''));

    return lines.slice(0, maxLines);
}

function trimLineToWidth(text, maxWidth, measureText, overflowSuffix = '') {
    let value = text;
    const suffix = overflowSuffix || '';
    if (measureText(value) <= maxWidth && !suffix) {
        return value;
    }

    while (value.length > 1 && measureText(`${value}${suffix}`) > maxWidth) {
        value = value.slice(0, -1).trimEnd();
    }

    return `${value}${suffix}`;
}

function updateShake(delta) {
    if (shakeIntensity <= 0 || reducedMotion) {
        shakeX = 0;
        shakeY = 0;
        return;
    }
    shakeDecay = Math.max(0, shakeDecay - delta / shakeDuration);
    if (shakeDecay <= 0) {
        shakeIntensity = 0;
        shakeX = 0;
        shakeY = 0;
        return;
    }
    shakeX = shakeIntensity * (Math.random() * 2 - 1) * shakeDecay;
    shakeY = shakeIntensity * (Math.random() * 2 - 1) * shakeDecay;
}

export function triggerScreenShake(intensity, durationMs) {
    if (reducedMotion) return;
    shakeIntensity = intensity;
    shakeDuration = durationMs;
    shakeDecay = 1;
}

export function spawnParticles(config) {
    const count = reducedMotion ? Math.ceil(config.count / 2) : config.count;
    for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) {
            particles.shift(); // Remove oldest
        }
        const angle = Math.random() * Math.PI * 2;
        const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
        particles.push({
            x: config.x,
            y: config.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: config.colors[Math.floor(Math.random() * config.colors.length)],
            alpha: 1,
            lifetime: config.lifetime,
            age: 0,
            gravity: config.gravity || 0,
        });
    }
}

function updateAndDrawParticles(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += delta;
        if (p.age >= p.lifetime) {
            particles.splice(i, 1);
            continue;
        }
        p.x += p.vx;
        p.vy += p.gravity || 0;
        p.y += p.vy;
        p.alpha = Math.max(0, Math.min(1, 1 - p.age / p.lifetime));

        if (isNaN(p.x) || isNaN(p.y)) continue;

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    }
    ctx.globalAlpha = 1;
}

export function clearParticles() {
    particles = [];
}

export function getParticleCount() {
    return particles.length;
}

// Rounded rectangle utility
function roundRect(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, Math.min(w / 2, h / 2)));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function roundRectTop(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, Math.min(w / 2, h / 2)));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// Export for tests
export const _internals = {
    CARD_W, CARD_H, MAX_PARTICLES, TAG_BAR_H,
    getCardHeaderAssetKey,
    wrapTextLines,
    get particles() { return particles; },
    get shakeIntensity() { return shakeIntensity; },
};

// ── V3 Extensions ─────────────────────────────────────────────────────────────

let cameraZoom = 1.0;
let cameraZoomTarget = 1.0;

/**
 * V3-4.5 Huissier: set camera zoom target for dramatic effect.
 * @param {number} zoom - target zoom (1.0 = normal, 1.15 = huissier)
 */
export function setCameraZoom(zoom) {
    cameraZoomTarget = zoom;
}

/** Update camera zoom lerp. Call in renderFrame. */
export function updateCameraZoom(delta) {
    cameraZoom += (cameraZoomTarget - cameraZoom) * Math.min(1, delta / 300);
}

/** Get current camera zoom. */
export function getCameraZoom() {
    return cameraZoom;
}

/**
 * V3-2.2: Draw document tags bar on a card.
 * @param {string[]} tags - array of tag strings (max 3)
 * @param {number} halfW - half card width
 * @param {number} halfH - half card height
 */
export function drawTagBar(tags, halfW, halfH) {
    if (!ctx || !tags || tags.length === 0) return;

    const TAG_COLORS = {
        'URGENT': { bg: '#E74C3C', fg: '#FFFFFF' },
        'VIP': { bg: '#F1C40F', fg: '#2C3E50' },
        'PIÈGE': { bg: '#8E44AD', fg: '#FFFFFF' },
        'FRAUDULEUX': { bg: '#C0392B', fg: '#FFFFFF' },
        'CLIENT FIDÈLE': { bg: '#3498DB', fg: '#FFFFFF' },
        'MÉMOIRE': { bg: '#9B59B6', fg: '#FFFFFF' },
    };

    const barY = -halfH + HEADER_H;
    const maxTags = Math.min(3, tags.length);
    let offsetX = -halfW + 12;

    for (let i = 0; i < maxTags; i++) {
        const tag = tags[i];
        const colors = TAG_COLORS[tag] || { bg: '#7F8C8D', fg: '#FFFFFF' };

        ctx.font = 'bold 10px "Nunito", sans-serif';
        const tw = ctx.measureText(tag).width + 12;
        const th = 20;

        ctx.fillStyle = colors.bg;
        roundRect(ctx, offsetX, barY + 4, tw, th, 4);
        ctx.fill();

        ctx.fillStyle = colors.fg;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(tag, offsetX + 6, barY + 4 + th / 2);

        offsetX += tw + 4;
    }
}

/**
 * V3: Draw mini-card for doc queue or avalanche display.
 * @param {object} miniDoc - { iconKey, rarity, tag, headerColor }
 * @param {number} x
 * @param {number} y
 * @param {number} w - card width (default 80)
 * @param {number} h - card height (default 50)
 */
export function drawMiniCard(miniDoc, x, y, w, h) {
    if (!ctx) return;
    w = w || 80;
    h = h || 50;

    // Background
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, x, y, w, h, 4);
    ctx.fill();

    // Rarity strip
    ctx.fillStyle = miniDoc.headerColor || '#A0A0A0';
    ctx.fillRect(x, y, w, 4);

    // Icon
    const icon = getImageAsset(miniDoc.iconKey);
    if (icon) {
        ctx.drawImage(icon, x + w / 2 - 8, y + 10, 16, 16);
    }

    // Tag
    if (miniDoc.tag) {
        ctx.font = '8px "Nunito", sans-serif';
        ctx.fillStyle = '#2C3E50';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(miniDoc.tag, x + w / 2, y + 30, w - 4);
    }
}
