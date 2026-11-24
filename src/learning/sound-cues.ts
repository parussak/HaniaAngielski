/** Które krótkie sygnały dźwiękowe zagrać. Czysta decyzja: bez DOM-u, zapisu i odtwarzania. */
import {lessonContext} from './lesson-flow.ts';
import {mapProgress} from './map-progress.ts';
import type {Journey} from './journey.ts';
import type {Progress,Session} from './model.ts';

export type SoundCue = 'correct' | 'lesson' | 'map';
/** Ścieżki względem katalogu aplikacji (`public/`); źródło i licencja: `public/sounds/ZRODLO.md`. */
export const cueFiles: Record<SoundCue, string> = {
    correct: 'sounds/confirmation_001.ogg',
    lesson: 'sounds/confirmation_002.ogg',
    map: 'sounds/steel02.ogg',
};

/** Wynik oceny z `recordAnswer`/`answerOnBoard`: tylko jawna poprawna odpowiedź gra. */
export const answerCue = (correct: boolean | undefined): SoundCue | undefined => correct === true ? 'correct' : undefined;

/**
 * Sygnał po przejściu do podsumowania. `before` i `after` to postęp sprzed i po zapisie „Dalej”,
 * więc sygnał mapy jest tylko przy pierwszym domknięciu mapy (D-52: ukończenia się nie cofają).
 */
export function finishCue(journeys: Journey[], before: Progress, after: Progress, session: Session): SoundCue | undefined {
    // Te same warunki co nagroda w `rewardCompletion`: lekcja naprawdę ukończona.
    if (!session.lesson || !session.completedAt || !session.items.every(i => session.attempts.some(a => a.key === i.key)))
        return;
    const journey = lessonContext(journeys, after, session)?.journey;
    if (journey && !mapProgress(journey, before).complete && mapProgress(journey, after).complete)
        return 'map';
    return 'lesson';
}
