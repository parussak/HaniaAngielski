import type { Module, Progress, Session } from './model.ts';
import { makeReadingSession } from './readings.ts';

/**
 * Wynik decyzji „co się stanie po tej akcji”. Planer jest czystą funkcją: czyta dane,
 * nic nie zmienia i nie pyta użytkownika. Skutki (pytanie o zastąpienie sesji, zmiana
 * stanu ekranu, zapis) wykonuje jedna powłoka w `controllers/session-start.ts`.
 */
export type StartPlan =
    | { kind: 'ignore' }
    | { kind: 'notice'; text: string }
    | { kind: 'open'; session: Session; confirm: string; select?: Module; mode?: Session['mode']; resetRewards: boolean };

/** Dane, które planery mogą czytać; żaden nie dostaje stanu aplikacji. */
export interface StartInput {
    /** Moduły aktualnego kursu. */
    courseModules: readonly Module[];
    /** Wszystkie wczytane moduły. */
    modules: Module[];
    selectedModuleId?: string;
    progress: Progress;
}

const noneYet = 'Tę czytankę poznasz najpierw na mapie. Potem możesz ją tu przeczytać ponownie.';

/** D-68: „Czytanki” — a reading the learner already met on a map, read again whole. */
export function planReadingStart(input: StartInput, dataset: { module?: string; id?: string }): StartPlan {
    const module = input.courseModules.find(m => m.id === (dataset.module ?? input.selectedModuleId));
    const session = module && makeReadingSession(input.modules, module, dataset.id ?? '', input.progress);
    if (!module || !session) return { kind: 'notice', text: noneYet };
    return { kind: 'open', session, confirm: 'Rozpocząć czytankę zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.', select: module, mode: 'reading', resetRewards: false };
}
