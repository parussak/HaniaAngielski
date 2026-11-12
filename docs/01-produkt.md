# Produkt — dla kogo i po co

Status: opis obecnego produktu i uzgodnionego kierunku. Ostatnie uporządkowanie: 10 listopada 2026 r. [Jak czytać dokumentację](README.md).

## Stan obecny

„Małe kroki” to aplikacja internetowa/PWA z polskim interfejsem, kontami, zapisem lokalnym i synchronizacją. Obecny materiał to angielski Food dla Hani. Są dwa wejścia: kocia mapa i ćwiczenia po swojemu. Strona startowa ma też ramkę następnego kroku, a stała nawigacja prowadzi do: Nauki, Map, Domku, Postępów i Konta. Kopia postępów jest w Koncie, również bez logowania. Na telefonie pięć wejść mieści się w dolnym pasku. Mapy dotyczą wybranego kursu.

Szczegółowy punkt odniesienia: [produkt przed zmianami](stan-obecny/produkt.md). Food ma już dwie mapy i trening wcześniejszej mapy. Zakres uzupełnienia oraz ograniczenia względem podręcznika opisuje [raport etapu 4](wdrozenie-food.md). Francuski i włoski nie mają jeszcze produkcyjnych materiałów.

Każdy kurs każdego konta ma własny domek i portfel gwiazdek. Dawny dorobek pozostaje w angielskim. Ukończenie map Food udostępnia wyposażenie do kupienia, a obie mapy dają bezpłatnie kuchnię; zaległe błędy nie blokują pokoju. [Pokoje, nagrody i ochrona danych](koci-domek.md).

## Uzgodnione założenia docelowe

### Użytkownicy i materiał

- Hania uczy się angielskiego i bardzo podstawowego francuskiego według swoich podręczników.
- Paulina zaczyna włoski na poziomie około A1/A2 i również ma podręcznik; później nauka może być dopasowywana do jej potrzeb.
- Wspólna aplikacja obsługuje różne kursy. Treści językowe nie są wpisywane w mechanikę ćwiczeń.
- Jeden kurs odpowiada jednemu podręcznikowi do danego języka; inne podręczniki tego języka stanowią osobne kursy.
- Ten sam kurs może służyć wielu kontom: korzystają ze wspólnych materiałów i zachowują własne postępy. Testowanie przez Paulinę nie zmienia wyników Hani.
- Dodawanie kolejnych materiałów ma zwykle polegać na przygotowaniu treści, a nie dopisywaniu wyjątków w kodzie.
- Nauka gramatyki ma wspierać rozumienie: po poprawnej i błędnej odpowiedzi użytkownik dostaje uzasadnienie reguły w kontekście konkretnego zdania (D-31).

### Wybór kursu i poznany materiał — wdrożone w etapie 3

Pod powitaniem użytkownik widzi kurs i przycisk „Wybierz kurs”. Mapy i moduły są ograniczone do wybranego podręcznika. Link „Ćwicz cały poznany materiał” otwiera globalne fiszki, quiz i gramatykę; dotychczasowe wejścia modułowe pozostają. Zmiana kursu nie usuwa rozpoczętej sesji. Jeżeli jest z innego kursu, można do niej wrócić osobnym przyciskiem; rozpoczęcie nowej wymaga potwierdzenia zastąpienia. [Pełny opis działania](wdrozenie-zakresow.md).

### Dwa sposoby korzystania

| Sposób | Doświadczenie użytkownika |
| --- | --- |
| Nauka prowadzona | Użytkownik wybiera kurs i moduł, a 1–3 mapy prowadzą przez jego najważniejsze słownictwo i gramatykę. Każda mapa ma kilka lekcji, w tym odpowiednio umieszczone treningi i powtórki. |
| Nauka swobodna | Użytkownik wybiera fiszki, quiz lub gramatykę z materiału konkretnego modułu albo z dotychczas poznanego materiału całego wybranego kursu. |

