import {homeFor,settleHouseUnlocks} from '../house/progress.ts';
import type { Screen } from '../app/state.ts';
import type {Journey, JourneyIssue} from '../learning/journey.ts';
import type { Module, Progress } from '../core.ts';
import type { AccountUser } from '../firebase.ts';
import { checkPage, compactHistory, type HistoryPage } from '../history.ts';
import { seedReviewArchive, seedStageReviews, settleStageRewards } from '../stage-review.ts';
import type { ProgressSync } from '../sync.ts';
/**
 * Jedyne, co kontroler postępu widzi ze stanu (najwęższy dostęp). Wyniki dziecka (`progress`,
 * `guestProgress`, `storageError`) zmienia wyłącznie `commitSaved` po udanym zapisie; komunikat
 * po migracji — `announce`. Pozostałe pola kontroler tylko czyta.
 */
export interface ProgressState {
    progress: Progress;
    guestProgress: Progress;
    storageError: string;
    notice: string;
    readonly journeys: Journey[];
    readonly journeyIssues: JourneyIssue[];
    readonly modules: Module[];
    readonly selectedCourseId: string;
    readonly user: AccountUser | null;
    readonly ready: boolean;
    readonly busy: boolean;
    readonly screen: Screen;
}
/** Magazyn lokalny (IndexedDB) jako port — kontroler nie zna storage.ts. */
interface ProgressStore {
    save: (p: Progress) => Promise<void>;
    putHistoryPage: (page: HistoryPage) => Promise<void>;
    localHistoryPage: (id: string) => Promise<HistoryPage | undefined>;
}
interface ProgressPorts {
    sync: Pick<ProgressSync, 'save' | 'cache'>;
    store: ProgressStore;
    run: (task: () => Promise<void>) => Promise<void>;
    render: () => void;
    scheduleSync: (delay?: number) => void;
    isOnline: () => boolean;
    /** Pobranie strony historii z konta (z limitem czasu). */
    fetchHistoryPage: (uid: string, id: string) => Promise<HistoryPage>;
}
export function createProgressController(state: ProgressState, { sync, store, run, render, scheduleSync, isOnline, fetchHistoryPage }: ProgressPorts) {
    let reviewMigrationTimer: ReturnType<typeof setTimeout> | undefined;
    let reviewMigrationWorking = false;
    function announce(text: string) { state.notice = text; }
    /** Jedyne miejsce, w którym zapisany postęp trafia do stanu ekranu (po udanym zapisie). */
    function commitSaved(p: Progress, guest: boolean) {
        if (guest)
            state.guestProgress = structuredClone(p);
        state.progress = p;
        state.storageError = '';
    }
    async function prepareProgress(p: Progress) {
        // Do not finish historical migration or settle bonuses against a partial catalog.
        const prepared = await compactHistory(state.journeyIssues.length?p:seedStageReviews(p, state.journeys), store.putHistoryPage);
        if(!state.journeyIssues.length)settleStageRewards(prepared, state.journeys,undefined,state.modules);
        settleHouseUnlocks(prepared,state.modules,state.journeys,state.journeyIssues);
        return prepared;
    }
    function scheduleReviewMigration() {
        if (!state.ready || state.journeyIssues.length || !state.progress.adventure?.reviewArchiveHead || reviewMigrationWorking)
            return;
        clearTimeout(reviewMigrationTimer);
        reviewMigrationTimer = setTimeout(async () => {
            if (state.busy) {
                scheduleReviewMigration();
                return;
            }
            const head = state.progress.adventure?.reviewArchiveHead, owner = state.user?.uid ?? 'guest';
            if (!head)
                return;
            reviewMigrationWorking = true;
            let again = false;
            try {
                const page = await getHistoryPage(head);
                if ((state.user?.uid ?? 'guest') !== owner || state.progress.adventure?.reviewArchiveHead !== head)
                    return;
                if (state.busy) {
                    again = true;
                    return;
                }
                await run(async () => {
                    const earned = homeFor(state.progress,state.selectedCourseId)?.earned ?? 0;
                    await mutate(p => { seedReviewArchive(p, page, state.journeys); });
                    if ((homeFor(state.progress,state.selectedCourseId)?.earned ?? 0) > earned)
                        announce('Dawne lekcje uwzględnione. Gwiazdki za domknięte etapy są już w portfelu.');
                });
                again = true;
            }
            catch {
                if ((state.screen === 'map' || state.screen === 'journeys') && (state.user?.uid ?? 'guest') === owner) {
                    announce('Starsze błędy doliczymy po pobraniu historii. Połącz się z internetem; bieżące ćwiczenia i zapis działają.');
                    render();
                }
            }
            finally {
                reviewMigrationWorking = false;
                if (again || (state.user?.uid ?? 'guest') !== owner || state.progress.adventure?.reviewArchiveHead !== head)
                    scheduleReviewMigration();
            }
        }, 300);
    }
    async function getHistoryPage(id: string): Promise<HistoryPage> {
        const local = await store.localHistoryPage(id);
        if (local)
            return checkPage(local);
        if (!state.user || !isOnline())
            throw new Error('Ta część historii nie jest jeszcze pobrana. Połącz się z internetem i otwórz ją lub zapisz pełną kopię. Bieżące wyniki są bezpieczne.');
        return fetchHistoryPage(state.user.uid, id);
    }
    async function mutate(change: (p: Progress) => void) {
        const expectedVersion = sync.cache?.localVersion;
        let draft = structuredClone(state.progress);
        change(draft);
        if (state.user) {
            await sync.save(draft, expectedVersion);
            draft = structuredClone(sync.cache!.progress);
            commitSaved(draft, false);
        }
        else {
            draft = await prepareProgress(draft);
            await store.save(draft);
            commitSaved(draft, true);
        }
        scheduleSync();
    }
    return { prepareProgress, scheduleReviewMigration, getHistoryPage, mutate };
}
