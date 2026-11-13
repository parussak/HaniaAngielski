# Architektura — mapa kodu

Gdzie w kodzie jest dana odpowiedzialność i jakich granic pilnujemy. Zasady działania opisują [nauka](03-nauka.md) i [zapis](06-zapis.md); tu jest tylko „gdzie”. Poprzednia wersja, z opisem realizacji kolejnych decyzji i etapów refaktoringu: [archiwum](archiwum/architektura-do-2026-11-13.md).

## Warstwy i przepływ

```
widok (views/) ──data-action──▶ app/events.ts ──▶ kontroler (controllers/)
                                                        │
                    logika (learning/, materials/, house/) ◀┤
                                                        ▼
                         controllers/progress.ts: mutate ──▶ zapis (storage, sync, Firebase)
                                                        │
                                   app/renderer.ts ◀────┘  (odświeżenie ekranu)
```

- **Widoki** (`src/views/`) renderują stan i przyciski z `data-action`. Nie zapisują wyników i nie zawierają reguł konkretnego języka.
- **Kontrolery** (`src/controllers/`) obsługują akcje, korzystają z logiki i usług przekazanych jako argumenty. Żaden nie importuje `main.ts`.
- **Logika** (`src/learning/`, `src/materials/`, `src/house/`) to czyste funkcje: bez DOM, Firebase i IndexedDB. Nie zna kursów ani modułów z nazwy (np. Food).
- **Zmiana wyników** zawsze przechodzi przez `mutate` w `controllers/progress.ts`: praca na kopii, kontrola wersji konta, potwierdzenie zapisu przed aktualizacją interfejsu.
- **`main.ts`** tylko uruchamia i łączy części; nie wracamy do umieszczania w nim logiki.
- **`AppState`** (`app/state.ts`) to stan otwartego interfejsu, nie zapisywany jako całość.
- **`src/core.ts`** to wspólny punkt eksportu dla zgodności starszych importów.

Granice importów pilnuje `tests/refactor-boundaries.test.ts` (np. domek nie zależy od modułu map i nagród).

## Gdzie co jest

### Aplikacja i ekrany

| Odpowiedzialność | Pliki |
| --- | --- |
| Rozruch, odczyt konta, blokada drugiej karty | `app/startup.ts` |
| Rejestr ekranów, nawigacja i cofanie | `app/views.ts`, `app/navigation.ts` |
| Odświeżanie ekranu, fokus, blokada przy zapisie, przerwanie dźwięku przy zmianie kontekstu | `app/renderer.ts` |
| Kliknięcia, formularze, przeciąganie słów do luk | `app/events.ts`, `app/gap-drag.ts` |
| Selektory stanu (np. bieżąca lekcja) | `app/selectors.ts` |
| Menu i etykiety mobilne | `views/shell.ts` |
| Strona startowa, następny krok | `views/home.ts`, `next-step.ts` |
| Katalog map i modułów, widok mapy i wprowadzeń | `views/catalog.ts`, `adventure-view.ts` |
| Ekran ćwiczenia, błąd, poprawka, podsumowanie | `views/study.ts` |
| Plansze par i luk, sceny | `views/lesson-activities.ts` |
| Trzy akcje po lekcji, kocie łapki | `views/lesson-summary-actions.ts`, `views/lesson-rating.ts` |
| Kocie rozmówcy w scenach, przydział kotów | `views/scene-actors.ts`, `cats.ts` |
| Zaproszenia (rozgrzewka, finał), ekran rozgrzewek, przygotowanie treningu | `views/cat-invitation.ts`, `views/warmup.ts`, `views/training-preparation.ts` |
| Ustawienia ćwiczeń i ściąga gramatyczna | `views/setup.ts` |
| Kursy i globalne ćwiczenia | `views/courses.ts`, `controllers/courses.ts` |
| Postępy | `views/progress.ts`, `learning/progress-overview.ts` |
| Konto i logowanie | `views/account.ts`, `controllers/account.ts` |
| Kopia: import, eksport, starsza historia | `views/backup.ts`, `controllers/backup.ts` |
| Nazwy wyświetlane aktywności | `learning-labels.ts` |

### Nauka

| Odpowiedzialność | Pliki |
| --- | --- |
| Typy sesji, wyników i ćwiczeń | `learning/model.ts` |
| Rozpoczęcie sesji, odpowiedzi, nagrody, zastąpienie aktywnej sesji (`confirmReplacement`, `openSession`) | `controllers/learning.ts` |
| Przebieg sesji, pierwsza próba | `learning/session.ts` |
| Pytania, warianty i ocenianie; a/an słówek; porównanie odpowiedzi | `learning/questions.ts`, `answers.ts`, `learning/vocabulary-answer.ts`, `answer-comparison.ts` |
| Plansze: kompletność, zamknięcie, rozmieszczanie słów | `learning/boards.ts` |
| Poprawka po błędzie | `learning/retry.ts` |
| Sceny dialogowe | `learning/scenes.ts` |
| Skład nowych sesji, kolejna lekcja, poziom legendarny | `learning/lesson-variety.ts`, `learning/lesson-flow.ts` |
| Klucze map, wersja lekcji dla postępów | `learning/journey.ts`, `adventure.ts` (`lessonForProgress`, `journeyForProgress`) |
| Procent ukończenia | `learning/map-progress.ts` |
| Trening i jego rozmieszczenie | `learning/training.ts` |
| Sekcja 7 + 2, Kocie powtórki, licznik utrwalenia | `learning/section-plan.ts`, `learning/recall.ts`, `learning/retention.ts` |
| Dawne kolejki etapów i premia etapu | `stage-review.ts` |
| Poznany zakres, globalne zestawy, zakres kursu | `learning/known-material.ts`, `learning/course-practice.ts`, `learning/scope.ts` |
| Wartości gwiazdek | `learning/rewards.ts` |
| Statystyki i ocena w łapkach | `learning/statistics.ts` |

