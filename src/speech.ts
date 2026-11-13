/**
 * Shared speech interface: recordings first, then browser synthesis, then ordinary tasks.
 * Playback never reads or writes learning progress.
 */
import {createRecordedSpeaker,type RecordedSpeaker} from './speech/recorded-speaker.ts';
import {recordingCatalog} from './speech/recordings.ts';
import {speakingRate,type SpeechKind} from './speech/tempo.ts';
export interface Speaker {
    /** True when this device can speak the language right now. */
    available(language: string | undefined,text?:string): boolean;
    /** Starts speaking; returns false when nothing could be started. Never throws. */
    speak(text: string, language: string | undefined, slow?: boolean,kind?:SpeechKind): boolean;
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
export const speechRate = {normal:speakingRate(),slow:speakingRate(true)};

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
        speak(text, language, slow = false,kind='word') {
            const voice = on && !failed ? voiceFor(language) : undefined;
            if (!voice || !text.trim()) return false;
            try {
                env.synth!.cancel();
                const utterance = new env.Utterance!(text);
                utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = speakingRate(slow,kind);
                utterance.onerror = event => { if (!quiet.includes(event?.error ?? '')) fail(); };
                env.synth!.speak(utterance as never);
                return true;
            } catch { fail(); return false; }
        },
        stop() { try { env.synth?.cancel(); } catch { /* nothing to stop */ } },
    };
}

let shared: RecordedSpeaker | undefined, redraw: (() => void) | undefined;
/** The app's speaker. Outside a browser it is simply unavailable. */
export function speaker(): Speaker {
    if (shared) return shared;
    const w = typeof window === 'undefined' ? undefined : window as unknown as { speechSynthesis?: SpeechEnvironment['synth']; SpeechSynthesisUtterance?: SpeechEnvironment['Utterance']; localStorage?: Storage };
    let storage: Storage | undefined;
    try { storage = w?.localStorage; } catch { /* blocked storage */ }
    const fallback=createSpeaker({ synth: w?.speechSynthesis, Utterance: w?.SpeechSynthesisUtterance, online: () => typeof navigator === 'undefined' || navigator.onLine !== false, storage, changed: () => redraw?.() });
    return shared=createRecordedSpeaker({fallback,changed:()=>redraw?.(),supported:()=>{try{return typeof Audio!=='undefined'&&!!new Audio().canPlayType('audio/ogg; codecs="opus"');}catch{return false;}},createAudio:url=>new Audio(url),url:file=>new URL(`audio/${file}`,document.baseURI).href});
}
export function onSpeechChange(listener: () => void) { redraw = listener; }
/** Missing/old indexes fall back silently. Startup waits at most three seconds for the small catalog. */
export async function initializeRecordings(){
 if(typeof window==='undefined')return;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),3000);
 try{const response=await fetch(new URL('audio/catalog.json',document.baseURI),{cache:'no-cache',signal:controller.signal});if(!response.ok)throw Error('Brak indeksu nagrań.');speaker();shared!.setCatalog(recordingCatalog(await response.json()));}
 catch{speaker();shared!.setCatalog([]);}finally{clearTimeout(timeout);}
}
