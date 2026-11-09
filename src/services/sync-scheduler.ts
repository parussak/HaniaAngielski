import { AppState } from '../app/state.ts';
import { ProgressSync } from '../sync.ts';
export function createSyncScheduler(root: HTMLDivElement, state: AppState, sync: ProgressSync) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function syncLabel() { return !state.user || !navigator.onLine ? 'Zapis lokalny' : sync.status === 'saved' ? 'Zapis na koncie' : sync.status === 'checking' ? 'Łączenie…' : sync.status === 'conflict' ? 'Sprawdź zapis' : 'Zapis lokalny'; }
    function refreshSyncLabel() { root.querySelectorAll('[data-sync-label]').forEach(el => el.textContent = state.storageError ? 'Problem z zapisem' : syncLabel()); }
    function scheduleSync(delay = 1200) {
        clearTimeout(timer);
        if (!state.user || sync.conflict || state.reauthNeeded)
            return;
        if (!navigator.onLine) {
            if (sync.cache?.dirty)
                sync.status = 'pending';
            refreshSyncLabel();
            return;
        }
        timer = setTimeout(async () => {
            if (state.busy || state.authWorking) {
                scheduleSync(500);
                return;
            }
            await sync.sync();
            if (sync.status === 'pending')
                scheduleSync();
        }, delay);
    }
    return { syncLabel, refreshSyncLabel, scheduleSync };
}
