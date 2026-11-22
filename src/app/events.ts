import type {createHouseController} from '../controllers/house.ts';
import { createAccountController } from '../controllers/account.ts';
import { AppState } from './state.ts';
import { createBackupController } from '../controllers/backup.ts';
import { createLearningController } from '../controllers/learning.ts';
import { applyUpdate, installPwa, prepareOffline } from '../pwa.ts';
import { ProgressSync } from '../sync.ts';
import {bindHouseDrag} from './house-drag.ts';
import {homeFor} from '../house/progress.ts';
import {currentCourse} from './selectors.ts';
import {bindNavigation} from './navigation.ts';
import {bindGapDrag} from './gap-drag.ts';
import {speaker} from '../speech.ts';
const searchText = (value: string) => value.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replaceAll('ł', 'l');
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
    root.addEventListener('input', ev => {
        const input = ev.target;
        if (!(input instanceof HTMLInputElement) || input.id !== 'grammar-search') return;
        const query = searchText(input.value);
        let count = 0;
        for (const topic of root.querySelectorAll<HTMLElement>('[data-grammar-text]')) {
            topic.hidden = !searchText(topic.dataset.grammarText!).includes(query);
            if (!topic.hidden) count++;
        }
        const status = root.querySelector<HTMLElement>('.grammar-search-status')!;
        status.textContent = !query ? '' : count ? `Znalezione tematy: ${count}` : 'Brak pasujących tematów. Spróbuj innego słowa.';
    });
    async function action(action: string, el: HTMLElement) {
        state.notice = '';
        if (await house.handleAction(action, el))
            return;
        if (await learning.handleAction(action, el))
            return;
        if (await backups.handleAction(action, el))
            return;
        if (await accounts.handleAction(action, el))
            return;
        if (action === 'pwa-install') {
            await installPwa();
            return;
        }
        if (action === 'pwa-prepare') {
            await prepareOffline();
            return;
        }
        if (action === 'pwa-update') {
            if (state.progress.active && !window.confirm('Wczytać nową wersję? Strona zostanie odświeżona, a zapisana sesja pozostanie zachowana.'))
                return;
            applyUpdate();
            return;
        }
        if (['home', 'progress', 'backup'].includes(action)) {
            state.screen = action as 'home' | 'progress' | 'backup';
            state.pending = null;
        }
    }
    const drag=bindHouseDrag(root,()=>({h:homeFor(state.progress,currentCourse(state)?.id),room:state.chosenRoom,course:currentCourse(state)?.id??'',owner:state.user?.uid??'guest',editing:state.screen==='house'&&state.houseEditing,busy:state.busy,epoch:state.progress}), (id,position,scope)=>{
        const proxy=document.createElement('button');Object.assign(proxy.dataset,{id,x:String(position.x),y:String(position.y),room:scope.room,course:scope.course,owner:scope.owner});
        void run(()=>action('grid-move',proxy));
    });
    const gaps=bindGapDrag(root,(key,answer)=>{const proxy=document.createElement('button');Object.assign(proxy.dataset,{key,answer});void run(()=>action('gap-place',proxy));});
    root.addEventListener('click', ev => {
        if(gaps.consumeClick()||drag.consumeClick(ev)){ev.preventDefault();return;}
        const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
        if (!el)
            return;
        ev.preventDefault();
        // D-58: listening changes no progress, so it neither saves nor redraws — unless sound just failed.
        if (el.dataset.action === 'listen') { if (!speaker().speak(el.dataset.say ?? '', el.dataset.lang, el.dataset.slow === 'true',el.dataset.speechKind==='dialogue'?'dialogue':'word')) void run(async () => {}); return; }
        void run(() => action(el.dataset.action!, el));
    });
    // D-68: on a computer → works like „Dalej” in a reading, but never while typing.
    document.addEventListener('keydown', ev => {
        if (ev.key !== 'ArrowRight' || ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey || (ev.target as HTMLElement | null)?.closest?.('input,textarea,select,[contenteditable]')) return;
        const step = root.querySelector<HTMLButtonElement>('[data-reading-next]:not([disabled])');
        if (!step) return;
        ev.preventDefault();
        step.click();
    });
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
        const proxy = document.createElement('button');
        proxy.dataset.answer = input.value;
        void run(() => action('answer', proxy));
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