„Globalny” zakres dotyczy wybranego kursu. Nie oznacza przypadkowego mieszania francuskiego, angielskiego i włoskiego. Reguły zakresu są opisane w [nauce](03-nauka.md), a powiązania obiektów w [mechanice](02-mechanika.md).

Oprócz treningów na mapie użytkownik może uruchomić dodatkowy trening na żądanie, bez czekania na termin i nawet kilka razy dziennie, z wcześniej poznanego materiału wybranego kursu (D-27). Przycisk jest na mapie i w ćwiczeniach swobodnych; ukończona nowa sesja daje 1 ★ (D-34). Podstawowy wybór kursu i zakresu jest wdrożony; osobne aktywne sesje oraz preferencje odpowiedzi per kurs pozostają zaparkowane w U-08.

Wybór kursu ogranicza katalogi i dobór ćwiczeń. Ekran „Twoje postępy” i historia nauki obejmują całe konto. Bilans gwiazdek i domek są osobne dla każdego kursu.

### Co oznacza ukończenie

Przejście map modułu oznacza przepracowanie jego najważniejszego wymaganego zakresu. Ukończenie mapy wymaga zwykłych lekcji i treningów na mapie; dodatkowe treningi są dobrowolne, a powtórki błędów nie blokują ukończenia (D-32). Nie jest to obietnica, że materiał pozostanie zapamiętany bez dalszego utrwalania. Treningi podtrzymują znajomość, a powtórki pomagają przepracować błędy.

Produkt pokazuje te informacje zrozumiale, bez utożsamiania ukończenia mapy, braku błędów i trwałego opanowania całego podręcznika. Szczegółowe kryteria i nagrody należą do [zasad nauki](03-nauka.md).

Zatwierdzono prezentację D-23: postęp lekcji na pasku lub w kółku dochodzi do 100% po wszystkich lekcjach, niezależnie od powtórek. Zaległe błędy pokazujemy pomarańczowo jako liczbę, np. „5 ćwiczeń do utrwalenia”, bez ogólnego procentu utrwalenia. Gdy lekcje są ukończone i zaległości wynoszą zero, całość otrzymuje zielony stan i gratulacje. Szczegóły liczenia i znaczenie trzech zaliczeń są w dokumencie nauki; ta prezentacja jest wdrożona w pierwszym etapie D-34.

## Urządzanie domku — stan obecny

Zakładki „Sklep” i „Moje rzeczy” oddzielają wybieranie zakupów od przeglądania własnej kolekcji. Przy zakupie widać jego pokój lub schowek. Dodatkowe miejsca i warstwy pozwalają łączyć tekstylia, meble i drobiazgi w jednym wnętrzu. Każdy pokój ma własne wyposażenie. „Urządź pokój” pozwala przeciągać rzeczy po siatce albo przesuwać je strzałkami. Rozmiary są stałe i nie ma obracania; własność i ceny pozostają zachowane. [Kontrakt domku](koci-domek.md).

## Do ustalenia

- Ewentualne osobne aktywne sesje i preferencje sposobu odpowiadania dla kursów — [U-08](decyzje.md#u-08). Sam wybór kursu i globalne ćwiczenia są wdrożone.
- Czy dla Pauliny potrzebne są inne cele, tempo lub opcje oprawy — [U-09](decyzje.md#u-09).
- Dokładny zakres liczników na ekranach — [U-07](decyzje.md#u-07). Prezentacja postępu (D-23), moment poznania (D-25) oraz uwzględnienie wcześniejszych prób bez zmiany ocen, ukończeń i gwiazdek (D-26) są zatwierdzone. Poznany zakres jest wdrożony; odczytuje także starszą historię i zachowuje fakt poznania przy zastąpieniu niedokończonej sesji — [U-04](decyzje.md#u-04).

## Granice dokumentu

Tutaj opisujemy potrzeby i doświadczenie użytkownika. Format danych jest w mechanice, poprawność językowa w merytoryce, algorytm utrwalania w nauce, a wykonanie techniczne w architekturze. Nie kopiujemy do opisu produktu wszystkich szczegółów tych zasad.