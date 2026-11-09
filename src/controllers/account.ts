import { deadline, sdk } from '../services/firebase-client.ts';
import { AppState } from '../app/state.ts';
import { emptyProgress, type Progress } from '../core.ts';
import { firebaseMessage } from '../firebase-errors.ts';
import type { AccountUser } from '../firebase.ts';
import { load, writeStored } from '../storage.ts';
import { ProgressSync, hasProgress } from '../sync.ts';
interface AccountPorts {
    sync: ProgressSync;
    scheduleSync: (delay?: number) => void;
    downloadProgress: (p: Progress, suffix?: string) => Promise<void>;
    run: (task: () => Promise<void>) => Promise<void>;
}
export function createAccountController(state: AppState, { sync, scheduleSync, downloadProgress, run }: AccountPorts) {
    async function connectAccount(account: AccountUser) {
        await sync.connect(account.uid, state.guestProgress);
        state.user = { uid: account.uid, email: account.email, displayName: account.displayName ?? null };
        state.reauthNeeded = false;
        await writeStored('firebase-user', state.user);
        state.screen = 'account';
        state.accountSection = 'name';
        state.registerAccount = false;
        state.progress = structuredClone(sync.cache!.progress);
        state.pending = null;
        state.lastSession = null;
        scheduleSync(0);
    }
    async function rememberAccount(account: AccountUser) {
        if (!state.user || account.uid !== state.user.uid)
            throw new Error('Konto się zmieniło. Zaloguj się ponownie.');
        state.user = { uid: account.uid, email: account.email, displayName: account.displayName ?? null };
        await writeStored('firebase-user', state.user);
    }
    async function handleAction(action: string, el: HTMLElement): Promise<boolean> {
        if (action === 'account') {
            state.screen = 'account';
            state.accountError = '';
            return true;
        }
        if (action === 'auth-toggle') {
            state.registerAccount = !state.registerAccount;
            state.accountError = '';
            return true;
        }
        if (action === 'refresh-account') {
            state.accountError = '';
            state.accountNotice = '';
            try {
                if (!navigator.onLine)
                    throw new Error('Odświeżenie danych konta wymaga internetu.');
                const account = await deadline((await sdk()).restoreUser());
                if (!account)
                    throw new Error('Zaloguj się ponownie.');
                await rememberAccount(account);
                state.accountNotice = 'Dane konta zostały odświeżone.';
            }
            catch (error) {
                state.accountError = firebaseMessage(error);
            }
            return true;
        }
        if (action === 'logout' || action === 'switch-account') {
            state.authWorking = true;
            try {
                await (await sdk()).logout();
                await sync.disconnect();
                await writeStored('firebase-user', null);
                state.user = null;
                state.reauthNeeded = false;
                state.progress = await load();
                state.guestProgress = structuredClone(state.progress);
                state.pending = null;
                state.lastSession = null;
                state.accountNotice = 'Wylogowano. Widoczny jest osobny zapis bez konta; wyniki konta pozostały zachowane.';
            }
            catch (error) {
                state.accountError = firebaseMessage(error);
            }
            finally {
                state.authWorking = false;
            }
            return true;
        }
        if (action === 'sync-now') {
            await sync.sync();
            return true;
        }
        if (action === 'guest-copy') {
            if (hasProgress(state.progress) && !window.confirm('Postępy z tego urządzenia zastąpią bieżące postępy konta. Zachowamy kopię dotychczasowego zapisu. Kontynuować?'))
                return true;
            await sync.useGuest(state.guestProgress);
            scheduleSync(0);
            return true;
        }
        if (action === 'guest-skip') {
            sync.dismissGuest();
            return true;
        }
        if (action === 'resolve-local' || action === 'resolve-cloud') {
            if (!window.confirm('Wybrany zapis stanie się bieżącym. Druga wersja pozostanie do pobrania jako kopia sprzed zmiany. Kontynuować?'))
                return true;
            await sync.resolve(action === 'resolve-local' ? 'local' : 'cloud');
            return true;
        }
        if (action === 'export-cloud') {
            await downloadProgress(sync.conflict?.remote?.progress ?? emptyProgress(), 'konto');
            return true;
        }
        if (action === 'export-recovery' && sync.cache?.recovery) {
            await downloadProgress(sync.cache.recovery, 'sprzed-zmiany');
            return true;
        }
        return false;
    }
    function handleSubmit(ev: SubmitEvent): boolean {
        if (['profile-form', 'email-form', 'password-form'].includes((ev.target as HTMLElement).id)) {
            ev.preventDefault();
            const form = ev.target as HTMLFormElement, kind = form.id;
            state.accountSection = kind === 'profile-form' ? 'name' : kind === 'email-form' ? 'email' : 'password';
            const value = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value;
            const data = kind === 'profile-form' ? { name: value('displayName') } : kind === 'email-form' ? { email: value('email'), password: value('currentPassword') } : { password: value('currentPassword'), next: value('newPassword'), confirm: value('confirmPassword') };
            void run(async () => {
                state.accountError = '';
                state.accountNotice = '';
                state.authWorking = true;
                try {
                    if (!navigator.onLine)
                        throw new Error('Zmiana ustawień konta wymaga internetu. Postępy pozostają zapisane.');
                    if (kind === 'password-form' && data.next !== data.confirm)
                        throw new Error('Nowe hasła nie są takie same. Wpisz je ponownie.');
                    const firebase = await sdk();
                    if (kind === 'profile-form') {
                        await rememberAccount(await deadline(firebase.changeName(data.name!, state.user!.uid)));
                        state.accountNotice = 'Imię zostało zapisane.';
                    }
                    else if (kind === 'email-form') {
                        await deadline(firebase.changeEmail(data.email!, data.password!, state.user!.uid));
                        state.accountNotice = 'Wysłaliśmy link na nowy adres. Otwórz go, aby potwierdzić zmianę e-maila. Do tego czasu działa dotychczasowy adres.';
                    }
                    else {
                        await deadline(firebase.changePassword(data.password!, data.next!, state.user!.uid));
                        state.accountNotice = 'Hasło zostało zmienione. Przy kolejnym logowaniu użyj nowego hasła.';
                    }
                }
                catch (error) {
                    state.accountError = firebaseMessage(error);
                }
                finally {
                    state.authWorking = false;
                }
            });
            return true;
        }
        if ((ev.target as HTMLElement).id === 'account-form') {
            ev.preventDefault();
            const form = ev.target as HTMLFormElement, email = (form.elements.namedItem('email') as HTMLInputElement).value.trim(), password = (form.elements.namedItem('password') as HTMLInputElement).value;
            const name = (form.elements.namedItem('displayName') as HTMLInputElement | null)?.value ?? '';
            const reset = (ev as SubmitEvent).submitter?.getAttribute('value') === 'reset';
            void run(async () => {
                state.authWorking = true;
                state.accountError = '';
                state.accountNotice = '';
                try {
                    if (!navigator.onLine)
                        throw new Error('Logowanie i odzyskanie hasła wymagają internetu. Możesz wrócić do nauki z lokalnym zapisem.');
                    const firebase = await sdk();
                    if (reset) {
                        await deadline(firebase.resetPassword(email));
                        state.accountNotice = 'Jeśli dla tego adresu dostępne jest odzyskiwanie hasła, otrzymasz wiadomość. Sprawdź też spam.';
                    }
                    else {
                        const account = await deadline(firebase.login(email, password, state.registerAccount, name));
                        await connectAccount(account);
                        state.accountNotice = 'Zalogowano. Postępy bez konta są przechowywane osobno.';
                    }
                }
                catch (error) {
                    state.accountError = firebaseMessage(error);
                }
                finally {
                    state.authWorking = false;
                }
            });
            return true;
        }
        return false;
    }
    return { handleAction, handleSubmit, connectAccount, rememberAccount };
}
