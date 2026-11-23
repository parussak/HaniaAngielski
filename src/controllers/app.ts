import type { AppState } from '../app/state.ts';
import { applyUpdate, installPwa, prepareOffline } from '../pwa.ts';
import { isOwnedBy, unhandled } from '../app/actions.ts';
// Akcje całej aplikacji: wersja i instalacja (PWA) oraz proste przejścia na ekran bez własnej logiki.
export function createAppController(state: AppState) {
    async function handleAction(action: string): Promise<boolean> {
        if (!isOwnedBy('app', action))
            return false;
        switch (action) {
            case 'pwa-install':
                await installPwa();
                return true;
            case 'pwa-prepare':
                await prepareOffline();
                return true;
            case 'pwa-update':
                if (state.progress.active && !window.confirm('Wczytać nową wersję? Strona zostanie odświeżona, a zapisana sesja pozostanie zachowana.'))
                    return true;
                applyUpdate();
                return true;
            case 'home':
            case 'progress':
            case 'backup':
                state.screen = action;
                state.pending = null;
                return true;
            default: return unhandled(action);
        }
    }
    return { handleAction };
}
