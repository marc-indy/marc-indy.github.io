// src/data/document-data.js — All document definitions, rarity, events, death messages

/** @typedef {'facture'|'formulaire'|'lettre'|'recu'|'contrat'|'relance'} DocumentType */
/** @typedef {'commun'|'inhabituel'|'rare'|'legendaire'} Rarity */
/** V3: Document tag types */
export const DOCUMENT_TAGS = ['URGENT', 'VIP', 'PIÈGE', 'FRAUDULEUX', 'CLIENT FIDÈLE', 'MÉMOIRE'];

export const RARITY_COLORS = {
    commun: '#A0A0A0',
    inhabituel: '#5B9BD5',
    rare: '#7B4FBF',
    legendaire: '#FFD700',
};

export const RARITY_WEIGHTS = {
    early: { commun: 60, inhabituel: 25, rare: 12, legendaire: 3 },
    late: { commun: 30, inhabituel: 30, rare: 25, legendaire: 15 },
};

export const ICON_KEYS = {
    facture: 'sprite_icon_facture',
    formulaire: 'sprite_icon_formulaire',
    lettre: 'sprite_icon_lettre',
    recu: 'sprite_icon_recu',
    contrat: 'sprite_icon_contrat',
    relance: 'sprite_icon_relance',
};

export const DEATH_MESSAGES = {
    argent_0: [
        'Faillite totale — vos stagiaires ont mangé tout le budget cantine.',
        'Plus un centime… même la machine à café refuse vos pièces.',
        'Le compte en banque affiche un emoji triste. C\'est mauvais signe.',
        'Banqueroute ! Le chat du bureau est le seul actif restant.',
    ],
    argent_100: [
        'Trop d\'argent ! L\'URSSAF débarque avec des menottes dorées.',
        'Votre coffre-fort a explosé. Littéralement.',
        'Excès de trésorerie suspecte — les gendarmes arrivent.',
        'Le fisc vous félicite… ironiquement.',
    ],
    satisfaction_0: [
        'Plus aucun client… même votre mère est partie chez le concurrent.',
        'Les clients ont formé un syndicat anti-vous.',
        'Satisfaction à zéro. Google Reviews : ★☆☆☆☆ (0.3/5).',
        'Le dernier client est parti en claquant la porte. Puis est revenu la claquer une deuxième fois.',
    ],
    satisfaction_100: [
        'Clients trop heureux ! Ils campent devant votre bureau. Littéralement.',
        'Satisfaction maximale — vous ne pouvez plus fermer boutique.',
        'Les clients vous offrent des cadeaux. L\'URSSAF a des questions.',
        'Trop aimé ! Les clients veulent que vous deveniez maire.',
    ],
    conformite_0: [
        'CONTRÔLE URSSAF IMMÉDIAT. Votre marge de conformité est à sec.',
        'L\'URSSAF débarque. Vos dossiers sentent la combine à plein nez.',
        'Conformité à zéro. Le redressement part déjà à l\'impression.',
        'Vous avez vidé la jauge de conformité. Le contrôle fiscal est sur le parking.',
    ],
    conformite_100: [
        'CONTRÔLE FISCAL IMMÉDIAT. L\'inspecteur est déjà dans votre bureau.',
        'L\'URSSAF a doublé ses effectifs rien que pour votre dossier.',
        'Suspicion maximale ! Votre chat a été interrogé comme témoin.',
        'L\'inspecteur des impôts est devenu votre voisin. Par hasard, bien sûr.',
    ],
};

DEATH_MESSAGES.legal_0 = DEATH_MESSAGES.conformite_0;
DEATH_MESSAGES.legal_100 = DEATH_MESSAGES.conformite_100;

export const DECISION_ACTION_KEYS = ['accept', 'reject'];

export const DECISION_ACTION_LABELS = {
    accept: 'Accepter',
    reject: 'Refuser',
    timeout: 'Timeout',
};

function roundEffect(value) {
    return Math.round(value);
}

function computeLegacySeverity(doc) {
    return Math.max(
        6,
        Math.round(
            (
                Math.abs(doc.onAccept?.argent || 0) +
                Math.abs(doc.onAccept?.satisfaction || 0) +
                Math.abs(doc.onAccept?.conformite ?? doc.onAccept?.legal ?? 0) +
                Math.abs(doc.onReject?.argent || 0) +
                Math.abs(doc.onReject?.satisfaction || 0) +
                Math.abs(doc.onReject?.conformite ?? doc.onReject?.legal ?? 0)
            ) / 6,
        ),
    );
}

