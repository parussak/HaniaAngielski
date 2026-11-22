# Merytoryka — treść językowa i jej źródła

Status: oddzielenie treści od formatu i prowadzenia nauki. [Mechanika](02-mechanika.md) opisuje możliwości danych; [nauka](03-nauka.md) określa ich wykorzystanie.

## Stan obecny

Format kursów i znaczeń jest wdrożony i opisany w [instrukcji materiałów](format-materialow.md). Nowy format rozdziela warianty językowe od jawnych akceptowanych odpowiedzi; walidacja nie jest recenzją tych odpowiedzi. [Etap 4](archiwum/wdrozenie-food.md) dokumentuje porównanie Food ze zdjęciami, uzupełnienie kontekstu na drugiej mapie oraz zakres nieobjęty ćwiczeniami. Treści Food są w `public/content/02-food/`. Zawierają słownictwo, gramatykę, dialogi, odpowiedzi, źródła i ilustracje. Obecna walidacja sprawdza strukturę i wybrane zależności; testy chronią także konkretne wcześniejsze poprawki Food.

Nie ma automatycznej recenzji całego podręcznika, potwierdzonego poziomu każdego zadania ani formularza importu zdjęć/PDF z OCR. Pole `source` jest tekstem, a nie dowodem weryfikacji językowej.

Dokładny opis istniejących plików i kontroli: [materiały — punkt odniesienia](archiwum/stan-obecny/materialy.md). Instrukcja edycji obecnego Food: [public/content/README.md](../public/content/README.md).

## Uzgodnione założenia docelowe

### Co należy do merytoryki

- Znaczenie słowa lub zwrotu w określonym kontekście, tłumaczenia i realizacje językowe.
- Reguły gramatyczne, przykłady, odmiany, rodzajniki, akcenty i elizje.
- Poprawne odpowiedzi i językowo dopuszczalne warianty dla konkretnego pytania.
- Wyjaśnienia w określonym dla kursu języku objaśnień, odpowiednie dla odbiorcy; dla trzech początkowych kursów po polsku — zgodnie z D-12 w [decyzjach](decyzje.md).
- Zgodność ilustracji z konkretnym znaczeniem.
- Źródło podręcznikowe oraz wskazanie najważniejszego zakresu modułu.

### Granice materiału

Podręcznik wyznacza zakres kursu i działu. Zadania mogą być adaptacjami, ale nie powinny przypadkowo wymagać niepoznanego słownictwa i gramatyki spoza ustalonego zakresu. Ćwiczenie bieżącej mapy może opierać się na dozwolonych wcześniejszych treściach; trening korzysta z wcześniejszych map zgodnie z [zasadami nauki](03-nauka.md).

Lista wymaganych elementów modułu stanowi podstawę kontroli pokrycia przez mapy. Zdefiniowanie, że dane słowo lub reguła są ważne w podręczniku, jest decyzją merytoryczną; porównanie list odwołań może być kontrolą techniczną.

### Forma odpowiedzi a poziom nauki — D-35

Zachowujemy koncepcję zadań podręcznikowych, ponieważ odpowiada poziomowi ucznia. Jeśli zadanie polega na uzupełnieniu słowa lub wyrażenia w zdaniu, uczeń podaje tylko ten fragment. Jeśli podano warianty, wybiera odpowiedź. Przepisania lub napisania całego zdania wymagamy tylko wtedy, gdy jest to cel zadania źródłowego. Adaptacja do aplikacji nie może niejawnie zwiększać wymagań pisania.

Zasada obowiązuje również po błędzie oraz w powtórce ogólnej i etapowej: zachowujemy kontekst zdania, lukę i jej klucz. Objaśnienie może przedstawiać pełne poprawne zdanie, ale poprawka nadal dotyczy wyłącznie wymaganej części. Wpisywane odpowiedzi do luk mają wskazówkę „Wpisz tylko brakujący fragment, bez przepisywania całego zdania”, także podczas ponownej próby i po wznowieniu sesji. Fiszki i pytania wyboru nie otrzymują tej wskazówki.

Przegląd aktualnych plików Food wykazał 104 zadania gramatyczne i dialogowe z krótkimi odpowiedziami; nie znaleziono kluczy wymagających pisania całych zdań. Nie zmieniono ich identyfikatorów, odpowiedzi ani rewizji. Podstawowe formy ćwiczeń porównano ze zdjęciami podręcznika s. 27 i 29; nie jest to nowa recenzja wszystkich treści językowych modułu.

### Inspiracja podręcznikiem, własny tekst — D-73 (propozycja)

Aplikacja jest publiczna (GitHub Pages), choć korzystają z niej tylko Hania i Paulina. Dlatego treść ma realizować ten sam zakres co podręcznik, ale własnymi słowami.

**Przejmujemy z podręcznika**, bo to zakres podstawy programowej, a nie tekst autora:

