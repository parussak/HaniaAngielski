# Testy — podział i zasady

Jak kontrolujemy aplikację, jakie testy dodajemy i czego jeszcze nie sprawdzono. Wyniki konkretnych uruchomień podajemy w opisie commita, nie tutaj. Dawne wyniki i opisy testów dodawanych przy kolejnych decyzjach: [dziennik weryfikacji](archiwum/weryfikacje.md).

## Polecenia

| Polecenie | Co sprawdza |
| --- | --- |
| `npm test` | Testy Node (`tests/*.test.ts`): logika, materiały, zapis, historia, synchronizacja |
| `npm run check:content` | Format i odwołania materiałów wszystkich kursów, map i ilustracji |
| `npm run build` | Kontrola treści + TypeScript + budowanie + przygotowanie plików PWA |
| `npx playwright test` | Scenariusze przeglądarkowe (`tests/browser/`) na wersji deweloperskiej |
| `HANIA_TEST_BUILD=1 npx playwright test` | Te same scenariusze na zbudowanej aplikacji, łącznie z PWA offline (wymaga wcześniejszego `npm run build`) |
| `npm run audio:check` | Zgodność nagrań z tekstami, profilami i sumami kontrolnymi |
| `node scripts/check-docs.mjs` | Lokalne odnośniki w dokumentacji |

Na wersji deweloperskiej scenariusze wymagające zbudowanej PWA są pomijane. `HANIA_BROWSER_CHANNEL=msedge` uruchamia testy w Edge, a `HANIA_BASE_URL` — na opublikowanej stronie.

CI (GitHub Actions) uruchamia `npm test`, `check:content` i `npm run build`, **bez Playwright**.

## Jak zbudowane są testy

- **Mechanika** jest testowana na danych syntetycznych (`tests/fixtures/`), bez nazw konkretnych kursów i modułów. Regresje Food wskazują go po identyfikatorze. Testy Node przechodzą też na wirtualnie rozszerzonej bibliotece z dodatkowymi kursami EN/FR/IT — [dane testowe](../tests/README.md).
- **Scenariusze przeglądarkowe** działają na telefonie 320–430 px i domyślnie na urządzeniu **bez głosu i bez dekodera Opus** (`browser/fixtures.ts`), żeby wynik nie zależał od komputera. Wyjątek: `browser/recordings.spec.ts` używa prawdziwych plików Opus. Synteza mowy jest atrapą.
- **Konta i synchronizacja** są sprawdzane przez testowy adapter Firebase, bez prawdziwych kont.
- **Walidacja kopii** jest porównywana z zestawem 116 zapisanych wyników (`tests/fixtures/backup-validation-results.json`). Tego odniesienia nie regenerujemy.
- **Granice architektury** (np. domek niezależny od modułu map) pilnuje `tests/refactor-boundaries.test.ts`.

## Podział odpowiedzialności

| Grupa | Co ma sprawdzać | Czego nie ma zastępować |
| --- | --- | --- |
| Mechanika | Obiekty, odwołania, typy pytań, stosowanie kryteriów odpowiedzi i przebieg sesji | Poprawności językowej konkretnego tłumaczenia |
| Nauka | Pokrycie zakresu przez mapy, role lekcji, dobór treningu, błędy, utrwalenie i nagrody | Samej walidacji JSON |
| Materiały — wspólny kontrakt | Format i odwołania każdego kursu, modułu, mapy, zadania i zasobu | Recenzji podręcznika |
| Merytoryka i kursy | Zatwierdzone przykłady odpowiedzi, źródła, warianty i regresje FR/IT/EN | Ogólnego silnika sesji ani recenzji wszystkich treści przez jeden test |
| Zapis i zgodność | Konta, konflikty, offline, starsze kopie, historia i ewentualne migracje | Samego testu kliknięcia przycisku |
| Interfejs i pełne przebiegi | Nawigacja, telefon, dostępność, wznowienie i połączenie części aplikacji | Każdego przypadku algorytmu utrwalania w przeglądarce |

Nie trzeba tworzyć osobnego testu dla każdego słówka ani kopii całej baterii mechaniki dla każdego języka.

## Zasady dodawania i uruchamiania

1. Nowe zachowanie otrzymuje test efektu i istotnego przypadku brzegowego. Test nie powinien wyłącznie powtarzać wewnętrznej struktury funkcji.
2. Powracający błąd dostaje test regresji. Oczekiwania zmieniamy po ustaleniu, czy zmieniła się zasada, a nie tylko dlatego, że test przestał przechodzić. Zmiana oczekiwań istniejącego testu wymaga zgody Pauliny.
3. Nowe materiały korzystają ze wspólnych kontroli. Regresje Food pozostają sprawdzane osobno, zamiast ograniczać cały katalog do jednego modułu.
4. Zmiana zapisu wymaga sprawdzenia zgodności starszych danych, kont i aktywnej sesji; rzeczywista migracja wymaga własnych przypadków.
5. Drobna poprawka tekstu lub odstępu zwykle nie wymaga nowego testu. Zakres kontroli powinien odpowiadać ryzyku.
6. W trakcie pracy uruchamiamy kontrole obszaru i zależności. Przed publikacją zmian aplikacji wykonujemy pełny zestaw Node, budowanie i istotne scenariusze przeglądarkowe.
7. Dla samej zmiany dokumentacyjnej sprawdzamy zgodność opisów, odnośniki i zakres zmienionych plików; nie przedstawiamy dawnych uruchomień jako nowych.
8. Wynik uruchomień (polecenia, liczby, czego nie sprawdzono) trafia do podsumowania i opisu commita. Do tego dokumentu dopisujemy tylko nową zasadę albo nowy obszar, którego testy automatyczne nie sprawdzają.

