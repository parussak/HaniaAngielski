# Diagramy architektury

Obraz stanu kodu w `src/` — uzupełnia [architekturę](05-architektura.md) (tam jest „gdzie co leży” i zasady), [zasady kodu](zasady-kodu.md) (dlaczego tak) i [zapis](06-zapis.md) (pola i zgodność). Diagramy są w Mermaid, więc renderują się na GitHubie. Powstały z importów i typów w kodzie, nie z opisów; przy zmianie granic poprawiaj je razem z architekturą. Strzałka `A --> B` znaczy „A importuje B” albo „A wywołuje B”.

Spis: [1 · Warstwy](#1--warstwy-i-kierunek-zależności) · [2 · Przepływ akcji](#2--przepływ-akcji) · [3 · Rozpoczynanie sesji](#3--rozpoczynanie-sesji-d-76) · [4 · Kontrolery i wąskie stany](#4--kontrolery-i-wąskie-stany) · [5 · Model danych i zapis](#5--model-danych-i-zapis) · [6 · Treść i audio](#6--treść-i-audio)

## 1 · Warstwy i kierunek zależności

Katalog `app/` pełni dwie role. **Kontrakty** (`state.ts`, `actions.ts`, `action-payloads.ts`, `selectors.ts`) to typy i czyste selektory, z których korzystają wszystkie warstwy. **Okablowanie** (`events.ts`, `renderer.ts`, `views.ts`, `startup.ts`) łączy ekran z kontrolerami; to jedyne miejsce w `app/`, które importuje `views/` i `controllers/`. Zależności z `main.ts` nie rysuję poza okablowaniem — `main.ts` tylko składa części i wstrzykuje porty.

```mermaid
flowchart TD
    main["main.ts<br/>(składa i wstrzykuje porty)"]
    wiring["app/ okablowanie<br/>events, renderer, views, startup"]
    contracts["app/ kontrakty<br/>state, actions, action-payloads, selectors"]
    views["views/<br/>HTML ze stanu"]
    controllers["controllers/<br/>skutki: stan, zapis, pytania"]
    logic["logika (czyste funkcje)<br/>learning/, materials/, house/"]
    services["services/ i usługi główne<br/>storage, sync, firebase, content"]

    main --> wiring
    main --> controllers
    main --> services
    wiring --> views
    wiring --> controllers
    views --> contracts
    controllers --> contracts
    views --> logic
    controllers --> logic
    services --> logic

    logic -. "ZAKAZ: DOM, window, app/, controllers/, views/" .-> wiring
    controllers -. "ZAKAZ: DOM, window, main.ts, pełny AppState" .-> main
    views -. "ZAKAZ: importowanie kontrolerów i zapis wyników" .-> controllers

    linkStyle 10,11,12 stroke:#c0392b,stroke-dasharray:4 3,color:#c0392b
```

Co z tego wynika i czego diagram nie pokazuje:

- Widok nie importuje kontrolera: wywołanie akcji idzie przez atrybut `data-action` i `app/events.ts` (diagram 2). Wyniki zmienia wyłącznie `mutate` z `controllers/progress.ts` (diagram 5).
- Kontroler nie zna DOM-u ani `window`: pytanie (`confirm`), przeładowanie (`reload`), zapis i PWA wchodzą jako porty (diagram 4). Zamiast całego `AppState` dostaje własny wąski interfejs `*State`.
- Logika (`learning/`, `materials/`, `house/`) nie używa DOM, `window`, IndexedDB ani Firebase i nie importuje `app/`, `controllers/`, `views/`. Pilnuje tego `tests/refactor-boundaries.test.ts`.
- Pliki w katalogu głównym `src/` nie tworzą jednej warstwy: `storage.ts`, `sync.ts`, `firebase.ts`, `history.ts`, `content.ts`, `pwa.ts`, `speech.ts` to usługi (porty dla kontrolerów), a `answers.ts`, `stage-review.ts`, `polish-count.ts` — dodatkowa logika, z której korzysta `learning/`.
- Importy wewnątrz logiki nie są jednokierunkowe. `learning/` i `materials/` importują się nawzajem (`materials/model.ts` bierze typy `Module` i `Word` z `learning/model.ts`, a `learning/` korzysta z `materials/`), a `learning/` zależy też od `house/` (m.in. `lesson-session.ts` → `house/progress.ts`, `journey-validation.ts` → `house/catalog.ts`) i od typu `HistorySummary` z `history.ts`. To są zależności od typów i katalogów danych, a nie od DOM; nie ma zależności z logiki do `app/`, `controllers/` ani `views/`.
- `services/sync-scheduler.ts` importuje `app/state.ts` (typ stanu do odczytu etykiety zapisu) — jedyna zależność usługi od `app/`.

## 2 · Przepływ akcji

Każde kliknięcie z `data-action` przechodzi tę samą drogę. Akcja `listen` (odsłuchanie) jest wyjątkiem: `speech.handleAction` nie zapisuje i nie rysuje ekranu, więc omija część poniżej (D-58).

```mermaid
sequenceDiagram
    autonumber
    actor U as Użytkownik
    participant V as widok (act w ui.ts)
    participant E as app/events.ts
    participant P as app/action-payloads.ts
    participant R as renderer.run
    participant O as app/actions.ts (actionOwners)
    participant K as kontroler właściciela
    participant L as planer (learning/)
    participant M as mutate (controllers/progress.ts)

    V-->>U: przycisk z data-action i data-pola
    U->>E: kliknięcie
    E->>P: readCall(nazwa, element)
    P-->>E: ActionCall (typowany payload) albo null
    E->>R: run(() => action(nazwa, call))
    E->>E: state.notice = ""
    E->>O: ownerOf(nazwa)
    O-->>E: właściciel (app, house, account, starts, ...)
    E->>K: handleAction(...call)
    K->>O: isOwnedBy(właściciel, akcja)
    K->>L: planer czyta wycinek danych
    L-->>K: opis wyniku (np. StartPlan)
    K->>K: powłoka: stan ekranu, komunikat, pytanie
    K->>M: mutate(zmiana na kopii Progress)
    M-->>K: zapisano (potwierdzenie przed zmianą ekranu)
    K-->>E: true
    R->>R: render() ekranu, fokus
```

- Brak właściciela (`undefined`) albo brak wymaganego pola (`call === null`) oznacza, że nic się nie dzieje. Nieznana nazwa akcji nie skompiluje się w widoku, bo `act()` przyjmuje tylko `AppAction`.
- Nie każda akcja ma planer ani zapis: akcje stanu ekranu (np. `home`, `house-tab`) kończą się na zmianie stanu i renderze. Kroki z planerem i `mutate` dotyczą tylko akcji, które rozstrzyga logika i zapisują postępy.
- Właściciele `navigation`, `starts`, `answers`, `reading` trafiają do jednego kontrolera `learning`, który przekazuje je dalej (diagram 4). Pozostali właściciele (`house`, `backup`, `account`, `app`, `speech`) mają po jednym kontrolerze.

## 3 · Rozpoczynanie sesji (D-76)

Decyzja (co ma się stać) jest w czystych planerach, skutek (pytanie, stan, zapis) w jednej powłoce. Typ wyniku `StartPlan` jest w `learning/start-plan.ts`.

```mermaid
classDiagram
    direction LR
    class StartInput {
        courseModules
        modules
        journeys
        journeyIssues
        progress
        answerMode
        previous
        selected
        currentJourney
        lastSession
        grammarTopicIds
    }
    class Selection {
        module?
        journeyKey?
        introLessonId?
        answerMode?
        mode?
    }
    class StartPlan {
        selection?: Selection
    }
    class ignore { kind }
    class notice { text }
    class resume { kind }
    class intro { kind }
    class open {
        session
        confirm: string | null
        afterConfirm?: Selection
        resetRewards
    }
    StartPlan <|-- ignore
    StartPlan <|-- notice
    StartPlan <|-- resume
    StartPlan <|-- intro
    StartPlan <|-- open
    StartPlan o-- Selection
```

`StartPlan` to unia z polem `kind`: `ignore` (nic), `notice` (komunikat), `resume` (powrót do trwającej sesji), `intro` (ekran wprowadzenia lekcji), `open` (nowa sesja). Poniżej przebieg dla akcji z właścicielem `starts`.

```mermaid
sequenceDiagram
    autonumber
    participant L as controllers/learning.ts
    participant S as controllers/session-start.ts
    participant PL as learning/start-lesson-plans.ts
    participant PP as learning/start-practice-plans.ts
    participant M as mutate
    participant ST as stan (SessionStartState)
    actor U as Użytkownik

    L->>S: handleAction (właściciel starts)
    S->>M: preparePlans() — plan sekcji (tylko begin-lesson, module-ritual)
    S->>S: startInput() — wycinek stanu do odczytu
    alt akcje lekcji i mapy
        S->>PL: planBeginLesson / planLegendary / planStageReview...
        PL-->>S: StartPlan
    else akcje ćwiczeń poza mapą
        S->>PP: planRitual / planExtraTraining / planCourseMode / planMode / planGrammarPractice / planReadingStart
        PP-->>S: StartPlan
    end
    S->>ST: applySelection(plan.selection)
    alt kind = open i confirm nie jest null
        S->>U: confirm(newSessionConfirm) — gdy trwa aktywna sesja
        U-->>S: zgoda albo odmowa
    end
    S->>M: openSession: replaceActive(p, session)
    S->>ST: screen = "study" (resume), "lesson-intro" (intro), notice (notice)
```

- Planery nie dostają `AppState` ani nie pytają użytkownika; czyta je test planera bez stanu. Powłoka `applyPlan` jako jedyna pyta o zastąpienie aktywnej sesji (`confirmReplacement`).
- `lessonAfterFinished` (akcje `following-lesson`, `legendary` po zakończeniu lekcji) używa `planLessonAfterFinished`, którego wynikiem nie jest `StartPlan`, tylko typ `After` z `start-lesson-plans.ts`.

## 4 · Kontrolery i wąskie stany

Każdy kontroler to fabryka `createXController(state, ports)`. `AppState` spełnia wszystkie poniższe interfejsy strukturalnie (nie przez `implements`), ale kontroler widzi tylko swój. Kontroler nauki składa trzy podkontrolery; jego stan jest sumą ich stanów.

```mermaid
classDiagram
    direction LR
    class AppState
    class JourneyScope
    class SessionStartState
    class AnswerState
    class ReadingState
    class LearningState
    class LearningController { navigation }
    class SessionStartController { starts }
    class SessionAnswerController { answers }
    class ReadingController { reading }

    SessionStartState --|> JourneyScope
    LearningState --|> SessionStartState
    LearningState --|> AnswerState
    LearningState --|> ReadingState
    LearningController ..> LearningState
    SessionStartController ..> SessionStartState
    SessionAnswerController ..> AnswerState
    ReadingController ..> ReadingState
    LearningController *-- SessionStartController
    LearningController *-- SessionAnswerController
    LearningController *-- ReadingController
    AppState ..> LearningState : spełnia strukturalnie
```

Pozostałe kontrolery, ich stany i porty. Porty to wszystko, co leży poza stanem: zapis, sieć, okno przeglądarki. Wstrzykuje je `main.ts` (a `events.ts` dla kontrolerów `app` i `speech`); w testach są atrapami.

```mermaid
flowchart LR
    AppState["AppState<br/>(spełnia wszystkie *State)"]
    subgraph kontrolery
        ctrlApp["app.ts<br/>AppControllerState"]
        ctrlHouse["house.ts<br/>HouseState"]
        ctrlBackup["backup.ts<br/>BackupState"]
        ctrlAccount["account.ts<br/>AccountState"]
        ctrlCourses["courses.ts<br/>CourseState"]
        ctrlProgress["progress.ts<br/>ProgressState"]
        ctrlSearch["grammar-search.ts<br/>GrammarQueryStore"]
    end
    ports["porty:<br/>mutate, run, confirm, reload,<br/>saveFile, scheduleSync, firebase,<br/>read/write, store, fetchHistoryPage"]
    ctrlProgress -->|"udostępnia mutate"| ports
    ports --> ctrlHouse
    ports --> ctrlBackup
    ports --> ctrlAccount
    ports --> ctrlApp
    ports --> ctrlCourses
    AppState -. "wąski odczyt" .-> kontrolery
```

| Kontroler | Stan | Najważniejsze porty |
| --- | --- | --- |
| `app.ts` | `AppControllerState` | `confirm`, `installPwa`, `prepareOffline`, `applyUpdate` |
| `house.ts` | `HouseState` | `mutate`, `courseId` |
| `backup.ts` | `BackupState` | `mutate`, `getHistoryPage`, `saveHistoryPage`, `saveFile`, `run` |
| `account.ts` | `AccountState` | `sync`, `scheduleSync`, `firebase`, `confirm`, `isOnline`, `loadGuestProgress`, `storeUser`, `run`… |
| `courses.ts` | `CourseState` | `read`, `write` (wybór kursu w IndexedDB) |
| `progress.ts` | `ProgressState` | `sync`, `store`, `run`, `render`, `scheduleSync`, `isOnline`, `fetchHistoryPage` |
| `learning.ts` | `LearningState` | `mutate`, `reload`, `confirm`, `courses`, `scheduleReviewMigration` |
| `session-start.ts` | `SessionStartState` | `mutate`, `confirm` |
| `session-answers.ts` | `AnswerState` | `mutate`, `courseId` |
| `reading.ts` | `ReadingState` | `mutate` |
| `grammar-search.ts` | `GrammarQueryStore` | — (tylko `grammarQuery`) |
| `speech.ts` | — | — (nie zapisuje) |

## 5 · Model danych i zapis

### Model

Treść (kurs, moduł, mapa) jest wspólna dla kont; postępy (`Progress`) są osobne dla każdego konta. Pola w diagramie są wyborem — komplet jest w `learning/model.ts`, a opis i zasady zgodności w [zapisie](06-zapis.md#słownik-pól). Typ `Course` jest w `materials/model.ts`, a `Module`, `Progress`, `Session`, `Item`, `Attempt` w `learning/model.ts`; `Journey`, `Stage`, `Lesson` w `learning/journey.ts`; `Adventure` w `learning/adventure-state.ts`.

```mermaid
classDiagram
    direction LR
    class Course {
        id
        moduleIds
        grammarTopics?
    }
    class Module {
        id
        version
        words
        exercises
        grammar
        scenes?
        readings?
        journeyPaths?
    }
    class Journey {
        moduleId
        id?
        stages
        rewards?
    }
    class Stage {
        id
        lessons
    }
    class Lesson {
        id
        wordIds
        exerciseIds
        ruleIds
    }
    class Progress {
        version
        sessions
        active
        words
        difficult
        adventure?
        history?
    }
    class Session {
        id
        moduleId
        mode
        items
        index
        phase
        attempts
        lesson?
    }
    class Item {
        key
        moduleId
        type
        id
        input
    }
    class Attempt {
        key
        first
        answer
        corrections
    }
    class Adventure {
        completed
        earned
        purchases
        courseHomes?
        memory?
    }

    Course "1" o-- "*" Module : moduleIds
    Journey "*" --> "1" Module : moduleId
    Journey *-- Stage
    Stage *-- Lesson
    Lesson ..> Module : wordIds, exerciseIds, ruleIds
    Progress *-- Session : sessions, active
    Session *-- Item
    Session *-- Attempt
    Item ..> Module : moduleId + id
    Progress *-- Adventure
```

Klucze map (`journeyKey`) i lekcji (`lessonKey`) łączą mapę z zapisem: `Adventure.completed` i `Session.lesson.id` wskazują lekcję tym kluczem, więc nie zmieniamy `id` (D-52).

### Zapis lokalny i synchronizacja

```mermaid
flowchart TD
    ctrl["kontroler<br/>(po akcji)"]
    mutate["mutate<br/>controllers/progress.ts<br/>kopia → zmiana → zapis → commitSaved"]
    guest["gość:<br/>prepareProgress → storage.save<br/>IndexedDB 'current'"]
    acct["konto: ProgressSync.save (sync.ts)<br/>lokalny rekord account:uid"]
    sched["services/sync-scheduler.ts<br/>scheduleSync"]
    cloud["ProgressSync.sync → firebase.pushProgress<br/>Firestore (kontrola wersji)"]
    conflict["SyncConflict →<br/>kontroler konta: resolve-local / resolve-cloud"]
    history["storage.putHistoryPage<br/>archiwum historii"]
    backup["learning/backup.ts<br/>eksport / import kopii"]

    ctrl --> mutate
    mutate -->|"brak użytkownika"| guest
    mutate -->|"zalogowany"| acct
    mutate --> sched
    sched --> cloud
    cloud -->|"zmiana na innym urządzeniu"| conflict
    acct -.-> history
    backup -->|"import przez mutate, po potwierdzeniu"| mutate
```

- Stan ekranu (`AppState`) nie jest zapisywany; zapis obejmuje `Progress`, archiwum historii i lokalne preferencje poza postępami ([zapis](06-zapis.md#gdzie-leżą-dane)).
- Wywołania `firebase.ts` idą przez leniwy `services/firebase-client.ts` (`sdk()`); `firebase` jest jedyną zależnością w działaniu.

## 6 · Treść i audio

Treść kursów jest danymi: ta sama funkcja `readLibrary` czyta je w przeglądarce, w testach, w kontroli treści i w generatorze audio. Aplikacja nie importuje niczego ze `scripts/`; generator importuje z `src/` (czytanie biblioteki, klucze pytań, normalizację tekstu), w drugą stronę zależności nie ma.

```mermaid
flowchart LR
    subgraph repo["repozytorium"]
        content["public/content/<br/>katalog.json → kurs.json →<br/>modul.json, slownictwo, quiz,<br/>cwiczenia, gramatyka, rozmowki,<br/>czytanki, mapy"]
        lib["materials/library.ts<br/>readLibrary(read)"]
        val["content-validation.ts<br/>assembleModule, validateModules<br/>+ materials/validation.ts"]
        jval["learning/journey-validation.ts<br/>validateJourney, readJourneys"]
    end
    subgraph aplikacja["aplikacja (przeglądarka)"]
        load["content.ts, services/journeys.ts<br/>fetch + cache PWA"]
        speech["speech.ts, speech/recorded-speaker.ts<br/>audio/catalog.json + clips/*.ogg"]
    end
    subgraph audio["narzędzia audio (poza aplikacją)"]
        gen["scripts/audio/<br/>generate, plan, publish, verify<br/>+ audio/config.json"]
    end
    check["scripts/check-content.mjs<br/>(npm run check:content)"]

    content --> lib
    lib --> val
    content --> jval
    load --> lib
    load --> jval
    check --> lib
    check --> jval
    gen --> lib
    gen -->|"audio/generated → publish"| speech
```

- Walidacja odrzuca błędny plik z czytelnym komunikatem (moduł: `readLibrary` rzuca błąd; mapa: `readJourneys` izoluje błąd jednej mapy — [odporność map](odpornosc-map.md)).
- Nagrania są plikami statycznymi: `publish.mjs` buduje lekki indeks `audio/catalog.json` i klipy `clips/*.ogg`, a aplikacja pobiera je i odtwarza z zapasem w postaci syntezy i ciszy (`speech.ts`). Szczegóły i kolejność — [generowanie audio](generowanie-audio.md). Nagrania generuje się dopiero po zatwierdzeniu treści.
- Zakres kontroli: `npm run check:content` (treść), `npm run audio:check` (zgodność nagrań z treścią) — [testy](07-testy.md).
