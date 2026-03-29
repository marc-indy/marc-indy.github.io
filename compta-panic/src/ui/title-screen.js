// src/ui/title-screen.js — Animated title screen: parallax desk, themed buttons, floating papers

/** @type {CanvasRenderingContext2D|null} */
let ctx = null;
let canvasW = 0;
let canvasH = 0;

let elapsed = 0;

// Floating paper particles
let papers = [];
const PAPER_COUNT = 5;

// Café steam particles
let steamParticles = [];

// Phone LED state
let phoneLedOn = false;
let phoneLedTimer = 0;

// Calculator digits
let calcDigits = '0000';
let calcTimer = 0;

// Mouse position for parallax
let mouseX = 0;
let mouseY = 0;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} context
 */
export function initTitleScreen(canvas, context) {
    ctx = context;
    canvasW = canvas.width;
    canvasH = canvas.height;
    elapsed = 0;
    mouseX = canvasW / 2;
    mouseY = canvasH / 2;
    phoneLedOn = false;
    phoneLedTimer = 0;
    calcDigits = '0000';
    calcTimer = 0;

    // Init floating papers
    papers = [];
    for (let i = 0; i < PAPER_COUNT; i++) {
        papers.push({
            x: Math.random() * canvasW,
            y: Math.random() * canvasH,
            rot: Math.random() * 360,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.3,
            size: 24 + Math.random() * 16,
        });
    }

    // Init steam
    steamParticles = [];
}

/**
 * Update title screen animations.
 * @param {number} deltaMs
 */
export function updateTitleScreen(deltaMs) {
    elapsed += deltaMs;

    // Float papers
    for (let i = papers.length - 1; i >= 0; i--) {
        const p = papers[i];
        p.x += p.vx * (deltaMs / 16);
        p.y += p.vy * (deltaMs / 16);
        p.rot += 0.2 * (deltaMs / 16);

        // Burst papers decay
        if (p._burst) {
            p._life -= deltaMs;
            p.vy += 0.04 * (deltaMs / 16);
            if (p._life <= 0) { papers.splice(i, 1); continue; }
        }

        // Bounce on edges (non-burst only)
        if (!p._burst) {
            if (p.x < 0 || p.x > canvasW) p.vx *= -1;
            if (p.y < 0 || p.y > canvasH) p.vy *= -1;
            p.x = Math.max(0, Math.min(canvasW, p.x));
            p.y = Math.max(0, Math.min(canvasH, p.y));
        }
    }

    // Phone LED blink
    phoneLedTimer += deltaMs;
    if (phoneLedTimer >= 500) {
        phoneLedTimer -= 500;
        phoneLedOn = !phoneLedOn;
    }

    // Calculator digits change
    calcTimer += deltaMs;
    if (calcTimer >= 200) {
        calcTimer -= 200;
        calcDigits = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    }

    // Coffee steam
    if (elapsed % 800 < deltaMs) {
        for (let i = 0; i < 3; i++) {
            steamParticles.push({
                x: canvasW * 0.78 + (Math.random() - 0.5) * 6,
                y: canvasH * 0.12,
                alpha: 0.4,
                life: 2500,
            });
        }
    }
    for (let i = steamParticles.length - 1; i >= 0; i--) {
        const s = steamParticles[i];
        s.y -= 0.3 * (deltaMs / 16);
        s.life -= deltaMs;
        s.alpha = Math.max(0, 0.4 * (s.life / 2500));
        if (s.life <= 0) steamParticles.splice(i, 1);
    }
}

/**
 * Render the full title screen.
 * @param {CanvasRenderingContext2D} context
 */
export function renderTitleScreen(context) {
    const c = context;

    // Background — desk colored
    c.fillStyle = '#5D4037';
    c.fillRect(0, 0, canvasW, canvasH);

    // Subtle parallax offset based on mouse
    const px = (mouseX - canvasW / 2) * 0.01;
    const py = (mouseY - canvasH / 2) * 0.01;

    c.save();
    c.translate(px, py);

    // Desk surface
    c.fillStyle = '#6D4C41';
    c.fillRect(10, 10, canvasW - 20, canvasH - 20);

    // Desk detail lines
    c.strokeStyle = '#4E342E';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(20, canvasH * 0.3);
    c.lineTo(canvasW - 20, canvasH * 0.3);
    c.stroke();

    // Floating papers (behind everything)
    for (const p of papers) {
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot * Math.PI / 180);
        c.globalAlpha = p._burst ? Math.max(0, p._life / 1500) : 0.6;
        c.fillStyle = '#F5E6CC';
        c.fillRect(-p.size / 2, -p.size / 2 * 1.3, p.size, p.size * 1.3);
        c.restore();
    }

    // Phone (left corner)
    c.fillStyle = '#2C3E50';
    c.fillRect(canvasW * 0.08, canvasH * 0.08, 40, 30);
    if (phoneLedOn) {
        c.fillStyle = '#E74C3C';
        c.beginPath();
        c.arc(canvasW * 0.08 + 35, canvasH * 0.08 + 5, 3, 0, Math.PI * 2);
        c.fill();
    }

    // Calculator (center-right)
    c.fillStyle = '#2C3E50';
    c.fillRect(canvasW * 0.65, canvasH * 0.1, 30, 40);
    c.fillStyle = '#2ECC71';
    c.font = '10px monospace';
    c.textAlign = 'center';
    c.fillText(calcDigits, canvasW * 0.65 + 15, canvasH * 0.1 + 25);

    // Coffee cup (right)
    c.fillStyle = '#8B4513';
    c.beginPath();
    c.arc(canvasW * 0.78, canvasH * 0.15, 12, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#5D4037';
    c.beginPath();
    c.arc(canvasW * 0.78, canvasH * 0.15, 8, 0, Math.PI * 2);
    c.fill();

    // Steam
    for (const s of steamParticles) {
        c.fillStyle = `rgba(255,255,255,${s.alpha})`;
        c.beginPath();
        c.arc(s.x, s.y, 3, 0, Math.PI * 2);
        c.fill();
    }

    c.restore();
}

/**
 * Update mouse position for parallax.
 * @param {number} x
 * @param {number} y
 */
export function setMousePosition(x, y) {
    mouseX = x;
    mouseY = y;
}


