// src/ui/overlays.js — DOM overlays: title, pause, game over, how-to-play, collection, victory with a11y (v1.1)

import { DOCUMENTS, RARITY_COLORS } from '../data/document-data.js';
import { getSeenDocIds, getCollectionStats } from '../data/collection.js';

let overlays = {};
let callbacks = {};
let announceEl = null;
let focusTrapStack = [];

export function initOverlays(cbs) {
    callbacks = cbs;
    createOverlayElements();
}

function createOverlayElements() {
    // Announce region (aria-live)
    announceEl = document.createElement('div');
    announceEl.setAttribute('aria-live', 'polite');
    announceEl.setAttribute('aria-atomic', 'true');
    announceEl.className = 'sr-only';
    announceEl.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;';
    document.body.appendChild(announceEl);

    // Create all overlays
    overlays.title = createTitleOverlay();
    overlays.pause = createPauseOverlay();
    overlays.gameOver = createGameOverOverlay();
    overlays.howToPlay = createHowToPlayOverlay();
    overlays.collection = createCollectionOverlay();
    overlays.victory = createVictoryOverlay();

    // Add shared styles
    addOverlayStyles();
}

export function createOverlayBase(id, overlayName) {
    const el = document.createElement('div');
    el.id = id;
    el.className = 'game-overlay';
    el.setAttribute('data-overlay', overlayName);
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.hidden = true;
    el.style.pointerEvents = 'none';
    document.body.appendChild(el);
    return el;
}

function createTitleOverlay() {
    const el = createOverlayBase('overlay-title', 'title');
    el.style.background = 'linear-gradient(180deg, rgba(30,20,10,0.75) 0%, rgba(50,30,15,0.85) 100%)';
    el.innerHTML = `
    <div class="overlay-content" style="position:relative;">
      <h1 class="title-text" style="color:#F1C40F;font-size:42px;font-family:'Fredoka One',cursive;margin:0;text-shadow:3px 3px 0 #2C3E50, 0 0 20px rgba(241,196,15,0.3);letter-spacing:1px;">COMPTA-PANIC</h1>
        <p class="subtitle" style="color:#E8DACC;font-size:18px;margin:8px 0 4px;font-style:italic;">Entrepreneur au bord de la crise</p>
        <p style="color:#BDC3C7;font-size:14px;margin:0 0 24px;">Un swipe de trop et c'est la faillite.</p>

      <button class="btn btn-primary" id="btn-jouer" style="background:linear-gradient(135deg,#27AE60,#2ECC71);margin-bottom:12px;box-shadow:0 4px 12px rgba(46,204,113,0.4);width:220px;font-size:19px;">🎮 Jouer</button>

      <div style="display:flex;gap:16px;justify-content:center;margin-bottom:16px;">
        <button class="btn-link" id="btn-how-to-play" style="color:#BDC3C7;font-size:14px;background:none;border:none;cursor:pointer;text-decoration:underline;min-height:44px;">❓ Règles</button>
        <button class="btn-link" id="btn-collection" style="color:#BDC3C7;font-size:14px;background:none;border:none;cursor:pointer;text-decoration:underline;min-height:44px;">📚 Collection <span id="btn-collection-count" style="font-size:13px;opacity:0.8;"></span></button>
      </div>

      <p class="highscore-text" id="title-highscore" style="color:#F1C40F;font-size:16px;margin-top:12px;text-shadow:0 0 8px rgba(241,196,15,0.3);"></p>
      <p class="version-text" style="color:rgba(255,255,255,0.3);font-size:11px;position:absolute;bottom:8px;right:12px;">v1.1</p>
    </div>
  `;

    el.querySelector('#btn-jouer').addEventListener('click', () => {
        callbacks.onJouer?.();
    });
    el.querySelector('#btn-how-to-play').addEventListener('click', () => {
        callbacks.onHowToPlay?.();
    });
    el.querySelector('#btn-collection').addEventListener('click', () => {
        callbacks.onCollection?.();
    });

    return el;
}