- słówka i wyrażenia z listy działu,
- struktury gramatyczne i typowe zwroty funkcyjne spotykane w każdym podręczniku na tym poziomie (np. *What's your favourite…?*, *I like… because…*),
- typ i poziom ćwiczenia (luka, dopasowanie, wybór) zgodnie z D-35.

**Piszemy od nowa:** zdania przykładowe i zdania z lukami (słowo w luce zostaje, kontekst jest własny), dialogi, sceny i czytanki z postaciami-kotkami aplikacji, polecenia i wyjaśnienia.

**Nie przenosimy:** postaci, ich imion i charakterystycznych historii z podręcznika, rymowanek, piosenek, czytanek, ilustracji ani układu ćwiczenia (ta sama kolejność zdań, tylko z innymi słowami).

**Test zdania:** czy mogłoby się znaleźć w dowolnym podręczniku na tym poziomie? Jeśli tak, to zwykły język. Jeśli jest charakterystyczne dla tej książki, piszemy własne. Poza zwrotami z listy słówek nie powtarzamy dłuższego ciągu kolejnych słów z oryginału.

**Źródła:** pole `source` i karty w `docs/materialy/` dalej wskazują strony podręcznika. To narzędzie pracy i recenzji. Aplikacja nie pokazuje tych odwołań użytkownikowi (dziś pokazuje je m.in. informacja zwrotna po odpowiedzi, ściąga gramatyki i ustawienia modułu). Ukrycie ich to osobne zadanie mechaniki. Odwołania nadal są widoczne w publicznym repozytorium i w plikach treści.

**Istniejąca treść:** nie przerabiamy jej. Wyjątkiem są zadania z nazwami postaci z podręcznika albo wyraźnie skopiowanym fragmentem. Poprawiamy wtedy tekst i zachowujemy `id` i `rev` (D-52).

### Warianty i znaczenia

Zgodnie z D-16 w [rejestrze](decyzje.md) jedno hasło opisuje jedno konkretne znaczenie, z własną przypisaną ilustracją i wariantami językowymi. Przy opracowywaniu materiału trzeba rozdzielić różne znaczenia tego samego zapisu, zamiast dobierać jeden obrazek i wspólną listę tłumaczeń dla wszystkich.

Obrazek i tłumaczenie są związane ze znaczeniem, nie wyłącznie z identycznym zapisem słowa. Lista odpowiedzi dla zadania nie musi obejmować wszystkich form i tłumaczeń hasła. Nie uznajemy dowolnego synonimu za poprawny, jeśli nie pasuje do kontekstu pytania.

Nie zakładamy, że akcenty i rodzajniki można globalnie pomijać. Uzgodnione zasady kursu wskazują, kiedy są wymagane i jak pokazywać błąd. Mechanika stosuje te zasady; nie tworzy własnej gramatyki francuskiego ani włoskiego.

### Uzasadnienia gramatyczne

Zgodnie z D-31 w [rejestrze](decyzje.md), informacja zwrotna po odpowiedzi poprawnej i błędnej ma tłumaczyć zastosowanie reguły w konkretnym zdaniu. Samo podanie poprawnej formy lub ogólnego hasła reguły nie wystarcza. Wyjaśnienie powinno pomóc zrozumieć, dlaczego forma jest właściwa oraz na czym polega błąd, jeśli odpowiedź była niepoprawna.

Poprawność tego uzasadnienia i jego dopasowanie do kontekstu wymagają recenzji merytorycznej; sam niepusty tekst w polu wyjaśnienia nie potwierdza jakości. Aplikacja pokazuje zapisaną odpowiedź użytkownika na jasnoróżowym tle oraz poprawny wariant na zielonym tle, bez przekreśleń i zaznaczania różnic znaków (D-36). Zachowuje wcześniej przygotowane wyjaśnienie zadania. Dane słówka mogą dodatkowo zawierać wyjaśnienie użycia a/an (D-37); nie jest to generowana na żywo diagnoza dowolnej pomyłki. Polecenie słownikowe ma wskazywać konkretne znaczenie i liczbę, zamiast łączyć różne formy w niejednoznacznym tłumaczeniu. Szczególne kryteria odpowiedzi FR/IT nadal wymagają ustalenia w U-06.

### Przygotowanie materiału i recenzja

Proces opisuje [instrukcja dodawania modułu](dodawanie-modulow.md). Rozdziela odczyt źródła, opracowanie treści, kontrolę pokrycia, kontrolę techniczną i recenzję językową. [Karta materiałów](szablon-modulu.md) zapisuje źródła, zakres sprawdzenia, osobę lub AI wykonujące przegląd oraz niepewności. Niepewnego odczytu nie uzupełniamy zgadywaniem.

To lekka procedura redakcyjna w plikach, nie formularz importu ani automatyczny recenzent w aplikacji. Nie przesądza niezależnego zatwierdzania treści przez nauczyciela ani otwartych zasad odpowiedzi FR/IT. Nie dodajemy AI do każdej sesji użytkownika, żeby rozwiązać problem przygotowania podręcznika.

## Czego tutaj nie opisujemy

Liczba zadań w lekcji, kolejność powtórek, 3 zaliczenia, procenty i gwiazdki należą do [nauki](03-nauka.md). Pola JSON, typy pytań i odwołania należą do [mechaniki](02-mechanika.md) oraz opisu istniejącego formatu. Konta i synchronizacja należą do [zapisu](06-zapis.md).

## Do ustalenia

Polityka wariantów odpowiedzi: [U-06](decyzje.md#u-06). Podręczniki, zakres pilotażu i sposób zatwierdzania treści: [U-10](decyzje.md#u-10). Ustalenia właściwe dla kursu będą w [kartach kursów](kursy/README.md), zamiast w kodzie wspólnego silnika.