## Czego testy automatyczne nie sprawdzają

Informacja dla agentów: tych rzeczy nie wolno opisywać jako sprawdzonych tylko dlatego, że testy przechodzą. To nie jest lista zadań do wykonania.

- **Prawdziwy telefon.** Scenariusze działają na emulowanym ekranie w Chrome/Edge. Telefon Hani i Pauliny jest używany na co dzień i sprawdzany wyrywkowo — [gdy coś nie działa na telefonie](#gdy-coś-nie-działa-na-telefonie).
- **Prawdziwe konto Firebase.** Testy używają atrapy (adaptera). Zmiana `firestore.rules` lub sposobu zapisu może przejść testy i zepsuć prawdziwą synchronizację — dlatego wymaga zgody Pauliny.
- **Brzmienie nagrań.** `audio:check` sprawdza zgodność plików z tekstem, nie to, czy nagranie brzmi dobrze. Część nagrań brzmi nienaturalnie.
- **Poprawność językowa.** Testy struktury nie zastępują recenzji językowej ani pedagogicznej. Sceny Food czekają na [recenzję](recenzja-scen-food.md).
- **Ekrany przy każdym wypchnięciu.** CI nie uruchamia Playwright; scenariusze przeglądarkowe działają tylko lokalnie.

### Propozycje do rozważenia

- **Automatyczna kontrola nagrań:** lokalne rozpoznawanie mowy (np. Whisper) odsłuchuje każde nagranie i porównuje z tekstem; do tego pomiar długości, ciszy i przesterowania. Wynik: krótka lista podejrzanych nagrań do odsłuchu lub ponownego wygenerowania.
- **Playwright w CI:** dodanie scenariuszy przeglądarkowych do GitHub Actions, kosztem dłuższego sprawdzania każdego wypchnięcia.

## Ważne przyszłe scenariusze

- Zachowanie mapy Food i ukończonych części 1–4 przy poprawkach sekcji 5–7; nowa mapa uzupełnia ustalone braki bez samoczynnego resetu istniejących postępów (D-22).
- Przy poprawkach Food również zaliczone pojedyncze lekcje wewnątrz sekcji 5–7 pozostają ukończone, a zdobyte gwiazdki zostają na koncie. Poprawiane są tylko nieukończone lekcje; dodanie brakującego materiału na nowej mapie nie otwiera ponownie zaliczonych lekcji (D-24).
- Ukończone lekcje dają 100% postępu także przy zaległych błędach. Zaległości pokazuje osobna pomarańczowa liczba elementów z wynikiem poniżej 3/3; po zaliczeniu całej nauki i wyzerowaniu kolejki jest zielony stan z gratulacjami (D-23). Pusta kolejka przed ukończeniem lekcji nie daje fałszywego 100%.
- Wynik jednego konta nie zmienia wyników innego; na jednym koncie zaliczenie elementu w jednym kursie nie zalicza go w drugim (D-14, D-15).
- Wszystkie wymagane elementy modułu są wskazane w jego 1–3 mapach; trening nie zastępuje brakującego wprowadzenia nowej treści.
- Mapa wymaga ukończenia zwykłych lekcji i treningów na mapie: nieukończony trening na mapie wyklucza jej ukończenie i 100% postępu lekcji. Dodatkowe treningi nie powiększają wymaganego zakresu, a zaległa powtórka błędów nie blokuje ukończenia ani 100% po wszystkich wymaganych lekcjach (D-32). Warunki premii za utrwalenie sprawdzamy osobno.
- Pierwsze ukończenie danego treningu na mapie przyznaje 3 gwiazdki w kontekście konta i kursu; ponowne przetworzenie tej samej sesji, także po ponownym uruchomieniu lub synchronizacji, nie daje ich drugi raz. Nowa pełna sesja powtórzenia daje 1 gwiazdkę (D-40), z zachowaniem pierwotnego ukończenia. Samo rozpoczęcie lub przerwanie treningu nie daje nagrody. Scenariusz nie zakłada jeszcze zasad nagradzania dodatkowych treningów na żądanie.
- Zwykła lekcja ma 6–10 zadań początkowych, najczęściej 8 (D-18). Powtórka błędów ma 1–10 zadań z dostępnej kolejki, bez dopełniania innymi pytaniami i z podziałem większej kolejki na sesje (D-19). Trening ma 6–10 zadań, najczęściej 8, lub mniej przy małej puli wcześniejszego materiału — bez przyszłych treści i sztucznego powielania dla minimum (D-20). Poprawki i powroty błędów nie są doliczane do wielkości początkowego zestawu. Jedna oceniana odpowiedź to jedno zadanie bez dodatkowych wag; w standardowym zakresie liczba jest bliższa 6 dla dłuższych zadań, a 8–10 dla krótkich (D-21).
- Trening wybiera wcześniejszy poznany materiał, w tym elementy wcześniej bezbłędne, i nie wprowadza przyszłych treści ani obcego kursu.
- Mapa rozpoczyna się od nowego materiału; pierwszy trening pojawia się po 2–3 lekcjach nowego materiału, a kolejne co 2–3 lekcje nowego materiału, zależnie od długości mapy i dostępnego materiału (D-30). Warunkiem jest poznany materiał z wcześniejszych map; bez takiej puli nie tworzymy pustego treningu. Walidacja konkretnej mapy uwzględnia ten rytm i dostępność materiału; same treningi oraz powtórki błędów nie są liczone jako lekcje nowego materiału.
- Zadanie gramatyczne pokazuje wyjaśnienie po odpowiedzi poprawnej i błędnej (D-31). Testy sprawdzają obecność i właściwe wyświetlenie uzasadnienia; jego językowa poprawność i dopasowanie do konkretnego zdania wymagają również recenzji merytorycznej.
- Trening łączy dostępne słownictwo i gramatykę bez sztywnego podziału proporcji; przy dostępności tylko jednego rodzaju działa z tym rodzajem, bez dodawania niepoznanych treści do brakującej kategorii (D-28).
- Dobór treningu daje pierwszeństwo trudnym i dawno niećwiczonym elementom, a jednocześnie zapewnia regularny powrót bezbłędnych (D-29). Konkretne oczekiwania dotyczące odstępów, parametrów i liczby wystąpień będą ustalone po odłożonym na później wyborze algorytmu; nie testujemy teraz domniemanego SM-2 ani FSRS.
- Błąd z treningu trafia do powtórki mapy, na której odbywał się trening, z zachowaniem tożsamości źródłowego materiału.
- Globalne fiszki, quiz i gramatyka obejmują poznany zakres kursu, a nie cały przyszły podręcznik lub wszystkie języki.
- Pierwsza próba, także błędna i w niedokończonej lekcji, oznacza poznanie powiązanego elementu dla danego konta i kursu. Samo obejrzenie wprowadzenia nie oznacza poznania; stan ten nie nadaje automatycznie poprawności ani utrwalenia (D-25).
- Poznany zakres jest odtwarzany także z wcześniejszych zapisanych prób, w tym archiwalnych, bez zmiany ocen, ukończeń ani salda zdobytych gwiazdek i bez wymuszania ponownej próby poznania (D-26).
- Wybrany harmonogram ma testy odstępów, błędów, powtórki na żądanie oraz sytuacji bez dostępnego materiału.
- Dodatkowy trening można uruchomić bez oczekiwania na termin, także kilka razy tego samego dnia; nie omija to ograniczeń poznanego zakresu i kursu ani zasad wielkości treningu (D-27, D-20). Sposób aktualizacji harmonogramu po dodatkowym treningu będzie sprawdzany po jego ustaleniu.
- Nowy podział map zachowuje stare postępy i kopie zgodnie z zatwierdzonym sposobem przejścia.

Te scenariusze **nie są deklaracją istniejącego pokrycia**. Szczegóły oczekiwań zależą od [otwartych decyzji](decyzje.md).

## Gdy coś nie działa na telefonie

**Zasada:** błąd zauważony na telefonie agent najpierw odtwarza testem automatycznym (Node lub Playwright), dopiero potem naprawia. Dzięki temu ten sam błąd nie wróci.

Ściąga, gdy nie ma dźwięku:

- Sprawdź, czy aplikacja jest zaktualizowana (PWA) i czy w „Konto → Ćwiczenia ze słuchu” przełącznik jest włączony; „Sprawdź dźwięk” powinien odczytać słowo po angielsku.
- Nagrania Food nie wymagają głosu telefonu. Dla tekstu bez nagrania Android używa „Zamiany tekstu na mowę” (silnik Google, pobrany język angielski); po pobraniu głosu odśwież aplikację.
- Przeglądarka może wymagać pierwszego dotknięcia, zanim odtworzy dźwięk — wtedy działa „Posłuchaj jeszcze raz”.
- Chrome na Androidzie bywa, że podaje głosy z opóźnieniem; aplikacja przerysowuje zadanie, gdy głos się pojawi. Bez głosu zadanie przechodzi w zwykłą formę i lekcję da się ukończyć.

## Dokumentacja

`node scripts/check-docs.mjs` sprawdza lokalne odnośniki plikowe i prostą strukturę skilla projektu; `--self-test` sprawdza sam skrypt. Nie są to testy działania aplikacji ani recenzja językowa. Przegląd dokumentacji wspiera [skill projektu](../.agents/skills/male-kroki-dokumentacja/SKILL.md) według [instrukcji utrzymania](utrzymanie-dokumentacji.md).
