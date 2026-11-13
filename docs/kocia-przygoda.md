# Kocia mapa i domek

Food ma dwie mapy. Pierwsza zachowuje siedem etapów i 41 krótkich lekcji. Druga, „Kocia kuchnia — Food w praktyce”, ma cztery lekcje kontekstowe i jeden trening wcześniejszej mapy. [Zakres etapu 4 i ochrona wyników](archiwum/wdrozenie-food.md). Pierwsza mapa obejmuje wszystkie 97 słówek oraz dotychczasowe zadania gramatyczne i rozmówki. Etap może mieć kilka lekcji; lekcja zawiera maksymalnie osiem pozycji przed powtórkami błędów.

1. Jedzenie i napoje — 5 lekcji.
2. Śniadanie — 5 lekcji.
3. Co można policzyć? — 8 lekcji.
4. Ilości i opakowania — 7 lekcji.
5. W restauracji — 5 lekcji.
6. Powód i skutek — 1 lekcja.
7. Koci piknik — 10 lekcji, w tym dwie końcowe misje.

Wejście: **Moja nauka → Wybierz przygodę → wybrana mapa Food**. Przycisk **Kontynuuj naukę** wybiera pierwszą niedokończoną lekcję. Najpierw pojawiają się słówka z obrazkami albo zasady i przykłady; potem wybiera się sposób odpowiadania i uruchamia ćwiczenia. Sesja wraca po odświeżeniu przez **Kontynuuj** na stronie głównej. Po jej ukończeniu odblokowuje się następna lekcja. Poprzednie lekcje można powtarzać. Dawne wyniki pozostają w postępach; mapa jest nową ścieżką i nie nalicza automatycznie nagród za stare swobodne sesje.

## Wersje lekcji

Etapy 1–4 pozostają bez zmian. Nieukończone lekcje etapów 5–7 mają poprawione wersje po 6–8 zadań. Ukończone stare lekcje zachowują oryginalny zakres, a rozpoczęte sesje swoje pytania. Nowo ukończone wersje zachowują znacznik wydania 2. Nie przeliczamy ukończeń, gwiazdek ani zakupów.

## Gwiazdki

- Pierwsze ukończenie każdej lekcji: **3 ★**, również z błędami i poprawkami. Razem 123 gwiazdki za 41 lekcji Food.
- Ponowne ukończenie tej samej lekcji nie nalicza kolejnych 3 gwiazdek.
- Domknięcie etapu: **3 ★ raz**, gdy wszystkie jego lekcje są ukończone, a każda pozycja w powtórce osiągnęła 3/3 poprawnych odpowiedzi. Etap bez błędów dostaje tę premię po ostatniej lekcji. Siedem etapów Food to dodatkowe 21 gwiazdek (łącznie 144 z lekcjami pierwszej mapy).
- Druga mapa: pięć pierwszych ukończeń po 3 ★, maksymalnie 15 ★. Jej powtórka nie ma nowej dodatkowej premii. Dawna odznaka pierwszej mapy zostaje.
- Premia 1 ★ za ogólną powtórkę raz dziennie została wyłączona. Wcześniej zdobyte gwiazdki pozostają w portfelu.
- Nie odbieramy gwiazdek za błędy i przerwy. Nie ma płatności ani kupowania dostępu do materiałów.
- Food ukończony na mapie daje także widoczną w domku odznakę kociego kucharza. Ukończenie oznacza przejście lekcji, nie deklarację trwałego zapamiętania wszystkich słów; trudne pozycje pozostają do powtórki.

Nagroda jest częścią tego samego zapisu co ukończona sesja. Sprawdzenie identyfikatora lekcji zapobiega powtórnemu naliczeniu po ponownym kliknięciu czy odświeżeniu. Saldo to zdobyte gwiazdki pomniejszone o zapisane koszty zakupów.

## Powtórka na końcu każdego etapu

Każdy etap ma kafelek **Powtórka**. Zbiera błędy tylko z jego własnych lekcji, również podczas ich ponownego przechodzenia. Etap gramatyczny zbiera zadania, a etap słownikowy słówka. Ta sama pozycja może wymagać niezależnego utrwalenia w dwóch etapach, jeśli błąd wystąpił w obu. Swobodna „Powtórka błędów” pozostaje osobnym treningiem i nie zastępuje tur etapowych.

- 0/3: pozycja jest gotowa do najbliższej tury.
- Po pierwszej poprawnej odpowiedzi pomija jedną turę, po drugiej dwie.
- Trzecia samodzielna poprawna odpowiedź oznacza utrwalenie 3/3.
- Błąd zeruje serię i przywraca pozycję w następnej turze. Natychmiastowa poprawka po wyjaśnieniu oraz kolejna próba tej samej pozycji w tej samej turze nie zwiększają licznika.
- Postęp zapisujemy dopiero po ukończeniu całej tury, do 10 różnych pozycji. Samo otwarcie, zamknięcie lub porzucenie poprawnie zaczętej tury nie zwiększa licznika. Nowy błąd zapisuje się od razu, żeby nie można było go cofnąć zamknięciem.
- Jeśli wszystkie pozostałe pozycje czekają na późniejszą turę, aplikacja od razu wybiera najbliższy niepusty zestaw. Można uczyć się kilka razy tego samego dnia; nie ma ograniczeń dniami ani pustych uruchomień.