function createVictoryOverlay() {
    const el = createOverlayBase('overlay-victory', 'victory');
    el.style.background = 'rgba(15,20,40,0.97)';
    el.innerHTML = `
    <div class="overlay-content" style="max-width:600px;">
      <h1 style="color:#F1C40F;font-size:42px;font-family:'Fredoka One',cursive;margin:0 0 8px;">ENTREPRISE SAUVÉE !</h1>
      <p style="color:#FFFFFF;font-size:16px;font-style:italic;margin:0 0 24px;">Vous avez survécu à l'intégralité de l'année fiscale&nbsp;! Contre toute attente.</p>
      <p id="victory-total-score" style="color:#F1C40F;font-size:32px;font-weight:bold;margin:0 0 24px;"></p>
      <div id="victory-stats" style="color:#FFFFFF;font-size:14px;line-height:1.8;margin:0 0 24px;"></div>
      <button class="btn btn-primary" id="btn-victory-menu">Retour au menu</button>
    </div>
  `;
    el.querySelector('#btn-victory-menu').addEventListener('click', () => {
        if (callbacks.onMenu) callbacks.onMenu();
    });
    return el;
}

function createPauseOverlay() {
    const el = createOverlayBase('overlay-pause', 'pause');
    el.innerHTML = `
    <div class="overlay-content">
      <h2 style="color:#FFFFFF;font-size:36px;margin:0 0 32px;">PAUSE</h2>
      <button class="btn btn-primary" id="btn-resume">Reprendre</button>
      <button class="btn btn-danger" id="btn-quit">Quitter</button>
    </div>
  `;

    el.querySelector('#btn-resume').addEventListener('click', () => {
        if (callbacks.onResume) callbacks.onResume();
    });
    el.querySelector('#btn-quit').addEventListener('click', () => {
        if (callbacks.onQuit) callbacks.onQuit();
    });

    return el;
}

function createGameOverOverlay() {
    const el = createOverlayBase('overlay-gameover', 'gameOver');
    el.innerHTML = `
    <div class="overlay-content">
      <h2 id="go-title" style="color:#E74C3C;font-size:40px;margin:0 0 8px;font-weight:bold;">GAME OVER</h2>
      <div id="go-death-gauge" style="display:none;margin:0 0 12px;">
        <div id="go-death-gauge-bar" style="width:200px;height:14px;border-radius:7px;margin:0 auto 6px;background:#2C3E50;overflow:hidden;">
          <div id="go-death-gauge-fill" style="height:100%;border-radius:7px;transition:width 0.3s;"></div>
        </div>
        <p id="go-death-gauge-label" style="color:#BDC3C7;font-size:13px;margin:0;"></p>
      </div>
      <p id="go-death-cause" style="color:#FFFFFF;font-size:16px;font-style:italic;margin:0 0 24px;"></p>
      <p id="go-score" style="color:#F1C40F;font-size:28px;font-weight:bold;margin:0 0 16px;"></p>
      <div id="go-new-record" style="color:#F1C40F;font-size:20px;display:none;margin:-8px 0 16px;">🏆 Nouveau record !</div>
      <div id="go-new-discoveries" style="color:#5B9BD5;font-size:16px;display:none;margin:0 0 12px;"></div>
      <div id="go-stats" style="color:#FFFFFF;font-size:14px;margin:0 0 24px;line-height:1.8;"></div>
      <button class="btn btn-primary" id="btn-replay">Rejouer</button>
      <button class="btn btn-secondary" id="btn-menu">Menu</button>
    </div>
  `;
    el.querySelector('#btn-replay').addEventListener('click', () => {
        if (callbacks.onReplay) callbacks.onReplay();
    });
    el.querySelector('#btn-menu').addEventListener('click', () => {
        if (callbacks.onMenu) callbacks.onMenu();
    });

    return el;
}

