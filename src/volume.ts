/**
 * Głośność wymowy i efektów: dwa niezależne poziomy 0–100%, zapamiętane tylko na tym urządzeniu.
 * Nie dotyka postępów ani przełącznika wymowy; nowa wartość działa od następnego odtworzenia.
 */
export const volumeKeys = {speech: 'male-kroki:glosnosc-wymowy', cues: 'male-kroki:glosnosc-efektow'} as const;
export const defaultVolume = {speech: 100, cues: 30} as const;
export type VolumeGroup = keyof typeof volumeKeys;

export interface VolumeSettings {
    speech(): number;
    cues(): number;
    setSpeech(percent: number): void;
    setCues(percent: number): void;
}

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

export function createVolumeSettings(storage?: Pick<Storage, 'getItem' | 'setItem'>): VolumeSettings {
    const read = (group: VolumeGroup) => {
        try {
            const raw = storage?.getItem(volumeKeys[group]);
            const value = raw === null || raw === undefined || raw.trim() === '' ? NaN : Number(raw);
            return Number.isFinite(value) && value >= 0 && value <= 100 ? Math.round(value) : defaultVolume[group];
        } catch { return defaultVolume[group]; }
    };
    const levels = {speech: read('speech'), cues: read('cues')};
    const set = (group: VolumeGroup, percent: number) => {
        levels[group] = clamp(Number.isFinite(percent) ? percent : defaultVolume[group]);
        try { storage?.setItem(volumeKeys[group], String(levels[group])); } catch { /* nie zapamiętano */ }
    };
    return {speech: () => levels.speech, cues: () => levels.cues, setSpeech: p => set('speech', p), setCues: p => set('cues', p)};
}

let shared: VolumeSettings | undefined;
/** Ustawienia głośności aplikacji; poza przeglądarką działają tylko w pamięci. */
export function volumeSettings(): VolumeSettings {
    if (shared) return shared;
    let storage: Storage | undefined;
    try { storage = typeof window === 'undefined' ? undefined : window.localStorage; } catch { /* zablokowany magazyn */ }
    return shared = createVolumeSettings(storage);
}
