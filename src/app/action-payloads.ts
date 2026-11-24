// Dane akcji (payload): jedyne miejsce, które mówi, jakie pola `data-*` niesie każda akcja ze spisu.
// Widok zapisuje je przez `act(akcja, payload)` (ui.ts), a granica zdarzeń czyta je przez `readCall()`.
// Kontroler i planer dostają typowany obiekt, nigdy `dataset` ani element DOM (konstytucja, pkt 6).
// Nazwy pól to nazwy `dataset` (`speechKind` ↔ `data-speech-kind`). Zasady: docs/05-architektura.md, „Spis akcji”.
import {actionOwners,ownerOf,type ActionOf,type ActionOwner,type AppAction} from './actions.ts';

interface Spec { readonly kind: 'text' | 'number' | 'flag'; readonly optional?: true }
type Fields = Readonly<Record<string, Spec>>;
const text = { kind: 'text' } as const, maybeText = { kind: 'text', optional: true } as const;
const num = { kind: 'number' } as const, maybeNum = { kind: 'number', optional: true } as const;
/** Znacznik: obecny jako `data-x="true"` albo go nie ma. */
const flag = { kind: 'flag', optional: true } as const;
const none = {} as const;
/** Pola identyfikujące miejsce w domku, gdy ruch przychodzi z przeciągania (kontroler sprawdza, czy ekran się nie zmienił). */
const gridScope = { id: maybeText, owner: maybeText, course: maybeText, room: maybeText } as const;

/** Wymagane pole: gdy go brak, akcja nie jest wykonywana (`readCall` zwraca `null`). Opcjonalne: brak to `undefined`. */
export const payloadSchema = {
    'pwa-install': none, 'pwa-prepare': none, 'pwa-update': none, home: none, progress: none, backup: none,
    listen: { speechKind: maybeText, say: maybeText, lang: maybeText, slow: flag },
    'house-edit': none, 'grid-move': { ...gridScope, x: num, y: num }, 'grid-nudge': { ...gridScope, dx: maybeNum, dy: maybeNum }, 'grid-place': gridScope,
    'select-room': { id: maybeText }, house: none, 'house-tab': { tab: maybeText },
    // Ramka (x, y, w, h) czyta tylko przeciąganie; kontroler potrzebuje samego `id`.
    'select-decoration': { id: maybeText, x: maybeNum, y: maybeNum, w: maybeNum, h: maybeNum },
    'buy-decoration': { id: maybeText }, 'place-decoration': { id: maybeText, slot: maybeText },
    account: none, 'auth-toggle': none, 'refresh-account': none, logout: none, 'switch-account': none, 'sync-now': none,
    'guest-copy': none, 'guest-skip': none, 'resolve-local': none, 'resolve-cloud': none, 'export-cloud': none, 'export-recovery': none,
    'older-history': none, export: none, 'cancel-import': none, 'confirm-import': none,
    'continue-lesson': none, 'following-lesson': none, 'retry-maps': none, 'prepare-training': none, warmup: none, courses: none,
    'progress-course': { id: text }, 'select-course': { id: text }, resume: none, module: { id: text },
    'course-practice': none, grammar: none, 'grammar-lesson': { module: text, journey: text, id: text }, 'next-step': none, journeys: none,
    'module-list': none, map: { id: maybeText, journey: maybeText }, 'open-lesson': { id: maybeText },
    legendary: none, 'module-ritual': { kind: maybeText, module: maybeText, journey: maybeText }, 'course-mode': { mode: maybeText },
    'grammar-practice': { id: maybeText }, 'stage-review': { journey: maybeText, id: maybeText }, 'begin-lesson': { id: maybeText, restart: flag },
    'extra-training': { module: maybeText }, mode: { module: maybeText, mode: maybeText }, 'reading-start': { module: maybeText, id: maybeText },
    'pair-answer': { answer: maybeText }, 'gap-place': { key: maybeText, token: maybeText, answer: maybeText }, 'pair-select': { key: maybeText },
    'bank-select': { answer: maybeText }, answer: { answer: text }, retry: { key: maybeText }, next: none,
    'reading-next': none, 'reading-peek': { sentence: maybeText, word: maybeText }, 'reading-question-peek': { key: maybeText, term: maybeText },
} as const satisfies Record<AppAction, Fields>;

type Value<S extends Spec> = S['kind'] extends 'number' ? number : S['kind'] extends 'flag' ? boolean : string;
type Shape<F extends Fields> =
    { -readonly [K in keyof F as F[K] extends { optional: true } ? never : K]: Value<F[K]> } &
    { -readonly [K in keyof F as F[K] extends { optional: true } ? K : never]?: Value<F[K]> };
type Schema = typeof payloadSchema;
/** Dane akcji `A`; `undefined`, gdy akcja nie niesie żadnych pól. */
export type ActionPayload<A extends AppAction> = keyof Schema[A] extends never ? undefined : { [K in keyof Shape<Schema[A]>]: Shape<Schema[A]>[K] };
/** Argumenty widoku i kontrolera dla akcji `A`: sama nazwa albo nazwa i payload (bez payloadu, gdy akcja go nie ma). */
export type CallOf<A extends AppAction> = A extends AppAction ? (ActionPayload<A> extends undefined ? [action: A] : [action: A, payload: ActionPayload<A>]) : never;
export type ActionCall = CallOf<AppAction>;
/** Wywołanie akcji jednego właściciela — to przyjmuje jego kontroler. */
export type OwnerCall<O extends ActionOwner> = CallOf<ActionOf<O>>;
/** Argumenty `act()`: payload jest wymagany, gdy akcja ma wymagane pola. */
export type PayloadArgs<A extends AppAction> = ActionPayload<A> extends undefined ? [] : {} extends ActionPayload<A> ? [payload?: ActionPayload<A>] : [payload: ActionPayload<A>];
/** Akcje, które da się zbudować bez payloadu (`button()` i spółka). */
export type BareAction = { [A in AppAction]: [] extends PayloadArgs<A> ? A : never }[AppAction];

type Source = { readonly dataset: DOMStringMap };

/** Typowany payload z `data-*` elementu albo `null`, gdy brakuje wymaganego pola. Pola spoza schematu są ignorowane. */
export function payloadOf<A extends AppAction>(action: A, el: Source): ActionPayload<A> | null {
    const fields = payloadSchema[action] as Fields, keys = Object.keys(fields);
    if (!keys.length) return undefined as ActionPayload<A>;
    const payload: Record<string, string | number | boolean> = {};
    for (const key of keys) {
        const raw = el.dataset[key], spec = fields[key];
        if (raw === undefined) { if (!spec.optional) return null; continue; }
        if (spec.kind === 'number') payload[key] = Number(raw);
        else if (spec.kind === 'flag') { if (raw === 'true') payload[key] = true; }
        else payload[key] = raw;
    }
    return payload as ActionPayload<A>;
}

/** Wywołanie akcji o podanej nazwie z elementu, albo `null` dla nieznanej nazwy lub braku wymaganych danych. */
export function readCall(name: string, el: Source): ActionCall | null {
    if (ownerOf(name) === undefined) return null;
    const action = name as AppAction, payload = payloadOf(action, el);
    if (payload === null) return null;
    return (payload === undefined ? [action] : [action, payload]) as ActionCall;
}

/** Zawęża wywołanie do akcji jednego właściciela. */
export const isCallOwnedBy = <O extends ActionOwner>(owner: O, call: readonly [string, ...unknown[]]): call is OwnerCall<O> =>
    (actionOwners[owner] as readonly string[]).includes(call[0]);
