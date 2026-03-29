// src/engine/visual-effects.js — Desk chaos, environmental reactions, swipe trails, danger crescendo

/**
 * @typedef {Object} DeskChaosLayer
 * @property {number} x
 * @property {number} y
 * @property {number} rot — degrees
 * @property {string} type — 'paper'|'postit'|'coffee'|'phone'|'pen'|'drawer'|'dossier'|'calculator'|'fanPaper'|'light'
 * @property {string} color
 * @property {number} alpha — 0–1
 */

/**
 * @typedef {Object} SwipeTrailParticle
 * @property {number} x
 * @property {number} y
 * @property {number} age
 * @property {number} lifetime
 * @property {string} color
 * @property {number} size
 */

/**
 * @typedef {Object} StampVFX
 * @property {string} text
 * @property {string} color
 * @property {number} x
 * @property {number} y
 * @property {number} age
 * @property {number} lifetime
 * @property {number} rotation
 * @property {number} startScale
 * @property {number} endScale
 */

let reducedMotion = false;
let deskLayers = [];
let lastChaosLevel = -1;
let swipeTrailParticles = [];
let activeStamps = [];

let vignetteState = { active: false, color: '#E74C3C', opacity: 0, pulseMs: 600, elapsed: 0 };
let comboSparkles = [];
let comboSparkleTimer = 0;

const POSTIT_COLORS = ['#FFE066', '#FF69B4', '#77DD77', '#87CEEB', '#FFB347'];
const PAPER_COLOR = '#F5F0E6';
const ACTION_VISUAL_SPECS = {
    accept: { color: '#27AE60', text: 'ACCEPTÉ', particleCount: 8, size: 6 },
    reject: { color: '#E74C3C', text: 'REFUSÉ', particleCount: 8, size: 6 },
};

