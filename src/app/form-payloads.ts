import type {AnswerMode} from '../learning/model.ts';
/**
 * Granica zdarzeń formularzy i pól (D-78): jedyne miejsce, które czyta elementy DOM tych zdarzeń.
 * Kontrolery dostają typowane dane, nigdy element ani zdarzenie.
 */

/** Formularz konta po odczycie. `login` obejmuje też odzyskanie hasła (`reset`). */
export type AccountSubmit =
    | { kind: 'login'; email: string; password: string; name: string; reset: boolean }
    | { kind: 'profile'; name: string }
    | { kind: 'email'; email: string; password: string }
    | { kind: 'password'; password: string; next: string; confirm: string };

/** Plik kopii wybrany przez użytkownika — tylko to, co kontroler z niego czyta. */
export interface ImportFile {
    readonly size: number;
    text(): Promise<string>;
}

/** Zmiana ustawienia nauki odczytana z pola formularza. */
export type SettingChange =
    | { kind: 'answerMode'; value: AnswerMode }
    | { kind: 'previous'; checked: boolean };

/** Odczytuje formularz konta; `null`, gdy zdarzenie pochodzi z innego formularza. */
export function readAccountSubmit(ev: SubmitEvent): AccountSubmit | null {
    const form = ev.target as HTMLFormElement;
    const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
    const value = (name: string) => field(name).value;
    switch (form.id) {
        case 'profile-form': return { kind: 'profile', name: value('displayName') };
        case 'email-form': return { kind: 'email', email: value('email'), password: value('currentPassword') };
        case 'password-form': return { kind: 'password', password: value('currentPassword'), next: value('newPassword'), confirm: value('confirmPassword') };
        case 'account-form': return {
            kind: 'login', email: value('email').trim(), password: value('password'),
            name: (form.elements.namedItem('displayName') as HTMLInputElement | null)?.value ?? '',
            reset: ev.submitter?.getAttribute('value') === 'reset',
        };
        default: return null;
    }
}

/** Plik z pola wyboru kopii (`#import-file`); `null`, gdy to inne pole albo nic nie wybrano. */
export function readImportFile(target: EventTarget | null): ImportFile | null {
    const input = target as HTMLInputElement | null;
    if (input?.id !== 'import-file') return null;
    return input.files?.[0] ?? null;
}

/** Ustawienie nauki z pola formularza; `null`, gdy pole nie jest ustawieniem. */
export function readSetting(target: EventTarget | null): SettingChange | null {
    const input = target as HTMLInputElement | null;
    if (!input) return null;
    if (input.name === 'answerMode') return { kind: 'answerMode', value: input.value as AnswerMode };
    if (input.id === 'previous') return { kind: 'previous', checked: input.checked };
    return null;
}
