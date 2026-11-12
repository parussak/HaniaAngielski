import { AppState } from './state.ts';
export function createRenderer(root: HTMLDivElement, state: AppState, renderScreen: () => string) {
    function render() {
        const historyContext = `${state.user?.uid ?? 'guest'}:${state.progress.history?.head ?? 'none'}`;
        if (state.viewedHistory !== historyContext) {
            state.viewedHistory = historyContext;
            state.olderSessions = [];
            state.olderHead = state.progress.history?.head;
        }
        document.body.classList.toggle('studying', state.screen === 'study');
        document.body.classList.toggle('home-screen', state.screen === 'home');
        const summarySession = state.lastSession ?? state.progress.sessions.at(-1);
        document.body.classList.toggle('journey-summary', state.screen === 'summary' && !!(summarySession?.lesson || summarySession?.stageReview || summarySession?.training));
        const focused = document.activeElement as HTMLElement | null;
        const focusAction = focused?.dataset.action;
        const focusId = focused?.id;
        const changedScreen = state.renderedScreen !== state.screen;
        const helpOpen = !changedScreen && !!root.querySelector<HTMLDetailsElement>('.home-help')?.open;
        root.innerHTML = renderScreen();
        const help = root.querySelector<HTMLDetailsElement>('.home-help');
        if (help)
            help.open = helpOpen;
        root.setAttribute('aria-busy', String(state.busy));
        if (!state.ready || state.busy)
            root.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button,input').forEach(el => el.disabled = true);
        if (changedScreen) {
            window.scrollTo(0, 0);
            const heading = root.querySelector<HTMLElement>('h1');
            if (heading) {
                heading.tabIndex = -1;
                heading.focus({ preventScroll: true });
            }
        }
        else if (state.screen === 'study' && state.progress.active?.phase === 'retry') {
            root.querySelector<HTMLInputElement>('#answer')?.focus();
        }
        else if (state.screen === 'study' && state.progress.active?.phase === 'feedback') {
            const feedback = root.querySelector<HTMLElement>('.feedback');
            if (feedback) {
                feedback.tabIndex = -1;
                feedback.focus({ preventScroll: true });
            }
        }
        else if (state.screen === 'house' && (focusAction === 'select-decoration'||focusAction==='house-edit')) {
            const controls=root.querySelector<HTMLElement>((state.houseEditing||focusAction==='house-edit')?'.cat-house':'#house-placement');
            controls?.scrollIntoView({block:'start'});
            controls?.focus({preventScroll:true});
        }
        else {
            const target = focusId ? document.getElementById(focusId) : Array.from(root.querySelectorAll<HTMLElement>('[data-action]')).find(el => el.dataset.action === focusAction);
            target?.focus({ preventScroll: true });
        }
        state.renderedScreen = state.screen;
    }
    async function run(task: () => Promise<void>) {
        if (state.busy || !state.ready)
            return;
        state.busy = true;
        root.setAttribute('aria-busy', 'true');
        root.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.disabled = true);
        try {
            await task();
        }
        catch (err) {
            state.storageError = 'Nie udało się zapisać zmiany. Poprzednie dane są zachowane. Spróbuj ponownie lub zapisz kopię postępów.';
            console.error(err);
        }
        finally {
            state.busy = false;
            render();
        }
    }
    return { render, run };
}