Na zwiniętym kafelku etapu widać ukończenie lekcji i osobną liczbę zaległości, np. **4 ćwiczenia do utrwalenia**, oznaczoną pomarańczowo. Pasek i procent pokazują ukończenie lekcji i dochodzą do 100% bez czekania na powtórki. Po ukończeniu lekcji i wyzerowaniu zaległości pojawia się zielony stan z gratulacjami. Na głównym podglądzie Food i nad mapą widać podsumowanie. We wspólnym podsumowaniu powtarzająca się pozycja jest liczona raz; pozostaje zaległa, jeśli choć jeden etap jeszcze jej nie utrwalił.

Powtórka nie blokuje zakończenia etapu ani następnych lekcji. Po ponownym błędzie liczba zaległości może wzrosnąć, ale ukończenie lekcji i przyznane gwiazdki pozostają. Premia etapu nigdy nie jest przyznawana drugi raz.

Nowe pola są opcjonalną częścią zapisu `adventure`: `stageReviews`, `reviewSchema` i kursor `reviewArchiveHead`. Stare błędy lekcji z mapy są odtwarzane z ostatnich sesji i, jednorazowo, z archiwum. Brakujące starsze części na drugim urządzeniu wymagają połączenia; nie blokuje to bieżącej nauki. Nagrody etapowe czekają, aż sprawdzenie dawnej historii zostanie zakończone, żeby nie przyznać ich przedwcześnie. Nowszych serii nie zerujemy przy doczytywaniu dawnego błędu. Kolejki, tury i nagrody są objęte zwykłą synchronizacją, ochroną konfliktów, kopią i działaniem offline. Nie trzeba zmieniać reguł Firebase po tej aktualizacji, jeśli reguły dla archiwum zostały już opublikowane.

## Dodatkowy trening

Na mapie i w ćwiczeniach swobodnych jest dobrowolny **Dodatkowy trening**. Powtarza wcześniej poznane słówka i gramatykę z tego kursu, również bezbłędne, zwykle w 8 zadaniach. Przy mniejszej puli może być krótszy. Każda nowa ukończona sesja daje 1 ★; wznowienie i ponowne przetworzenie tej samej sesji nie naliczają gwiazdki ponownie. Nie blokuje mapy i można uruchomić go kilka razy dziennie. Nie ma jeszcze wybranego algorytmu odstępów.

Mechanizm treningu na kolejnych mapach jest osobny: wymagana lekcja po 2–3 lekcjach nowego materiału, materiał wyłącznie wcześniejszych map i nagroda 3 ★ tylko za pierwsze ukończenie. Obecna pierwsza mapa Food pozostaje bez takich lekcji.

## Domek

Zakładka **Domek** jest dostępna w nawigacji. Sześć dekoracji: poduszka 6 ★, kłębek 4 ★, drapak 12 ★, roślinka 8 ★, książeczki 10 ★ i koszyk 8 ★. Każdy przedmiot kupuje się raz. Kupiony przedmiot można ustawić w jednym z sześciu miejsc albo schować. Zajęte miejsca powodują zamianę dekoracji, a nie usunięcie zakupu. Kliknięcie miejsca zapisuje ustawienie; ruch myszy/palca nie wysyła zapisów. Domek jest wspólny dla modułów jednego użytkownika. Osobne konta i gość mają osobne salda i domki.

Tło i wyposażenie to siedem małych plików SVG w `public/game`. Kotki korzystają z już istniejących plansz; nie dodano kolejnych dużych bitmap, bibliotek gier ani płatnego serwera. Mapa, domek i zakupy działają offline po pobraniu PWA, a zapis konta synchronizuje się po połączeniu.

## Edycja

- `public/content/02-food/sciezka.json`: etapy, tytuły, wprowadzenia i kolejność lekcji. `wordIds`, `exerciseIds` i `ruleIds` wskazują istniejące treści — nie kopiujemy pytań ani reguł do kodu.
- `src/adventure.ts`: zasady postępu, nagród, ceny i miejsca dekoracji.
- `src/adventure-view.ts`, `src/adventure.css`: wygląd.
- `docs/historia.md`: części historii, stare kopie i publikacja reguł Firebase.

Nie zmieniaj identyfikatorów istniejących lekcji przy korekcie tytułu: według nich zapisane są ukończenia i przyznane nagrody.
