import {createHouseController} from './controllers/house.ts';
import { currentCourse } from './app/selectors.ts';
import './style.css';
import './theme.css';
import './adventure.css';
import './home.css';
import './courses.css';
import './progress.css';
import './report.css';
import { deadline, sdk } from './services/firebase-client.ts';
import { createAccountController } from './controllers/account.ts';
import { bindAppEvents } from './app/events.ts';
import { createRenderer } from './app/renderer.ts';
import { onSpeechChange, speaker } from './speech.ts';
import { createReportController } from './controllers/report.ts';
import { bindReportDialog } from './app/report-dialog.ts';
import { cuePlayer } from './sounds.ts';
import { startApplication } from './app/startup.ts';
import { AppState } from './app/state.ts';
import { createViews } from './app/views.ts';
import { createBackupController } from './controllers/backup.ts';
import { type Progress } from './learning/model.ts';
import { createLearningController } from './controllers/learning.ts';
import { createProgressController } from './controllers/progress.ts';
import { load, localHistoryPage, putHistoryPage, readStored, save, writeStored } from './storage.ts';
import { downloadJsonFile } from './services/download-file.ts';
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
    // D-80: a signed-in, connected account is the moment waiting problem reports can leave the device.
    if (sync.status === 'saved')
        void reports.flush();
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
// D-58: voices can appear late or sound can fail; redraw so a task moves between listening and its ordinary form.
onSpeechChange(() => { if (!state.ready || state.busy) return; const typed = root.querySelector<HTMLInputElement>('#answer')?.value; renderer.render(); const input = root.querySelector<HTMLInputElement>('#answer'); if (input && typed) input.value = typed; });
const progressService = createProgressController(state, { sync, store: { save, putHistoryPage, localHistoryPage }, run, render, scheduleSync, isOnline: () => navigator.onLine, fetchHistoryPage: async (uid, id) => deadline((await sdk()).fetchHistoryPage(uid, id)) });
const backups = createBackupController(state, { mutate, getHistoryPage: id => progressService.getHistoryPage(id), saveHistoryPage: putHistoryPage, saveFile: downloadJsonFile, run });
const courses = createCourseController(state, { read: key => readStored(key), write: writeStored });
const accounts = createAccountController(state, { sync, scheduleSync, downloadProgress: backups.downloadProgress, run, restoreCourse: courses.restore, firebase: sdk, deadline, isOnline: () => navigator.onLine, confirm: message => window.confirm(message), loadGuestProgress: load, storeUser: user => writeStored('firebase-user', user) });
const reports = createReportController(state, {
    speech: { available: (language, text) => speaker().available(language, text), last: () => speaker().lastPlayback(), recordingOf: (text, language) => speaker().recordingOf(text, language) },
    outbox: { read: () => readStored<unknown>('reports-outbox'), write: list => writeStored('reports-outbox', list) },
    send: async (uid, report) => deadline((await sdk()).sendReport(uid, report)),
    isOnline: () => navigator.onLine, now: () => new Date(), newId: () => crypto.randomUUID().replaceAll('-', ''),
    changed: () => drawReport(),
});
const reportDialog = document.createElement('dialog');
document.body.append(reportDialog);
const drawReport = bindReportDialog(reportDialog, state, reports);
const house = createHouseController(state, { mutate, courseId: () => currentCourse(state)!.id });
const learning = createLearningController(state, { mutate, scheduleReviewMigration, courses, reload: () => window.location.reload(), confirm: message => window.confirm(message), playCue: cue => cuePlayer().play(cue) });
function scheduleReviewMigration() { progressService.scheduleReviewMigration(); }
async function prepareProgress(p: Progress) { return progressService.prepareProgress(p); }
async function mutate(change: (p: Progress) => void) { return progressService.mutate(change); }
function render() { renderer.render(); }
async function run(task: () => Promise<void>) { await renderer.run(task); }
function syncLabel() { return scheduler.syncLabel(); }
function refreshSyncLabel() { scheduler.refreshSyncLabel(); }
function scheduleSync(delay?: number) { scheduler.scheduleSync(delay); }
// D-80: waiting problem reports leave the device when the connection returns or the app is brought back.
window.addEventListener('online', () => { void reports.flush(); });
window.addEventListener('focus', () => { void reports.flush(); });
bindAppEvents(root, state, { accounts, learning, house, backups, report: reports, sync, scheduleSync, scheduleReviewMigration, run });
void startApplication({ root, state, sync, prepareProgress, rememberAccount: accounts.rememberAccount, scheduleSync, scheduleReviewMigration, render, refreshSyncLabel, restoreCourse: courses.restore });
