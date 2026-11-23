import type { Journey, JourneyIssue } from './journey.ts';
import type { AnswerMode, Mode, Module, Progress, Session } from './model.ts';

/**
 * Wynik decyzji „co się stanie po tej akcji”. Planery startu sesji (`start-lesson-plans.ts`,
 * `start-practice-plans.ts`) są czystymi funkcjami: czytają dane, niczego nie zmieniają
 * i nie pytają użytkownika. Skutki wykonuje jedna powłoka w `controllers/session-start.ts`.
 */

/** Wybór zapisywany w stanie ekranu; każde pole jest opcjonalne. */
export interface Selection { module?: Module; journeyKey?: string; introLessonId?: string; answerMode?: AnswerMode; mode?: Mode }

export type StartPlan = { selection?: Selection } & (
    /** Nic do zrobienia (np. nieznany moduł). */
    | { kind: 'ignore' }
    | { kind: 'notice'; text: string }
    /** Ta sesja już trwa — wróć do ekranu ćwiczeń. */
    | { kind: 'resume' }
    /** Ekran wprowadzenia lekcji (bez sesji). */
    | { kind: 'intro' }
    /**
     * `selection` działa zawsze; `afterConfirm` dopiero po zgodzie na zastąpienie aktywnej sesji.
     * `confirm: null` — nie pytaj (np. powrót do tej samej lekcji).
     */
    | { kind: 'open'; session: Session; confirm: string | null; afterConfirm?: Selection; resetRewards: boolean }
);

/** Dane, które planery mogą czytać; żaden nie dostaje stanu aplikacji. */
export interface StartInput {
    /** Moduły aktualnego kursu. */
    courseModules: readonly Module[];
    /** Wszystkie wczytane moduły. */
    modules: Module[];
    journeys: Journey[];
    journeyIssues: readonly JourneyIssue[];
    progress: Progress;
    answerMode: AnswerMode;
    previous: boolean;
    selected: Module | undefined;
    /** Mapa wybrana na ekranie (`currentJourney`). */
    currentJourney: Journey | undefined;
    lastSession: Session | null;
    /** Identyfikatory tematów gramatyki wybranego kursu. */
    grammarTopicIds: ReadonlySet<string>;
}

export const newSessionConfirm = 'Nowa sesja zastąpi niedokończoną sesję. Zakończone wyniki pozostaną zachowane. Kontynuować?';
