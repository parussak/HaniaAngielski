# Zasady projektowania i kodu

Status: **projekt do zatwierdzenia przez Paulinę.** Według tych zasad ChatGPT pisze kod, a Claude ocenia zmiany w [przeglądzie jakości](proces-pracy.md#przegląd-jakości--claude). Mapa plików: [architektura](05-architektura.md); tory pracy: [AGENTS.md](../AGENTS.md).

## 1. Zasady projektowania

1. **Warstwy.** Widok (`views/`) → akcja `data-action` → `app/events.ts` → kontroler (`controllers/`) → logika (`learning/`, `materials/`, `house/`) → `mutate` → zapis. Widok tylko składa HTML ze stanu. Kontroler łączy logikę z usługami. `main.ts` tylko łączy części.
2. **Logika bez wejścia/wyjścia.** Pliki logiki nie używają DOM, `window`, IndexedDB, Firebase ani `localStorage` i nie importują `app/`, `controllers/`, `views/`. Funkcja dostaje dane w argumentach. Może zmieniać przekazany szkic `Progress` (tak działają `recordAnswer`, `closeBoard`, `retryAnswer`), ale tylko wewnątrz `mutate`.
3. **Wyniki zmieniamy tylko przez `mutate`** (`controllers/progress.ts`): praca na kopii, kontrola wersji konta, zapis, dopiero potem nowy stan ekranu. Kontrolery dostają `mutate` jako port; nie wołają `save` ani `sync` bezpośrednio.
4. **Mechanika nie zna kursów ani języków.** Kod nie sprawdza `unit-2-food`, `angielski-hani` ani reguł konkretnego języka. To, co różni kursy, przychodzi z plików treści (`public/content/`) lub z ustawień kursu (np. `languageCode`).
5. **Zgodność danych.** Kopia zostaje w wersji 1, nowe pola są opcjonalne, brak pola = dotychczasowe zachowanie, identyfikatory i `rev` się nie zmieniają, rozpoczęta sesja wznawia się z własnej listy zadań — szczegóły w [zapisie](06-zapis.md#zasady-zgodności).
6. **Wyliczaj zamiast zapisywać.** Co da się odtworzyć z `items`, `attempts` i treści, nie dostaje własnego pola ([lista](06-zapis.md#wyliczane-nie-zapisywane)).
7. **Nowa forma to oprawa, nie nowa treść.** Nowy sposób pokazania zadania (jak `pairGroup`, `presentation: bank`, `listen`) korzysta z istniejących `word`/`exercise` i ich oceniania, zamiast tworzyć drugi zestaw odpowiedzi.

## 2. Jak dodać

Każda zmiana zasady nauki zaczyna się od decyzji D-xx w [rejestrze](decyzje.md).

### Nowy typ ćwiczenia

1. Najpierw sprawdź, czy wystarczy oprawa istniejącego zadania (zasada 7).
2. Typ: `learning/model.ts` — pole opcjonalne (`kind`, `presentation` lub znacznik elementu sesji).
3. Walidacja treści: `content-validation.ts` (`assembleModule`, `validateModules`) — błędny plik ma być odrzucony z czytelnym komunikatem.
4. Pytanie i ocena: `learning/questions.ts` (`questionFor`, `isCorrect`) albo nowy plik w `learning/` (wzór: `boards.ts`, `scenes.ts`).
5. Widok: `views/study.ts` lub `views/lesson-activities.ts`; obsługa akcji w `controllers/session-start.ts` (rozpoczęcie sesji) lub `controllers/session-answers.ts` (odpowiedź w trwającej sesji); wzór osobnej oprawy: `learning/readings.ts` i `controllers/reading.ts`.
6. Jeśli sesja dostaje nowe pole — przepis niżej.
7. Format dla autorów treści: [format materiałów](format-materialow.md).
8. Testy: logika na fiksturze z `tests/fixtures/`, przebieg w `tests/browser/` na wąskim ekranie.

### Nowe pole w sesji lub postępach

1. `learning/model.ts`: pole **opcjonalne**; jego brak oznacza dotychczasowe zachowanie.
2. Walidacja kopii: właściwy plik w `learning/backup-validation/` (`session.ts`, `progress.ts`, `adventure.ts`…) — przyjmij poprawne, odrzuć błędne.
3. Nie podnoś wersji kopii i nie regeneruj `tests/fixtures/backup-validation-results.json`.
4. Znaczniki „już naliczone” (jak `rewarded`) chronią przed podwójną nagrodą po odświeżeniu, imporcie i synchronizacji.
5. Testy: stara kopia (`tests/fixtures/backup-v1.json`) i rozpoczęta sesja bez pola dalej działają; nowa wartość przechodzi eksport → import.
6. Opis pola: słownik w [zapisie](06-zapis.md#słownik-pól).

### Nowy ekran

1. Nazwa ekranu w liście `screens` w `app/state.ts` — z niej powstaje typ `Screen` i z niej korzysta cofanie w `app/navigation.ts`.
2. Widok: funkcja w `views/<nazwa>.ts` zwracająca HTML; tekst z danych zawsze przez `e()` z `ui.ts`.
3. Rejestracja w `views` w `app/views.ts`.
4. Przyciski z `data-action` i `data-*`; obsługa w `handleAction` właściwego kontrolera (kolejność w `app/events.ts`: domek, nauka, kopia, konto).
5. Test w `tests/browser/` na telefonie 320–430 px; wiersz w [architekturze](05-architektura.md).

### Nowy rodzaj treści

1. Opis formatu: [format materiałów](format-materialow.md); pliki w `public/content/<moduł>/`, lista w `katalog.json`.
2. Wczytanie i walidacja: `content.ts`, `content-validation.ts` lub `materials/`; ta sama funkcja (`readLibrary`) dla przeglądarki, testów i budowania.
3. `npm run check:content` musi sprawdzać nowy rodzaj dla każdego kursu, bez wyjątków dla jednego modułu.
4. Mechanika i treść to osobne zmiany — [tory pracy](../AGENTS.md#tory-pracy--jedna-zmiana-jeden-tor).

## 3. Konwencje kodu

- **Moduły:** importy z rozszerzeniem `.ts`, tylko eksporty nazwane, bez `export default`. Typy importujemy przez `import type` lub `type X`.
- **Klasy** tylko tam, gdzie już są (`AppState`, `ProgressSync`, `SyncConflict`). Poza tym funkcje.
- **Kontrolery** to fabryki `createXController(state, ports)`; zależności w interfejsie `XPorts` (np. `mutate`, `run`, `sync`). Inne części dostają je przez `ReturnType<typeof createXController>`. Kontroler nie importuje `main.ts`.
- **Akcje:** `handleAction(action, el): Promise<boolean>` — `true`, gdy akcja obsłużona.
- **Nazwy:** kod i identyfikatory po angielsku (`camelCase` dla funkcji, `PascalCase` dla typów), pliki `kebab-case.ts`. Tekst dla użytkownika po polsku. Komentarze krótkie, wyjaśniają „dlaczego”, z numerem decyzji, np. `// D-58: …`.
- **Typy:** `strict` TypeScript. Dane z zewnątrz (pliki, kopia, Firebase) to `unknown` do czasu walidacji. Unikaj `any` i `!` bez pewności.
- **Błędy — spokojna odmowa czy alarm:**
  - *Spokojna odmowa* — zwykła sytuacja w zabawie. Funkcja zwraca `false` (lub `undefined`), a kontroler wpisuje komunikat do `state.notice`. Przykład: poduszka na zajętym miejscu → „To miejsce jest zajęte”; „poprawka” bez błędu do poprawienia → nic się nie dzieje.
  - *Alarm* (`throw new Error('…')`) — tylko gdy dane są zepsute lub niedostępne, np. uszkodzony plik kopii, brak historii bez internetu. Komunikat po polsku i zrozumiały.
  - Każda akcja użytkownika idzie przez `run` (`app/renderer.ts`): alarm zostaje tam złapany, a ekran mówi, że dane są zachowane. Dlatego alarm przy zwykłej sytuacji straszyłby dziecko komunikatem o zapisie.
- **Zależności:** jedyna zależność w działaniu to `firebase`, ładowana leniwie (`services/firebase-client.ts`). Nowa biblioteka wymaga zgody Pauliny.
- **Wielkość:** jeden plik = jedna odpowiedzialność z [architektury](05-architektura.md). Plik powyżej ~10 KB lub funkcja robiąca kilka rzeczy to kandydat do podziału.
- **Format:** dopasuj się do stylu pliku. Nie przeformatowuj całych plików przy okazji zmiany — diff ma pokazywać tylko zmianę. W logice jedna instrukcja na linię.
- **Style CSS:** kolejność arkuszy jest ważna — [architektura](05-architektura.md#style).

## 4. Testy

Zasady i polecenia są w [testach](07-testy.md) i [danych testowych](../tests/README.md). Najważniejsze przy kodzie:

- Logika: test Node na fiksturze (`engineModule()` z `tests/fixtures/engine.ts`), który sprawdza efekt na `Progress`/`Session`, a nie wewnętrzną budowę funkcji.
- Kontroler: test z atrapą portów (wzór: `house-controller.test.ts`, `learning-controller.test.ts`), łącznie z błędem zapisu.
- Ekran: Playwright; napisy sprawdzaj na stronie (`getByRole`), nie szukając tekstu w plikach `.ts`.
- Zapis: stara kopia, konto i aktywna sesja.
- Food tylko w testach regresji, po identyfikatorze (`tests/materials.ts`).
- Nazwy testów po polsku, opisują zachowanie.
- Nie zmieniaj oczekiwań istniejącego testu bez zgody.

## 5. Lista kontrolna przeglądu (Claude)

Przy przeglądzie diffu od ostatniego przeglądu:

- [ ] Jedna zmiana — jeden tor; mechanika nie zmienia produkcyjnych JSON-ów.
- [ ] Logika nie importuje DOM, Firebase, IndexedDB ani `app/`/`controllers/`/`views/`.
- [ ] Wyniki zmieniane tylko w `mutate`; żadnego zapisu z widoku.
- [ ] Brak nowych odwołań do konkretnego kursu, modułu lub języka w `src/`.
- [ ] Nowe pola opcjonalne, walidowane w `backup-validation/`, opisane w [zapisie](06-zapis.md); brak zmian `id`/`rev`.
- [ ] Nic, co da się wyliczyć, nie jest zapisywane.
- [ ] Tekst z danych (treść kursu, kopia, imię z konta) wstawiony do HTML przechodzi przez `e()` z `ui.ts`. Bez tego znaki `<`, `>`, `"` przeglądarka czyta jako kod strony: zdanie `I <3 apples` zniknęłoby lub zepsuło zadanie.
- [ ] Błędy: odmowa przez wartość zwrotną i `notice`, wyjątki z polskim komunikatem, akcje przez `run`.
- [ ] Nowe zachowanie ma test efektu i przypadku brzegowego; zmienione oczekiwania testów mają zgodę.
- [ ] Brak nowych zależności, `any`, przeformatowanych całych plików.
- [ ] Rosnące pliki (>~10 KB) i powtórzony kod — wpisać jako kandydat do refaktoryzacji.
- [ ] Zmiana granic lub nowe pliki opisane w [architekturze](05-architektura.md); nowa zasada — w D-xx.

## 6. Rozbieżności w obecnym kodzie — kandydaci do refaktoryzacji

Stan na listopad 2026; poprawiamy przy okazji przeglądu, po wyborze Pauliny.

- **Duże pliki:** `views/study.ts` (~12 KB; `studyView` to jedna długa funkcja), `content-validation.ts`, `views/account.ts`.
- **Dwa style zapisu:** rozwinięty (wcięcia 4 spacje) i zbity w jednej linii (np. `learning/boards.ts`, `house/layout.ts`); w widokach linie do kilku tysięcy znaków. Brak automatycznego formatowania — wprowadzenie formatera to nowa zależność (zgoda Pauliny) i jednorazowy diff całych plików, osobno od innych zmian.
- **`any`** pozostaje w `firebase.ts` (`decode`) — dane z Firebase powinny być `unknown` do czasu walidacji.
