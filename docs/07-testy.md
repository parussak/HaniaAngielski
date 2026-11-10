# Testy — podział i zasady

Status: istniejące kontrole oraz docelowy sposób ich organizacji. Po zatwierdzeniu D-34 dodano testy wdrożenia treningów; workflow GitHub pozostaje bez zmian.

## Stan obecny

Są testy Node dla logiki, materiałów, historii i synchronizacji oraz scenariusze Playwright dla aplikacji i PWA. Część testów jest ogólna, część świadomie sprawdza konkretne ustalenia Food; kilka zależy od historycznych nazw i fragmentów kodu.

W przeglądzie 9–10 listopada 2026 r. wykonano 84 testy Node i kontrolę materiałów z powodzeniem. Zebrano 51 testów przeglądarkowych, bez ponownego ich wykonania w zadaniu dokumentacyjnym. Nie są to wyniki nowego uruchomienia przy obecnym porządkowaniu dokumentacji.

Po rozpoczęciu implementacji D-34 uruchomiono także pełny zestaw przeglądarkowy gotowej aplikacji: **57/57**, w tym dodatkowy trening offline i synchronizację jego nagrody. Nowe kontrole Node są w `tests/training.test.ts`, a przebiegi interfejsu w `tests/browser/training.spec.ts` i `tests/browser/pwa.spec.ts`. [Raport wdrożenia](wdrozenie-nauki.md) opisuje zakres i ograniczenia; historyczna macierz pozostaje punktem odniesienia sprzed zmian.

Obecne workflow GitHub uruchamiają testy Node i budowanie z walidacją treści, ale nie Playwright. Brak błędu publikacji nie potwierdza kompletnej recenzji językowej ani działania na wszystkich prawdziwych telefonach.

Szczegółowa macierz pokrycia, ograniczenia i dowody: [testy — punkt odniesienia](stan-obecny/testy.md).

## Weryfikacja etapu 2

Po uporządkowaniu kursów: **114/114 testów Node i 61/61 testów Playwright** gotowej aplikacji. `tests/courses.test.ts` obejmuje model i kontrolę materiałów; `tests/fixtures/course-materials.ts` zawiera wspólne syntetyczne dane EN/FR/IT, a `tests/browser/courses.spec.ts` cztery przebiegi mobilne. Dane testowe nie są dodawane do produkcyjnego katalogu. Test porównuje stare i nowe odczytanie wszystkich słów i skompilowanych zadań Food oraz ich kluczy.

Budowanie korzysta bezpośrednio ze wspólnego `readLibrary`, a nie z importu danych przez plik testowy. Walidacja kursów nie zastępuje recenzji wariantów językowych ani podręcznika. [Raport etapu 2](wdrozenie-kursow.md).

## Weryfikacja etapu 3

**130/130 testów Node i 68/68 testów Playwright** gotowej aplikacji. `tests/course-practice.test.ts` sprawdza poznanie, archiwum, ograniczenie opcji, zgodność kopii, odrębność kursów i preferencje kont. `tests/browser/course-practice.spec.ts` obejmuje sześć scenariuszy mobilnych, a `tests/browser/pwa.spec.ts` dodatkowo globalne ćwiczenie offline i wysłanie jego wyniku po połączeniu.

Sprawdzamy też zachowanie zaliczonych modułowych fiszek Food, brak nowych gwiazdek za globalne tryby, odmowę zastąpienia aktywnej sesji oraz utrzymanie poznania po zastąpieniu starszej niedokończonej sesji. Globalna historia nie jest zaliczana do wyników jednego przypadkowego modułu. [Raport etapu 3](wdrozenie-zakresow.md).

## Weryfikacja etapu 4

**137/137 testów Node i 72/72 testów Playwright** gotowej aplikacji w Chrome, z testami PWA. `npm run build` przechodzi walidację treści, TypeScript, budowanie i przygotowanie zasobów offline. `tests/food-audit.test.ts` chroni oryginalne treści i mapę, odrębny wybór wersji według ukończeń, stare i nowe aktywne sesje, kopie, brak ponownych gwiazdek oraz trening drugiej mapy. `tests/browser/food-audit.spec.ts` obejmuje dawne ukończenie, rozpoczętą sesję, nową mapę z nagrodą i odznaką oraz zimny start nowej mapy offline. Sprawdzono wygląd zrzutów telefonu i brak przewijania poziomego przy 320 i 390 px.

Testy kont używają lokalnego modelu Firebase; nie ingerują w prawdziwe wyniki. Przegląd zdjęć i objaśnień opisuje [raport Food](wdrozenie-food.md); testy struktury nie zastępują recenzji pedagogicznej ani próby na fizycznym telefonie Hani.

## Weryfikacja przygotowania treningu i odzyskiwania map

Po poprawkach po etapie 4: **144/144 testów Node i 76/76 testów Playwright** gotowej aplikacji w Chrome, z dotychczasowymi testami PWA i synchronizacji. `npm run build` przechodzi walidację materiałów, TypeScript i budowanie wydania offline.

`tests/map-recovery.test.ts` obejmuje błąd pobrania, JSON i schematu pojedynczej mapy, duplikaty tożsamości, izolację kursów, odzyskanie katalogu, przygotowanie poznanej puli, nagrody bez duplikatów oraz odroczenie migracji i premii przy brakujących mapach. `tests/browser/map-recovery.spec.ts` sprawdza na telefonie przejście od pustej puli przez lekcję do treningu, brak drugiej nagrody, dostępność poprawnej mapy podczas awarii innej i wznowienie zachowanej sesji po naprawie pliku. Sprawdzono zrzut ekranu przygotowania i brak przewijania poziomego przy 320 px. Kontrole nie zmieniają prawdziwego konta Hani. [Zakres i ograniczenia](odpornosc-map.md).

