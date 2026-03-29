// src/game-loop.js — Entry point, main loop, state machine, initialization (v1.1)

import { initRenderer, renderFrame, triggerScreenShake, spawnParticles, clearParticles } from './engine/renderer.js';
import { initInput, getSwipeResult, getDragState, isKeyJustPressed, getTapPosition, resetInput } from './engine/input.js';
import { initAudio, registerSFX, registerMusic, playSFX, playMusic, stopMusic, crossfadeMusic, isInitialized as isAudioInitialized, setHighpassFreq } from './engine/audio.js';
import { loadAllAssets } from './engine/assets.js';
import { getGameState, resetGameState, updateGameState, processDocument, getDeathCause, _setGaugeDirect, recordResult, setAnalysisStart, checkAnalysisBonus, setDeskChaosLevel as setStateDeskChaos } from './gameplay/game-state.js';
import { initDocuments, getNextDocument } from './gameplay/documents.js';
import { initOverlays, showOverlay, hideAllOverlays, updateGameOverStats, updateHighScoreDisplay, updateNewDiscoveries, announce, triggerVictory } from './ui/overlays.js';
import { initHUD, drawHUD, resetDisplayedValues } from './ui/hud.js';
import { SFX_DATA } from './data/sfx-data.js';
import { MUSIC_DATA } from './data/music-data.js';
import { RARITY_COLORS } from './data/document-data.js';
import { markDocSeen, getSeenDocIds } from './data/collection.js';
import { drawPauseButton as drawPauseButtonExtracted, drawDebugPanel as drawDebugPanelExtracted, setupDebug as setupDebugExtracted } from './ui/action-buttons.js';
import { renderV3EffectsLayers, renderV3HUDAdditions, renderComboEffects } from './ui/gameplay-renderer.js';
import { initVisualEffects, updateDeskChaos, renderDeskChaos, addSwipeTrailParticles, renderSwipeTrail, spawnStampVFX, renderStamps, updateSwipeEffects, updateDangerVignette, renderDangerVignette, updateComboSparkles, renderComboSparkles } from './engine/visual-effects.js';
import { computeDeskChaosLevel, getMaxDangerIntensity } from './gameplay/escalation.js';
import { enterTitle, enterGameplay, enterGameOver, enterVictory } from './gameplay/state-transitions.js';
import { updateV3Systems } from './gameplay/v3-systems-updater.js';
import { buildCardData } from './ui/card-data-builder.js';
import { playSwipeAudioFeedback, playSwipeVisualFeedback } from './gameplay/swipe-feedback.js';
import { handleTapButtons } from './ui/action-buttons.js';
import { initTitleScreen, updateTitleScreen, renderTitleScreen } from './ui/title-screen.js';

// Game states (v1.1 — 7 states)
const TITLE = 'TITLE', GAMEPLAY = 'GAMEPLAY', PAUSE = 'PAUSE', GAME_OVER = 'GAME_OVER';
const HOW_TO_PLAY = 'HOW_TO_PLAY', COLLECTION = 'COLLECTION', VICTORY = 'VICTORY';

let currentState = null, canvas = null, ctx = null, lastTimestamp = 0, audioInitialized = false;
let currentDocument = null, documentTimer = 0;
let pauseTimerActive = false, pauseTimerEnd = 0, debugMode = false;
let pendingScoreTickPoints = 0, lastScoreTickAt = 0, nextPaperAmbientAt = 0;

// Debounce: minimum delay between two consecutive document interactions
const SWIPE_COOLDOWN_MS = 400;
let swipeCooldownUntil = 0;

export const SCORE_TICK_CHUNK = 60;
export const SCORE_TICK_INTERVAL_MS = 80;
export const PAPER_AMBIENT_INTERVAL_MS = 2600;
export const WIRED_PRESENTATION_SFX_KEYS = ['SFX_SCORE_TICK', 'SFX_PAPER_AMBIENT'];
let cardAnim = { phase: 'idle', t: 0, targetX: 0, targetRotation: 0 };
let runNewDiscoveries = 0;
let reducedMotion = false;
const HS_KEY = 'compta-panic-highscore';
let highScore = 0;

