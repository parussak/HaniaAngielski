# Mechanika — obiekty i ich możliwości

Status: model pojęciowy i wdrożone podstawy etapu 2. [Format plików kursów i znaczeń](format-materialow.md) opisuje obecny kontrakt; [raport etapu 2](wdrozenie-kursow.md) oddziela wykonane zmiany od dalszych założeń. [Decyzje i statusy](decyzje.md).

## Stan obecny

Prezentacja zadania może mieć opcjonalny `pairGroup` (2–3 słówka w planszy, każde oceniane oddzielnie) albo `presentation: bank` (jedna oceniana odpowiedź do luki, wybrana z propozycji). To oprawa istniejących `word`/`exercise`, nie drugi zestaw odpowiedzi lub tłumaczeń. Sesja zapisuje wybrane hasło lub propozycję, a jej ukończenie nadal wymaga próby każdego bazowego zadania. `legendary` oznacza pełną dobrowolną powtórkę tej samej lekcji, bez nowego identyfikatora ukończenia. [D-50](03-nauka.md).

Sekcja może deklarować opcjonalny plan 7 + 2: siedem lekcji bazowych i dwa generowane przystanki z rolą `recall`. Zapisany plan zawiera identyfikatory bazowe i miejsca wstawienia; pytania powstają z historii przy uruchomieniu sesji, nie przez edycję treści lekcji. Sesja otwarcia/finału ma opcjonalną rolę `ritual`, bez tworzenia nowego rodzaju pytania. [Format](format-materialow.md), [dobór, wymagalność i nagrody](03-nauka.md), [zapis i zgodność](06-zapis.md).

