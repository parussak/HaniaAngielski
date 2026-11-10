import './style.css';
import './theme.css';
import './adventure.css';
import './home.css';
import './courses.css';
import { deadline, sdk } from './services/firebase-client.ts';
import { createAccountController } from './controllers/account.ts';
import { bindAppEvents } from './app/events.ts';
import { createRenderer } from './app/renderer.ts';
import { startApplication } from './app/startup.ts';
import { AppState } from './app/state.ts';
import { createViews } from './app/views.ts';
import { createBackupController } from './controllers/backup.ts';
import { type Progress } from './core.ts';
import { createLearningController } from './controllers/learning.ts';
import { createProgressController } from './controllers/progress.ts';
import { readStored, writeStored } from './storage.ts';
import { createSyncScheduler } from './services/sync-scheduler.ts';
import { ProgressSync, type AccountCache } from './sync.ts';
import { createCourseController } from './controllers/courses.ts';
const root = document.querySelector<HTMLDivElement>('#app')!;
const state = new AppState();
const sync = new ProgressSync({
    prepare: prepareProgress,
    read: uid => readStored<AccountCache>(`account:${uid}`),
    save: (uid, cache) => writeStored(`account:${uid}`, cache),
    fetch: async (uid) => deadline((await sdk()).fetchProgress(uid)),
    push: async (uid, p, revision) => deadline((await sdk()).pushProgress(uid, p, revision)),
}, dataChanged => {
    if (dataChanged && sync.cache) {
        state.progress = structuredClone(sync.cache.progress);
        state.lastSession = null;
    }
    if (dataChanged)
        scheduleReviewMigration();
    if (sync.status === 'saved' && !state.reauthNeeded)
        state.accountError = '';
    if (!state.ready || state.busy)
        return;
    if (state.screen === 'account' && document.activeElement?.closest('form')) {
        refreshSyncLabel();
        return;
    }
    if (dataChanged || state.screen === 'account')
        render();
    else
        refreshSyncLabel();
});
const scheduler = createSyncScheduler(root, state, sync);
const renderScreen = createViews(state, sync, syncLabel);
const renderer = createRenderer(root, state, renderScreen);
const progressService = createProgressController(state, { sync, run, render, scheduleSync });
const backups = createBackupController(state, { mutate, getHistoryPage: id => progressService.getHistoryPage(id), run });
const courses = createCourseController(state, { read: key => readStored(key), write: writeStored });
const accounts = createAccountController(state, { sync, scheduleSync, downloadProgress: backups.downloadProgress, run, restoreCourse: courses.restore });
const learning = createLearningController(state, { mutate, scheduleReviewMigration, courses });
function scheduleReviewMigration() { progressService.scheduleReviewMigration(); }
async function prepareProgress(p: Progress) { return progressService.prepareProgress(p); }
async function mutate(change: (p: Progress) => void) { return progressService.mutate(change); }
function render() { renderer.render(); }
async function run(task: () => Promise<void>) { await renderer.run(task); }
function syncLabel() { return scheduler.syncLabel(); }
function refreshSyncLabel() { scheduler.refreshSyncLabel(); }
function scheduleSync(delay?: number) { scheduler.scheduleSync(delay); }
bindAppEvents(root, state, { accounts, learning, backups, sync, scheduleSync, scheduleReviewMigration, run });
void startApplication({ root, state, sync, prepareProgress, rememberAccount: accounts.rememberAccount, scheduleSync, scheduleReviewMigration, render, refreshSyncLabel, restoreCourse: courses.restore });