function createHowToPlayOverlay() {
    const el = createOverlayBase('overlay-howtoplay', 'howToPlay');
    el.innerHTML = `
    <div class="overlay-content" style="max-height:80vh;overflow-y:auto;">
      <h2 style="color:#FFFFFF;font-size:28px;margin:0 0 16px;">COMMENT JOUER</h2>
      <div style="color:#FFFFFF;font-size:14px;line-height:1.8;text-align:left;max-width:400px;margin:0 auto 24px;">
        <p>Vous avez lancé votre boîte. La compta, c'est vous. Des dossiers absurdes arrivent sans arrêt.<br>
        Chaque carte demande une décision immédiate : <strong>Accepter</strong> ou <strong>Refuser</strong>.</p>
        <p><strong>DÉCISIONS :</strong><br>
        Swipez la carte à <strong>droite</strong> pour accepter, à <strong>gauche</strong> pour refuser.<br>
        Accepter fait passer le dossier tel quel. Refuser évite parfois un risque, mais peut fâcher un client ou coûter de l'argent.</p>
        <p><strong>JAUGES :</strong><br>
        💰 Argent — L'argent de l'entreprise. Trop bas = faillite !<br>
        😊 Satisfaction — Le bonheur des clients. Trop bas = plus de clients !<br>
        ⚖️ Conformité — Votre marge avant le contrôle. Les magouilles la vident, les dossiers propres la refont monter.<br>
        Gardez un œil sur le niveau de chaque jauge — si l'une atteint un extrême, c'est <strong>GAME OVER</strong>.</p>
        <p><strong>COMBOS :</strong> Enchaînez les bonnes décisions pour multiplier votre score.<br>
        Les flèches sur la carte montrent l'effet de chaque choix sur vos jauges.</p>
        <p><strong>CONTRÔLES :</strong><br>
        📱 Mobile : Swipez à gauche ou à droite.<br>
        ⌨️ Clavier : <strong>D</strong> ou <strong>→</strong> = Accepter / <strong>Q</strong> ou <strong>←</strong> = Refuser / <strong>Échap</strong> = Pause</p>
      </div>
      <button class="btn btn-primary" id="btn-understood">Compris !</button>
    </div>
  `;

    el.querySelector('#btn-understood').addEventListener('click', () => {
        if (callbacks.onHowToPlayClose) callbacks.onHowToPlayClose();
    });

    return el;
}

function createCollectionOverlay() {
    const el = createOverlayBase('overlay-collection', 'collection');
    el.innerHTML = `
    <div class="overlay-content" style="max-width:600px;max-height:90vh;display:flex;flex-direction:column;">
      <h2 style="color:#F1C40F;font-size:28px;margin:0 0 8px;">COLLECTION 📚</h2>
      <p id="collection-counter" style="color:#FFFFFF;font-size:18px;margin:0 0 8px;">0 / 0 découverts</p>
      <div style="width:100%;height:8px;background:#2C3E50;border-radius:4px;margin:0 0 12px;overflow:hidden;">
        <div id="collection-bar-fill" style="height:100%;background:linear-gradient(90deg,#2ECC71,#F1C40F);width:0%;transition:width 0.4s;border-radius:4px;"></div>
      </div>
      <div class="collection-filters" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:0 0 12px;">
        <button class="btn-filter active" data-filter="tous" style="font-size:12px;padding:4px 10px;border-radius:14px;border:1px solid #7F8C8D;background:#7F8C8D;color:#FFF;cursor:pointer;min-height:32px;">Tous</button>
        <button class="btn-filter" data-filter="commun" style="font-size:12px;padding:4px 10px;border-radius:14px;border:1px solid #FFFFFF;background:transparent;color:#FFFFFF;cursor:pointer;min-height:32px;">Commun</button>
        <button class="btn-filter" data-filter="inhabituel" style="font-size:12px;padding:4px 10px;border-radius:14px;border:1px solid #5B9BD5;background:transparent;color:#5B9BD5;cursor:pointer;min-height:32px;">Inhabituel</button>
        <button class="btn-filter" data-filter="rare" style="font-size:12px;padding:4px 10px;border-radius:14px;border:1px solid #7B4FBF;background:transparent;color:#7B4FBF;cursor:pointer;min-height:32px;">Rare</button>
        <button class="btn-filter" data-filter="legendaire" style="font-size:12px;padding:4px 10px;border-radius:14px;border:1px solid #FFD700;background:transparent;color:#FFD700;cursor:pointer;min-height:32px;">Légendaire</button>
      </div>
      <div id="collection-grid" class="collection-grid" data-filter="tous" style="flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;padding:4px;"></div>
      <button class="btn btn-primary" id="btn-collection-back" style="margin-top:12px;">Retour</button>
    </div>
  `;

    // Filter buttons
    el.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            el.querySelectorAll('.btn-filter').forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
            });
            btn.classList.add('active');
            btn.style.background = btn.dataset.filter === 'tous' ? '#7F8C8D' : (RARITY_COLORS[btn.dataset.filter] || '#555');
            btn.style.color = '#FFF';
            const grid = document.getElementById('collection-grid');
            if (grid) grid.dataset.filter = btn.dataset.filter;
            refreshCollectionGrid();
        });
    });

    el.querySelector('#btn-collection-back').addEventListener('click', () => {
        if (callbacks.onCollectionClose) callbacks.onCollectionClose();
    });

    return el;
}

