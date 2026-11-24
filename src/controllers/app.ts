import type { Screen } from '../app/state.ts';
import type { Backup, Progress } from '../learning/model.ts';
import { isOwnedBy, unhandled } from '../app/actions.ts';
/**
 * Jedyne, co kontroler aplikacji widzi ze stanu (najwęższy dostęp): czyta, czy trwa sesja,
 * a ekran i oczekującą kopię zmienia jedna nazwana operacja (`goTo`).
 */
export interface AppControllerState {
    readonly progress: Pick<Progress, 'active'>;
    screen: Screen;
    pending: Backup | null;
}
/** Wszystko spoza stanu: pytanie do użytkownika i skutki PWA. */
interface AppPorts {
    confirm: (message: string) => boolean;
    installPwa: () => Promise<void>;
    prepareOffline: () => Promise<void>;
    applyUpdate: () => void;
}
// Akcje całej aplikacji: wersja i instalacja (PWA) oraz proste przejścia na ekran bez własnej logiki.
export function createAppController(state: AppControllerState, { confirm, installPwa, prepareOffline, applyUpdate }: AppPorts) {
    // Przejście na ekran zawsze porzuca niezatwierdzoną kopię.
    const goTo = (screen: Screen) => { state.screen = screen; state.pending = null; };
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
                if (state.progress.active && !confirm('Wczytać nową wersję? Strona zostanie odświeżona, a zapisana sesja pozostanie zachowana.'))
                    return true;
                applyUpdate();
                return true;
            case 'home':
            case 'progress':
            case 'backup':
                goTo(action);
                return true;
            default: return unhandled(action);
        }
    }
    return { handleAction };
}
