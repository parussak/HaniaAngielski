# Zgłaszanie problemu z zadania (D-80)

Hania może z dowolnego zadania zgłosić, że coś jest nie tak (np. niewyraźne nagranie). Paulina znajduje wpis w konsoli Firebase i wie, którą wypowiedź odsłuchać. Zgłoszenie nie zmienia postępów, sesji ani treści.

## Jak to wygląda dla Hani

1. Pod zadaniem jest zawsze przycisk **Zgłoś problem** — także wtedy, gdy dźwięk się nie odtworzył.
2. Okienko pyta „Co jest nie tak?”: „Nic nie słychać”, „Słychać, ale trudno zrozumieć” (tylko gdy na ekranie jest dźwięk), „W zadaniu lub odpowiedzi jest błąd”, „Coś innego”. Pierwsze trzy wysyłają się jednym kliknięciem; „Coś innego” prosi o krótki opis i przycisk „Wyślij”.
3. Gdy na ekranie można odsłuchać kilka wypowiedzi (kwestie dialogu, zdania czytanki), po wyborze „Nic nie słychać” albo „Słychać, ale trudno zrozumieć” Hania wskazuje, której dotyczy zgłoszenie; ostatnio odtwarzana jest opisana jako „ostatnio odtwarzana”. Przy jednej wypowiedzi pytania nie ma.
4. „Zamknij” (lub Esc) zamyka okienko; „Wróć do zadania” po wysłaniu też. Zadanie, wpisana odpowiedź i lekcja nie są przerysowywane.

| Sytuacja | Co zobaczy Hania |
| --- | --- |
| Konto, internet, zapis potwierdzony przez Firebase | „Wysłano. Dziękujemy!” (dopiero po potwierdzeniu) |
| Konto, brak internetu | „Brak internetu. Zgłoszenie czeka na tym urządzeniu i wyślemy je, gdy połączenie wróci.” |
| Konto, wysyłka nie powiodła się (także gdy reguły nie są jeszcze wdrożone) | „Nie udało się wysłać teraz. Zgłoszenie czeka na tym urządzeniu i spróbujemy jeszcze raz.” |
| Bez konta (gość) | „Zapisane na tym urządzeniu. Wyślemy je, gdy zalogujesz się na konto.” |

Zgłoszenia mogą wysyłać tylko zalogowani (decyzja Pauliny): gość nie ma konta, więc reguły nie dopuszczają zapisu bez logowania, a zapełnienie kolekcji przez kogoś, kto zna publiczny klucz aplikacji, nie zużyje dziennego limitu zapisów wspólnego z synchronizacją postępów.

## Kolejka na urządzeniu

Zgłoszenie najpierw trafia do kolejki w IndexedDB (klucz `reports-outbox`, osobno od postępów — nie jest częścią kopii i `Progress` się nie zmienia), dopiero potem jest wysyłane. Kolejka wychodzi: zaraz po zgłoszeniu, po powrocie sieci (`online`), po powrocie do aplikacji (`focus`) i po udanej synchronizacji konta. Wysyła jedno zgłoszenie naraz.

Brak duplikatów: identyfikator dokumentu to 32 znaki hex wylosowane przy otwarciu okienka. Szybkie dwukrotne kliknięcie trafia w krok „sending” i nic nie robi; ponowna wysyłka używa tego samego identyfikatora (`setDoc`), a reguły dopuszczają tylko zapis niezmieniający istniejącego wpisu.

Kolejka jest przypisana do urządzenia, nie do konta: pierwszy zalogowany użytkownik, który wejdzie do aplikacji z internetem, wysyła czekające zgłoszenia pod swoim UID.

## Co jest w kolekcji `zgloszenia`

Jeden dokument = jedno zgłoszenie, ID dokumentu = identyfikator zgłoszenia. Pola (nazwy po angielsku, wartości do odczytu):

| Pole | Znaczenie |
| --- | --- |
| `format` | zawsze 1 |
| `uid` | konto, które wysłało (wymusza je reguła) |
| `createdAt` | czas zgłoszenia według zegara urządzenia (Firestore: timestamp) |
| `category` | `no-sound`, `unclear`, `wrong-content`, `other` |
| `comment` | opis (tylko „Coś innego”, do 500 znaków) |
| `course`, `module` | kurs i moduł (`course` tylko jeśli moduł go zna) |
| `item` | klucz zadania, np. `unit-2-food@1:exercise:talk--four` — dla sceny to aktualna luka |
| `excerpt` | początek pytania/hasła (do 160 znaków) |
| `audio` | tylko dla `no-sound` i `unclear`: patrz niżej |

Pole `audio`:

| Pole | Znaczenie |
| --- | --- |
| `text`, `language` | dokładny tekst, który był odtwarzany (w scenie: kwestia z uzupełnionymi lukami), i język |
| `line`, `speaker` | numer kwestii w rozmowie / zdania w czytance oraz mówiący — przy zgłoszeniu z dialogu to wskazuje kwestię do odsłuchu |
| `recordingFile` | plik z katalogu nagrań, np. `clips/<hash>.ogg` (hash jest też nazwą pliku w `audio/generated/clips/`, jeśli jest tam lokalnie) — tylko gdy tekst ma nagranie |
| `playback` | `recording` (próbowano pliku), `device-voice` (głos urządzenia) albo `none` (nic się nie odtworzyło) — tylko gdy aplikacja wie o ostatniej próbie tej wypowiedzi |
| `recordingFailed` | `true`, gdy plik nie zagrał i aplikacja przeszła do głosu urządzenia lub ciszy |

Brakujących danych aplikacja nie zgaduje — pola po prostu nie ma. Nie wysyłamy plików audio ani sesji nauki.

## Jak Paulina czyta zgłoszenia

Konsola Firebase → Firestore Database → kolekcja `zgloszenia`. Konsola nie podlega regułom, więc wpisy widać; aplikacja nie ma listy zgłoszeń i nie pobiera ich. Panel administratora i osobna strona są poza zakresem tej wersji.

## Reguły Firestore

`firestore.rules`, blok `zgloszenia`: zalogowany użytkownik może **utworzyć** dokument o ID z 32 znaków hex i z dokładnie dozwolonymi polami (kształt i rozmiary sprawdzane, `uid` = własny); **nie ma** `get`, `list` ani `delete`; `update` jest dozwolony tylko dla własnego dokumentu i tylko gdy niczego nie zmienia (ponowna wysyłka). Reguły postępów i historii są bez zmian.

**Reguły trzeba opublikować w projekcie Firebase** (instrukcja w [Firebase](firebase.md)). Do tego czasu zgłoszenia czekają w kolejce na urządzeniu i nie giną.

## Co sprawdzono automatycznie (patrz [testy](07-testy.md))

- `tests/problem-report.test.ts`: wypowiedzi na ekranie (scena, czytanka, słuchanie), kategorie, planer, dokument; zgodność pól dokumentu z listą pól w `firestore.rules` (porównanie tekstowe).
- `tests/playback-record.test.ts`, `tests/report-controller.test.ts`: zapis próby odtwarzania; kolejka, offline, gość, duplikaty, błąd zapisu.
- `tests/browser/problem-report.spec.ts`: przebieg na telefonie z atrapą Firebase.

**Nie sprawdzono w testach:** zachowanie reguł Firestore (brak emulatora w projekcie; wymagałby nowej zależności i Javy — decyzja Pauliny), prawdziwy zapis do Firebase, telefon fizyczny.