export function createDecisionActions(doc) {
    const acceptConformite = doc.onAccept.conformite ?? doc.onAccept.legal ?? 0;
    const rejectConformite = doc.onReject.conformite ?? doc.onReject.legal ?? 0;
    const acceptScore = (doc.onAccept.argent || 0) * 0.55 + (doc.onAccept.satisfaction || 0) * 0.8 - acceptConformite * 1.15;
    const rejectScore = (doc.onReject.argent || 0) * 0.55 + (doc.onReject.satisfaction || 0) * 0.8 - rejectConformite * 1.15;
    const acceptGaugeEffects = { argent: doc.onAccept.argent || 0, satisfaction: doc.onAccept.satisfaction || 0, conformite: acceptConformite };
    const rejectGaugeEffects = { argent: doc.onReject.argent || 0, satisfaction: doc.onReject.satisfaction || 0, conformite: rejectConformite };

    if (acceptScore === rejectScore) {
        return {
            accept: {
                actionKey: 'accept',
                label: DECISION_ACTION_LABELS.accept,
                gaugeEffects: acceptGaugeEffects,
                quality: 'good',
            },
            reject: {
                actionKey: 'reject',
                label: DECISION_ACTION_LABELS.reject,
                gaugeEffects: rejectGaugeEffects,
                quality: 'risky',
            },
        };
    }

    const acceptIsBetter = acceptScore > rejectScore;
    return {
        accept: {
            actionKey: 'accept',
            label: DECISION_ACTION_LABELS.accept,
            gaugeEffects: acceptGaugeEffects,
            quality: acceptIsBetter ? 'good' : 'bad',
        },
        reject: {
            actionKey: 'reject',
            label: DECISION_ACTION_LABELS.reject,
            gaugeEffects: rejectGaugeEffects,
            quality: acceptIsBetter ? 'bad' : 'good',
        },
    };
}

export function createTimeoutOutcome(doc) {
    const severity = computeLegacySeverity(doc);

    return {
        actionKey: 'timeout',
        label: DECISION_ACTION_LABELS.timeout,
        quality: 'bad',
        gaugeEffects: {
            argent: roundEffect((doc.onReject.argent || 0) * 0.6 - 1),
            satisfaction: roundEffect((doc.onReject.satisfaction || 0) * 1.2 - 4),
            conformite: roundEffect(((doc.onReject.conformite ?? doc.onReject.legal) || 0) * 1.1 + Math.max(4, Math.round(severity / 3))),
        },
    };
}

/**
 * 40+ document definitions. Each has: id, type, rarity, title, body, onAccept, onReject, hiddenPreview.
 * iconKey and headerColor are derived at runtime from type and rarity.
 */