export function startGame() {
    // Canvas setup
    canvas = document.getElementById('game-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'game-canvas';
        canvas.setAttribute('role', 'application');
        document.body.appendChild(canvas);
    }

    ctx = canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Load high score
    try {
        const stored = localStorage.getItem(HS_KEY);
        if (stored) highScore = parseInt(stored, 10) || 0;
    } catch (e) { /* localStorage unavailable */ }

    // Init engine modules
    initRenderer(canvas, ctx);
    initInput(canvas);
    void loadAllAssets().catch(() => null);

    // Audio will be initialized on first user gesture
    // Register data for when audio is initialized

    // Init UI
    initOverlays({
        onJouer: () => {
            ensureAudio();
            playSFX('SFX_TITLE_START');
            transitionTo(GAMEPLAY);
        },
        onResume: () => {
            ensureAudio();
            playSFX('SFX_BUTTON_TAP');
            transitionTo(GAMEPLAY);
        },
        onQuit: () => {
            ensureAudio();
            playSFX('SFX_BUTTON_TAP');
            transitionTo(TITLE);
        },
        onReplay: () => {
            ensureAudio();
            playSFX('SFX_TITLE_START');
            transitionTo(GAMEPLAY);
        },
        onMenu: () => {
            ensureAudio();
            playSFX('SFX_BUTTON_TAP');
            transitionTo(TITLE);
        },
        onHowToPlay: () => {
            ensureAudio();
            playSFX('SFX_BUTTON_TAP');
            transitionTo(HOW_TO_PLAY);
        },
        onHowToPlayClose: () => {
            ensureAudio();
            playSFX('SFX_BUTTON_TAP');
            transitionTo(TITLE);
        },
        onCollection: () => {
            ensureAudio();
            playSFX('SFX_BUTTON_TAP');
            transitionTo(COLLECTION);
        },
        onCollectionClose: () => {
            ensureAudio();
            playSFX('SFX_BUTTON_TAP');
            transitionTo(TITLE);
        },
    });

    initHUD(ctx);
    initTitleScreen(canvas, ctx);

    // Expose debug
    setupDebugExtracted(() => currentState, getGameState, _setGaugeDirect);

    // Start at TITLE
    transitionTo(TITLE);

    // Start loop
    lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    if (ctx) ctx.scale(dpr, dpr);
}

function ensureAudio() {
    if (!audioInitialized) {
        initAudio();
        registerSFX(SFX_DATA);
        registerMusic(MUSIC_DATA);
        audioInitialized = true;
    }
}

function transitionTo(newState) {
    const prevState = currentState;
    currentState = newState;

    // Hide ALL overlays first
    hideAllOverlays();

    // Clear the last gameplay frame to prevent it bleeding through overlay backgrounds (B-006)
    if (newState !== GAMEPLAY && ctx && canvas) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    }

    const deps = {
        audioInitialized, highScore,
        HS_KEY, MUSIC_DATA,
        showOverlay, announce, playMusic, stopMusic, playSFX, setHighpassFreq,
        updateHighScoreDisplay, resetGameState, initDocuments,
        resetDisplayedValues, clearParticles,
        initVisualEffects,
        _setGaugeDirect, getGameState,
        getDeathCause, updateGameOverStats, updateNewDiscoveries,
        triggerVictory,
        shouldResetGameOnTransition,
        spawnNextDocument, runNewDiscoveries,
    };

    switch (newState) {
        case TITLE:
            enterTitle(deps);
            break;
        case GAMEPLAY: {
            const result = enterGameplay(prevState, deps);
            if (result) {
                const rs = result.resetState;
                pauseTimerActive = rs.pauseTimerActive;
                runNewDiscoveries = rs.runNewDiscoveries;
                pendingScoreTickPoints = rs.pendingScoreTickPoints;
                lastScoreTickAt = rs.lastScoreTickAt;
                nextPaperAmbientAt = rs.nextPaperAmbientAt;
                cardAnim = rs.cardAnim;
                reducedMotion = result.reducedMotion;
            }
            break;
        }
        case PAUSE:
            showOverlay('pause');
            if (audioInitialized) stopMusic();
            announce('Jeu en pause');
            break;
        case GAME_OVER:
            highScore = enterGameOver(deps);
            break;
        case HOW_TO_PLAY:
            showOverlay('howToPlay');
            announce('Comment jouer');
            break;
        case COLLECTION:
            showOverlay('collection');
            announce('Collection de documents');
            break;
        case VICTORY:
            enterVictory(deps);
            break;
    }
}

function gameLoop(timestamp) {
    const delta = Math.min(33, timestamp - lastTimestamp); // clamp dt to 33ms
    lastTimestamp = timestamp;

    if (currentState === TITLE || currentState === HOW_TO_PLAY || currentState === COLLECTION) {
        updateTitleScreen(delta);
        renderTitleScreen(ctx);
    }

    if (currentState === GAMEPLAY) {
        handleGameplayInput();
        updateGameplay(delta);
        renderGameplay(delta);
        updatePresentationAudio(timestamp);
    }

    requestAnimationFrame(gameLoop);
}