function addOverlayStyles() {
    if (document.getElementById('overlay-styles')) return;
    const style = document.createElement('style');
    style.id = 'overlay-styles';
    style.textContent = `
    .game-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      font-family: 'Nunito', sans-serif;
    }
    .game-overlay[hidden] {
      display: none !important;
      pointer-events: none;
    }
    .overlay-content {
      text-align: center;
      padding: 24px;
      max-width: 420px;
      width: 90%;
    }
    .btn {
      display: block;
      width: 200px;
      margin: 8px auto;
      padding: 12px 24px;
      border: none;
      border-radius: 28px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      font-family: 'Nunito', sans-serif;
      transition: transform 0.1s;
      min-height: 44px;
      min-width: 44px;
    }
    .btn:active { transform: scale(0.96); }
    .btn:focus-visible { outline: 3px solid #F1C40F; outline-offset: 2px; }
    .btn-primary { background: #2ECC71; color: #FFFFFF; }
    .btn-secondary { background: transparent; color: #3498DB; border: 2px solid #3498DB; }
    .btn-danger { background: transparent; color: #E74C3C; border: 2px solid #E74C3C; }
    .sr-only { position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0; }

    .collection-card {
      background: #1a1a2e;
      border-radius: 8px;
      border-top: 3px solid #555;
      overflow: hidden;
      min-height: 120px;
    }
    .collection-card.locked {
      opacity: 0.5;
    }
    .collection-card-header {
      padding: 4px 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #FFF;
      font-weight: bold;
      text-transform: uppercase;
    }
    .collection-card-body {
      padding: 8px;
      min-height: 80px;
    }
    .collection-card-title {
      color: #FFF;
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .collection-card-text {
      color: #BDC3C7;
      font-size: 11px;
      line-height: 1.4;
    }
    .btn-filter:focus-visible { outline: 3px solid #F1C40F; outline-offset: 2px; }

    @media (prefers-reduced-motion: reduce) {
      .btn { transition: none; }
    }
  `;
    document.head.appendChild(style);
}

export function showOverlay(name) {
    const el = overlays[name];
    if (!el) return;
    if (name === 'collection') refreshCollectionGrid();
    trapFocus(el);
    el.hidden = false;
    el.style.pointerEvents = 'auto';
    // Focus first button
    const firstBtn = el.querySelector('button');
    if (firstBtn) firstBtn.focus();
}

export function hideOverlay(name) {
    const el = overlays[name];
    if (!el) return;
    releaseFocus(el);
    el.hidden = true;
    el.style.pointerEvents = 'none';
}

