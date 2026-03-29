const DEFAULT_MANIFEST_URL = './assets/manifest.json';

export const REQUIRED_PRESENTATION_IMAGE_KEYS = [
    'bg_desk',
    'sprite_card_bg',
    'sprite_icon_facture',
    'sprite_icon_formulaire',
    'sprite_icon_lettre',
    'sprite_icon_recu',
    'sprite_icon_contrat',
    'sprite_icon_relance',
    'ui_btn_accept',
    'ui_btn_reject',
    'ui_btn_reporter',
    'ui_btn_pause',
    'ui_gauge_frame',
    'ui_icon_argent',
    'ui_icon_satisfaction',
    'ui_icon_legal',
    'ui_arrow_up',
    'ui_arrow_down',
    'ui_arrow_neutral',
    'ui_label_accepte',
    'ui_label_refuse',
    'ui_label_reporter',
];

let assetStore = createEmptyAssetStore();

function createEmptyAssetStore() {
    return {
        manifest: null,
        images: {},
        failures: new Set(),
        manifestConsumed: false,
    };
}

export function getAssetStore() {
    return assetStore;
}

export function getImageAsset(key) {
    return assetStore.images[key] || null;
}

export function hasImageAsset(key) {
    return Boolean(getImageAsset(key));
}

export function didImageAssetFail(key) {
    return assetStore.failures.has(key);
}

export function isImageManifestSection(sectionName) {
    return typeof sectionName === 'string' && sectionName.startsWith('images');
}

export function getManifestSectionEntries(manifest, predicate = null) {
    return Object.entries(manifest || {}).flatMap(([sectionName, entries]) => {
        if (!entries || typeof entries !== 'object' || Array.isArray(entries)) {
            return [];
        }

        if (predicate && !predicate(sectionName, entries)) {
            return [];
        }

        return Object.entries(entries).map(([key, relativePath]) => [sectionName, key, relativePath]);
    });
}

export function getManifestImageEntries(manifest) {
    return getManifestSectionEntries(manifest, (sectionName) => isImageManifestSection(sectionName))
        .map(([, key, relativePath]) => [key, relativePath]);
}

export function resolveAssetPath(relativePath) {
    return relativePath ? `assets/${relativePath}` : null;
}

export async function loadAssetManifest(manifestUrl = DEFAULT_MANIFEST_URL, fetchImpl = globalThis.fetch) {
    if (typeof fetchImpl !== 'function') {
        throw new Error('Asset manifest loading requires fetch().');
    }

    const response = await fetchImpl(manifestUrl);
    if (!response.ok) {
        throw new Error(`Failed to load asset manifest: ${response.status}`);
    }

    return response.json();
}

export async function loadAllAssets(options = {}) {
    const {
        manifestUrl = DEFAULT_MANIFEST_URL,
        manifest: providedManifest = null,
        fetchImpl = globalThis.fetch,
        imageFactory = () => new Image(),
    } = options;

    const manifest = providedManifest || await loadAssetManifest(manifestUrl, fetchImpl);
    const images = {};
    const failures = new Set();

    await Promise.all(getManifestImageEntries(manifest).map(async ([key, relativePath]) => {
        try {
            images[key] = await loadImage(resolveAssetPath(relativePath), imageFactory);
        } catch (error) {
            failures.add(key);
        }
    }));

    assetStore = {
        manifest,
        images,
        failures,
        manifestConsumed: true,
    };

    return assetStore;
}

function loadImage(src, imageFactory) {
    return new Promise((resolve, reject) => {
        const image = imageFactory();
        if (!image) {
            reject(new Error(`Unable to create image for ${src}`));
            return;
        }

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        image.src = src;
    });
}
