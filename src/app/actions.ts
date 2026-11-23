// Spis akcji aplikacji: jedyne miejsce, w którym akcja z `data-action` dostaje nazwę i właściciela.
// „Kto obsługuje akcję X?” — wystarczy wyszukać jej nazwę tutaj. Widoki budują `data-action` z tego
// typu (`act()` w `ui.ts`), a kontrolery obsługują swoje akcje wyczerpującym `switch`, więc literówka
// lub akcja bez obsługi nie przejdzie kompilacji. Zasady: docs/05-architektura.md, „Spis akcji”.
export const actionOwners = {
    /** Wersja aplikacji (PWA) i przejścia między ekranami bez własnej logiki. */
    app: ['pwa-install', 'pwa-prepare', 'pwa-update', 'home', 'progress', 'backup'],
    /** Odsłuchanie: nie zmienia postępów, więc nie zapisuje i nie przerysowuje (D-58). */
    speech: ['listen'],
    house: ['house-edit', 'grid-move', 'grid-nudge', 'grid-place', 'select-room', 'house', 'house-tab', 'select-decoration', 'buy-decoration', 'place-decoration'],
    account: ['account', 'auth-toggle', 'refresh-account', 'logout', 'switch-account', 'sync-now', 'guest-copy', 'guest-skip', 'resolve-local', 'resolve-cloud', 'export-cloud', 'export-recovery'],
    backup: ['older-history', 'export', 'cancel-import', 'confirm-import'],
    /** Nawigacja między ekranami nauki. */
    navigation: ['continue-lesson', 'following-lesson', 'retry-maps', 'prepare-training', 'warmup', 'courses', 'progress-course', 'select-course', 'resume', 'module', 'quick-start', 'course-practice', 'grammar', 'grammar-lesson', 'next-step', 'journeys', 'module-list', 'map', 'open-lesson'],
    /** Rozpoczynanie sesji (planery w `learning/start-*-plans.ts`). */
    starts: ['legendary', 'module-ritual', 'course-mode', 'grammar-practice', 'stage-review', 'begin-lesson', 'extra-training', 'mode', 'reading-start'],
    /** Odpowiedzi w trwającej sesji. */
    answers: ['pair-answer', 'gap-place', 'pair-select', 'bank-select', 'answer', 'retry', 'next'],
    reading: ['reading-next', 'reading-peek', 'reading-question-peek'],
} as const;

export type ActionOwner = keyof typeof actionOwners;
/** Nazwy akcji jednego właściciela, np. `ActionOf<'house'>`. */
export type ActionOf<O extends ActionOwner> = (typeof actionOwners)[O][number];
export type AppAction = ActionOf<ActionOwner>;

const owners = new Map<string, ActionOwner>(
    (Object.keys(actionOwners) as ActionOwner[]).flatMap(owner => (actionOwners[owner] as readonly string[]).map(action => [action, owner] as const)));

/** Ostatnia gałąź `switch(action)`: kompiluje się tylko wtedy, gdy obsłużono każdą akcję właściciela. */
export const unhandled = (_action: never): false => false;

/** Właściciel akcji albo `undefined`, gdy nazwa nie jest w spisie. */
export const ownerOf = (action: string): ActionOwner | undefined => owners.get(action);
export const isOwnedBy = <O extends ActionOwner>(owner: O, action: string): action is ActionOf<O> => owners.get(action) === owner;
