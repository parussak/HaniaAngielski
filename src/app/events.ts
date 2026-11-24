import type {createHouseController} from '../controllers/house.ts';
import { createAccountController } from '../controllers/account.ts';
import { AppState } from './state.ts';
import { createBackupController } from '../controllers/backup.ts';
import { createLearningController } from '../controllers/learning.ts';
import { createAppController } from '../controllers/app.ts';
import { createSpeechController } from '../controllers/speech.ts';
import { ownerOf, unhandled, type ActionOwner } from './actions.ts';
import { isCallOwnedBy, readCall, type ActionCall, type OwnerCall } from './action-payloads.ts';
import { ProgressSync } from '../sync.ts';
import {bindHouseDrag} from './house-drag.ts';
import {homeFor} from '../house/progress.ts';
import {currentCourse} from './selectors.ts';
import {bindNavigation} from './navigation.ts';
import {bindGapDrag} from './gap-drag.ts';
import {speaker} from '../speech.ts';
import { applyUpdate, installPwa, prepareOffline } from '../pwa.ts';
import {bindReadingShortcut} from '../controllers/reading.ts';
import {createGrammarSearchController} from '../controllers/grammar-search.ts';
import {filterGrammarTopics} from '../views/grammar-search.ts';
interface EventPorts {
    accounts: ReturnType<typeof createAccountController>;
    house: ReturnType<typeof createHouseController>;
    learning: ReturnType<typeof createLearningController>;
    backups: ReturnType<typeof createBackupController>;
    sync: ProgressSync;
    scheduleSync: (delay?: number) => void;
    scheduleReviewMigration: () => void;
    run: (task: () => Promise<void>) => Promise<void>;
}
export function bindAppEvents(root: HTMLDivElement, state: AppState, { accounts, learning, house, backups, sync, scheduleSync, scheduleReviewMigration, run }: EventPorts) {
    bindNavigation(state,run);
    const grammarSearch = createGrammarSearchController(state);
    root.addEventListener('input', ev => {
        const input = ev.target;
        if (input instanceof HTMLInputElement && grammarSearch.handleInput(input)) filterGrammarTopics(root, state.grammarQuery);
    });
    const app = createAppController(state, { confirm: message => window.confirm(message), installPwa, prepareOffline, applyUpdate }), speech = createSpeechController();
    // Jedyny przełącznik akcji: właściciel (spis w `actions.ts`) wskazuje kontroler. Nieznana nazwa albo brak wymaganych
    // danych (`call === null`) nic nie robi. Rzutowanie na akcje właściciela jest bezpieczne: `owner` wynika z nazwy akcji.
    async function action(name: string, call: ActionCall | null) {
        state.notice = '';
        const owner = ownerOf(name), owned = <O extends ActionOwner>(_owner: O) => call as OwnerCall<O>;
        // Wyczyszczenie błędu planszy dotyczy każdej akcji poza domkiem (tak jak wcześniej, gdy akcje przechodziły przez naukę).
        if (owner !== 'house')
            state.boardError = undefined;
        switch (owner) {
            case 'house': await house.handleAction(...owned(owner)); return;
            case 'navigation': case 'starts': case 'answers': case 'reading': await learning.handleAction(...owned(owner)); return;
            case 'backup': await backups.handleAction(...owned(owner)); return;
            case 'account': await accounts.handleAction(...owned(owner)); return;
            case 'app': await app.handleAction(...owned(owner)); return;
            case 'speech': speech.handleAction(...owned(owner)); return;
            case undefined: return;
            default: unhandled(owner);
        }
    }
    const drag=bindHouseDrag(root,()=>({h:homeFor(state.progress,currentCourse(state)?.id),room:state.chosenRoom,course:currentCourse(state)?.id??'',owner:state.user?.uid??'guest',editing:state.screen==='house'&&state.houseEditing,busy:state.busy,epoch:state.progress}), (id,position,scope)=>{
        void run(()=>action('grid-move',['grid-move',{id,x:position.x,y:position.y,room:scope.room,course:scope.course,owner:scope.owner}]));
    });
    const gaps=bindGapDrag(root,(key,answer)=>{void run(()=>action('gap-place',['gap-place',{key,answer}]));});
    root.addEventListener('click', ev => {
        if(gaps.consumeClick()||drag.consumeClick(ev)){ev.preventDefault();return;}
        const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
        if (!el)
            return;
        ev.preventDefault();
        // D-58: listening changes no progress, so it neither saves nor redraws — unless sound just failed.
        const name = el.dataset.action!, call = readCall(name, el);
        if (call && isCallOwnedBy('speech', call)) { if (!speech.handleAction(...call)) void run(async () => {}); return; }
        void run(() => action(name, call));
    });
    bindReadingShortcut(root);
    root.addEventListener('submit', ev => {
        if (accounts.handleSubmit(ev))
            return;
        if ((ev.target as HTMLElement).id !== 'answer-form')
            return;
        ev.preventDefault();
        const input = root.querySelector<HTMLInputElement>('#answer')!;
        if (!input.value.trim()) {
            input.focus();
            return;
        }
        void run(() => action('answer', ['answer', { answer: input.value }]));
    });
    root.addEventListener('change', ev => { const input = ev.target as HTMLInputElement; if (input.id === 'listening') { speaker().setEnabled(input.checked); void run(async () => {}); return; }
        learning.handleSettingsChange(ev.target as HTMLInputElement); void backups.handleChange(ev); });
    window.addEventListener('online', () => { if (sync.cache?.dirty || !state.progress.active)
        scheduleSync(0); });
    window.addEventListener('focus', () => { if (state.user && !state.progress.active)
        scheduleSync(0); });
    window.addEventListener('online', scheduleReviewMigration);
    window.addEventListener('focus', scheduleReviewMigration);
}
