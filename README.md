# Małe kroki — nauka Hani

„Postępy” pokazują osobno ukończone mapy i lekcje, tydzień nauki oraz małe sukcesy w wybranym kursie. Zdobyte gwiazdki pozostają widoczne po zakupach; dokładne wyniki i historia są w rozwijanych szczegółach. Widok korzysta z dotychczasowych zapisów, bez nowego algorytmu opanowania — [zasady liczenia](docs/03-nauka.md).

Lekcje mapowe automatycznie łączą wpisywanie, wybór, dobieranie par i luki z bankiem propozycji. Po lekcji można przejść dalej, zrobić dobrowolny **Poziom legendarny** (+1 ★ za pełną powtórkę) lub wrócić do mapy. Food zachowuje obie mapy i wcześniejsze postępy. [Zasady nauki](docs/03-nauka.md).

Aplikacja internetowa: fiszki, quizy, gramatyka, lokalne postępy i opcjonalne konto z synchronizacją przez Firebase. Dostępny jest moduł 2 **Food — Fun with food**, opracowany z przesłanych zdjęć podręcznika i zeszytu ćwiczeń, z dwiema mapami nauki. Aktualny zakres i ograniczenia opisuje [audyt Food](docs/wdrozenie-food.md). Materiał demonstracyjny został usunięty.

[Dokumentacja po polsku](docs/README.md) rozdziela produkt, mechanikę, naukę, merytorykę, architekturę, zapis i testy oraz oznacza stan obecny, założenia docelowe i sprawy do ustalenia. Oddzielna [lista braków dla francuskiego i włoskiego](docs/rozwoj-jezykow.md) rozróżnia stan obecny od propozycji rozwoju.

Aktualizacja nauki: dobrowolna Kocia rozgrzewka z poznanego materiału za 1 ★, ukończenie mapy liczone niezależnie od błędów oraz wyjaśnienia gramatyczne z przypomnieniem reguły. Etap 2 dodaje kursy/podręczniki i wspólny format materiałów wielojęzycznych, zachowując wygląd, treści i zapis Food. [Format materiałów](docs/format-materialow.md), [raport etapu 1](docs/wdrozenie-nauki.md), [raport etapu 2](docs/wdrozenie-kursow.md). Etap 3 dodaje wybór kursu oraz globalne fiszki, quiz i gramatykę wyłącznie z poznanego materiału — [opis i sprawdzenie](docs/wdrozenie-zakresow.md).

## Uzgodniony kierunek — 13 listopada 2026

