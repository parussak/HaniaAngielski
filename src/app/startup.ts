import { deadline, sdk } from '../services/firebase-client.ts';
import { loadJourneys } from '../adventure.ts';
import { AppState } from './state.ts';
import { loadCats } from '../cats.ts';
import { loadLibrary } from '../content.ts';
import { backup, validateBackup, type Progress } from '../core.ts';
import type { AccountUser } from '../firebase.ts';
import { startPwa } from '../pwa.ts';
import { load, readStored, save, storageNamespace } from '../storage.ts';
import { ProgressSync } from '../sync.ts';
import { e } from '../ui.ts';
import {restoreNavigation} from './navigation.ts';
import {updateBanner} from '../views/home.ts';
import {pwa} from '../pwa.ts';
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
    restoreCourse: () => Promise<void>;
}
export async function startApplication({ root, state, sync, prepareProgress, rememberAccount, scheduleSync, scheduleReviewMigration, render, refreshSyncLabel, restoreCourse }: StartupPorts) {
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
            const [library, cats] = await Promise.all([loadLibrary(), loadCats()]);
            state.courses = library.courses;
            state.modules = library.modules;
            state.catCatalog = cats;
            state.selected = state.modules[0];
            const maps = await loadJourneys(state.modules);
            state.journeys = maps.journeys;
            state.journeyIssues = maps.issues;
            if(maps.issues.length)state.notice='Nie wszystkie mapy udało się wczytać. Dostępne mapy i ćwiczenia nadal działają. Możesz ponowić próbę w katalogu przygód.';
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
            await restoreCourse();
            restoreNavigation(state);
            state.ready = true;
            render();
            scheduleReviewMigration();
            startPwa(() => { if (state.ready && !state.busy && state.screen !== 'study'){
                if(state.screen==='home')render();
                else {const banner=root.querySelector('[data-update-banner]');if(banner)banner.outerHTML=updateBanner(pwa);}
            } });
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
