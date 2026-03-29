// src/ui/card-data-builder.js — Extracted card data construction from renderGameplay

export function buildCardData(currentDocument, gs, cardAnim, drag, w, h, documentTimer) {
    let cardX = w / 2;
    let cardY = h * 0.45;
    let rotation = 0;
    let scale = 1;
    let opacity = 1;
    let showAccept = false;
    let showReject = false;
    let labelOpacity = 0;

    if (cardAnim.phase === 'idle' && drag && drag.active) {
        // Dragging
        cardX += drag.dx;
        rotation = Math.max(-20, Math.min(20, drag.dx * 0.08));
        showAccept = drag.dx > 30;
        showReject = drag.dx < -30;
        labelOpacity = Math.max(0, Math.min(1, Math.abs(drag.dx) / 100));
    } else if (cardAnim.phase === 'idle') {
        // Idle float
        const floatOffset = Math.sin(performance.now() / 1000) * 3;
        cardY += floatOffset;
    } else if (cardAnim.phase === 'exit-right' || cardAnim.phase === 'exit-left') {
        const progress = Math.min(1, cardAnim.t / 300);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        cardX += cardAnim.targetX * eased;
        rotation = cardAnim.targetRotation * eased;
        scale = 1 - 0.2 * eased;
        opacity = 1 - eased;
        showAccept = cardAnim.phase === 'exit-right';
        showReject = cardAnim.phase === 'exit-left';
        labelOpacity = 1;
    } else if (cardAnim.phase === 'entering') {
        const progress = Math.min(1, cardAnim.t / 200);
        // Ease-out-back
        const c1 = 1.70158;
        const c3 = c1 + 1;
        const eased = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);
        scale = eased;
    }

    // Background tint during drag
    let bgTint = { color: 'transparent', opacity: 0 };
    if (cardAnim.phase === 'idle' && drag && drag.active) {
        const absDx = Math.abs(drag.dx);
        if (drag.dx > 0) {
            bgTint = { color: '#2ECC71', opacity: Math.min(0.3, absDx / 200) };
        } else {
            bgTint = { color: '#E74C3C', opacity: Math.min(0.3, absDx / 200) };
        }
    }

    // Timer bar
    const timerPercent = gs.documentInterval > 0 ? Math.max(0, 1 - documentTimer / gs.documentInterval) : 1;

    const cardData = {
        x: cardX,
        y: cardY,
        rotation,
        scale,
        opacity,
        headerColor: currentDocument.headerColor,
        rarity: currentDocument.rarity,
        type: currentDocument.type,
        iconKey: currentDocument.iconKey,
        title: currentDocument.title,
        body: currentDocument.body,
        timerPercent,
        showAcceptLabel: showAccept,
        showRejectLabel: showReject,
        labelOpacity,
    };

    return { cardData, bgTint };
}
