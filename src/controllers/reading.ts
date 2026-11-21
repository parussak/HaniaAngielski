import type {AppState} from '../app/state.ts';
import type {Progress} from '../core.ts';
import {advanceReading,readingView} from '../learning/readings.ts';
interface ReadingPorts {
    mutate: (change: (p: Progress) => void) => Promise<void>;
}
/** The screen's own sentence counter for the active reading, if it belongs to this session. */
export const readingShown=(state:Readonly<AppState>)=>state.progress.active&&state.readingShown?.sessionId===state.progress.active.id?state.readingShown.count:undefined;
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
            state.readingPeek = undefined;
            return true;
        }
        if (action === 'reading-peek') {
            const s = state.progress.active, view = s && readingView(state.modules, s, readingShown(state)), sentence = el.dataset.sentence ?? '';
            if (!s || !view || view.questionOpen) return true;
            const index = view.reading.sentences.findIndex(x => x.id === sentence);
            if (index < 0 || index >= view.visible) return true;
            const word = el.dataset.word || undefined, same = state.readingPeek?.sessionId === s.id && state.readingPeek.sentence === sentence && state.readingPeek.word === word;
            state.readingPeek = same ? undefined : {sessionId: s.id, sentence, ...(word ? {word} : {})};
            return true;
        }
        return false;
    }
    return { handleAction };
}