### Materiały

| Odpowiedzialność | Pliki |
| --- | --- |
| Model kursu, znaczenia, wariantu językowego | `materials/model.ts` |
| Odczyt biblioteki (`readLibrary` — wspólny dla przeglądarki, testów i budowania), walidacja, słownictwo, dawny format | `materials/library.ts`, `materials/validation.ts`, `materials/vocabulary.ts`, `materials/legacy.ts` |
| Składanie modułu z plików i walidacja treści | `content-validation.ts` |
| Pobieranie plików materiałów | `content.ts` |
| Wczytywanie map z izolacją błędów jednej mapy (`readJourneys` / `loadJourneys`) | `adventure.ts` |
| Objaśnienia słówek, identyfikator dawnego kursu angielskiego | `materials/presentation.ts`, `materials/identity.ts` |
| Pliki treści | `public/content/` — [format](format-materialow.md) |

### Dźwięk

| Odpowiedzialność | Pliki |
| --- | --- |
| Interfejs `Speaker`: nagranie → synteza → brak dźwięku | `speech.ts` |
| Odtwarzacz nagrań, indeks, normalizacja tekstu, tempa | `speech/recorded-speaker.ts`, `speech/recordings.ts`, `speech/text.ts`, `speech/tempo.ts` |
| Dobór słuchania w sesji, odsłuch odpowiedzi | `learning/listening.ts` |
| Przyciski zwykły / „Wolniej” | `views/speech-controls.ts` |
| Generator nagrań (poza aplikacją; aplikacja go nie importuje) | `scripts/audio/` — [generowanie audio](generowanie-audio.md) |

### Domek

| Odpowiedzialność | Pliki |
| --- | --- |
| Katalog dekoracji, cen, pokoi, miejsc i warstw | `house/catalog.ts` |
| Portfele kursów, odblokowania, ustawianie, podpora stolika | `house/progress.ts` |
| Siatka 24 × 15, rozmiary, kolizje, odczyt starych miejsc | `house/layout.ts` |
| Przeciąganie (Pointer Events) | `house/drag.ts` |
| Ekran domku, pokój, panel ustawiania | `views/house.ts`, `views/house-room.ts`, `views/house-placement.ts` |
| Akcje domku (obsługiwane przed innymi kontrolerami) | `controllers/house.ts` |

Szczegóły: [koci domek](koci-domek.md).

### Zapis i offline

| Odpowiedzialność | Pliki |
| --- | --- |
| Zapis zmiany, odtwarzanie starszych błędów | `controllers/progress.ts` |
| Kopia: publiczna walidacja i eksport, części walidatora, integralność historii | `learning/backup.ts`, `learning/backup-validation/`, `history-backup.ts` |
| IndexedDB, archiwum historii | `storage.ts`, `history.ts` |
| Synchronizacja, konflikty, rozdzielenie kont | `sync.ts` |
| Firebase i planowanie synchronizacji | `firebase.ts`, `services/firebase-client.ts`, `services/sync-scheduler.ts` |
| PWA i cache (z nagraniami, zakresy bajtów) | `pwa.ts`, `scripts/build-sw.mjs`, `scripts/service-worker-range.mjs` |

## Style

Kolejność arkuszy: `style.css`, `theme.css`, `adventure.css`, `home.css`, `courses.css`, `progress.css`. Nie zmieniaj jej przy porządkowaniu importów — późniejsze nadpisują wcześniejsze.

## Znane ograniczenia

- Izolacja błędów obejmuje pliki map, ale nie pliki modułu ani rejestru kursów — [odporność map](odpornosc-map.md).
- W prezentacji zostały szczegóły Food i angielskiego: opisy rozmówek, etykieta podstawowych fiszek, odznaka pierwszej mapy. Przed publikacją kolejnego języka trzeba je sprawdzić — [gotowość na francuski i włoski](rozwoj-jezykow.md).
- Statystyki i historia obejmują całe konto; wybór kursu ogranicza katalogi, dobór ćwiczeń, domek i portfel.

## Przy zmianie kodu

Zacznij od wiersza tabeli powyżej i testów tego obszaru ([testy](07-testy.md)). Nie zmieniaj formatu postępów przy zmianie wyglądu. Zmiana granic odpowiedzialności to zmiana architektury — opisz ją tutaj, a nie w osobnym raporcie.