function handleGameplayInput() {
    // Pause via Escape (just-pressed to catch quick taps)
    if (isKeyJustPressed('Escape')) {
        transitionTo(PAUSE);
        resetInput();
        return;
    }

    if (isKeyJustPressed('KeyD') || isKeyJustPressed('ArrowRight')) {
        processSwipe('right');
        resetInput();
        return;
    }

    if (isKeyJustPressed('KeyS') || isKeyJustPressed('ArrowDown')) {
        processSwipe('down');
        resetInput();
        return;
    }

    if (isKeyJustPressed('KeyQ') || isKeyJustPressed('ArrowLeft')) {
        processSwipe('left');
        resetInput();
        return;
    }

    // Debug toggle
    if (isKeyJustPressed('Backquote')) {
        debugMode = !debugMode;
        updateDebugPanel();
    }

    // Check for tap on canvas buttons (B-002: mobile button hit-testing)
    const tap = getTapPosition();
    if (tap && canvas) {
        if (handleTapButtons(tap, canvas, cardAnim, currentDocument, {
            transitionTo, PAUSE, processSwipe, resetInput,
        })) return;
    }

    // Check for swipe (with debounce cooldown)
    if (cardAnim.phase === 'idle' && currentDocument && performance.now() >= swipeCooldownUntil) {
        const swipe = getSwipeResult();
        if (swipe) {
            processSwipe(swipe.direction);
        }
    }

    resetInput();
}

function processSwipe(direction, isTimeout = false) {
    if (!currentDocument) return;

    // Set cooldown to prevent classifying the next document too fast
    swipeCooldownUntil = performance.now() + SWIPE_COOLDOWN_MS;

    // Track collection discovery
    const seenBefore = getSeenDocIds();
    const isNewDiscovery = !seenBefore.has(currentDocument.id);
    markDocSeen(currentDocument.id);
    if (isNewDiscovery) runNewDiscoveries++;

    const gs = getGameState();
    const directionToAction = {
        right: 'accept',
        left: 'reject',
    };

    let actionKey = isTimeout ? 'timeout' : directionToAction[direction];
    if (!actionKey) return;

    const triageOutcome = actionKey === 'timeout'
        ? currentDocument.timeoutOutcome
        : currentDocument.decisionActions?.[actionKey];
    if (!triageOutcome) return;

    // Process document effects in game state
    const result = processDocument(triageOutcome);

    // Track outcomes for contextual drift
    const conformiteDelta = triageOutcome.gaugeEffects.conformite ?? triageOutcome.gaugeEffects.legal ?? 0;
    recordResult(actionKey, conformiteDelta);

    // Check analysis speed bonus
    if (result && !result.gameOver) checkAnalysisBonus(currentDocument.rarity);

    // Audio feedback
    if (audioInitialized) {
        playSwipeAudioFeedback(actionKey, result, gs, {
            playSFX, announce, getGameState, crossfadeMusic,
        });
        pendingScoreTickPoints = queueScoreTicks(pendingScoreTickPoints, result ? result.scoreAdded : 0);
    }

    // Visual feedback
    playSwipeVisualFeedback(actionKey, result, currentDocument, canvas, {
        triggerScreenShake, spawnStampVFX, addSwipeTrailParticles, spawnParticles,
    });

    // Check game over
    if (result && result.gameOver) {
        transitionTo(GAME_OVER);
        return;
    }

    // Start swipe animation
    cardAnim = {
        phase: direction === 'right' ? 'exit-right' : 'exit-left',
        t: 0,
        targetX: direction === 'right' ? 600 : -600,
        targetRotation: direction === 'right' ? 25 : -25,
    };
}

function updateGameplay(delta) {
    if (cardAnim.phase === 'idle') {
        // Update document timer
        const gs = getGameState();

        // Coffee break and swipe cooldown both pause the document timer
        if (pauseTimerActive) {
            if (performance.now() >= pauseTimerEnd) {
                pauseTimerActive = false;
            }
        } else if (performance.now() >= swipeCooldownUntil) {
            documentTimer += delta;
        }

        // Check timeout
        if (currentDocument && documentTimer >= gs.documentInterval) {
            if (audioInitialized) playSFX('SFX_CARD_TIMEOUT');
            processSwipe('left', true);
            return;
        }

    } else {
        // Card animation
        cardAnim.t += delta;
        if (cardAnim.t >= 300) {
            // Animation done — spawn next card
            cardAnim = { phase: 'entering', t: 0, targetX: 0, targetRotation: 0 };
            spawnNextDocument();
        }
    }

    if (cardAnim.phase === 'entering') {
        cardAnim.t += delta;
        if (cardAnim.t >= 200) {
            cardAnim = { phase: 'idle', t: 0, targetX: 0, targetRotation: 0 };
        }
    }

    // Update game state (drift, tour changes)
    const result = updateGameState(delta);
    if (result) {
        if (result.scoreAdded > 0) {
            pendingScoreTickPoints = queueScoreTicks(pendingScoreTickPoints, result.scoreAdded);
        }
        if (result.tourChanged) {
            const gs = getGameState();
            announce(`Tour ${gs.tour}`);
        }
        if (result.gameOver) {
            transitionTo(GAME_OVER);
            return;
        }
    }

    // Update visual effects (desk chaos, danger vignette, sparkles, particles, audio filter)
    const gsVfx = getGameState();
    updateV3Systems(delta, gsVfx, {
        canvas, audioInitialized,
        updateSwipeEffects, getMaxDangerIntensity, updateDangerVignette,
        updateComboSparkles, computeDeskChaosLevel,
        updateDeskChaos, setStateDeskChaos, setHighpassFreq,
    });
}

