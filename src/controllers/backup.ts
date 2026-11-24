import type {OwnerCall} from '../app/action-payloads.ts';
import { type Backup, type Progress, type Session } from '../learning/model.ts';
import { fullBackup, validateFullBackup } from '../history-backup.ts';
import { type HistoryPage } from '../history.ts';
import { isOwnedBy, unhandled } from '../app/actions.ts';
/**
 * Jedyne, co kontroler kopii widzi ze stanu (najwęższy dostęp). `progress` jest tylko
 * czytany — zmienia go wyłącznie port `mutate`. Reszta to stan ekranu kopii.
 */
export interface BackupState {
    readonly progress: Progress;
    olderSessions: Session[];
    olderHead: string | null | undefined;
    pending: Backup | null;
    notice: string;
    storageError: string;
}
interface BackupPorts {
    mutate: (change: (p: Progress) => void) => Promise<void>;
    getHistoryPage: (id: string) => Promise<HistoryPage>;
    saveHistoryPage: (page: HistoryPage) => Promise<void>;
    /** Oddaje gotowy plik użytkownikowi (pobranie w przeglądarce). */
    saveFile: (filename: string, json: string) => void;
    run: (task: () => Promise<void>) => Promise<void>;
}
export function createBackupController(state: BackupState, { mutate, getHistoryPage, saveHistoryPage, saveFile, run }: BackupPorts) {
    // Każde pole stanu ekranu zmienia jedna nazwana operacja.
    const notify = (message: string) => { state.notice = message; };
    const setPending = (backup: Backup | null) => { state.pending = backup; };
    const appendOlder = (page: HistoryPage) => {
        state.olderSessions.push(...[...page.sessions].reverse());
        state.olderHead = page.previous;
    };
    const finishImport = () => {
        state.pending = null;
        state.storageError = '';
        state.notice = 'Kopia została wczytana. Twoje postępy są już na tym urządzeniu.';
    };
    async function downloadProgress(value: Progress, suffix = '') {
        let complete: Backup;
        try {
            complete = await fullBackup(value, getHistoryPage);
        }
        catch (error) {
            notify((error as Error).message);
            return;
        }
        saveFile(`hania-postepy-${new Date().toISOString().slice(0, 10)}${suffix ? '-' + suffix : ''}.json`, JSON.stringify(complete, null, 2));
        notify('Plik kopii został przygotowany do pobrania. Zachowaj go, aby móc odtworzyć postępy.');
    }
    async function exportProgress() { await downloadProgress(state.progress); }
    async function handleAction(...[action]: OwnerCall<'backup'>): Promise<boolean> {
        if (!isOwnedBy('backup', action))
            return false;
        switch (action) {
        case 'older-history': {
            if (!state.olderHead)
                return true;
            try {
                appendOlder(await getHistoryPage(state.olderHead));
            }
            catch (error) {
                notify((error as Error).message);
            }
            return true;
        }
        case 'export':
            await exportProgress();
            return true;
        case 'cancel-import':
            setPending(null);
            return true;
        case 'confirm-import': {
            if (!state.pending)
                return false;
            const complete = await validateFullBackup(state.pending);
            for (const page of complete.archives ?? [])
                await saveHistoryPage(page);
            const imported = complete.progress;
            await mutate(p => { delete p.history; delete p.adventure; Object.assign(p, imported); });
            finishImport();
            return true;
        }
        default: return unhandled(action);
        }
    }
    async function handleChange(ev: Event) {
        const input = ev.target as HTMLInputElement;
        if (input.id !== 'import-file')
            return;
        const file = input.files?.[0];
        if (!file)
            return;
        await run(async () => {
            setPending(null);
            try {
                if (file.size > 50 * 1024 * 1024)
                    throw new Error('Plik jest za duży. Maksymalny rozmiar kopii to 50 MB.');
                setPending(await validateFullBackup(JSON.parse(await file.text())));
                notify('');
            }
            catch (err) {
                notify(err instanceof SyntaxError ? 'Nie można odczytać tego pliku JSON. Wybierz kopię pobraną z aplikacji. Obecne dane pozostają bez zmian.' : (err as Error).message);
            }
        });
    }
    return { handleAction, handleChange, downloadProgress };
}
