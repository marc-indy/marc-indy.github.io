// src/engine/input.js — Touch swipe, keyboard (AZERTY), mouse — unified input

const SWIPE_THRESHOLD_PX = 60;
const TAP_THRESHOLD_PX = 15;

let canvas = null;
let lastSwipe = null;
let lastTap = null;
let dragState = null;
let keysPressed = {};
let justPressedKeys = new Set();
let lastNumberKey = null;

// Touch tracking
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let isTouching = false;

// Mouse drag tracking
let mouseDown = false;
let mouseStartX = 0;
let mouseStartY = 0;

export function initInput(canvasEl) {
    canvas = canvasEl;
    lastSwipe = null;
    lastTap = null;
    dragState = null;
    keysPressed = {};
    justPressedKeys = new Set();

    // Touch events
    canvas.style.touchAction = 'none';
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    // Mouse events
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);

    // Keyboard events — use event.code for AZERTY
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

function onTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = performance.now();
    isTouching = true;
    dragState = { active: true, dx: 0, dy: 0, startX: touchStartX, startY: touchStartY };
}

function onTouchMove(e) {
    e.preventDefault();
    if (!isTouching) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    dragState = { active: true, dx, dy, startX: touchStartX, startY: touchStartY };
}

function onTouchEnd(e) {
    e.preventDefault();
    if (!isTouching) return;
    isTouching = false;

    if (dragState && Math.abs(dragState.dx) >= SWIPE_THRESHOLD_PX && Math.abs(dragState.dx) > Math.abs(dragState.dy)) {
        const elapsed = Math.max(1, performance.now() - touchStartTime);
        lastSwipe = {
            direction: dragState.dx > 0 ? 'right' : 'left',
            velocity: Math.abs(dragState.dx) / elapsed,
            source: 'touch',
        };
    } else if (!dragState || (Math.abs(dragState.dx) < TAP_THRESHOLD_PX && Math.abs(dragState.dy) < TAP_THRESHOLD_PX)) {
        // Short tap — record position in canvas-relative coordinates
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            lastTap = { x: touchStartX - rect.left, y: touchStartY - rect.top };
        }
    }
    dragState = null;
}

function onMouseDown(e) {
    mouseDown = true;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
    dragState = { active: true, dx: 0, dy: 0, startX: mouseStartX, startY: mouseStartY };
}

function onMouseMove(e) {
    if (!mouseDown) return;
    const dx = e.clientX - mouseStartX;
    const dy = e.clientY - mouseStartY;
    dragState = { active: true, dx, dy, startX: mouseStartX, startY: mouseStartY };
}

function onMouseUp(e) {
    if (!mouseDown) return;
    mouseDown = false;

    if (dragState && Math.abs(dragState.dx) >= SWIPE_THRESHOLD_PX && Math.abs(dragState.dx) > Math.abs(dragState.dy)) {
        lastSwipe = {
            direction: dragState.dx > 0 ? 'right' : 'left',
            velocity: Math.abs(dragState.dx) / 300,
            source: 'mouse',
        };
    } else if (!dragState || (Math.abs(dragState.dx) < TAP_THRESHOLD_PX && Math.abs(dragState.dy) < TAP_THRESHOLD_PX)) {
        // Short click — record position in canvas-relative coordinates
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            lastTap = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
    }
    dragState = null;
}

function onKeyDown(e) {
    if (isGameControlKey(e.code) && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }

    keysPressed[e.code] = true;
    justPressedKeys.add(e.code);

    // V3: Number keys 1-4 for quiz/option selection
    const numMap = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 };
    if (e.code in numMap) {
        lastNumberKey = numMap[e.code];
    }
}

function onKeyUp(e) {
    keysPressed[e.code] = false;
}

export function getSwipeResult() {
    const result = lastSwipe;
    lastSwipe = null;
    return result;
}

export function getDragState() {
    return dragState;
}

export function isKeyPressed(code) {
    return !!keysPressed[code];
}

export function isKeyJustPressed(code) {
    return justPressedKeys.has(code);
}

export function getTapPosition() {
    const result = lastTap;
    lastTap = null;
    return result;
}

export function resetInput() {
    justPressedKeys.clear();
}

export function destroyInput() {
    if (canvas) {
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseup', onMouseUp);
    }
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    canvas = null;
    lastSwipe = null;
    lastTap = null;
    dragState = null;
    keysPressed = {};
    justPressedKeys = new Set();
    lastNumberKey = null;
}

function isGameControlKey(code) {
    return code === 'Escape' ||
        code === 'KeyD' ||
        code === 'KeyQ' ||
        code === 'KeyS' ||
        code === 'ArrowRight' ||
        code === 'ArrowLeft' ||
        code === 'ArrowDown' ||
        code === 'Backquote';
}

// ── V3 Extensions ─────────────────────────────────────────────────────────────

/**
 * V3: Get a number key press (1-4) for quiz options or numbered selections.
 * Consumes the key on read.
 * @returns {number|null} - 0-based index (0 for key 1, 3 for key 4), or null
 */
export function getNumberKeyPress() {
    const result = lastNumberKey;
    lastNumberKey = null;
    return result;
}