function spawnNextDocument() {
    const gs = getGameState();
    currentDocument = getNextDocument(gs.tour);
    documentTimer = 0;
    setAnalysisStart();
    if (audioInitialized) playSFX('SFX_CARD_ENTER');
}

function renderGameplay(delta) {
    if (!ctx || !canvas) return;

    const gs = getGameState();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    let cardData = null;
    let bgTint = { color: 'transparent', opacity: 0 };
    if (currentDocument) {
        const drag = getDragState();
        const built = buildCardData(currentDocument, gs, cardAnim, drag, w, h, documentTimer);
        cardData = built.cardData;
        bgTint = built.bgTint;
    }

    renderFrame(delta, {
        card: cardData,
        particles: [],
        shakeOffset: { x: 0, y: 0 },
        backgroundTint: bgTint,
        reducedMotion: false,
    });

    drawPauseButtonExtracted(ctx);

    // Render all effect layers (desk chaos, trails, stamps, vignette, sparkles)
    renderV3EffectsLayers(ctx, canvas);

    // Draw HUD on top
    drawHUD({
        gauges: {
            argent: { value: gs.gauges.argent, zone: gs.gaugeZones.argent },
            satisfaction: { value: gs.gauges.satisfaction, zone: gs.gaugeZones.satisfaction },
            conformite: { value: gs.gauges.conformite, zone: gs.gaugeZones.conformite },
        },
        score: gs.score,
        combo: gs.combo,
        stableTriageStreak: gs.stableTriageStreak,
        comboMultiplier: gs.comboMultiplier,
        objectiveProgress: null,
    });

    // V3: Render HUD additions (doc queue, event banners)
    renderV3HUDAdditions(ctx, delta, gs);

    // Combo visual effects
    renderComboEffects(ctx, gs, w, h);

    // Debug panel
    if (debugMode) {
        drawDebugPanelExtracted(ctx, gs, w, h, currentState, currentDocument);
    }
}

export function queueScoreTicks(currentQueue, scoreAdded) {
    return currentQueue + Math.max(0, scoreAdded || 0);
}

export function consumeScoreTickQueue(currentQueue, now, lastTickAt, intervalMs = SCORE_TICK_INTERVAL_MS, chunkSize = SCORE_TICK_CHUNK) {
    if (currentQueue <= 0 || now - lastTickAt < intervalMs) {
        return {
            queue: currentQueue,
            lastTickAt,
            shouldPlay: false,
        };
    }

    return {
        queue: Math.max(0, currentQueue - chunkSize),
        lastTickAt: now,
        shouldPlay: true,
    };
}

export function shouldPlayPaperAmbient({ audioReady, state, now, nextAt }) {
    return Boolean(audioReady && state === GAMEPLAY && now >= nextAt);
}

function updatePresentationAudio(timestamp) {
    const scoreTickState = consumeScoreTickQueue(pendingScoreTickPoints, timestamp, lastScoreTickAt);
    pendingScoreTickPoints = scoreTickState.queue;
    lastScoreTickAt = scoreTickState.lastTickAt;
    if (scoreTickState.shouldPlay && audioInitialized) {
        playSFX('SFX_SCORE_TICK');
    }

    if (shouldPlayPaperAmbient({ audioReady: audioInitialized, state: currentState, now: timestamp, nextAt: nextPaperAmbientAt })) {
        playSFX('SFX_PAPER_AMBIENT');
        nextPaperAmbientAt = timestamp + PAPER_AMBIENT_INTERVAL_MS;
    }
}

// Pure function — injectable for unit testing
export function shouldResetGameOnTransition(prevState, newState) {
    // Resuming from PAUSE must preserve the live run (score, combo, gauges, card).
    // Only a fresh start (from TITLE or GAME_OVER) resets run state.
    return newState === GAMEPLAY && prevState !== PAUSE;
}

// Auto-start when loaded as module
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startGame);
    } else {
        startGame();
    }
}

// Export for testing
export { transitionTo, TITLE, GAMEPLAY, PAUSE, GAME_OVER, HOW_TO_PLAY, COLLECTION, VICTORY };
