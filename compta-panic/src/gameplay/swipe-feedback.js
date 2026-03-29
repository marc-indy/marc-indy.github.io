// src/gameplay/swipe-feedback.js — Extracted audio and visual feedback from processSwipe

const ACTION_FEEDBACK = {
    accept: {
        swipeSfx: 'SFX_SWIPE_RIGHT',
        accentSfx: 'SFX_STAMP_ACCEPT',
        confirmSfx: 'SFX_DESK_SLAM',
        trailVariant: 'accept',
        stampVariant: 'accept',
        shakeMagnitude: 6,
        shakeDuration: 150,
        particleCount: 18,
        particleColors: ['#2ECC71', '#F1C40F', '#FFFFFF'],
    },
    reject: {
        swipeSfx: 'SFX_SWIPE_LEFT',
        accentSfx: 'SFX_STAMP_REJECT',
        confirmSfx: null,
        trailVariant: 'reject',
        stampVariant: 'reject',
        shakeMagnitude: 4,
        shakeDuration: 130,
        particleCount: 12,
        particleColors: ['#E74C3C', '#F7D6D0', '#2C3E50'],
    },
    timeout: {
        swipeSfx: 'SFX_CARD_TIMEOUT',
        accentSfx: 'SFX_COMBO_BREAK',
        confirmSfx: null,
        trailVariant: 'reject',
        stampVariant: 'reject',
        shakeMagnitude: 4,
        shakeDuration: 140,
        particleCount: 10,
        particleColors: ['#E74C3C', '#2C3E50', '#FFFFFF'],
    },
};

const COMBO_MILESTONES = [1.25, 1.5, 2.0, 2.5];

export function getActionFeedbackProfile(actionKey, routeQuality = 'good') {
    const baseProfile = ACTION_FEEDBACK[actionKey] || ACTION_FEEDBACK.accept;
    const qualityScale = routeQuality === 'good' ? 1 : routeQuality === 'risky' ? 0.85 : 0.7;

    return {
        ...baseProfile,
        particleCount: Math.max(8, Math.round(baseProfile.particleCount * qualityScale)),
        shakeMagnitude: Math.max(2, baseProfile.shakeMagnitude * qualityScale),
    };
}

export function playSwipeAudioFeedback(actionKey, result, prevGs, deps) {
    const profile = getActionFeedbackProfile(actionKey, result?.routeQuality);
    const gaugeLabels = { argent: 'argent', satisfaction: 'satisfaction', conformite: 'conformité' };

    if (profile.swipeSfx) deps.playSFX(profile.swipeSfx);
    if (profile.accentSfx) deps.playSFX(profile.accentSfx);
    if (result?.routeQuality === 'good' && profile.confirmSfx) deps.playSFX(profile.confirmSfx);

    if (result) {
        // Zone change SFX
        const previousZones = { ...prevGs.gaugeZones };
        const newZones = result.newZones;
        for (const key of ['argent', 'satisfaction', 'conformite']) {
            if (newZones[key] === 'warning' && previousZones[key] === 'safe') {
                deps.playSFX('SFX_GAUGE_WARNING');
                deps.announce(`Attention : ${gaugeLabels[key]} en zone d'alerte`);
            } else if (newZones[key] === 'danger' && previousZones[key] !== 'danger') {
                deps.playSFX('SFX_GAUGE_DANGER');
                deps.announce(`Danger : ${gaugeLabels[key]} en zone critique !`);
            } else if (newZones[key] === 'safe' && previousZones[key] === 'danger') {
                deps.playSFX('SFX_GAUGE_RECOVER');
            }
        }

        // Combo SFX
        if (result.comboChanged) {
            const newState = deps.getGameState();
            if (newState.combo === 0 && prevGs.combo > 0) {
                deps.playSFX('SFX_COMBO_BREAK');
            } else if (newState.combo > 0) {
                const prevMult = prevGs.comboMultiplier;
                const newMult = newState.comboMultiplier;
                const reachedMilestone = COMBO_MILESTONES.some((milestone) => newMult >= milestone && prevMult < milestone);
                if (reachedMilestone) {
                    deps.playSFX('SFX_COMBO_MILESTONE');
                    deps.announce(`Combo ×${newMult.toFixed(1)} !`);
                } else {
                    deps.playSFX('SFX_COMBO_INCREMENT');
                }
            }
        }

        // Music tension crossfade
        const newGs = deps.getGameState();
        const anyDanger = ['argent', 'satisfaction', 'conformite'].some((key) => newGs.gaugeZones[key] !== 'safe');
        if (anyDanger) {
            deps.crossfadeMusic('MUSIC_GAMEPLAY_TENSE', 500);
        } else {
            deps.crossfadeMusic('MUSIC_GAMEPLAY_CALM', 500);
        }
    }
}

export function playSwipeVisualFeedback(actionKey, result, currentDocument, canvas, deps) {
    const profile = getActionFeedbackProfile(actionKey, result?.routeQuality);

    deps.triggerScreenShake(profile.shakeMagnitude, profile.shakeDuration);
    if (canvas) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const centerX = canvas.width / (2 * dpr);
        const centerY = canvas.height * 0.45 / dpr;

        deps.spawnStampVFX(centerX, centerY, profile.stampVariant);
        deps.addSwipeTrailParticles(centerX, centerY, profile.trailVariant);

        deps.spawnParticles({
            x: centerX,
            y: centerY,
            count: profile.particleCount,
            colors: [currentDocument.headerColor || profile.particleColors[0], ...profile.particleColors],
            lifetime: 600,
            speed: { min: 2, max: actionKey === 'accept' ? 7 : 5 },
            gravity: 0.1,
        });
    }
}