export const DOCUMENTS = [
    // ========== COMMUN (factures, reçus simples) ==========
    { id: 'doc_facture_001', type: 'facture', rarity: 'commun', title: 'Facture fournitures', body: 'Stylos, papier, agrafeuse. Le strict minimum.', onAccept: { argent: -5, satisfaction: 0, conformite: -2 }, onReject: { argent: 0, satisfaction: -3, conformite: 2 } },
    { id: 'doc_facture_002', type: 'facture', rarity: 'commun', title: 'Facture électricité', body: 'EDF réclame son dû. Comme chaque mois.', onAccept: { argent: -8, satisfaction: 0, conformite: -3 }, onReject: { argent: 0, satisfaction: 0, conformite: 5 } },
    { id: 'doc_recu_001', type: 'recu', rarity: 'commun', title: 'Reçu déjeuner client', body: 'Un menu à 12,50€. Sobre et professionnel.', onAccept: { argent: -3, satisfaction: 5, conformite: 0 }, onReject: { argent: 0, satisfaction: -2, conformite: 0 } },
    { id: 'doc_recu_002', type: 'recu', rarity: 'commun', title: 'Reçu taxi', body: 'Course Gare de Lyon → Bureau. 15€.', onAccept: { argent: -5, satisfaction: 0, conformite: 0 }, onReject: { argent: 0, satisfaction: 0, conformite: 2 } },
    { id: 'doc_lettre_001', type: 'lettre', rarity: 'commun', title: 'Lettre de remerciement', body: 'M. Dupont vous remercie pour votre travail.', onAccept: { argent: 0, satisfaction: 5, conformite: 0 }, onReject: { argent: 0, satisfaction: -5, conformite: 0 } },
    { id: 'doc_formulaire_001', type: 'formulaire', rarity: 'commun', title: 'Formulaire TVA mensuel', body: 'La déclaration TVA du mois. Routine.', onAccept: { argent: -5, satisfaction: 0, conformite: -5 }, onReject: { argent: 5, satisfaction: 0, conformite: 8 } },
    { id: 'doc_facture_003', type: 'facture', rarity: 'commun', title: 'Facture imprimante', body: 'L\'imprimante est en panne. Encore.', onAccept: { argent: -6, satisfaction: 2, conformite: 0 }, onReject: { argent: 0, satisfaction: -3, conformite: 0 } },
    { id: 'doc_recu_003', type: 'recu', rarity: 'commun', title: 'Reçu café bureau', body: 'Capsules Nespresso pour la machine du bureau.', onAccept: { argent: -3, satisfaction: 3, conformite: 0 }, onReject: { argent: 0, satisfaction: -4, conformite: 0 } },
    { id: 'doc_lettre_002', type: 'lettre', rarity: 'commun', title: 'Courrier administratif', body: 'Votre abonnement postal est à renouveler.', onAccept: { argent: -4, satisfaction: 0, conformite: -2 }, onReject: { argent: 0, satisfaction: -2, conformite: 3 } },
    { id: 'doc_facture_004', type: 'facture', rarity: 'commun', title: 'Facture ménage', body: 'Le service de nettoyage du bureau. Indispensable.', onAccept: { argent: -5, satisfaction: 2, conformite: -1 }, onReject: { argent: 0, satisfaction: -3, conformite: 1 } },
    { id: 'doc_facture_011', type: 'facture', rarity: 'commun', title: 'Facture photocopies', body: '2 500 photocopies ce mois-ci. Vous battez des records.', onAccept: { argent: -4, satisfaction: 1, conformite: -1 }, onReject: { argent: 0, satisfaction: -2, conformite: 1 } },
    { id: 'doc_recu_007', type: 'recu', rarity: 'commun', title: 'Reçu parking', body: 'Parking centre-ville, 3h. Le client était en retard.', onAccept: { argent: -3, satisfaction: 2, conformite: 0 }, onReject: { argent: 0, satisfaction: -1, conformite: 1 } },
    { id: 'doc_formulaire_008', type: 'formulaire', rarity: 'commun', title: 'Formulaire congés payés', body: 'Demande de congés de Mme Martin.\nDu 15 au 22 juillet. Classique.', onAccept: { argent: -3, satisfaction: 4, conformite: -2 }, onReject: { argent: 0, satisfaction: -5, conformite: 2 } },
    { id: 'doc_lettre_008', type: 'lettre', rarity: 'commun', title: 'Prospection commerciale', body: 'Une entreprise propose des stylos personnalisés.\n"Offre limitée !"', onAccept: { argent: -4, satisfaction: 1, conformite: 0 }, onReject: { argent: 0, satisfaction: 0, conformite: 0 } },
    { id: 'doc_facture_012', type: 'facture', rarity: 'commun', title: 'Facture abonnement téléphone', body: 'Forfait pro illimité. 39,99€/mois. RAS.', onAccept: { argent: -5, satisfaction: 1, conformite: -1 }, onReject: { argent: 0, satisfaction: -2, conformite: 2 } },
    { id: 'doc_recu_008', type: 'recu', rarity: 'commun', title: 'Reçu timbre fiscal', body: 'Timbre fiscal à 25€ pour une formalité administrative.', onAccept: { argent: -4, satisfaction: 0, conformite: -3 }, onReject: { argent: 0, satisfaction: 0, conformite: 3 } },
    { id: 'doc_contrat_007', type: 'contrat', rarity: 'commun', title: 'Contrat maintenance ascenseur', body: 'Vérification annuelle de l\'ascenseur. Obligatoire.', onAccept: { argent: -6, satisfaction: 1, conformite: -3 }, onReject: { argent: 0, satisfaction: -1, conformite: 4 } },
    { id: 'doc_relance_005', type: 'relance', rarity: 'commun', title: 'Relance cotisation retraite', body: 'La caisse de retraite rappelle la date limite de paiement.', onAccept: { argent: -5, satisfaction: 0, conformite: -4 }, onReject: { argent: 0, satisfaction: 0, conformite: 5 } },
    { id: 'doc_facture_013', type: 'facture', rarity: 'commun', title: 'Facture eau et assainissement', body: 'Consommation d\'eau du trimestre. Rien d\'inhabituel.', onAccept: { argent: -4, satisfaction: 0, conformite: -2 }, onReject: { argent: 0, satisfaction: -1, conformite: 3 } },
    { id: 'doc_formulaire_009', type: 'formulaire', rarity: 'commun', title: 'Changement d\'adresse', body: 'L\'entreprise déménage ? Non, juste une erreur de code postal.', onAccept: { argent: -2, satisfaction: 0, conformite: -3 }, onReject: { argent: 0, satisfaction: -1, conformite: 2 } },

    // ========== INHABITUEL (situations plus complexes) ==========
    { id: 'doc_facture_005', type: 'facture', rarity: 'inhabituel', title: 'Facture séminaire', body: 'Séminaire "synergies et paradigmes" à 2000€. Utile ?', onAccept: { argent: -12, satisfaction: 8, conformite: -2 }, onReject: { argent: 0, satisfaction: -5, conformite: 0 } },
    { id: 'doc_contrat_001', type: 'contrat', rarity: 'inhabituel', title: 'Contrat freelance', body: 'Un développeur freelance propose ses services. Tarif élevé.', onAccept: { argent: -10, satisfaction: 5, conformite: -5 }, onReject: { argent: 0, satisfaction: -8, conformite: 3 } },
    { id: 'doc_relance_001', type: 'relance', rarity: 'inhabituel', title: 'Relance client impayé', body: 'Mme. Lefèvre n\'a toujours pas payé sa facture de mars.', onAccept: { argent: 10, satisfaction: -8, conformite: 0 }, onReject: { argent: -5, satisfaction: 3, conformite: 0 } },
    { id: 'doc_formulaire_002', type: 'formulaire', rarity: 'inhabituel', title: 'Formulaire URSSAF', body: 'Déclaration trimestrielle des cotisations sociales.', onAccept: { argent: -8, satisfaction: 0, conformite: -10 }, onReject: { argent: 5, satisfaction: 0, conformite: 12 } },
    { id: 'doc_lettre_003', type: 'lettre', rarity: 'inhabituel', title: 'Plainte client', body: 'Un client se plaint des délais. "Inacceptable !"', onAccept: { argent: -5, satisfaction: 10, conformite: 0 }, onReject: { argent: 0, satisfaction: -12, conformite: 5 } },
    { id: 'doc_facture_006', type: 'facture', rarity: 'inhabituel', title: 'Facture logiciel', body: 'Licence annuelle du logiciel comptable. 500€.', onAccept: { argent: -10, satisfaction: 3, conformite: -5 }, onReject: { argent: 0, satisfaction: -3, conformite: 5 } },
    { id: 'doc_contrat_002', type: 'contrat', rarity: 'inhabituel', title: 'Contrat assurance', body: 'Assurance responsabilité civile professionnelle.', onAccept: { argent: -8, satisfaction: 0, conformite: -8 }, onReject: { argent: 0, satisfaction: 0, conformite: 10 } },
    { id: 'doc_relance_002', type: 'relance', rarity: 'inhabituel', title: 'Relance fournisseur', body: 'Le fournisseur menace de couper le service.', onAccept: { argent: -10, satisfaction: 0, conformite: -3 }, onReject: { argent: 0, satisfaction: -5, conformite: 5 } },
    { id: 'doc_recu_004', type: 'recu', rarity: 'inhabituel', title: 'Reçu restaurant client', body: 'Dîner "networking" à 85€. Avec champagne.', onAccept: { argent: -10, satisfaction: 8, conformite: 5 }, onReject: { argent: 0, satisfaction: -5, conformite: 0 } },
    { id: 'doc_formulaire_003', type: 'formulaire', rarity: 'inhabituel', title: 'Formulaire CFE', body: 'Cotisation Foncière des Entreprises. Passionnant.', onAccept: { argent: -8, satisfaction: 0, conformite: -8 }, onReject: { argent: 3, satisfaction: 0, conformite: 10 } },
    { id: 'doc_contrat_008', type: 'contrat', rarity: 'inhabituel', title: 'Contrat influenceur', body: 'Un influenceur TikTok pour la "marque employeur".\n3 Reels et 1 Story pour 5 000€.', onAccept: { argent: -12, satisfaction: 10, conformite: -3 }, onReject: { argent: 0, satisfaction: -5, conformite: 0 } },
    { id: 'doc_formulaire_010', type: 'formulaire', rarity: 'inhabituel', title: 'Accident du travail', body: 'Le stagiaire s\'est agrafé le doigt.\nAvec l\'agrafeuse industrielle.', onAccept: { argent: -8, satisfaction: -3, conformite: -8 }, onReject: { argent: 0, satisfaction: -5, conformite: 10 } },
    { id: 'doc_facture_014', type: 'facture', rarity: 'inhabituel', title: 'Facture pétanque', body: 'Team building "pétanque et pastis" dans le parking.\nFacture : location terrain + apéro.', onAccept: { argent: -8, satisfaction: 10, conformite: 3 }, onReject: { argent: 0, satisfaction: -6, conformite: 0 } },
    { id: 'doc_lettre_009', type: 'lettre', rarity: 'inhabituel', title: 'Remboursement en Bitcoin', body: 'M. Crypto_Michel_42 exige un remboursement.\nEn Bitcoin. Uniquement.', onAccept: { argent: -6, satisfaction: 8, conformite: 8 }, onReject: { argent: 0, satisfaction: -10, conformite: -2 } },
    { id: 'doc_recu_009', type: 'recu', rarity: 'inhabituel', title: 'Reçu hôtel Monaco', body: 'Suite au Fairmont Monte-Carlo. "Conférence fiscale."\nMinibar : 340€.', onAccept: { argent: -12, satisfaction: 5, conformite: 8 }, onReject: { argent: 0, satisfaction: -3, conformite: -2 } },
    { id: 'doc_relance_006', type: 'relance', rarity: 'inhabituel', title: 'Amis du Chat de Bureau', body: 'L\'association réclame la cotisation annuelle.\nLe chat, lui, réclame des croquettes premium.', onAccept: { argent: -5, satisfaction: 8, conformite: 0 }, onReject: { argent: 0, satisfaction: -8, conformite: 0 } },
    { id: 'doc_facture_015', type: 'facture', rarity: 'inhabituel', title: 'Formation management', body: '"Management bienveillant et leadership positif."\n3 jours à Biarritz. Avec surf inclus.', onAccept: { argent: -12, satisfaction: 8, conformite: -2 }, onReject: { argent: 0, satisfaction: -5, conformite: 0 } },
    { id: 'doc_contrat_009', type: 'contrat', rarity: 'inhabituel', title: 'Voyance fiscale', body: 'Un médium propose de "lire l\'avenir de votre bilan".\nGarantie satisfait ou remboursé (en karma).', onAccept: { argent: -8, satisfaction: 5, conformite: 8 }, onReject: { argent: 0, satisfaction: -3, conformite: -2 } },
    { id: 'doc_formulaire_011', type: 'formulaire', rarity: 'inhabituel', title: 'Subvention pot de départ', body: 'Demande de subvention pour le pot de départ de Jean-Claude.\nBudget prévu : 800€ de charcuterie.', onAccept: { argent: -8, satisfaction: 10, conformite: 3 }, onReject: { argent: 0, satisfaction: -10, conformite: 0 } },
    { id: 'doc_relance_007', type: 'relance', rarity: 'inhabituel', title: 'Plante verte du bureau', body: 'Le fleuriste réclame 6 mois d\'impayés.\nLa plante est morte depuis 5 mois.', onAccept: { argent: -6, satisfaction: 3, conformite: -3 }, onReject: { argent: 0, satisfaction: -3, conformite: 5 } },

    // ========== RARE (situations absurdes/risquées) ==========
    { id: 'doc_facture_007', type: 'facture', rarity: 'rare', title: 'Facture "team building"', body: 'Facture de 5 000€ pour "team building".\nC\'était un escape game à Ibiza.', onAccept: { argent: -18, satisfaction: 15, conformite: 10 }, onReject: { argent: 0, satisfaction: -10, conformite: -3 } },
    { id: 'doc_lettre_004', type: 'lettre', rarity: 'rare', title: 'Lettre anonyme', body: 'Quelqu\'un a glissé "JE SAIS TOUT" sous la porte.', onAccept: { argent: 0, satisfaction: -5, conformite: 15 }, onReject: { argent: 0, satisfaction: 0, conformite: -5 } },
    { id: 'doc_contrat_003', type: 'contrat', rarity: 'rare', title: 'Contrat douteux', body: 'SARL Tartempion propose un "partenariat fiscal optimisé".', onAccept: { argent: 15, satisfaction: 0, conformite: 18 }, onReject: { argent: -5, satisfaction: -5, conformite: -5 } },
    { id: 'doc_formulaire_004', type: 'formulaire', rarity: 'rare', title: 'Redressement fiscal', body: 'L\'URSSAF demande des justificatifs pour 2019.', onAccept: { argent: -15, satisfaction: 0, conformite: -15 }, onReject: { argent: 0, satisfaction: 0, conformite: 20 } },
    { id: 'doc_relance_003', type: 'relance', rarity: 'rare', title: 'Relance huissier', body: 'Un huissier relaie la créance de la SARL Dupont.', onAccept: { argent: -15, satisfaction: -5, conformite: -12 }, onReject: { argent: 0, satisfaction: -10, conformite: 15 } },
    { id: 'doc_recu_005', type: 'recu', rarity: 'rare', title: 'Note de frais suspecte', body: 'Le stagiaire a dépensé 3 000€ en "documentation technique".\nC\'étaient des mangas.', onAccept: { argent: -15, satisfaction: 5, conformite: 12 }, onReject: { argent: 0, satisfaction: -8, conformite: -3 } },
    { id: 'doc_lettre_005', type: 'lettre', rarity: 'rare', title: 'Déduction Netflix', body: 'Vous essayez de déduire votre abonnement Netflix\ncomme "formation professionnelle".', onAccept: { argent: -5, satisfaction: 12, conformite: 15 }, onReject: { argent: 0, satisfaction: -12, conformite: -5 } },
    { id: 'doc_facture_008', type: 'facture', rarity: 'rare', title: 'Facture consulting', body: 'Un consultant propose de "disrupter votre bilan"\npour seulement 10 000€.', onAccept: { argent: -18, satisfaction: 5, conformite: -8 }, onReject: { argent: 0, satisfaction: -8, conformite: 5 } },
    { id: 'doc_contrat_004', type: 'contrat', rarity: 'rare', title: 'Contrat international', body: 'Export de services aux Îles Caïmans.\nTout à fait normal.', onAccept: { argent: 18, satisfaction: 5, conformite: 20 }, onReject: { argent: -8, satisfaction: -5, conformite: -8 } },
    { id: 'doc_formulaire_005', type: 'formulaire', rarity: 'rare', title: 'Formulaire 47-B bis', body: 'Personne ne sait ce que c\'est.\nMême l\'administration.', onAccept: { argent: -5, satisfaction: -5, conformite: -12 }, onReject: { argent: 0, satisfaction: -5, conformite: 15 } },
    { id: 'doc_recu_010', type: 'recu', rarity: 'rare', title: 'Frais de représentation', body: '"Frais de représentation" : 8 000€.\nC\'était une course de karting avec le directeur.', onAccept: { argent: -18, satisfaction: 12, conformite: 15 }, onReject: { argent: 0, satisfaction: -8, conformite: -5 } },
    { id: 'doc_lettre_010', type: 'lettre', rarity: 'rare', title: 'Menace client VIP', body: '"Je connais le Président de la République !\nVotre boîte n\'existera plus demain."', onAccept: { argent: -5, satisfaction: 12, conformite: 5 }, onReject: { argent: 0, satisfaction: -15, conformite: -3 } },
    { id: 'doc_contrat_010', type: 'contrat', rarity: 'rare', title: 'Startup en tokens', body: 'La startup BlockChain-Compta propose de payer en\n"ComptaCoins". Cours actuel : 0,003€.', onAccept: { argent: 15, satisfaction: 5, conformite: 18 }, onReject: { argent: -5, satisfaction: -8, conformite: -3 } },
    { id: 'doc_formulaire_012', type: 'formulaire', rarity: 'rare', title: 'Rectification inversée', body: 'Le stagiaire a déclaré tous les débits en crédits.\nEt inversement. Depuis janvier.', onAccept: { argent: -12, satisfaction: -5, conformite: -15 }, onReject: { argent: 0, satisfaction: -8, conformite: 18 } },
    { id: 'doc_facture_016', type: 'facture', rarity: 'rare', title: 'Détective privé', body: 'Facture de surveillance discrète d\'un fournisseur.\n"Sujet photographié en train de manger un kebab."', onAccept: { argent: -15, satisfaction: 5, conformite: 12 }, onReject: { argent: 0, satisfaction: -5, conformite: -5 } },
    { id: 'doc_relance_008', type: 'relance', rarity: 'rare', title: 'Relance Pizza Express', body: 'La pizzeria du coin est référencée comme "fournisseur".\n47 factures en attente. Exclusivement des 4 fromages.', onAccept: { argent: -12, satisfaction: 8, conformite: 10 }, onReject: { argent: 0, satisfaction: -10, conformite: -3 } },
    { id: 'doc_lettre_011', type: 'lettre', rarity: 'rare', title: 'Alliance secrète', body: 'Un concurrent propose une "alliance stratégique".\nRendez-vous dans un parking souterrain. À minuit.', onAccept: { argent: 12, satisfaction: 0, conformite: 18 }, onReject: { argent: -5, satisfaction: -5, conformite: -8 } },
    { id: 'doc_recu_011', type: 'recu', rarity: 'rare', title: 'Séminaire bien-être', body: 'Spa, massage et yoga "séminaire dirigeant".\nReçu : 4 500€ TTC. Avec supplément jacuzzi.', onAccept: { argent: -18, satisfaction: 12, conformite: 12 }, onReject: { argent: 0, satisfaction: -8, conformite: -3 } },
    { id: 'doc_contrat_011', type: 'contrat', rarity: 'rare', title: 'Bureau-péniche', body: 'Location de bureaux… sur une péniche.\nAmarre : Port de l\'Arsenal. Loyer : "ça dépend des marées".', onAccept: { argent: -15, satisfaction: 10, conformite: 12 }, onReject: { argent: 0, satisfaction: -5, conformite: -5 } },
    { id: 'doc_facture_017', type: 'facture', rarity: 'rare', title: '12 000€ de post-its', body: 'Le stagiaire a commandé 12 000€ de post-its.\nIl a confondu "unité" et "palette".', onAccept: { argent: -18, satisfaction: -5, conformite: 5 }, onReject: { argent: 0, satisfaction: -3, conformite: -3 } },

    // ========== LÉGENDAIRE (situations extrêmes) ==========
    { id: 'doc_facture_009', type: 'facture', rarity: 'legendaire', title: 'Facture 47 000€', body: 'Facture de 47 000€ pour "team building".\nC\'était un voyage à Ibiza. Avec le stagiaire.', onAccept: { argent: -25, satisfaction: 20, conformite: 15 }, onReject: { argent: 0, satisfaction: -15, conformite: -5 } },
    { id: 'doc_contrat_005', type: 'contrat', rarity: 'legendaire', title: 'Chat collaborateur', body: 'Un client insiste que son chat est\nun "collaborateur indépendant".', onAccept: { argent: -5, satisfaction: 20, conformite: 25 }, onReject: { argent: 0, satisfaction: -20, conformite: -10 } },
    { id: 'doc_lettre_006', type: 'lettre', rarity: 'legendaire', title: 'TVA au mauvais pays', body: 'Le stagiaire a envoyé la déclaration TVA…\nau Liechtenstein. Par erreur.', onAccept: { argent: -15, satisfaction: -10, conformite: 25 }, onReject: { argent: -5, satisfaction: -5, conformite: -15 } },
    { id: 'doc_formulaire_006', type: 'formulaire', rarity: 'legendaire', title: 'Amnistie fiscale', body: 'L\'État propose une amnistie fiscale exceptionnelle.\nTrop beau pour être vrai ?', onAccept: { argent: 20, satisfaction: 10, conformite: -25 }, onReject: { argent: -10, satisfaction: -10, conformite: 15 } },
    { id: 'doc_relance_004', type: 'relance', rarity: 'legendaire', title: 'Relance présidentielle', body: 'L\'Élysée réclame un audit complet de vos comptes.\nUrgent et confidentiel.', onAccept: { argent: -20, satisfaction: 0, conformite: -20 }, onReject: { argent: 0, satisfaction: 0, conformite: 30 } },
    { id: 'doc_recu_006', type: 'recu', rarity: 'legendaire', title: 'Reçu du futur', body: 'Un reçu daté de 2035.\nLe stagiaire jure qu\'il l\'a "trouvé".', onAccept: { argent: -10, satisfaction: 15, conformite: 20 }, onReject: { argent: -5, satisfaction: -15, conformite: -10 } },
    { id: 'doc_facture_010', type: 'facture', rarity: 'legendaire', title: 'Facture licorne', body: 'Achat d\'une licorne pour le bureau.\n"Pour le moral des troupes."', onAccept: { argent: -30, satisfaction: 25, conformite: 10 }, onReject: { argent: 0, satisfaction: -20, conformite: 0 } },
    { id: 'doc_contrat_006', type: 'contrat', rarity: 'legendaire', title: 'Fusion surprise', body: 'Une multinationale veut racheter votre boîte.\nPour 1 euro symbolique.', onAccept: { argent: 25, satisfaction: -15, conformite: 20 }, onReject: { argent: -15, satisfaction: 15, conformite: -10 } },
    { id: 'doc_lettre_007', type: 'lettre', rarity: 'legendaire', title: 'Confession du stagiaire', body: 'Le stagiaire avoue avoir classé toutes les factures\ndans la poubelle. Depuis janvier.', onAccept: { argent: -10, satisfaction: -10, conformite: 25 }, onReject: { argent: -5, satisfaction: -15, conformite: -15 } },
    { id: 'doc_formulaire_007', type: 'formulaire', rarity: 'legendaire', title: 'Formulaire Kafka', body: 'Formulaire A-12-Z. Référence : voir formulaire B-12-Z.\nB-12-Z référence : voir A-12-Z.', onAccept: { argent: -10, satisfaction: -5, conformite: -15 }, onReject: { argent: -5, satisfaction: -5, conformite: 20 } },
    { id: 'doc_formulaire_013', type: 'formulaire', rarity: 'legendaire', title: 'Dédoublement d\'entreprise', body: 'Formulaire DDE-77 : "Dédoublement d\'Entité Morale".\nÇa n\'existe pas. Mais ça a l\'air très officiel.', onAccept: { argent: -15, satisfaction: -5, conformite: -20 }, onReject: { argent: -5, satisfaction: -5, conformite: 15 } },
    { id: 'doc_lettre_012', type: 'lettre', rarity: 'legendaire', title: 'Prince nigérian investisseur', body: 'Un prince nigérian veut "investir 12 millions dans votre entreprise".\nIl a juste besoin de votre RIB. Par amitié.', onAccept: { argent: 25, satisfaction: 5, conformite: 30 }, onReject: { argent: 0, satisfaction: -5, conformite: -5 } },
    { id: 'doc_contrat_012', type: 'contrat', rarity: 'legendaire', title: 'Sponsoring cirque de Noël', body: 'Le Cirque Pinder propose un "partenariat festif".\nUn éléphant dans le hall d\'accueil le 24 décembre.', onAccept: { argent: -25, satisfaction: 25, conformite: 10 }, onReject: { argent: 0, satisfaction: -15, conformite: -5 } },
    { id: 'doc_recu_012', type: 'recu', rarity: 'legendaire', title: 'Paris-Tokyo express', body: 'Vol Paris → Tokyo → Paris en 48h.\nPour un rendez-vous de 20 minutes. Business class.', onAccept: { argent: -30, satisfaction: 10, conformite: 15 }, onReject: { argent: 0, satisfaction: -12, conformite: -8 } },
    { id: 'doc_facture_018', type: 'facture', rarity: 'legendaire', title: 'Clown professionnel', body: '"Animation réunion budget annuel" — clown + confettis.\nFacture : 3 500€. Le DAF n\'a pas ri.', onAccept: { argent: -20, satisfaction: 20, conformite: 8 }, onReject: { argent: 0, satisfaction: -15, conformite: -3 } },
    { id: 'doc_relance_009', type: 'relance', rarity: 'legendaire', title: 'Impôts : dossier perdu', body: '"Nous avons égaré l\'intégralité de votre dossier.\nMerci de tout refaire. Cordialement, le fisc."', onAccept: { argent: -20, satisfaction: -10, conformite: -25 }, onReject: { argent: 0, satisfaction: -5, conformite: 30 } },
    { id: 'doc_lettre_013', type: 'lettre', rarity: 'legendaire', title: 'La menace du hamster', body: '"Cessez immédiatement vos activités comptables\nou le hamster parlera." Signé : Anonyme.', onAccept: { argent: -5, satisfaction: -10, conformite: 20 }, onReject: { argent: 0, satisfaction: 5, conformite: -10 } },
    { id: 'doc_contrat_013', type: 'contrat', rarity: 'legendaire', title: 'Consultant énergie cosmique', body: 'Un "expert en alignement quantique" propose de\n"réharmoniser votre bilan avec les astres". 15 000€.', onAccept: { argent: -25, satisfaction: 15, conformite: 20 }, onReject: { argent: 0, satisfaction: -10, conformite: -5 } },
    { id: 'doc_formulaire_014', type: 'formulaire', rarity: 'legendaire', title: 'Formulaire Z-99', body: '"Ce formulaire n\'existe pas officiellement.\nRemplissez-le quand même. Signez en bleu."', onAccept: { argent: -10, satisfaction: -5, conformite: -20 }, onReject: { argent: -5, satisfaction: -5, conformite: 15 } },
    { id: 'doc_recu_013', type: 'recu', rarity: 'legendaire', title: 'Flipper vintage 50 000€', body: 'Reçu de 50 000€ : "Fournitures de bureau."\nC\'est un flipper Bally 1978 en parfait état.', onAccept: { argent: -30, satisfaction: 25, conformite: 20 }, onReject: { argent: 0, satisfaction: -15, conformite: -10 } },
];

