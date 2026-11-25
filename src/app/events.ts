import type {createHouseController} from '../controllers/house.ts';
import { createAccountController } from '../controllers/account.ts';
import { AppState } from './state.ts';
import { createBackupController } from '../controllers/backup.ts';
import { createLearningController } from '../controllers/learning.ts';
import { createAppController } from '../controllers/app.ts';
import { cuePlayer } from '../sounds.ts';
import { volumeSettings } from '../volume.ts';
import { createSpeechController } from '../controllers/speech.ts';
import { ownerOf, unhandled, type ActionOwner } from './actions.ts';
import { isCallOwnedBy, readCall, type ActionCall, type OwnerCall } from './action-payloads.ts';
import { ProgressSync } from '../sync.ts';
import {bindHouseDrag} from './house-drag.ts';
import {homeFor} from '../house/progress.ts';
import {currentCourse} from './selectors.ts';
import { readAccountSubmit, readImportFile, readSetting } from './form-payloads.ts';
import {bindNavigation} from './navigation.ts';
import {bindGapDrag} from './gap-drag.ts';
import {speaker} from '../speech.ts';
import { applyUpdate, installPwa, prepareOffline } from '../pwa.ts';
import {bindReadingShortcut} from './reading-shortcut.ts';
import type {createReportController} from '../controllers/report.ts';
import {createGrammarSearchController} from '../controllers/grammar-search.ts';
import {filterGrammarTopics} from '../views/grammar-search.ts';
interface EventPorts {
    accounts: ReturnType<typeof createAccountController>;
    house: ReturnType<typeof createHouseController>;
    learning: ReturnType<typeof createLearningController>;
    backups: ReturnType<typeof createBackupController>;
    report: ReturnType<typeof createReportController>;
    sync: ProgressSync;
    scheduleSync: (delay?: number) => void;
    scheduleReviewMigration: () => void;
    run: (task: () => Promise<void>) => Promise<void>;
}
export function bindAppEvents(root: HTMLDivElement, state: AppState, { accounts, learning, house, backups, report, sync, scheduleSync, scheduleReviewMigration, run }: EventPorts) {
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
            case 'report': await report.handleAction(...owned(owner)); return;
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
        // Głośność: „Posłuchaj” przy efektach gra aktualny sygnał poprawnej odpowiedzi; nic nie zapisuje i nie przerysowuje ekranu.
        if ((ev.target as HTMLElement).closest('[data-preview-cue]')) { ev.preventDefault(); cuePlayer().play('correct'); return; }
        const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
        if (!el)
            return;
        ev.preventDefault();
        // D-58: listening changes no progress, so it neither saves nor redraws — unless sound just failed.
        const name = el.dataset.action!, call = readCall(name, el);
        // D-80: the report window opens over the task without redrawing it, so a typed answer and the lesson stay as they are.
        if (call && isCallOwnedBy('report', call)) { void report.handleAction(...call); return; }
        if (call && isCallOwnedBy('speech', call)) { if (!speech.handleAction(...call)) void run(async () => {}); return; }
        void run(() => action(name, call));
    });
    bindReadingShortcut(root);
    root.addEventListener('submit', ev => {
        const accountForm = readAccountSubmit(ev);
        if (accountForm) {
            ev.preventDefault();
            accounts.handleSubmit(accountForm);
            return;
        }
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
    // Przeciąganie suwaka jest ciche: zmienia tylko poziom i napis, bez dźwięku, zapisu postępów i przerysowania.
    root.addEventListener('input', ev => { const input = ev.target as HTMLInputElement, group = input.dataset?.volume; if (group !== 'speech' && group !== 'cues') return; const percent = Number(input.value); if (group === 'speech') volumeSettings().setSpeech(percent); else volumeSettings().setCues(percent); const level = group === 'speech' ? volumeSettings().speech() : volumeSettings().cues(); const out = root.querySelector(`#volume-${group}-value`); if (out) out.textContent = `${level}%`; input.setAttribute('aria-valuetext', `${level}%`); });
    root.addEventListener('change', ev => { const input = ev.target as HTMLInputElement; if (input.id === 'listening') { speaker().setEnabled(input.checked); void run(async () => {}); return; }
        const setting = readSetting(ev.target); if (setting) learning.handleSettingsChange(setting); const file = readImportFile(ev.target); if (file) void backups.importFile(file); });
    window.addEventListener('online', () => { if (sync.cache?.dirty || !state.progress.active)
        scheduleSync(0); });
    window.addEventListener('focus', () => { if (state.user && !state.progress.active)
        scheduleSync(0); });
    window.addEventListener('online', scheduleReviewMigration);
    window.addEventListener('focus', scheduleReviewMigration);
}
