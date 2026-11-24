import {journeyKey} from './journey.ts';
import { makeCoursePracticeSession, type CoursePracticeMode } from './course-practice.ts';
import { makeGrammarTopicSession } from './grammar-topics.ts';
import { makeRitualSession } from './recall.ts';
import { makeReadingSession } from './readings.ts';
import { makeSession } from './session.ts';
import { makeTrainingSession } from './training.ts';
import { newSessionConfirm, type StartInput, type StartPlan } from './start-plan.ts';
import type { Mode } from './model.ts';

/** Planery startu ćwiczeń poza mapą: rytuały, rozgrzewka, tryby kursu, gramatyka, zwykły tryb, czytanki. Czyste funkcje (patrz `start-plan.ts`). */

/** Opening or finale mission of a module; the section plans must already be prepared. */
export function planRitual(input: StartInput, dataset: { module?: string; kind?: string; journey?: string }): StartPlan {
    const m = input.courseModules.find(m => m.id === dataset.module), kind = dataset.kind;
    if (!m || (kind !== 'opening' && kind !== 'finale')) return { kind: 'ignore' };
    if (kind === 'finale' && input.journeyIssues.some(issue => issue.moduleId === m.id)) return { kind: 'notice', text: 'Wczytaj wszystkie mapy modułu przed misją finałową.' };
    const map = input.journeys.find(j => j.moduleId === m.id && journeyKey(j) === dataset.journey);
    const session = makeRitualSession(input.modules, input.journeys, m, input.progress, kind, input.answerMode, map);
    if (!session) return { kind: 'notice', text: kind === 'opening' ? 'To początek przygody! Zacznij od pierwszej lekcji — nie ma jeszcze materiału z wcześniejszych modułów.' : 'Najpierw poznaj materiał i ukończ mapy tego modułu. Misja będzie wtedy gotowa.' };
    return { kind: 'open', session, confirm: 'Rozpocząć kocie ćwiczenia zamiast niedokończonej sesji? Wyniki pozostaną zachowane.', afterConfirm: { module: m }, resetRewards: true };
}

export function planExtraTraining(input: StartInput, dataset: { module?: string }): StartPlan {
    const anchor = dataset.module ? input.courseModules.find(m => m.id === dataset.module) : input.courseModules.find(m => m.id === input.selected?.id) ?? input.courseModules[0];
    if (!anchor) return { kind: 'ignore' };
    const selection = { module: anchor };
    const session = makeTrainingSession(input.modules, anchor, input.progress, input.answerMode, undefined, !!dataset.module);
    if (!session) return { kind: 'notice', text: 'Najpierw spróbuj odpowiedzieć na kilka pytań. Rozgrzewka obejmuje tylko wcześniej poznany materiał.', selection };
    return { kind: 'open', session, confirm: 'Rozpocząć rozgrzewkę zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.', selection, resetRewards: true };
}

export function planCourseMode(input: StartInput, dataset: { mode?: string }): StartPlan {
    if (!['flashcards', 'quiz', 'grammar'].includes(dataset.mode ?? '')) return { kind: 'ignore' };
    const anchor = input.courseModules[0]; if (!anchor) return { kind: 'ignore' };
    const session = makeCoursePracticeSession(input.modules, anchor, input.progress, dataset.mode as CoursePracticeMode, input.answerMode);
    if (!session) return { kind: 'notice', text: 'Nie ma jeszcze poznanego materiału dla tego ćwiczenia. Zacznij od mapy lub modułu.' };
    return { kind: 'open', session, confirm: newSessionConfirm, resetRewards: true };
}

/** D-74: a course grammar session limited to the given topics (several ids are separated by commas). */
export function planGrammarPractice(input: StartInput, dataset: { id?: string }): StartPlan {
    const anchor = input.courseModules[0]; if (!anchor) return { kind: 'ignore' };
    const ids = (dataset.id ?? '').split(',').filter(id => input.grammarTopicIds.has(id));
    const session = ids.length ? makeGrammarTopicSession(input.modules, anchor, input.progress, ids, input.answerMode) : null;
    if (!session) return { kind: 'notice', text: 'Nie ma jeszcze poznanych zadań z tej gramatyki. Spróbuj najpierw lekcji.' };
    return { kind: 'open', session, confirm: newSessionConfirm, resetRewards: true };
}

/** Zwykły tryb modułu (fiszki, quiz, gramatyka…); wybrany tryb zostaje zapamiętany także bez zadań. */
export function planMode(input: StartInput, dataset: { module?: string; mode?: string }): StartPlan {
    const m = dataset.module ? input.courseModules.find(m => m.id === dataset.module) : undefined;
    if (dataset.module && !m) return { kind: 'ignore' };
    const mode = dataset.mode as Mode, selected = m ?? input.selected!;
    const selection = { ...(m ? { module: m } : {}), mode };
    const session = makeSession(input.modules, selected, mode, input.answerMode, input.previous, input.progress);
    if (!session.items.length) return { kind: 'notice', text: 'Nie ma zadań do tej sesji. Znane fiszki pomijamy. Możesz wybrać quiz lub gramatykę.', selection };
    return { kind: 'open', session, confirm: 'Rozpoczęcie nowej sesji zastąpi niedokończoną sesję. Zakończona historia i zapisane trudności pozostaną. Kontynuować?', selection, resetRewards: false };
}

/** D-68: „Czytanki” — a reading the learner already met on a map, read again whole. */
export function planReadingStart(input: StartInput, dataset: { module?: string; id?: string }): StartPlan {
    const module = input.courseModules.find(m => m.id === (dataset.module ?? input.selected?.id));
    const session = module && makeReadingSession(input.modules, module, dataset.id ?? '', input.progress);
    if (!module || !session) return { kind: 'notice', text: 'Tę czytankę poznasz najpierw na mapie. Potem możesz ją tu przeczytać ponownie.' };
    return { kind: 'open', session, confirm: 'Rozpocząć czytankę zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.', afterConfirm: { module, mode: 'reading' }, resetRewards: false };
}
