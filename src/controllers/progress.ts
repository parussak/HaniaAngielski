import { deadline, sdk } from '../services/firebase-client.ts';
import { AppState } from '../app/state.ts';
import { type Progress } from '../core.ts';
import { checkPage, compactHistory, type HistoryPage } from '../history.ts';
import { seedReviewArchive, seedStageReviews, settleStageRewards } from '../stage-review.ts';
import { localHistoryPage, putHistoryPage, save } from '../storage.ts';
import { ProgressSync } from '../sync.ts';
interface ProgressPorts {
    sync: ProgressSync;
    run: (task: () => Promise<void>) => Promise<void>;
    render: () => void;
    scheduleSync: (delay?: number) => void;
}
export function createProgressController(state: AppState, { sync, run, render, scheduleSync }: ProgressPorts) {
    let reviewMigrationTimer: ReturnType<typeof setTimeout> | undefined;
    let reviewMigrationWorking = false;
    async function prepareProgress(p: Progress) {
        const prepared = await compactHistory(seedStageReviews(p, state.journeys), putHistoryPage);
        settleStageRewards(prepared, state.journeys);
        return prepared;
    }
    function scheduleReviewMigration() {
        if (!state.ready || !state.progress.adventure?.reviewArchiveHead || reviewMigrationWorking)
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
                    const earned = state.progress.adventure?.earned ?? 0;
                    await mutate(p => { seedReviewArchive(p, page, state.journeys); });
                    if ((state.progress.adventure?.earned ?? 0) > earned)
                        state.notice = 'Dawne lekcje uwzględnione. Gwiazdki za domknięte etapy są już w portfelu.';
                });
                again = true;
            }
            catch {
                if ((state.screen === 'map' || state.screen === 'journeys') && (state.user?.uid ?? 'guest') === owner) {
                    state.notice = 'Starsze błędy doliczymy po pobraniu historii. Połącz się z internetem; bieżące ćwiczenia i zapis działają.';
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
        const local = await localHistoryPage(id);
        if (local)
            return checkPage(local);
        if (!state.user || !navigator.onLine)
            throw new Error('Ta część historii nie jest jeszcze pobrana. Połącz się z internetem i otwórz ją lub zapisz pełną kopię. Bieżące wyniki są bezpieczne.');
        return deadline((await sdk()).fetchHistoryPage(state.user.uid, id));
    }
    async function mutate(change: (p: Progress) => void) {
        const expectedVersion = sync.cache?.localVersion;
        let draft = structuredClone(state.progress);
        change(draft);
        if (state.user) {
            await sync.save(draft, expectedVersion);
            draft = structuredClone(sync.cache!.progress);
        }
        else {
            draft = await prepareProgress(draft);
            await save(draft);
            state.guestProgress = structuredClone(draft);
        }
        state.progress = draft;
        state.storageError = '';
        scheduleSync();
    }
    return { prepareProgress, scheduleReviewMigration, getHistoryPage, mutate };
}