- **Wdrożone (D-54): historyjka jako cała lekcja.** Cztery historyjki Food zawierają wyłącznie rozmowę z 4–5 lukami, bez dodatkowych fiszek i ćwiczeń. Rozmówcy dostają różne istniejące kotki, stałe przez całą sesję i jej podsumowanie. Wcześniejsze ukończenia i gwiazdki pozostają; rozpoczęte sesje zachowują swój zestaw. [Zasady nauki](docs/03-nauka.md).
- **Wdrożone (D-58): słuchanie.** W lekcjach map można posłuchać słówka i wybrać jego znaczenie albo je wpisać, a w rozmowach odsłuchać kwestie. Zawsze są „Posłuchaj jeszcze raz” i „Wolniej”, bez limitu. Dźwięk daje synteza mowy przeglądarki — bez zewnętrznych usług i plików w paczce. Gdy urządzenie nie ma głosu w języku kursu albo słuchanie jest wyłączone na ekranie „Konto”, te same zadania mają zwykłą formę. Głosy na telefonie wymagają [sprawdzenia ręcznego](docs/07-testy.md#d-58--słuchanie).
- **Wdrożone (D-53): rozmowy z kilkoma lukami.** Scena pokazuje się kwestia po kwestii; każdą lukę uzupełnia się z banku albo wpisując, i każda jest oceniana osobno. Po błędzie jest wyjaśnienie po polsku, a błąd wraca w powtórkach. Mechanika jest wspólna dla wszystkich kursów; scenę dodaje się w `rozmowki.json` modułu. Food ma cztery sceny, które czekają na [recenzję językową](docs/recenzja-scen-food.md).
- **Wdrożone (D-52): ukończona lekcja pozostaje ukończona po zmianie treści.** Ćwiczenia w lekcjach, także ukończonych, można zmieniać i uzupełniać wielokrotnie. Lekcja ukończona wcześniej nadal liczy się jako ukończona, a mapa zachowuje 100%, gwiazdki i nagrody. Powtórka i Poziom legendarny biorą aktualną treść i dają 1 ★. Rozpoczęte sesje zachowują swój zestaw zadań. [Wymagania](docs/03-nauka.md), [zasady edycji treści](docs/format-materialow.md#aktualizacja-wydanej-lekcji).
- **Do wdrożenia — urozmaicenie ćwiczeń.** Wymagania trzeba zapisać w [nauce](docs/03-nauka.md) i [rejestrze decyzji](docs/decyzje.md) przed zmianą kodu. Do dobierania par i luk z bankiem dochodzą dialogi i historyjki z kilkoma lukami, uzupełnianymi słowem z propozycji albo wpisywanym, oraz ćwiczenia ze słuchaniem.

## Uruchomienie

Wymagany Node.js 22.12 lub nowszy (zalecany 24).

W Windows najprościej otworzyć plik **uruchom-aplikacje.cmd** w folderze projektu. Uruchomi stronę w przeglądarce. Okno uruchomienia należy pozostawić otwarte na czas nauki; Ctrl+C zatrzymuje serwer. Przy pierwszym uruchomieniu brakujące zależności zostaną pobrane.

```powershell
npm.cmd install
npm.cmd run dev
```

Otwórz adres wyświetlony przez serwer. Nie uruchamiaj `index.html` bezpośrednio z dysku. Bezpieczny zapis wymaga HTTPS lub lokalnego adresu localhost/127.0.0.1.

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

Testy przeglądarkowe domyślnie używają Chromium (`npx playwright install chromium`). Na Windows możesz użyć Edge, ustawiając przed testami `$env:HANIA_BROWSER_CHANNEL='msedge'`. Na innych systemach użyj `npm` i `npx` zamiast `npm.cmd` i `npx.cmd`.

```powershell
npx.cmd playwright test
```

Testy automatycznie uruchamiają i zatrzymują własny lokalny serwer na porcie 5184.

## Korzystanie

1. Wybierz moduł i rodzaj ćwiczeń.
   W module Food dostępne są „Fiszki podstawa” (38 haseł z ramek Vocabulary) oraz „Fiszki” (wszystkie 97 haseł). Oba zestawy współdzielą postępy tych samych słów.
2. Przed dotknięciem kafelka wybierz odpowiedzi zamknięte, wpisywanie lub tryb mieszany. Dotknięcie kafelka od razu zaczyna sesję. Polecenia z wariantami w nawiasie zawsze mają przyciski do wyboru.
3. Po błędzie towarzyszy Ci kotek nauczyciel, po dobrej odpowiedzi zadowolony lub świętujący kotek, a koniec sesji urozmaica zabawna scenka. Kocia ekipa ma 25 wariantów i działa offline. [Pliki kotków i edycja kadrów](public/cats/README.md). Po błędzie przeczytaj wyjaśnienie i spróbuj ponownie. Pierwsza próba jest liczona osobno od poprawek. Błąd nie wydłuża sesji: poprawka jest dobrowolna, a zadanie zostaje w osobnej powtórce. Błędna odpowiedź jest na jasnoróżowym tle, poprawna na zielonym, bez przekreśleń. W słówkach pominięcie poprawnego a/an jest zaliczane z pomarańczową uwagą; zły lub zbędny rodzajnik jest błędem.
4. Postępy zapisują się po każdej odpowiedzi w IndexedDB. Rozpoczętą sesję można wznowić z ekranu głównego.
5. Wybierz „Konto → Kopia postępów” i pobierz plik JSON (również bez logowania). Na drugim urządzeniu wczytaj go i potwierdź zastąpienie obecnych danych. Kopie nie są scalane.

Bez logowania wyniki są przypisane do przeglądarki i adresu strony. Po zalogowaniu dodatkowo synchronizują się z kontem Firebase. Zmiana przeglądarki, portu lub adresu wymaga przeniesienia kopii. Tryb prywatny i czyszczenie danych mogą usunąć postępy. Aplikacja blokuje równoczesny zapis z drugiej karty tej samej przeglądarki. Po zamknięciu pierwszej karty odśwież drugą. Przy błędzie zapisu poprzedni zapis pozostaje, a zmiana nie jest zatwierdzana.

Konto otworzysz pozycją „Konto” w nawigacji albo wskaźnikiem zapisu u góry. Przed użyciem włącz logowanie E-mail/hasło i Firestore w projekcie Firebase oraz opublikuj reguły dostępu: [instrukcja Firebase](docs/firebase.md). Możesz utworzyć wiele niezależnych kont, np. do nauki i do testów. W ustawieniach konta zmienisz imię, e-mail (przez potwierdzenie linkiem) i hasło oraz wylogujesz się lub przełączysz konto. Pierwsze przeniesienie wyników gościa wymaga decyzji. Zapis konta i gościa jest oddzielny, konflikty dwóch urządzeń wymagają wyboru wersji.

Po pierwszym pobraniu materiałów aplikacja działa offline i może być instalowana jako PWA z ikoną kotka. [Instrukcja instalacji i testu offline](docs/pwa.md). Konto synchronizuje lokalne zmiany po odzyskaniu połączenia w otwartej aplikacji lub przy kolejnym uruchomieniu. Nie ma automatycznego przetwarzania PDF. Do nauki z gotowych zestawów nie jest potrzebna usługa AI. Czcionki są systemowe i nie są pobierane z Google Fonts. Manifest PWA i wersjonowany service worker są częścią aplikacji.

## Kocia przygoda i domek

Strona główna pokazuje powitanie, ramkę z kotkiem **Twój następny krok** i dwa wejścia do nauki. Ramka wznawia rozpoczętą sesję (również quiz lub powtórkę), a przy jej braku prowadzi do najbliższej nieukończonej lekcji ostatnio używanego modułu lub następnego dostępnego modułu. Po ukończeniu map proponuje dobrowolną Kocią rozgrzewkę. Powtórki nie blokują przejścia do kolejnego modułu. **Wybierz przygodę** otwiera katalog map z nazwą przygody, podtytułem (np. A2 · Moduł 2 · Food), postępem lekcji. Mapa **Przygotowania do kociego pikniku** zawiera siedem etapów i 41 krótkich lekcji z wprowadzeniem, przykładami i ćwiczeniami. **Przejdź do modułów** prowadzi do osobnego katalogu fiszek, quizów, gramatyki, rozmówek i powtórek. Instrukcje instalacji, nauki offline i zapisu wyników są w rozwijanej pomocy na dole strony startowej. Komunikat o dostępnej aktualizacji pojawia się nad powitaniem. Stałe menu zawiera Naukę, Mapy, Domek, Postępy i Konto. Dostępne mapy i lekcje można wybierać bez wymogu wcześniejszych ukończeń. Pierwsze ukończenie lekcji daje 3 ★, każda nowa pełna sesja powtórzenia tej lekcji 1 ★; wznowienie tej samej sesji nie dubluje nagrody. Ukończona mapa i etap pokazują 100% i gratulacje niezależnie od błędów; nie ma na nich liczników zaległości ani kafelków powtórek. Błędy wracają w krótkich, dobrowolnych Kocich rozgrzewkach i w Kocich powtórkach sekcji 7 + 2, a licznik trzech samodzielnych poprawnych odpowiedzi działa w tle. Na pierwszej mapie dodatkowe 3 ★ przysługują raz za ukończone lekcje i utrwalenie błędów etapu. Druga mapa nie dodaje tej premii. Powtórki nie blokują dalszych lekcji. W obu rodzajach powtórek (ogólnej i etapowej) słówka, luki i dialogi wymagają wpisania odpowiedzi. Jeśli pytanie podaje warianty, także słownie (np. „policzalny czy niepoliczalny”), odpowiedź wybiera się przyciskiem — we wszystkich trybach. Zasada obejmuje też wznawiane starsze sesje. W zakładce **Domek** kupujesz wyposażenie pokojów za gwiazdki i ustawiasz je na siatce w trybie „Urządź pokój”. Mapa, saldo, powtórki i domek działają offline i są częścią zapisu danego konta oraz pliku kopii. Dotychczasowe swobodne ćwiczenia pozostają dostępne.

**Konfiguracja Firebase wymaga reguł obsługujących archiwum historii.** Publikuje się je jednorazowo przy przejściu ze starszej wersji bez archiwum; samo dodawanie modułów lub aktualizowanie dokumentacji nie wymaga ich ponownej publikacji. Instrukcje: [mapa i domek](docs/kocia-przygoda.md), [historia i aktualizacja reguł](docs/historia.md).

## Edytowanie materiałów i dodawanie modułu

Zacznij od [instrukcji dodawania modułu](docs/dodawanie-modulow.md) i [szablonu karty materiałów](docs/szablon-modulu.md). [Instrukcja utrzymania dokumentacji](docs/utrzymanie-dokumentacji.md) wskazuje, co aktualizować, a [skill projektu](.agents/skills/male-kroki-dokumentacja/SKILL.md) pomaga porównać opisy z kodem, testami i źródłami. Sprawdzenie odnośników: `node scripts/check-docs.mjs`.

Treści znajdują się w **public/content**, niezależnie od kodu strony w `src`. Aplikacja pobiera je jako osobne pliki, a nie jako część programu.

- `katalog.json` — lista modułów.
- `02-food/modul.json` — opis, nazwa, numer, wersja i opcjonalny poziom `level` (A1–C2). `journeyPaths` wskazuje listę map; pojedyncza mapa może korzystać ze starszego `journeyPath`.
- `02-food/slownictwo.json` — fiszki, tłumaczenia i akceptowane odpowiedzi.
- `02-food/quiz.json` — pytania słownikowe wskazujące słowa; poprawka słówka aktualizuje także quiz.
- `02-food/gramatyka.json` — zasady, objaśnienia i przykłady.
- `02-food/cwiczenia.json` — zadania, klucze odpowiedzi i wyjaśnienia po błędzie.
- `02-food/rozmowki.json` — 12 dialogów z lukami w osobnym trybie „Rozmówki”; wybór lub wpisywanie odpowiedzi, polskie wyjaśnienia i powtórka błędów.
- `02-food/sciezka.json` — etapy i lekcje kociej mapy, wskazujące istniejące słówka, zadania i reguły.
- `02-food/sciezka-praktyka.json` — druga mapa z zadaniami w kontekście posiłków, przepisu i śniadania oraz treningiem wcześniejszej mapy.

Słówka, gramatyka i rozmówki używają lokalnych pastelowych ilustracji SVG pasujących do kotków. Gramatyka przedstawia sytuację ze zdania (np. brak mleka, dwie butelki wody, zamawianie czy powód i skutek). [Edycja ilustracji](public/illustrations/README.md).

[Instrukcja edycji materiałów](public/content/README.md) zawiera przykłady. Po zmianie uruchom `npm.cmd run check:content`. Podczas lokalnej nauki wystarczy zapisać pliki i odświeżyć stronę. Po wysłaniu zmian na `main` GitHub automatycznie sprawdzi, zbuduje i opublikuje aplikację. W zainstalowanej PWA nowa wersja pojawi się jako przycisk „Zaktualizuj”.

Przy istotnej zmianie używanego już słówka, zadania lub lekcji sprawdź wpływ na ukończenia, aktywne sesje i powtórki. Listę zadań lekcji można zmieniać także po jej ukończeniu (D-52), ale opublikowanych słówek i zadań nie usuwamy z plików i nie zmieniamy im `rev`: to uniemożliwia wznowienie zapisanych pytań. Stosuj [zasady edycji lekcji](docs/format-materialow.md#aktualizacja-wydanej-lekcji); nie podbijaj masowo rewizji ani wersji Food. Kopia postępów nie zawiera treści modułów. Zdjęcia źródłowe są w pomijanym przez Git folderze `.local-materials`.

[Zakres i źródła modułu Food](docs/materialy-food.md).

## GitHub Pages

Konfiguracja Vite używa względnych ścieżek, więc aplikacja obsługuje adres w podkatalogu repozytorium. Workflow `.github/workflows/pages.yml` automatycznie publikuje każdy push na `main`, po poprawnym przejściu testów i budowania. Można go też uruchomić ręcznie przez „Publish Pages → Run workflow”. Osobny workflow `checks.yml` sprawdza push i pull request bez publikowania strony.

Wszystkie opublikowane moduły są publicznymi plikami strony. Wyniki gościa pozostają lokalnie; wyniki konta są też synchronizowane z Firebase. Baza postępów i blokada karty są oddzielone według ścieżki aplikacji, aby różne repozytoria na GitHub Pages nie współdzieliły danych. Do testów najlepiej używać innego profilu przeglądarki.

## Dokumenty

- [Wymagania](docs/wymagania.md)
- [Plan pierwszej wersji](docs/plan-pierwszej-wersji.md)
## Test zbudowanej strony w podkatalogu

Po zbudowaniu aplikacji można sprawdzić pliki z `dist` pod ścieżką taką jak na GitHub Pages:

```powershell
npm.cmd run build
$env:HANIA_BROWSER_CHANNEL='msedge'
$env:HANIA_TEST_BUILD='1'
npx.cmd playwright test
Remove-Item Env:HANIA_TEST_BUILD
```

Testy używają odizolowanych danych. Bez zmiennej `HANIA_TEST_BUILD` uruchamiają wersję deweloperską. Zmienna `HANIA_BASE_URL` służy do sprawdzania innego adresu i ma pierwszeństwo przed lokalnym podglądem.

## Struktura kodu

[Mapa plików i zasady rozwijania aplikacji](docs/05-architektura.md) opisuje ekrany, kontrolery, logikę nauki i zapis. Główny plik uruchamia teraz wydzielone moduły; format wyników i kopii pozostaje zgodny.

### Strona startowa

- `src/views/home.ts` — wygląd strony startowej, ramki następnego kroku, pomocy i aktualizacji; otrzymuje dane, nie zapisuje wyników.
- `src/next-step.ts` — wybór kolejnej czynności na podstawie istniejących postępów konta; bez nowego formatu zapisu i bez odwołań do przeglądarki.
- `src/views/catalog.ts` — osobne katalogi map i modułów.
- `src/views/hero-art.ts` — dotychczasowy kotek z książką.
- `src/ui.ts`, `src/learning-labels.ts` — wspólne ikony, przyciski, bezpieczne wyświetlanie tekstu i nazwy trybów.
- `src/home.css` — układ tych ekranów, także na telefonie.
- `src/main.ts` — uruchamia aplikację i łączy jej części; przejścia i kliknięcia obsługuje `src/app/events.ts`, a czynność następnego kroku wykonuje `src/controllers/learning.ts`.

Nowe mapy dodaje się przez materiały modułu (pole `journeyPath`), a ich kolejność wyznacza `order`. Logika następnego kroku obsługuje wiele modułów; obecny katalog produkcyjny nadal zawiera Food.

## Pokoje i wyposażenie za Food

Każdy kurs każdego konta ma osobny domek i portfel gwiazdek. Dotychczasowy pokój, zakupy, ustawienia i saldo pozostają w angielskim. Pierwsza mapa Food odblokowuje miseczki, dzbanek lemoniady, koszyk i koc piknikowy, a druga misę owoców, toster z kocimi uszami, półeczkę z kubkami i stolik. Za obie mapy otrzymujesz bezpłatnie Kocią kuchnię; wyposażenie kupujesz za gwiazdki. Wcześniejsze ukończenia też są uwzględniane. [Wymagania, ceny, edycja i zgodność zapisu](docs/koci-domek.md).
