/**
 * D-58: the only place that produces sound. Today it uses the browser's own speech
 * synthesis; recorded files can replace it later by providing another Speaker with
 * the same four methods. Nothing here knows a course, a module or an exercise.
 */
export interface Speaker {
    /** True when this device can speak the language right now. */
    available(language: string | undefined): boolean;
    /** Starts speaking; returns false when nothing could be started. Never throws. */
    speak(text: string, language: string | undefined, slow?: boolean): boolean;
    stop(): void;
    /** The learner's own switch, remembered on this device only. */
    enabled(): boolean;
    setEnabled(on: boolean): void;
}
interface Voice { lang: string; localService?: boolean; default?: boolean }
interface Utterance { lang: string; rate: number; voice: unknown; onerror: ((event: { error?: string }) => void) | null }
export interface SpeechEnvironment {
    synth?: { getVoices(): Voice[]; speak(utterance: never): void; cancel(): void; addEventListener?: (type: string, listener: () => void) => void };
    Utterance?: new (text: string) => Utterance;
    online?: () => boolean;
    storage?: Pick<Storage, 'getItem' | 'setItem'>;
    /** Called when availability may have changed, so the screen can be drawn again. */
    changed?: () => void;
}
const preference = 'male-kroki:sluchanie';
const primary = (language: string) => language.toLowerCase().split(/[-_]/)[0];
// Not failures: one utterance replacing another, and a browser waiting for the first tap.
const quiet = ['interrupted', 'canceled', 'not-allowed'];
export const speechRate = { normal: 0.9, slow: 0.6 };

export function createSpeaker(env: SpeechEnvironment): Speaker {
    // A device that failed once stays quiet until the page is opened again.
    let failed = false, on = true;
    try { on = env.storage?.getItem(preference) !== 'off'; } catch { /* private mode: keep the default */ }
    const voiceFor = (language: string | undefined) => {
        if (!language || !env.synth || !env.Utterance) return;
        let voices: Voice[] = [];
        try { voices = env.synth.getVoices() ?? []; } catch { return; }
        const wanted = primary(language), online = env.online ? env.online() : true;
        // Offline only a voice stored on the device can speak.
        const usable = voices.filter(v => typeof v?.lang === 'string' && primary(v.lang) === wanted && (online || v.localService === true));
        return usable.find(v => v.localService) ?? usable[0];
    };
    try { env.synth?.addEventListener?.('voiceschanged', () => env.changed?.()); } catch { /* optional */ }
    const fail = () => { if (!failed) { failed = true; env.changed?.(); } };
    return {
        enabled: () => on,
        setEnabled(value) { on = value; if (value) failed = false; try { env.storage?.setItem(preference, value ? 'on' : 'off'); } catch { /* not remembered */ } if (!value) this.stop(); },
        available: language => on && !failed && !!voiceFor(language),
        speak(text, language, slow = false) {
            const voice = on && !failed ? voiceFor(language) : undefined;
            if (!voice || !text.trim()) return false;
            try {
                env.synth!.cancel();
                const utterance = new env.Utterance!(text);
                utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = slow ? speechRate.slow : speechRate.normal;
                utterance.onerror = event => { if (!quiet.includes(event?.error ?? '')) fail(); };
                env.synth!.speak(utterance as never);
                return true;
            } catch { fail(); return false; }
        },
        stop() { try { env.synth?.cancel(); } catch { /* nothing to stop */ } },
    };
}

let shared: Speaker | undefined, redraw: (() => void) | undefined;
/** The app's speaker. Outside a browser it is simply unavailable. */
export function speaker(): Speaker {
    if (shared) return shared;
    const w = typeof window === 'undefined' ? undefined : window as unknown as { speechSynthesis?: SpeechEnvironment['synth']; SpeechSynthesisUtterance?: SpeechEnvironment['Utterance']; localStorage?: Storage };
    let storage: Storage | undefined;
    try { storage = w?.localStorage; } catch { /* blocked storage */ }
    return shared = createSpeaker({ synth: w?.speechSynthesis, Utterance: w?.SpeechSynthesisUtterance, online: () => typeof navigator === 'undefined' || navigator.onLine !== false, storage, changed: () => redraw?.() });
}
export function onSpeechChange(listener: () => void) { redraw = listener; }
