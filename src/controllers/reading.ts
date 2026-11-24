import type {OwnerCall} from '../app/action-payloads.ts';
import type {Module,Progress} from '../learning/model.ts';
import {advanceReading,readingOf,readingView} from '../learning/readings.ts';
import {isOwnedBy,unhandled} from '../app/actions.ts';
/**
 * Jedyne, co kontroler czytanki widzi ze stanu (najwęższy dostęp). `progress` jest tylko
 * czytany — zmienia go wyłącznie port `mutate`. Trzy pola `reading*` to stan ekranu.
 */
export interface ReadingState {
    readonly modules: Module[];
    readonly progress: Pick<Progress, 'active'>;
    readingShown?: {sessionId:string;count:number};
    readingPeek?: {sessionId:string;sentence:string;word?:string};
    readingQuestionPeek?: {sessionId:string;key:string;term:string};
}
interface ReadingPorts {
    mutate: (change: (p: Progress) => void) => Promise<void>;
}
/** The screen's own sentence counter for the active reading, if it belongs to this session. */
export const readingShown=(state:Pick<ReadingState,'progress'|'readingShown'>)=>state.progress.active&&state.readingShown?.sessionId===state.progress.active.id?state.readingShown.count:undefined;
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
export function createReadingController(state: ReadingState, { mutate }: ReadingPorts) {
    // Każde pole stanu ekranu zmienia dokładnie jedna nazwana operacja.
    const showSentences = (sessionId: string, count: number) => { state.readingShown = {sessionId, count}; };
    const togglePeek = (sessionId: string, sentence: string, word?: string) => {
        const same = state.readingPeek?.sessionId === sessionId && state.readingPeek.sentence === sentence && state.readingPeek.word === word;
        state.readingPeek = same ? undefined : {sessionId, sentence, ...(word ? {word} : {})};
    };
    const toggleQuestionPeek = (sessionId: string, key: string, term: string) => {
        const peek = state.readingQuestionPeek;
        state.readingQuestionPeek = peek?.sessionId === sessionId && peek.key === key && peek.term === term ? undefined : {sessionId, key, term};
    };
    async function handleAction(...[action, payload]: OwnerCall<'reading'>): Promise<boolean> {
        if(!isOwnedBy('reading',action))return false;
        switch(action){
        case 'reading-next':{
            const s = state.progress.active, view = s && readingView(state.modules, s, readingShown(state));
            // An open question blocks „Dalej” here too, not only on the button.
            if (!s || !view?.next || view.next === 'finish') return true;
            const {advance, shown} = view.next;
            if (advance) await mutate(p => { advanceReading(p, state.modules); });
            showSentences(s.id, shown);
            return true;
        }
        case 'reading-peek':{
            const s = state.progress.active, view = s && readingView(state.modules, s, readingShown(state)), sentence = payload.sentence ?? '';
            if (!s || !view || sentence === view.tapSentence) return true;
            const index = view.reading.sentences.findIndex(x => x.id === sentence);
            if (index < 0 || index >= view.visible) return true;
            togglePeek(s.id, sentence, payload.word || undefined);
            return true;
        }
        case 'reading-question-peek':{
            const s = state.progress.active;
            if (!s) return true;
            const {key,term} = payload, view = readingView(state.modules, s, readingShown(state));
            const current = s.items[s.index];
            const question = view
                ? view.questions.find(q => q.status !== 'hidden' && q.item.key === key)?.question
                : current?.key === key && current ? readingOf(state.modules, current)?.question : undefined;
            const glossary = question?.reading?.glossary;
            if (!key || !term || !glossary || !Object.hasOwn(glossary, term)) return true;
            toggleQuestionPeek(s.id, key, term);
            return true;
        }
        default:return unhandled(action);
        }
    }
    return { handleAction };
}