export function hideAllOverlays() {
    for (const name of Object.keys(overlays)) {
        hideOverlay(name);
    }
}

export function updateGameOverStats(stats) {
    const el = overlays.gameOver;
    if (!el) return;

    const causeEl = el.querySelector('#go-death-cause');
    const scoreEl = el.querySelector('#go-score');
    const statsEl = el.querySelector('#go-stats');
    const recordEl = el.querySelector('#go-new-record');

    // Death gauge visual indicator
    const gaugeSection = el.querySelector('#go-death-gauge');
    const gaugeFill = el.querySelector('#go-death-gauge-fill');
    const gaugeLabel = el.querySelector('#go-death-gauge-label');
    if (gaugeSection && stats.deathCause) {
        gaugeSection.style.display = 'block';
        const gaugeNames = { argent: '💰 Argent', satisfaction: '😊 Satisfaction', conformite: '⚖️ Conformité' };
        const gaugeColors = { argent: '#27AE60', satisfaction: '#3498DB', conformite: '#16A085' };
        const g = stats.deathCause.gauge;
        const v = stats.deathCause.value;
        if (gaugeLabel) gaugeLabel.textContent = v === 0
            ? `${gaugeNames[g] || g} est tombé à zéro !`
            : `${gaugeNames[g] || g} a atteint le maximum !`;
        if (gaugeFill) {
            gaugeFill.style.width = (v === 0 ? '0%' : '100%');
            gaugeFill.style.background = gaugeColors[g] || '#E74C3C';
        }
    } else if (gaugeSection) {
        gaugeSection.style.display = 'none';
    }
    if (causeEl) causeEl.textContent = stats.deathCause ? stats.deathCause.message : '';
    if (scoreEl) scoreEl.textContent = `Score : ${stats.score.toLocaleString('fr-FR')}`;
    if (statsEl) {
        const totalSec = Math.floor((stats.elapsedMs || 0) / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const streakLabel = stats.bestStableTriageStreak ?? stats.longestCombo ?? 0;

        statsEl.innerHTML = `
      Documents traités : ${stats.documentsProcessed}<br>
                        Meilleure série : ${streakLabel}<br>
      Temps survécu : ${mins}min ${secs}s
    `;
    }
    if (recordEl) {
        recordEl.style.display = stats.isNewHighScore ? 'block' : 'none';
    }
}

export function updateHighScoreDisplay(score) {
    const el = document.getElementById('title-highscore');
    if (el) {
        el.textContent = score > 0 ? `Meilleur score : ${score.toLocaleString('fr-FR')}` : '';
    }
    // Update collection counter on title button
    updateTitleCollectionCount();
}

export function updateTitleCollectionCount() {
    const el = document.getElementById('btn-collection-count');
    if (el) {
        const stats = getCollectionStats();
        el.textContent = `${stats.seen}/${stats.total}`;
    }
}

export function updateNewDiscoveries(count) {
    const el = document.getElementById('go-new-discoveries');
    if (el) {
        if (count > 0) {
            el.style.display = 'block';
            el.textContent = count === 1
                ? '📚 1 nouveau document découvert !'
                : `📚 ${count} nouveaux documents découverts !`;
        } else {
            el.style.display = 'none';
        }
    }
}

export function refreshCollectionGrid() {
    const container = document.getElementById('collection-grid');
    const counterEl = document.getElementById('collection-counter');
    const barEl = document.getElementById('collection-bar-fill');
    if (!container) return;

    const seen = getSeenDocIds();
    const stats = getCollectionStats();

    if (counterEl) counterEl.textContent = `${stats.seen} / ${stats.total} découverts`;
    if (barEl) barEl.style.width = `${(stats.seen / stats.total) * 100}%`;

    // Get current filter
    const activeFilter = container.dataset.filter || 'tous';

    container.innerHTML = '';
    const filtered = activeFilter === 'tous'
        ? DOCUMENTS
        : DOCUMENTS.filter(d => d.rarity === activeFilter);

    // Sort by type then rarity within each type
    const TYPE_ORDER = ['facture', 'recu', 'lettre', 'formulaire', 'contrat', 'note_interne', 'relance', 'rapport', 'audit', 'telephone', 'client_furieux', 'quitte_ou_double', 'prime', 'cafe'];
    const RARITY_ORDER = ['commun', 'inhabituel', 'rare', 'legendaire'];
    const sorted = [...filtered].sort((a, b) => {
        const ta = TYPE_ORDER.indexOf(a.type);
        const tb = TYPE_ORDER.indexOf(b.type);
        const typeA = ta >= 0 ? ta : TYPE_ORDER.length;
        const typeB = tb >= 0 ? tb : TYPE_ORDER.length;
        if (typeA !== typeB) return typeA - typeB;
        return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
    });

    // Type section headers
    let lastType = null;
    for (const doc of sorted) {
        if (doc.type !== lastType) {
            lastType = doc.type;
            const header = document.createElement('div');
            header.style.cssText = 'grid-column:1/-1;color:#F1C40F;font-size:14px;font-weight:bold;text-transform:uppercase;padding:8px 0 2px;border-bottom:1px solid rgba(241,196,15,0.2);margin-top:8px;';
            header.textContent = doc.type.replace(/_/g, ' ');
            container.appendChild(header);
        }
        const isSeen = seen.has(doc.id);
        const card = document.createElement('div');
        card.className = 'collection-card' + (isSeen ? ' seen' : ' locked');
        card.style.borderTopColor = isSeen ? (RARITY_COLORS[doc.rarity] || '#555') : '#333';

        if (isSeen) {
            const rarityLabel = { commun: 'Commun', inhabituel: 'Inhabituel', rare: 'Rare', legendaire: 'Légendaire' }[doc.rarity] || doc.rarity;
            card.innerHTML = `
                <div class="collection-card-header" style="background:${RARITY_COLORS[doc.rarity] || '#555'};">
                    <span class="collection-card-type">${doc.type}</span>
                    <span class="collection-card-rarity">${rarityLabel}</span>
                </div>
                <div class="collection-card-body">
                    <div class="collection-card-title">${doc.title}</div>
                    <div class="collection-card-text">${doc.body.replace(/\n/g, '<br>')}</div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="collection-card-header" style="background:#333;">
                    <span class="collection-card-type">???</span>
                </div>
                <div class="collection-card-body" style="display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:28px;opacity:0.4;">🔒</span>
                </div>
            `;
        }
        container.appendChild(card);
    }
}

export function announce(message) {
    if (announceEl) {
        announceEl.textContent = '';
        // Need to clear and set in separate frames for screen readers
        requestAnimationFrame(() => {
            if (announceEl) announceEl.textContent = message;
        });
    }
}

// Focus trap
function trapFocus(container) {
    const handler = (e) => {
        if (e.key !== 'Tab') return;
        const focusable = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };
    container._focusTrapHandler = handler;
    container.addEventListener('keydown', handler);
    focusTrapStack.push(container);
}

function releaseFocus(container) {
    if (container._focusTrapHandler) {
        container.removeEventListener('keydown', container._focusTrapHandler);
        delete container._focusTrapHandler;
    }
    focusTrapStack = focusTrapStack.filter(c => c !== container);
}

export function getOverlayElement(name) {
    return overlays[name] || null;
}

/** Populate and display the victory overlay */
export function triggerVictory(stats) {
    const scoreEl = document.getElementById('victory-total-score');
    const statsEl = document.getElementById('victory-stats');
    if (scoreEl) scoreEl.textContent = `Score total : ${stats.totalScore || 0} pts`;
    if (statsEl) statsEl.innerHTML = [
        `Documents traités : ${stats.docsTotal || 0}`,
        `Meilleur combo : ×${(stats.bestCombo || 1).toFixed(1)}`,
    ].join('<br>');
    showOverlay('victory');
}