// === V3 — Tag computation ===

/**
 * Compute tags for a document based on its properties and effects.
 * @param {Object} doc — a document definition from DOCUMENTS
 * @returns {string[]} — array of tag strings from DOCUMENT_TAGS
 */
export function computeTags(doc) {
    const tags = [];

    // URGENT: accept and reject both have time-sensitive effects (large conformite impact)
    if (doc.urgent || (Math.abs(doc.onAccept?.conformite ?? doc.onAccept?.legal ?? 0) >= 10 && Math.abs(doc.onReject?.conformite ?? doc.onReject?.legal ?? 0) >= 8)) {
        tags.push('URGENT');
    }

    // VIP: marked explicitly (S4 mechanic)
    if (doc.vip) {
        tags.push('VIP');
    }

    // PIÈGE: both accept and reject are significantly negative in at least one gauge
    const acceptBad = (doc.onAccept?.argent || 0) < -5 && (doc.onAccept?.conformite ?? doc.onAccept?.legal ?? 0) > 5;
    const rejectBad = (doc.onReject?.argent || 0) < -5 || (doc.onReject?.satisfaction || 0) < -5;
    if (acceptBad && rejectBad) {
        tags.push('PIÈGE');
    }

    // FRAUDULEUX: marked explicitly or accept has very high conformite risk
    if (doc.fraudulent || (doc.onAccept?.conformite ?? doc.onAccept?.legal ?? 0) >= 20) {
        tags.push('FRAUDULEUX');
    }

    // CLIENT FIDÈLE: marked explicitly
    if (doc.loyalClient) {
        tags.push('CLIENT FIDÈLE');
    }

    return tags;
}
