# Kocia mapa i domek

Food ma siedem etapów i 41 krótkich lekcji. Obejmuje wszystkie 97 słówek oraz dotychczasowe zadania gramatyczne i rozmówki. Etap może mieć kilka lekcji; lekcja zawiera maksymalnie osiem pozycji przed powtórkami błędów.

1. Jedzenie i napoje — 5 lekcji.
2. Śniadanie — 5 lekcji.
3. Co można policzyć? — 8 lekcji.
4. Ilości i opakowania — 7 lekcji.
5. W restauracji — 5 lekcji.
6. Powód i skutek — 1 lekcja.
7. Koci piknik — 10 lekcji, w tym dwie końcowe misje.

Wejście: **Moja nauka → Kocia mapa Food**. Przycisk **Kontynuuj naukę** wybiera pierwszą niedokończoną lekcję. Najpierw pojawiają się słówka z obrazkami albo zasady i przykłady; potem wybiera się sposób odpowiadania i uruchamia ćwiczenia. Sesja wraca po odświeżeniu przez **Kontynuuj** na stronie głównej. Po jej ukończeniu odblokowuje się następna lekcja. Poprzednie lekcje można powtarzać. Dawne wyniki pozostają w postępach; mapa jest nową ścieżką i nie nalicza automatycznie nagród za stare swobodne sesje.

## Gwiazdki

- Pierwsze ukończenie każdej lekcji: **3 ★**, również z błędami i poprawkami. Razem 123 gwiazdki za 41 lekcji Food.
- Ponowne ukończenie tej samej lekcji nie nalicza kolejnych 3 gwiazdek.
- Ukończenie zwykłej powtórki błędów: **1 ★ raz dziennie**, o ile sesja miała zadania. Kolejna taka sesja tego samego dnia nie daje premii.
- Nie odbieramy gwiazdek za błędy i przerwy. Nie ma płatności ani kupowania dostępu do materiałów.
- Food ukończony na mapie daje także widoczną w domku odznakę kociego kucharza. Ukończenie oznacza przejście lekcji, nie deklarację trwałego zapamiętania wszystkich słów; trudne pozycje pozostają do powtórki.

Nagroda jest częścią tego samego zapisu co ukończona sesja. Sprawdzenie identyfikatora lekcji zapobiega powtórnemu naliczeniu po ponownym kliknięciu czy odświeżeniu. Saldo to zdobyte gwiazdki pomniejszone o zapisane koszty zakupów.

## Domek

Zakładka **Domek** jest dostępna w nawigacji. Sześć dekoracji: poduszka 6 ★, kłębek 4 ★, drapak 12 ★, roślinka 8 ★, książeczki 10 ★ i koszyk 8 ★. Każdy przedmiot kupuje się raz. Kupiony przedmiot można ustawić w jednym z sześciu miejsc albo schować. Zajęte miejsca powodują zamianę dekoracji, a nie usunięcie zakupu. Kliknięcie miejsca zapisuje ustawienie; ruch myszy/palca nie wysyła zapisów. Domek jest wspólny dla modułów jednego użytkownika. Osobne konta i gość mają osobne salda i domki.

Tło i wyposażenie to siedem małych plików SVG w `public/game`. Kotki korzystają z już istniejących plansz; nie dodano kolejnych dużych bitmap, bibliotek gier ani płatnego serwera. Mapa, domek i zakupy działają offline po pobraniu PWA, a zapis konta synchronizuje się po połączeniu.

## Edycja

- `public/content/02-food/sciezka.json`: etapy, tytuły, wprowadzenia i kolejność lekcji. `wordIds`, `exerciseIds` i `ruleIds` wskazują istniejące treści — nie kopiujemy pytań ani reguł do kodu.
- `src/adventure.ts`: zasady postępu, nagród, ceny i miejsca dekoracji.
- `src/adventure-view.ts`, `src/adventure.css`: wygląd.
- `docs/historia.md`: części historii, stare kopie i publikacja reguł Firebase.

Nie zmieniaj identyfikatorów istniejących lekcji przy korekcie tytułu: według nich zapisane są ukończenia i przyznane nagrody.
