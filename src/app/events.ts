import { createAccountController } from '../controllers/account.ts';
import { AppState } from './state.ts';
import { createBackupController } from '../controllers/backup.ts';
import { createLearningController } from '../controllers/learning.ts';
import { applyUpdate, installPwa, prepareOffline } from '../pwa.ts';
import { ProgressSync } from '../sync.ts';
interface EventPorts {
    accounts: ReturnType<typeof createAccountController>;
    learning: ReturnType<typeof createLearningController>;
    backups: ReturnType<typeof createBackupController>;
    sync: ProgressSync;
    scheduleSync: (delay?: number) => void;
    scheduleReviewMigration: () => void;
    run: (task: () => Promise<void>) => Promise<void>;
}
export function bindAppEvents(root: HTMLDivElement, state: AppState, { accounts, learning, backups, sync, scheduleSync, scheduleReviewMigration, run }: EventPorts) {
    async function action(action: string, el: HTMLElement) {
        state.notice = '';
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
    root.addEventListener('click', ev => {
        const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
        if (!el)
            return;
        ev.preventDefault();
        void run(() => action(el.dataset.action!, el));
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
    root.addEventListener('change', ev => { learning.handleSettingsChange(ev.target as HTMLInputElement); void backups.handleChange(ev); });
    window.addEventListener('online', () => { if (sync.cache?.dirty || !state.progress.active)
        scheduleSync(0); });
    window.addEventListener('focus', () => { if (state.user && !state.progress.active)
        scheduleSync(0); });
    window.addEventListener('online', scheduleReviewMigration);
    window.addEventListener('focus', scheduleReviewMigration);
}