// Seeded random for stable desk chaos positions
function seededRandom(seed) {
    let s = seed;
    return function () {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}

export function initVisualEffects(isReducedMotion) {
    reducedMotion = !!isReducedMotion;
    deskLayers = [];
    lastChaosLevel = -1;
    swipeTrailParticles = [];
    activeStamps = [];
    comboSparkles = [];
    comboSparkleTimer = 0;
    vignetteState = { active: false, color: '#E74C3C', opacity: 0, pulseMs: 600, elapsed: 0 };
}

// ── Desk Chaos ────────────────────────────────────────────────────────────────

/**
 * Rebuild desk chaos layers when level changes.
 * @param {number} level — 0–5
 */
export function updateDeskChaos(level) {
    if (level === lastChaosLevel) return;
    lastChaosLevel = level;
    deskLayers = buildDeskLayers(level);
}

function buildDeskLayers(level) {
    const layers = [];
    const rng = seededRandom(Math.floor(level * 7919));

    const paperCount = [0, 3, 6, 10, 15, 20][level] || 0;
    const postitCount = [0, 1, 3, 5, 7, 10][level] || 0;

    for (let i = 0; i < paperCount; i++) {
        layers.push({
            x: rng() * 440 + 20,
            y: rng() * 750 + 50,
            rot: (rng() - 0.5) * 30,
            type: level >= 4 && i % 3 === 0 ? 'crumpled_paper' : 'paper',
            color: PAPER_COLOR,
            alpha: 0.6 + rng() * 0.3,
        });
    }

    for (let i = 0; i < postitCount; i++) {
        layers.push({
            x: rng() * 400 + 30,
            y: rng() * 200 + 20,
            rot: (rng() - 0.5) * 20,
            type: 'postit',
            color: POSTIT_COLORS[i % POSTIT_COLORS.length],
            alpha: 0.85,
        });
    }

    // Level-specific elements
    if (level >= 2) {
        layers.push({ x: 350, y: 400, rot: 15, type: 'pen', color: '#333', alpha: 0.8 });
    }
    if (level >= 3) {
        layers.push({ x: 200, y: 500, rot: 0, type: 'coffee', color: '#8B4513', alpha: 0.6 });
        layers.push({ x: 380, y: 300, rot: 0, type: 'phone', color: '#C0392B', alpha: 0.9 });
        layers.push({ x: 100, y: 600, rot: -5, type: 'drawer', color: '#8B6914', alpha: 0.7 });
    }
    if (level >= 4) {
        layers.push({ x: 280, y: 550, rot: 0, type: 'calculator', color: '#2C3E50', alpha: 0.8 });
        layers.push({ x: 60, y: 450, rot: 12, type: 'dossier', color: '#3498DB', alpha: 0.7 });
    }
    if (level >= 5) {
        layers.push({ x: 400, y: 200, rot: 0, type: 'light', color: '#FFD700', alpha: 0.5 });
        for (let i = 0; i < 3; i++) {
            layers.push({
                x: rng() * 400 + 40,
                y: rng() * 600 + 100,
                rot: (rng() - 0.5) * 40,
                type: 'fanPaper',
                color: PAPER_COLOR,
                alpha: 0.5,
            });
        }
    }

    return layers;
}

/**
 * Render desk chaos layers onto canvas.
 * @param {CanvasRenderingContext2D} ctx
 */
export function renderDeskChaos(ctx) {
    for (const layer of deskLayers) {
        ctx.save();
        ctx.translate(layer.x, layer.y);
        ctx.rotate((layer.rot * Math.PI) / 180);
        ctx.globalAlpha = layer.alpha;

        switch (layer.type) {
            case 'paper':
            case 'crumpled_paper':
            case 'fanPaper':
                ctx.fillStyle = layer.color;
                ctx.fillRect(-12, -16, 24, 32);
                if (layer.type === 'crumpled_paper') {
                    ctx.strokeStyle = '#CCC';
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(-8, -10); ctx.lineTo(5, 8);
                    ctx.moveTo(-5, 8); ctx.lineTo(8, -12);
                    ctx.stroke();
                }
                break;
            case 'postit':
                ctx.fillStyle = layer.color;
                ctx.fillRect(-14, -14, 28, 28);
                ctx.fillStyle = '#555';
                ctx.font = '6px sans-serif';
                ctx.fillText('NOTE', -10, 2);
                break;
            case 'coffee':
                ctx.fillStyle = layer.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'phone':
                ctx.fillStyle = '#2C3E50';
                ctx.fillRect(-15, -10, 30, 20);
                ctx.fillStyle = layer.color;
                ctx.beginPath();
                ctx.arc(10, -6, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'pen':
                ctx.strokeStyle = layer.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-15, 0); ctx.lineTo(15, 0);
                ctx.stroke();
                break;
            case 'drawer':
                ctx.fillStyle = layer.color;
                ctx.fillRect(-20, -8, 40, 16);
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(0, 0, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'calculator':
                ctx.fillStyle = layer.color;
                ctx.fillRect(-12, -16, 24, 32);
                ctx.fillStyle = '#2ECC71';
                ctx.font = '8px monospace';
                ctx.fillText('ERR', -8, 4);
                break;
            case 'dossier':
                ctx.fillStyle = layer.color;
                ctx.fillRect(-16, -20, 32, 40);
                ctx.fillStyle = '#FFF';
                ctx.fillRect(-12, -16, 24, 4);
                break;
            case 'light':
                // Flickering light glow
                ctx.fillStyle = layer.color;
                ctx.globalAlpha = layer.alpha * (0.5 + Math.random() * 0.5);
                ctx.beginPath();
                ctx.arc(0, 0, 30, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        ctx.restore();
    }
}

// ── Swipe Trail ───────────────────────────────────────────────────────────────

/**
 * Add swipe trail particles during card drag.
 * @param {number} x
 * @param {number} y
 * @param {'accept'|'reject'} direction
 */
export function addSwipeTrailParticles(x, y, direction) {
    if (reducedMotion) return;
    const spec = ACTION_VISUAL_SPECS[direction] || ACTION_VISUAL_SPECS.reject;
    for (let i = 0; i < spec.particleCount; i++) {
        swipeTrailParticles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            age: 0,
            lifetime: 400,
            color: spec.color,
            size: spec.size,
        });
    }
}

/**
 * Spawn a stamp VFX at the swipe release point.
 * @param {number} x
 * @param {number} y
 * @param {'accept'|'reject'} direction
 */
export function spawnStampVFX(x, y, direction) {
    const spec = ACTION_VISUAL_SPECS[direction] || ACTION_VISUAL_SPECS.reject;
    activeStamps.push({
        text: spec.text,
        color: spec.color,
        x,
        y,
        age: 0,
        lifetime: 500,
        rotation: (Math.random() - 0.5) * 16 * (Math.PI / 180),
        startScale: reducedMotion ? 1.0 : 1.5,
        endScale: 1.0,
    });
}

/**
 * Update all swipe trail particles and stamps.
 * @param {number} deltaMs
 */
export function updateSwipeEffects(deltaMs) {
    // Update trail particles
    for (let i = swipeTrailParticles.length - 1; i >= 0; i--) {
        swipeTrailParticles[i].age += deltaMs;
        if (swipeTrailParticles[i].age >= swipeTrailParticles[i].lifetime) {
            swipeTrailParticles.splice(i, 1);
        }
    }

    // Update stamps
    for (let i = activeStamps.length - 1; i >= 0; i--) {
        activeStamps[i].age += deltaMs;
        if (activeStamps[i].age >= activeStamps[i].lifetime) {
            activeStamps.splice(i, 1);
        }
    }
}

/**
 * Render swipe trail particles on canvas.
 * @param {CanvasRenderingContext2D} ctx
 */
export function renderSwipeTrail(ctx) {
    for (const p of swipeTrailParticles) {
        const progress = p.age / p.lifetime;
        const alpha = 0.7 * (1 - progress);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.restore();
    }
}

/**
 * Render stamp VFX on canvas.
 * @param {CanvasRenderingContext2D} ctx
 */
export function renderStamps(ctx) {
    for (const s of activeStamps) {
        const progress = s.age / s.lifetime;
        const scale = s.startScale + (s.endScale - s.startScale) * Math.min(progress * 3, 1);
        const alpha = 1 - progress;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;

        ctx.strokeStyle = s.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(-100, -30, 200, 60);

        ctx.fillStyle = s.color;
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.text, 0, 0);

        ctx.restore();
    }
}

// ── Environmental Reactions ───────────────────────────────────────────────────

/**
 * Update danger vignette state.
 * @param {number} dangerIntensity — 0 to 1
 * @param {number} deltaMs
 */
export function updateDangerVignette(dangerIntensity, deltaMs) {
    if (dangerIntensity <= 0) {
        vignetteState.active = false;
        vignetteState.opacity = 0;
        return;
    }

    vignetteState.active = true;
    vignetteState.elapsed += deltaMs;

    // Determine base opacity and pulse speed based on intensity
    let baseOpacity, pulseMs;
    if (dangerIntensity > 0.75) {
        baseOpacity = 0.35; pulseMs = 300;
    } else if (dangerIntensity > 0.5) {
        baseOpacity = 0.25; pulseMs = 500;
    } else if (dangerIntensity > 0.25) {
        baseOpacity = 0.15; pulseMs = 800;
    } else {
        baseOpacity = 0.08; pulseMs = 1200;
    }

    const pulse = reducedMotion ? 1.0 : (0.7 + 0.3 * Math.sin((vignetteState.elapsed / pulseMs) * Math.PI * 2));
    vignetteState.opacity = baseOpacity * pulse;
}

/**
 * Render danger vignette overlay.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w — canvas width
 * @param {number} h — canvas height
 */
export function renderDangerVignette(ctx, w, h) {
    if (!vignetteState.active || vignetteState.opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = vignetteState.opacity;
    const gradient = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.8);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, vignetteState.color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
}

/**
 * Update combo sparkle particles.
 * @param {number} comboMultiplier
 * @param {number} deltaMs
 * @param {number} canvasW
 * @param {number} canvasH
 */
export function updateComboSparkles(comboMultiplier, deltaMs, canvasW, canvasH) {
    if (reducedMotion) { comboSparkles = []; return; }

    // Remove expired
    for (let i = comboSparkles.length - 1; i >= 0; i--) {
        comboSparkles[i].age += deltaMs;
        comboSparkles[i].y -= 1.5;
        comboSparkles[i].x += (Math.random() - 0.5) * 2;
        if (comboSparkles[i].age >= comboSparkles[i].lifetime) {
            comboSparkles.splice(i, 1);
        }
    }

    // Spawn at ×2 rate, then intensify further on larger streaks.
    if (comboMultiplier >= 2.0) {
        comboSparkleTimer += deltaMs;
        const spawnInterval = comboMultiplier >= 2.5 ? 125 : 220;
        if (comboSparkleTimer >= spawnInterval) {
            comboSparkleTimer = 0;
            const edge = Math.floor(Math.random() * 4);
            let x, y;
            switch (edge) {
                case 0: x = Math.random() * canvasW; y = 0; break;
                case 1: x = canvasW; y = Math.random() * canvasH; break;
                case 2: x = Math.random() * canvasW; y = canvasH; break;
                default: x = 0; y = Math.random() * canvasH; break;
            }
            comboSparkles.push({ x, y, age: 0, lifetime: 800 });
        }
    } else {
        comboSparkleTimer = 0;
    }
}

/**
 * Render combo sparkle particles.
 * @param {CanvasRenderingContext2D} ctx
 */
export function renderComboSparkles(ctx) {
    ctx.save();
    for (const s of comboSparkles) {
        const alpha = 1 - (s.age / s.lifetime);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}



// ── Getters for testing ──────────────────────────────────────────────────────

export function getDeskLayers() { return deskLayers; }
export function getSwipeTrailCount() { return swipeTrailParticles.length; }
export function getActiveStampCount() { return activeStamps.length; }
export function getVignetteState() { return { ...vignetteState }; }
export function getComboSparkleCount() { return comboSparkles.length; }
