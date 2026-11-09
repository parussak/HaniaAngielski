import { deadline, sdk } from '../services/firebase-client.ts';
import { loadJourneys } from '../adventure.ts';
import { AppState } from './state.ts';
import { loadCats } from '../cats.ts';
import { loadModules } from '../content.ts';
import { backup, validateBackup, type Progress } from '../core.ts';
import type { AccountUser } from '../firebase.ts';
import { startPwa } from '../pwa.ts';
import { load, readStored, save, storageNamespace } from '../storage.ts';
import { ProgressSync } from '../sync.ts';
import { e } from '../ui.ts';
interface StartupPorts {
    root: HTMLDivElement;
    state: AppState;
    sync: ProgressSync;
    prepareProgress: (p: Progress) => Promise<Progress>;
    rememberAccount: (a: AccountUser) => Promise<void>;
    scheduleSync: (delay?: number) => void;
    scheduleReviewMigration: () => void;
    render: () => void;
    refreshSyncLabel: () => void;
}
export async function startApplication({ root, state, sync, prepareProgress, rememberAccount, scheduleSync, scheduleReviewMigration, render, refreshSyncLabel }: StartupPorts) {
    root.innerHTML = '<div class="loading">✳<p>Przygotowujemy Twoją przestrzeń…</p></div>';
    if (!navigator.locks) {
        root.innerHTML = '<div class="loading"><h1>Zaktualizuj przeglądarkę</h1><p>Ta wersja potrzebuje aktualnej przeglądarki Chrome, Edge, Firefox lub Safari, aby bezpiecznie zapisywać postępy.</p></div>';
        return;
    }
    await navigator.locks.request(`${storageNamespace}:writer`, { ifAvailable: true }, async (lock) => {
        if (!lock) {
            root.innerHTML = '<div class="loading"><h1>Nauka jest otwarta w innej karcie</h1><p>Zamknij drugą kartę i odśwież tę stronę. Chronimy w ten sposób Twoje postępy.</p><button class="primary" onclick="location.reload()">Spróbuj ponownie</button></div>';
            return;
        }
        try {
            [state.modules, state.catCatalog] = await Promise.all([loadModules(), loadCats()]);
            state.selected = state.modules[0];
            state.journeys = await loadJourneys(state.modules).catch(() => { state.notice = 'Kocia mapa jest chwilowo niedostępna. Możesz korzystać z własnych ćwiczeń.'; return []; });
            const oldGuest = validateBackup(backup(await load())).progress;
            state.progress = await prepareProgress(oldGuest);
            if (JSON.stringify(state.progress) !== JSON.stringify(oldGuest))
                await save(state.progress);
            state.guestProgress = structuredClone(state.progress);
            const savedAccount = await readStored<AccountUser>('firebase-user');
            if (savedAccount?.uid) {
                await sync.connect(savedAccount.uid, state.guestProgress);
                state.user = savedAccount;
                state.progress = structuredClone(sync.cache!.progress);
                if (navigator.onLine)
                    void (async () => {
                        try {
                            const account = await deadline((await sdk()).restoreUser());
                            if (account?.uid === savedAccount.uid) {
                                await rememberAccount(account);
                                scheduleSync(0);
                            }
                            else {
                                state.reauthNeeded = true;
                                state.accountError = 'Zaloguj się ponownie, aby zsynchronizować zapisane wyniki konta.';
                                sync.status = 'error';
                            }
                        }
                        catch (error) {
                            state.accountError = 'Połączenie z kontem jest niedostępne. Możesz uczyć się z lokalnym zapisem konta.';
                            sync.status = 'error';
                        }
                        if (state.ready && !state.busy && (state.screen === 'account' || state.screen === 'home' || state.screen === 'journeys'))
                            render();
                        else
                            refreshSyncLabel();
                    })();
            }
            state.ready = true;
            render();
            scheduleReviewMigration();
            startPwa(() => { if (state.ready && !state.busy && state.screen === 'home')
                render(); });
        }
        catch (err) {
            root.innerHTML = `<div class="loading"><h1>Nie możemy wczytać aplikacji</h1><p>Nie zmieniliśmy Twoich postępów. Sprawdź pliki materiałów, połączenie i zgodę przeglądarki na zapis danych, a następnie odśwież stronę.</p><p>${e(err instanceof Error ? err.message : 'Błąd odczytu')}</p></div>`;
            console.error(err);
            return;
        }
        // Blokada jest zwalniana przez przeglądarkę przy zamknięciu dokumentu.
        await new Promise<void>(() => { });
    });
}