## Docelowy podział odpowiedzialności

| Grupa | Co ma sprawdzać | Czego nie ma zastępować |
| --- | --- | --- |
| Mechanika | Obiekty, odwołania, typy pytań, stosowanie kryteriów odpowiedzi i przebieg sesji | Poprawności językowej konkretnego tłumaczenia |
| Nauka | Pokrycie zakresu przez mapy, role lekcji, dobór treningu, błędy, utrwalenie i nagrody | Samej walidacji JSON |
| Materiały — wspólny kontrakt | Format i odwołania każdego kursu, modułu, mapy, zadania i zasobu | Recenzji podręcznika |
| Merytoryka i kursy | Zatwierdzone przykłady odpowiedzi, źródła, warianty i regresje FR/IT/EN | Ogólnego silnika sesji ani recenzji wszystkich treści przez jeden test |
| Zapis i zgodność | Konta, konflikty, offline, starsze kopie, historia i ewentualne migracje | Samego testu kliknięcia przycisku |
| Interfejs i pełne przebiegi | Nawigacja, telefon, dostępność, wznowienie i połączenie części aplikacji | Każdego przypadku algorytmu utrwalania w przeglądarce |

To podział logiczny; docelowe przeniesienie plików testowych lub zmiana CI wymagają oddzielnej zmiany. Nie trzeba tworzyć osobnego testu dla każdego słówka ani kopii całej baterii mechaniki dla każdego języka.

## Ważne przyszłe scenariusze

- Zachowanie mapy Food i ukończonych części 1–4 przy poprawkach sekcji 5–7; nowa mapa uzupełnia ustalone braki bez samoczynnego resetu istniejących postępów (D-22).
- Przy poprawkach Food również zaliczone pojedyncze lekcje wewnątrz sekcji 5–7 pozostają ukończone, a zdobyte gwiazdki zostają na koncie. Poprawiane są tylko nieukończone lekcje; dodanie brakującego materiału na nowej mapie nie otwiera ponownie zaliczonych lekcji (D-24).
- Ukończone lekcje dają 100% postępu także przy zaległych błędach. Zaległości pokazuje osobna pomarańczowa liczba elementów z wynikiem poniżej 3/3; po zaliczeniu całej nauki i wyzerowaniu kolejki jest zielony stan z gratulacjami (D-23). Pusta kolejka przed ukończeniem lekcji nie daje fałszywego 100%.
- Wynik jednego konta nie zmienia wyników innego; na jednym koncie zaliczenie elementu w jednym kursie nie zalicza go w drugim (D-14, D-15).
- Wszystkie wymagane elementy modułu są wskazane w jego 1–3 mapach; trening nie zastępuje brakującego wprowadzenia nowej treści.
- Mapa wymaga ukończenia zwykłych lekcji i treningów na mapie: nieukończony trening na mapie wyklucza jej ukończenie i 100% postępu lekcji. Dodatkowe treningi nie powiększają wymaganego zakresu, a zaległa powtórka błędów nie blokuje ukończenia ani 100% po wszystkich wymaganych lekcjach (D-32). Warunki premii za utrwalenie sprawdzamy osobno.
- Pierwsze ukończenie danego treningu na mapie przyznaje 3 gwiazdki w kontekście konta i kursu; ponowne ukończenie, także po ponownym uruchomieniu aplikacji lub synchronizacji na innym urządzeniu, nie przyznaje ich drugi raz (D-33). Samo rozpoczęcie lub przerwanie treningu nie daje nagrody. Scenariusz nie zakłada jeszcze zasad nagradzania dodatkowych treningów na żądanie.
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

## Zasady dodawania i uruchamiania

1. Nowe zachowanie otrzymuje test efektu i istotnego przypadku brzegowego. Test nie powinien wyłącznie powtarzać wewnętrznej struktury funkcji.
2. Powracający błąd dostaje test regresji. Oczekiwania zmieniamy po ustaleniu, czy zmieniła się zasada, a nie tylko dlatego, że test przestał przechodzić.
3. Nowe materiały korzystają ze wspólnych kontroli. Regresje Food pozostają sprawdzane osobno, zamiast ograniczać cały katalog do jednego modułu.
4. Zmiana zapisu wymaga sprawdzenia zgodności starszych danych, kont i aktywnej sesji; rzeczywista migracja wymaga własnych przypadków.
5. Drobna poprawka tekstu lub odstępu zwykle nie wymaga nowego testu. Zakres kontroli powinien odpowiadać ryzyku.
6. W trakcie pracy uruchamiamy kontrole obszaru i zależności. Przed publikacją zmian aplikacji wykonujemy uzgodniony pełny zestaw i istotne scenariusze przeglądarkowe.
7. Dla samej zmiany dokumentacyjnej sprawdzamy zgodność opisów, odnośniki i zakres zmienionych plików; nie przedstawiamy dawnych uruchomień jako nowych.

Przegląd dokumentacji wspiera [skill projektu](../.agents/skills/male-kroki-dokumentacja/SKILL.md), zgodnie z [instrukcją utrzymania](utrzymanie-dokumentacji.md). `node scripts/check-docs.mjs` sprawdza lokalne odnośniki plikowe i prostą strukturę tego skilla; `node scripts/check-docs.mjs --self-test` sprawdza wykrywanie brakujących plików, pomijanie przykładów kodu oraz poprawne i niepoprawne opisy skilla. Nie są to testy działania aplikacji ani recenzja językowa. Nie dodano nowego kroku do CI; aktualne workflow pozostają bez zmian.
