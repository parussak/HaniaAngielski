# Gdzie wprowadzać zmiany

`src/main.ts` uruchamia aplikację i łączy jej części. Nie zawiera już szablonów ekranów, oceniania odpowiedzi ani formularzy konta.

| Zmiana | Miejsce |
| --- | --- |
| Wygląd strony startowej i ramki kontynuacji | `src/views/home.ts`, `src/home.css` |
| Wybór następnej lekcji lub modułu | `src/next-step.ts` |
| Lista map i modułów | `src/views/catalog.ts` |
| Ekran ćwiczenia, błąd, poprawka i podsumowanie | `src/views/study.ts` |
| Ustawienia ćwiczeń i ściąga gramatyczna | `src/views/setup.ts` |
| Konto, logowanie i formularze ustawień | `src/views/account.ts`, `src/controllers/account.ts` |
| Wygląd postępów i kopii | `src/views/progress.ts`, `src/views/backup.ts` |
| Import, eksport i pobieranie starszej historii | `src/controllers/backup.ts` |
| Rozpoczęcie sesji, odpowiedzi, nagrody, domek | `src/controllers/learning.ts` |
| Zapis zmiany i odtwarzanie starszych błędów | `src/controllers/progress.ts` |
| Obsługa kliknięć, formularzy i przejść | `src/app/events.ts` |
| Rejestr ekranów | `src/app/views.ts` |
| Odświeżanie ekranu, fokus i blokada przy zapisie | `src/app/renderer.ts` |
| Rozruch, odczyt konta i blokada drugiej karty | `src/app/startup.ts` |
| Stan otwartego interfejsu | `src/app/state.ts` |
| Typy materiałów i zapisanych wyników | `src/learning/model.ts` |
| Treść pytania, warianty i ocenianie | `src/learning/questions.ts`, `src/answers.ts` |
| Przebieg sesji i wynik pierwszej próby | `src/learning/session.ts` |
| Statystyki oraz walidacja kopii | `src/learning/statistics.ts`, `src/learning/backup.ts` |
| Synchronizacja, konflikty i rozdzielenie kont | `src/sync.ts` |
| Firebase i planowanie synchronizacji | `src/firebase.ts`, `src/services/` |
| IndexedDB i archiwum historii | `src/storage.ts`, `src/history.ts`, `src/history-backup.ts` |
| PWA i cache offline | `src/pwa.ts`, `scripts/build-sw.mjs` |
| Materiały podręcznika | `public/content/` |

## Przepływ działania

Widok wyświetla dane i przyciski z `data-action`. Obsługa zdarzeń przekazuje działanie do odpowiedniego kontrolera. Kontroler ćwiczeń lub konta korzysta z wydzielonej logiki i usług, a zmiany wyników przechodzą przez `mutate` w kontrolerze postępów. Po zakończeniu operacji renderer odświeża ekran.

Widoki nie zapisują wyników. Moduły z `learning/` nie korzystają z DOM, Firebase ani IndexedDB. Kontrolery otrzymują potrzebne usługi jako argumenty; żaden nie importuje `main.ts`. `AppState` zawiera stan bieżącego interfejsu i nie jest zapisywany jako całość.

## Zgodność danych

- `src/core.ts` pozostaje wspólnym punktem eksportu istniejących funkcji i typów; zachowano dotychczasowy interfejs.
- Kopie i zapis postępów nadal mają wersję `1`; zachowano nazwy pól, identyfikatory materiałów i kont, rewizje oraz klucze IndexedDB i Firestore.
- `mutate` nadal pracuje na kopii wyników, sprawdza wersję zapisu konta i potwierdza zapis przed aktualizacją interfejsu.
- Zachowano reguły archiwizacji historii, ochronę przed konfliktem dwóch urządzeń i blokadę dwóch otwartych kart.
- Kolejność stylów pozostaje: `style.css`, `theme.css`, `adventure.css`, `home.css`. Nie należy jej zmieniać przy porządkowaniu importów.

Ta reorganizacja nie wymaga migracji wyników, nowych reguł Firebase ani ponownego zakładania kont.

## Sprawdzanie zmian

Uruchom `npm.cmd test` i `npm.cmd run build`. Dla zmian w interfejsie lub obsłudze aplikacji uruchom też Playwright zgodnie z README. Istniejące testy obejmują starsze kopie, archiwizację, wznowienie sesji, wiele kont, konflikty, tryb offline i małe ekrany telefonu.

Przy kolejnej zmianie zacznij od wskazanego obszaru i jego testów. Nie przenoś logiki z powrotem do `main.ts` ani nie zmieniaj formatu postępów przy zmianie wyglądu.