Kod ma `Course`, `Meaning` i `LanguageVariant` w `src/materials/` oraz zgodne typy ćwiczeń `Word`, `Exercise`, `Module`, `Session`, `Journey`, `Stage` i `Lesson`. Moduł może wskazywać do trzech map, a lekcja może mieć rolę treningu. Food ma dwie mapy: starą z siedmioma etapami i drugą z pięcioma lekcjami, w tym treningiem wcześniejszego zakresu. Lekcja ma jedną aktualną treść (`update`, jeśli istnieje, inaczej sama lekcja), wspólną dla wszystkich kont; ukończenie zależy wyłącznie od identyfikatora lekcji, a rozpoczęta sesja od własnej zapisanej listy zadań (D-52). Zapisane `edition` jest znacznikiem historycznym. [Ochrona postępów](wdrozenie-food.md#ochrona-wyników-i-nagród). `Word` pozostaje projekcją znaczenia do istniejącego silnika, a nie drugim źródłem treści do ręcznej edycji.

Źródła: [model danych](../src/learning/model.ts), [mapy](../src/adventure.ts). Szczegóły istniejącego formatu: [materiały — stan obecny](stan-obecny/materialy.md).

## Uzgodniona hierarchia docelowa

Każdy kurs ma osobno określony język nauki i język objaśnień. Dla początkowych kursów angielskiego Hani, francuskiego Hani i włoskiego Pauliny objaśnienia będą po polsku. Jest to ustawienie kursu, nie założenie na stałe wpisane w mechanikę — [D-12](decyzje.md).

```text
Kurs — jeden podręcznik do określonego języka
└── Moduł — zakres działu podręcznika
    ├── Materiał: hasła, gramatyka, zwroty, dialogi
    ├── 1–3 mapy
    │   └── Kilka lekcji na każdej mapie
    └── Fiszki, quizy i gramatyka do ćwiczeń swobodnych
```

Ćwiczenia wskazują wspólny materiał. Nie tworzą osobnych kopii tego samego słówka tylko dlatego, że pojawia się ono na mapie, w fiszkach i w treningu. Zestaw globalny jest widokiem poznanego materiału kursu, nie dodatkowym modułem podręcznika.

## Obiekty

### Podstawowe informacje o kursie

Uzgodniony zakres D-17 w [rejestrze](decyzje.md):

- nazwa kursu;
- język nauki i język objaśnień;
- tytuł, autor i wydanie podręcznika;
- poziom albo zakres poziomów, np. A1–A2;
- uporządkowana lista modułów.

Odwołania do konkretnych stron i źródeł ćwiczeń pozostają przy materiałach modułu. Reprezentacja tych danych jest wdrożona w rejestrze kursów. Braki identyfikacji książki są jawnym `null`; nie dopisujemy tytułów ani autorów z domysłów. Powiązanie istniejącego Food nie wymaga zmiany jego plików ani kluczy postępów.

### Definicje i powiązania

**Kurs i użytkownik:** z jednego kursu może korzystać wiele kont. Definicje i materiały kursu są wspólne, natomiast każde konto ma własne postępy i wykonane sesje. Testowanie kursu na koncie Pauliny nie zmienia wyników Hani — D-14 w [rejestrze](decyzje.md). Postępy tego samego elementu są również osobne w każdym kursie jednego konta: znajomość elementu w kursie A nie zalicza go automatycznie w kursie B (D-15). Współdzielenie materiału lub ilustracji nie oznacza współdzielenia wyników.

**Tożsamość kursu a wydanie podręcznika:** dodruk i drobne poprawki pozostają w tym samym kursie. Istotna zmiana wydania, np. układu działów lub zakresu, oznacza osobny kurs — D-13 w [rejestrze](decyzje.md). Nie oznacza to zatwierdzenia przenoszenia wyników ani sposobu zmiany rewizji poszczególnych zadań.

| Pojęcie | Co reprezentuje | Co umożliwia mechanika |
| --- | --- | --- |
| Kurs | Jeden podręcznik do określonego języka | Grupowanie modułów tego podręcznika i ograniczanie zakresu ćwiczeń |
| Moduł | Dział materiału w kursie | Powiązanie treści, 1–3 map i ćwiczeń modułowych |
| Mapa | Uporządkowana droga przez część materiału modułu | Umieszczanie i łączenie lekcji; wskazywanie pokrywanego zakresu |
| Lekcja | Określony zestaw prezentacji i zadań | Posiadanie celu, zakresu i ustalonej wielkości; uruchomienie sesji |
| Hasło / znaczenie | Jedno konkretne znaczenie słowa, zwrotu lub wyrażenia | Przypisana ilustracja, warianty językowe i powiązanie ze źródłami — D-16 |
| Wariant językowy hasła | Zapis lub realizacja znaczenia w określonym języku | Powiązanie form, tłumaczeń i przykładów; bez zakładania, że każda para języków tłumaczy się jeden do jednego |
| Reguła gramatyczna | Jednostka objaśnienia i ćwiczenia | Powiązanie wyjaśnienia, przykładów i pytań |
| Pytanie / zadanie | Jedna okazja do udzielenia odpowiedzi | Polecenie, prezentacja, sposób odpowiedzi, kryterium sprawdzenia i informacja zwrotna |
| Quiz | Zestaw lub sposób dobierania pytań | Uruchomienie pytań z określonego zakresu |
| Fiszka | Forma aktywnego ćwiczenia hasła | Pokazanie bodźca, przyjęcie odpowiedzi i udzielenie informacji zwrotnej |
| Dialog z luką | Zadanie osadzone w rozmowie | Prezentacja wypowiedzi i wskazanie miejsca odpowiedzi |
| Sesja | Konkretne podejście użytkownika | Kolejność zadań, odpowiedzi, poprawki, wznowienie i wynik |

Wariant językowy znaczenia nie jest tym samym co lista akceptowanych odpowiedzi w zadaniu. Znaczenie, kontekst i forma pytania mogą wymagać węższej odpowiedzi. Nie łączymy automatycznie różnych znaczeń jednego zapisu w jedno hasło; np. budowla i zamek w drzwiach potrzebują rozróżnienia.

Uzgodniona zasada D-16: każde hasło opisuje jedno znaczenie, z własną przypisaną ilustracją i wariantami językowymi. „Zamek — budowla” i „zamek — zapięcie” to dwa hasła, a nie warianty językowe jednego hasła. Techniczny format tych powiązań jest wdrożony dla nowych plików słownictwa; stare Food jest odczytywane przez adapter zgodności.

## Pytania i sprawdzanie odpowiedzi

- **Zamknięte:** użytkownik wybiera spośród podanych wariantów.
- **Otwarte z krótką odpowiedzią:** użytkownik wpisuje odpowiedź sprawdzaną według jawnych wariantów i ustalonych zasad normalizacji.
- **Swobodna wypowiedź:** odrębna możliwość wymagająca własnego sposobu oceniania. Nie jest wdrożona ani wymagana do pierwszego pilotażu nowych kursów.

Mechanika potrafi przechować i zastosować kryterium odpowiedzi. Nie rozstrzyga sama, czy francuski rodzajnik albo włoska odmiana są poprawne — konkretne kryteria pochodzą z [merytoryki](04-merytoryka.md).

Obecne porównywanie odpowiedzi w `src/answers.ts` normalizuje Unicode do NFC, ujednolica apostrofy typograficzne, odstępy i wskazane znaki interpunkcyjne (`. , ! ? …`). Domyślnie pomija wielkość liter; zadanie może wymusić jej rozróżnianie przez `caseSensitive`. Nie usuwa akcentów ani nie stosuje automatycznej tolerancji literówek. Domyślnie wymaga jednego z jawnych wariantów po normalizacji. Wyjątek jest jawnie zadeklarowany w danych słownictwa: opcjonalne `article` określa `a`, `an` albo brak rodzajnika i gotowe wyjaśnienie. Brak wymaganego a/an zalicza słówko z pomarańczową uwagą; błędny lub zbędny rodzajnik oznacza błąd. Gramatyka i hasła bez takich danych zachowują dokładne kryteria. Szczegóły formatu są w [kontrakcie materiałów](format-materialow.md), a polityka językowa w [karcie angielskiego](kursy/angielski-hani.md). Nie rozszerza to tolerancji francuskich ani włoskich odpowiedzi.

## Lekcja: trzy niezależne wymiary

| Wymiar | Przykłady |
| --- | --- |
| Rola w nauce | Poznawanie/ćwiczenie, trening wcześniejszych map, powtórka błędów |
| Treść | Słownictwo, gramatyka, zwroty, dialogi |
| Forma zadania | Fiszka, pytanie zamknięte, wpisanie odpowiedzi, dialog z luką |

Trening może więc zawierać słownictwo i gramatykę oraz korzystać z różnych form pytań. „Gramatyka” nie musi być konkurencyjną rolą wobec „treningu”. Reguły doboru i rozmieszczenia tych lekcji należą do [nauki](03-nauka.md).

## Granica mechanika — nauka — merytoryka

| Przykład | Gdzie należy |
| --- | --- |
| Zadanie może mieć kilka akceptowanych odpowiedzi | Mechanika |
| Po błędzie materiał wraca z określoną częstotliwością | Nauka |
| W danym zdaniu wymagany jest konkretny rodzajnik | Merytoryka |
| Program przechowuje i wyświetla ilustrację | Mechanika |
| Ilustracja przedstawia właściwe znaczenie słowa | Merytoryka |
| Zmiana stanu trafia do lokalnej bazy i chmury | Zapis |

## Do ustalenia

Format kursu i wariantów językowych jest opisany w [kontrakcie materiałów](format-materialow.md), a wybór kursu jest wdrożony w etapie 3. Dalsze rozszerzenia modelu pozostają w [U-01](decyzje.md#u-01). Szczegółowa polityka sprawdzania i swobodnych odpowiedzi: [U-06](decyzje.md#u-06). Istniejące identyfikatory nie są zmieniane przez przyjęcie tego słownika pojęć.


## Rozgrzewka a zapisane role — D-46–D-47

Nazwa produktu „Kocia rozgrzewka” zastępuje trening, nie tworzy drugiego typu wymaganej lekcji. W materiałach zachowano `role: training`, a w sesjach `training.kind: map | extra`. Rozgrzewka na mapie ma ten sam identyfikator lekcji i wpis ukończenia; dodatkowa nie powiększa wymaganej listy. Tematy z wcześniejszymi błędami nadal używają `review` i `stageReview` w zapisie, lecz użytkownik widzi krótką rozgrzewkę bez licznika trzech zaliczeń. To zgodna warstwa prezentacji, bez przepisywania historii i bez nowego formatu kopii. [Zasady doboru i nagród](03-nauka.md).
