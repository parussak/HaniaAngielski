/**
 * Krótkie sygnały nagród. Odtwarzanie nie czyta ani nie zmienia postępów, a każda awaria
 * (zablokowane odtwarzanie, brak pliku, brak `Audio`) kończy się ciszą bez komunikatu.
 */
import {volumeSettings} from './volume.ts';
import {cueFiles,type SoundCue} from './learning/sound-cues.ts';

/** Łagodniej niż nagrania wymowy, żeby sygnał ich nie zagłuszał. */
export const cueVolume = 0.3;
export interface CueAudio { volume: number; play(): Promise<void> | void }
export interface CueEnvironment { url: (file: string) => string; createAudio: (url: string) => CueAudio; /** Poziom 0–1 czytany przy każdym odtworzeniu; domyślnie `cueVolume`. */ volume?: () => number }
export interface CuePlayer { play(cue: SoundCue): void }

export function createCuePlayer(env: CueEnvironment): CuePlayer {
    return {
        play(cue) {
            try {
                const audio = env.createAudio(env.url(cueFiles[cue]));
                audio.volume = env.volume ? env.volume() : cueVolume;
                void Promise.resolve(audio.play()).catch(() => { /* zablokowane lub brak pliku: nauka toczy się dalej */ });
            } catch { /* brak Audio lub błąd odtwarzacza */ }
        },
    };
}

let shared: CuePlayer | undefined;
/** Odtwarzacz aplikacji; poza przeglądarką nic nie robi. */
export function cuePlayer(): CuePlayer {
    return shared ??= typeof window === 'undefined' || typeof Audio === 'undefined'
        ? {play() {}}
        : createCuePlayer({url: file => new URL(file, document.baseURI).href, createAudio: url => new Audio(url), volume: () => volumeSettings().cues() / 100});
}
