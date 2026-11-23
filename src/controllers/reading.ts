import type {AppState} from '../app/state.ts';
import type {Progress} from '../core.ts';
import {advanceReading,readingOf,readingView} from '../learning/readings.ts';
interface ReadingPorts {
    mutate: (change: (p: Progress) => void) => Promise<void>;
}
/** The screen's own sentence counter for the active reading, if it belongs to this session. */
export const readingShown=(state:Readonly<AppState>)=>state.progress.active&&state.readingShown?.sessionId===state.progress.active.id?state.readingShown.count:undefined;
/** D-68: on a computer → works like „Dalej” in a reading, but never while typing. */
export function bindReadingShortcut(root: HTMLElement) {
    document.addEventListener('keydown', ev => {
        if (ev.key !== 'ArrowRight' || ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey || (ev.target as HTMLElement | null)?.closest?.('input,textarea,select,[contenteditable]')) return;
        const step = root.querySelector<HTMLButtonElement>('[data-reading-next]:not([disabled])');
        if (!step) return;
        ev.preventDefault();
        step.click();
    });
}
/**
 * D-68: „Dalej” in a reading and tap translations. A new sentence and a preview are
 * screen state only; moving to the next question is the one change that is saved.
 */
export function createReadingController(state: AppState, { mutate }: ReadingPorts) {
    async function handleAction(action: string, el: HTMLElement): Promise<boolean> {
        if (action === 'reading-next') {
            const s = state.progress.active, view = s && readingView(state.modules, s, readingShown(state));
            // An open question blocks „Dalej” here too, not only on the button.
            if (!s || !view?.next || view.next === 'finish') return true;
            const {advance, shown} = view.next;
            if (advance) await mutate(p => { advanceReading(p, state.modules); });
            state.readingShown = {sessionId: s.id, count: shown};
            return true;
        }
        if (action === 'reading-peek') {
            const s = state.progress.active, view = s && readingView(state.modules, s, readingShown(state)), sentence = el.dataset.sentence ?? '';
            if (!s || !view || sentence === view.tapSentence) return true;
            const index = view.reading.sentences.findIndex(x => x.id === sentence);
            if (index < 0 || index >= view.visible) return true;
            const word = el.dataset.word || undefined, same = state.readingPeek?.sessionId === s.id && state.readingPeek.sentence === sentence && state.readingPeek.word === word;
            state.readingPeek = same ? undefined : {sessionId: s.id, sentence, ...(word ? {word} : {})};
            return true;
        }
        if (action === 'reading-question-peek') {
            const s = state.progress.active;
            if (!s) return true;
            const {key,term} = el.dataset, view = readingView(state.modules, s, readingShown(state));
            const current = s.items[s.index];
            const question = view
                ? view.questions.find(q => q.status !== 'hidden' && q.item.key === key)?.question
                : current?.key === key && current ? readingOf(state.modules, current)?.question : undefined;
            const glossary = question?.reading?.glossary;
            if (!key || !term || !glossary || !Object.hasOwn(glossary, term)) return true;
            const peek = state.readingQuestionPeek;
            state.readingQuestionPeek = peek?.sessionId === s.id && peek.key === key && peek.term === term
                ? undefined : {sessionId:s.id,key,term};
            return true;
        }
        return false;
    }
    return { handleAction };
}
