import { AppState } from '../app/state.ts';
import { type Backup, type Progress } from '../core.ts';
import { fullBackup, validateFullBackup } from '../history-backup.ts';
import { type HistoryPage } from '../history.ts';
import { putHistoryPage } from '../storage.ts';
interface BackupPorts {
    mutate: (change: (p: Progress) => void) => Promise<void>;
    getHistoryPage: (id: string) => Promise<HistoryPage>;
    run: (task: () => Promise<void>) => Promise<void>;
}
export function createBackupController(state: AppState, { mutate, getHistoryPage, run }: BackupPorts) {
    async function downloadProgress(value: Progress, suffix = '') {
        let complete: Backup;
        try {
            complete = await fullBackup(value, getHistoryPage);
        }
        catch (error) {
            state.notice = (error as Error).message;
            return;
        }
        const url = URL.createObjectURL(new Blob([JSON.stringify(complete, null, 2)], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `hania-postepy-${new Date().toISOString().slice(0, 10)}${suffix ? '-' + suffix : ''}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        state.notice = 'Plik kopii został przygotowany do pobrania. Zachowaj go, aby móc odtworzyć postępy.';
    }
    async function exportProgress() { await downloadProgress(state.progress); }
    async function handleAction(action: string, el: HTMLElement): Promise<boolean> {
        if (action === 'older-history') {
            if (!state.olderHead)
                return true;
            try {
                const page = await getHistoryPage(state.olderHead);
                state.olderSessions.push(...[...page.sessions].reverse());
                state.olderHead = page.previous;
            }
            catch (error) {
                state.notice = (error as Error).message;
            }
            return true;
        }
        if (action === 'export')
            await exportProgress();
        else if (action === 'cancel-import')
            state.pending = null;
        else if (action === 'confirm-import' && state.pending) {
            const complete = await validateFullBackup(state.pending);
            for (const page of complete.archives ?? [])
                await putHistoryPage(page);
            const imported = complete.progress;
            await mutate(p => { delete p.history; delete p.adventure; Object.assign(p, imported); });
            state.pending = null;
            state.storageError = '';
            state.notice = 'Kopia została wczytana. Twoje postępy są już na tym urządzeniu.';
        }
        else
            return false;
        return true;
    }
    async function handleChange(ev: Event) {
        const input = ev.target as HTMLInputElement;
        if (input.id !== 'import-file')
            return;
        const file = input.files?.[0];
        if (!file)
            return;
        await run(async () => {
            state.pending = null;
            try {
                if (file.size > 50 * 1024 * 1024)
                    throw new Error('Plik jest za duży. Maksymalny rozmiar kopii to 50 MB.');
                state.pending = await validateFullBackup(JSON.parse(await file.text()));
                state.notice = '';
            }
            catch (err) {
                state.notice = err instanceof SyntaxError ? 'Nie można odczytać tego pliku JSON. Wybierz kopię pobraną z aplikacji. Obecne dane pozostają bez zmian.' : (err as Error).message;
            }
        });
    }
    return { handleAction, handleChange, downloadProgress };
}
