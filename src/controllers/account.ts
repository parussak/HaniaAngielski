import type {OwnerCall} from '../app/action-payloads.ts';
import type {AccountSubmit} from '../app/form-payloads.ts';
import { type Backup, type Progress, type Session, emptyProgress } from '../learning/model.ts';
import type { Screen } from '../app/state.ts';
import { firebaseMessage } from '../firebase-errors.ts';
import type * as FirebaseSdk from '../firebase.ts';
import type { AccountUser } from '../firebase.ts';
import { hasProgress, type ProgressSync } from '../sync.ts';
import { isOwnedBy, unhandled } from '../app/actions.ts';
/**
 * Jedyne, co kontroler konta widzi ze stanu (najwęższy dostęp). Dane postępu (`progress`,
 * `guestProgress`) zmienia tylko operacja `switchProgress` — przy zmianie konta wczytujemy
 * inny zapis, to nie jest edycja wyników (te zmienia wyłącznie `mutate` gdzie indziej).
 * Reszta to stan ekranu konta zmieniany nazwanymi operacjami kontrolera.
 */
export interface AccountState {
    progress: Progress;
    guestProgress: Progress;
    user: AccountUser | null;
    reauthNeeded: boolean;
    screen: Screen;
    accountSection: string;
    registerAccount: boolean;
    pending: Backup | null;
    lastSession: Session | null;
    accountError: string;
    accountNotice: string;
    authWorking: boolean;
}
type AccountSync = Pick<ProgressSync, 'connect' | 'disconnect' | 'sync' | 'useGuest' | 'dismissGuest' | 'resolve' | 'conflict' | 'cache'>;
type AccountSdk = Pick<typeof FirebaseSdk, 'login' | 'logout' | 'restoreUser' | 'resetPassword' | 'changeName' | 'changeEmail' | 'changePassword'>;
interface AccountPorts {
    sync: AccountSync;
    scheduleSync: (delay?: number) => void;
    downloadProgress: (p: Progress, suffix?: string) => Promise<void>;
    run: (task: () => Promise<void>) => Promise<void>;
    restoreCourse: () => Promise<void>;
    /** Usługa Firebase (ładowana leniwie) i limit czasu połączenia. */
    firebase: () => Promise<AccountSdk>;
    deadline: <T>(operation: Promise<T>) => Promise<T>;
    isOnline: () => boolean;
    /** Pytanie o zgodę (w przeglądarce `window.confirm`). */
    confirm: (message: string) => boolean;
    loadGuestProgress: () => Promise<Progress>;
    storeUser: (user: AccountUser | null) => Promise<void>;
}
export function createAccountController(state: AccountState, { sync, scheduleSync, downloadProgress, run, restoreCourse, firebase, deadline, isOnline, confirm, loadGuestProgress, storeUser }: AccountPorts) {
    // Każde pole stanu ekranu zmienia jedna nazwana operacja.
    const showAccount = () => { state.screen = 'account'; };
    const toggleRegistration = () => { state.registerAccount = !state.registerAccount; };
    const chooseSection = (section: string) => { state.accountSection = section; };
    const fail = (error: unknown) => { state.accountError = firebaseMessage(error); };
    const clearError = () => { state.accountError = ''; };
    const notify = (message: string) => { state.accountNotice = message; };
    const clearMessages = () => { clearError(); notify(''); };
    const setWorking = (working: boolean) => { state.authWorking = working; };
    const setUser = (account: AccountUser | null) => { state.user = account && { uid: account.uid, email: account.email, displayName: account.displayName ?? null }; };
    const leaveSession = () => { state.pending = null; state.lastSession = null; };
    const switchProgress = (progress: Progress, asGuest = false) => {
        state.progress = progress;
        if (asGuest)
            state.guestProgress = structuredClone(progress);
    };
    async function connectAccount(account: AccountUser) {
        await sync.connect(account.uid, state.guestProgress);
        setUser(account);
        state.reauthNeeded = false;
        await storeUser(state.user);
        showAccount();
        chooseSection('name');
        state.registerAccount = false;
        switchProgress(structuredClone(sync.cache!.progress));
        leaveSession();
        await restoreCourse();
        scheduleSync(0);
    }
    async function rememberAccount(account: AccountUser) {
        if (!state.user || account.uid !== state.user.uid)
            throw new Error('Konto się zmieniło. Zaloguj się ponownie.');
        setUser(account);
        await storeUser(state.user);
    }
    async function handleAction(...[action]: OwnerCall<'account'>): Promise<boolean> {
        if(!isOwnedBy('account',action))return false;
        switch(action){
        case 'account':{
            showAccount();
            clearError();
            return true;
        }
        case 'auth-toggle':{
            toggleRegistration();
            clearError();
            return true;
        }
        case 'refresh-account':{
            clearMessages();
            try {
                if (!isOnline())
                    throw new Error('Odświeżenie danych konta wymaga internetu.');
                const account = await deadline((await firebase()).restoreUser());
                if (!account)
                    throw new Error('Zaloguj się ponownie.');
                await rememberAccount(account);
                notify('Dane konta zostały odświeżone.');
            }
            catch (error) {
                fail(error);
            }
            return true;
        }
        case 'logout':case 'switch-account':{
            setWorking(true);
            try {
                await (await firebase()).logout();
                await sync.disconnect();
                await storeUser(null);
                setUser(null);
                state.reauthNeeded = false;
                switchProgress(await loadGuestProgress(), true);
                leaveSession();
                await restoreCourse();
                notify('Wylogowano. Widoczny jest osobny zapis bez konta; wyniki konta pozostały zachowane.');
            }
            catch (error) {
                fail(error);
            }
            finally {
                setWorking(false);
            }
            return true;
        }
        case 'sync-now':{
            await sync.sync();
            return true;
        }
        case 'guest-copy':{
            if (hasProgress(state.progress) && !confirm('Postępy z tego urządzenia zastąpią bieżące postępy konta. Zachowamy kopię dotychczasowego zapisu. Kontynuować?'))
                return true;
            await sync.useGuest(state.guestProgress);
            scheduleSync(0);
            return true;
        }
        case 'guest-skip':{
            sync.dismissGuest();
            return true;
        }
        case 'resolve-local':case 'resolve-cloud':{
            if (!confirm('Wybrany zapis stanie się bieżącym. Druga wersja pozostanie do pobrania jako kopia sprzed zmiany. Kontynuować?'))
                return true;
            await sync.resolve(action === 'resolve-local' ? 'local' : 'cloud');
            return true;
        }
        case 'export-cloud':{
            await downloadProgress(sync.conflict?.remote?.progress ?? emptyProgress(), 'konto');
            return true;
        }
        case 'export-recovery': {
            if (!sync.cache?.recovery)
                return false;
            await downloadProgress(sync.cache.recovery, 'sprzed-zmiany');
            return true;
        }
        default:return unhandled(action);
        }
    }
    /** Formularz konta odczytany przez granicę zdarzeń (`app/form-payloads.ts`); kontroler nie widzi DOM-u. */
    function handleSubmit(form: AccountSubmit): void {
        if (form.kind === 'login') {
            const { email, password, name, reset } = form;
            void run(async () => {
                setWorking(true);
                clearMessages();
                try {
                    if (!isOnline())
                        throw new Error('Logowanie i odzyskanie hasła wymagają internetu. Możesz wrócić do nauki z lokalnym zapisem.');
                    const service = await firebase();
                    if (reset) {
                        await deadline(service.resetPassword(email));
                        notify('Jeśli dla tego adresu dostępne jest odzyskiwanie hasła, otrzymasz wiadomość. Sprawdź też spam.');
                    }
                    else {
                        const account = await deadline(service.login(email, password, state.registerAccount, name));
                        await connectAccount(account);
                        notify('Zalogowano. Postępy bez konta są przechowywane osobno.');
                    }
                }
                catch (error) {
                    fail(error);
                }
                finally {
                    setWorking(false);
                }
            });
            return;
        }
        chooseSection(form.kind === 'profile' ? 'name' : form.kind === 'email' ? 'email' : 'password');
        void run(async () => {
            clearMessages();
            setWorking(true);
            try {
                if (!isOnline())
                    throw new Error('Zmiana ustawień konta wymaga internetu. Postępy pozostają zapisane.');
                if (form.kind === 'password' && form.next !== form.confirm)
                    throw new Error('Nowe hasła nie są takie same. Wpisz je ponownie.');
                const service = await firebase();
                if (form.kind === 'profile') {
                    await rememberAccount(await deadline(service.changeName(form.name, state.user!.uid)));
                    notify('Imię zostało zapisane.');
                }
                else if (form.kind === 'email') {
                    await deadline(service.changeEmail(form.email, form.password, state.user!.uid));
                    notify('Wysłaliśmy link na nowy adres. Otwórz go, aby potwierdzić zmianę e-maila. Do tego czasu działa dotychczasowy adres.');
                }
                else {
                    await deadline(service.changePassword(form.password, form.next, state.user!.uid));
                    notify('Hasło zostało zmienione. Przy kolejnym logowaniu użyj nowego hasła.');
                }
            }
            catch (error) {
                fail(error);
            }
            finally {
                setWorking(false);
            }
        });
    }
    return { handleAction, handleSubmit, connectAccount, rememberAccount };
}
