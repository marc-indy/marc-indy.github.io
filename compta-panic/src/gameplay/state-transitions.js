// src/gameplay/state-transitions.js — Extracted transitionTo case bodies (v1.1)

export function enterTitle(deps) {
    deps.showOverlay('title');
    deps.updateHighScoreDisplay(deps.highScore);
    if (deps.audioInitialized) {
        deps.playMusic('MUSIC_TITLE');
        deps.setHighpassFreq(0);
    }
    deps.announce('Écran titre — Compta-Panic');
}

export function enterGameplay(prevState, deps) {
    if (deps.shouldResetGameOnTransition(prevState, 'GAMEPLAY')) {
        // New game: full reset of all run state
        deps.resetGameState();
        deps.initDocuments();
        deps.resetDisplayedValues();
        deps.clearParticles();

        const resetState = {
            currentDocument: null,
            documentTimer: 0,
            pauseTimerActive: false,
            runNewDiscoveries: 0,
            pendingScoreTickPoints: 0,
            lastScoreTickAt: 0,
            nextPaperAmbientAt: performance.now() + 300,
            cardAnim: { phase: 'idle', t: 0, targetX: 0, targetRotation: 0 },
        };

        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
        deps.initVisualEffects(reducedMotion);

        if (deps.audioInitialized) deps.playMusic('MUSIC_GAMEPLAY_CALM');

        deps.spawnNextDocument();
        deps.announce('Le jeu commence — Tour 1');
        return { resetState, reducedMotion };
    } else {
        // Resume from pause: restore music only, all run state is preserved
        if (deps.audioInitialized) {
            const gs = deps.getGameState();
            const isTense = gs && (gs.gaugeZones.argent !== 'safe' || gs.gaugeZones.satisfaction !== 'safe' || gs.gaugeZones.conformite !== 'safe');
            deps.playMusic(isTense ? 'MUSIC_GAMEPLAY_TENSE' : 'MUSIC_GAMEPLAY_CALM');
        }
        deps.announce('Jeu repris');
        return null;
    }
}

export function enterGameOver(deps) {
    const gs = deps.getGameState();
    const death = deps.getDeathCause();

    // Check high score
    let isNew = false;
    let newHighScore = deps.highScore;
    if (gs.score > newHighScore) {
        newHighScore = gs.score;
        isNew = true;
        try { localStorage.setItem(deps.HS_KEY, String(newHighScore)); } catch (e) { /* noop */ }
    }

    deps.updateGameOverStats({
        deathCause: death,
        score: gs.score,
        documentsProcessed: gs.documentsProcessed,
        longestCombo: gs.longestCombo,
        elapsedMs: gs.elapsedMs,
        objectiveProgress: null,
        isNewHighScore: isNew,
    });
    deps.updateNewDiscoveries(deps.runNewDiscoveries);
    deps.showOverlay('gameOver');
    if (deps.audioInitialized) {
        deps.playSFX('SFX_GAMEOVER');
        deps.playMusic('MUSIC_GAMEOVER');
        deps.setHighpassFreq(0);
    }
    deps.announce(`Game Over — Score : ${gs.score}`);
    return newHighScore;
}

export function enterVictory(deps) {
    deps.triggerVictory({
        totalScore: deps.getGameState().score || 0,
        docsTotal: deps.getGameState().documentsProcessed || 0,
        bestCombo: deps.getGameState().longestCombo || 1,
    });
    if (deps.audioInitialized) deps.playSFX('SFX_SEASON_WIN');
    deps.announce('Victoire ! Entreprise sauvée !');
}
