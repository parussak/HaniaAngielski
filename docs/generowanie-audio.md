# Lokalne generowanie audio — D-59

**Stan obecny (D-60, D-61):** Food i Technology for all korzystają z gotowych nagrań Cori **24 kb/s** w aplikacji i PWA offline. Synteza przeglądarki jest źródłem zapasowym. [Instrukcja audio](../audio/README.md), [reguły słuchania](03-nauka.md), [architektura](05-architektura.md).

**Pomiar 13 listopada 2026:** 97 haseł i 23 kwestie scen dają 120 odwołań do 111 różnych klipów. Nagrania zajmują 266 115 bajtów (259,9 KiB), manifest 76 404 bajty; razem około 335 KiB. To pomiar tego zestawu, nie limit przyszłych modułów. Gotowe pliki sprawdzono przez pełne dekodowanie ffmpeg; nie wykonano nowego odsłuchu każdego słowa ani próby na telefonie.

## Uzgodniony zakres

Wybrany głos: **Cori high, brytyjski angielski**, po odsłuchaniu próbek przez Paulinę. Pliki: **Ogg Opus, mono, docelowo 24 kb/s** (zmiana z 16 kb/s w D-61). Generator uruchamiamy jednym poleceniem `npm run audio`. Nie pobiera narzędzi i nie korzysta z usług sieciowych podczas generowania.

Plan nagrań obejmuje pełne formy haseł, kwestie scen z lukami uzupełnionymi pierwszą akceptowaną odpowiedzią oraz zdania czytanek (D-68, odwołania `reading-sentence`). Zakres Technology for all obejmuje także rozmówkę telefoniczną i trzy czytanki. Pytania do czytanek, polecenia, objaśnienia, tłumaczenia i pozostałe warianty odpowiedzi są dostępne w tekście.

## Granice odpowiedzialności

- `public/content/` pozostaje jedynym miejscem redakcji materiału. Generator korzysta ze wspólnego odczytu materiałów i istniejącej reguły pełnej odpowiedzi, zamiast kopiować słówka lub zasady a/an.
- `audio/config.json` określa moduły, głos, parametry i wersje narzędzi poprzez sumy SHA-256. Nie zawiera kopii treści lekcji ani ścieżki konkretnego użytkownika.
- `scripts/audio/` odpowiada za plan tekstów, generowanie, kontrolę i pliki wynikowe. Aplikacja nie importuje generatora.
- `audio/generated/` zawiera gotowe nagrania i manifesty, przeznaczone do repozytorium. Źródło pozostaje **poza `public/`**. W D-60 budowanie kopiuje zweryfikowane klipy do `dist/audio/` wraz z lekkim indeksem; pełny manifest pozostaje poza publikacją.
- Piper, jego biblioteki, modele głosu i ffmpeg pozostają poza projektem. Ścieżkę można podać lokalnie; nie kopiujemy setek MB narzędzi do repozytorium.

## Zachowanie generatora

1. Czyta i sprawdza aktualne materiały. Łączy identyczne teksty tego samego języka i profilu w jeden klip; manifest zachowuje osobne odwołania do słowa lub kwestii sceny.
2. Nazwa klipu wynika z tekstu, języka, głosu i parametrów oraz wskazanych wersji narzędzi/modelu. Poprawienie tekstu zmienia właściwy klip, a zmiana profilu unieważnia odpowiedni zestaw.
3. Przy kolejnym uruchomieniu sprawdza sumy istniejących plików, zachowuje prawidłowe i generuje tylko brakujące lub uszkodzone. Niezmieniony zestaw nie jest ponownie zapisywany.
4. Zachowuje parametry zatwierdzonych próbek: długość fonemów 1,08; odstęp między zdaniami 0,25 s; przycięcie nadmiaru ciszy i wyrównanie głośności. Od D-65 słówka odtwarzają się próbnie z mnożnikiem 0,95, dialogi 0,90; dodatkowe „Wolniej” stosuje kolejne 0,7. Te mnożniki należą do odtwarzacza (`src/speech/tempo.ts`), a nie obróbki generatora. Wolniejsza wersja nie jest osobnym plikiem.
5. **Pojedyncze słowa (D-66):** hasło z jednego słowa, także z rodzajnikiem z listy profilu (`a`, `an`, `the`), trafia do Pipera z przecinkiem zamiast końcowej kropki lub wykrzyknika („bread” → „bread,”, „Cool!” → „Cool,”). Bez tego Piper czasem przeciągał słowo do kilku sekund lub je zniekształcał; próba 18 listopada 2026 (10 podejrzanych słówek, po 5 wersji) i odsłuch Pauliny wskazały przecinek jako najlepszy wariant. Kropka pogarszała część słów („jam.”, „put.” do 1,5–3 s). Ustawienie: `synthesis` w profilu w `audio/config.json`. Manifest zapisuje tekst podany Piperowi jako `spoken`; wyświetlany tekst i klucz odtwarzacza się nie zmieniają, a kwestie scen zachowują swoje nagrania. Przecinek nie gwarantuje dobrej wymowy (np. „cool” nadal brzmi trochę jak „pool”).
6. Przy błędzie nie zastępuje poprzedniego kompletnego zestawu. Po udanej aktualizacji usuwa wyłącznie stare pliki zarządzanego zestawu; nie czyści dowolnych katalogów ani nieznanych plików. Blokuje jednoczesne uruchomienia.
7. Oddzielna kontrola `npm run audio:check` wykrywa brakujące, nieaktualne, uszkodzone i osierocone nagrania bez uruchamiania syntezatora. W pierwotnym D-59 kontrola była osobnym poleceniem. Od D-60 budowanie wykonuje tę kontrolę przed publikacją plików.

## Głos i źródła

[Karta Cori high](https://huggingface.co/rhasspy/piper-voices/raw/main/en/en_GB/cori/high/MODEL_CARD) opisuje jeden brytyjski głos kobiecy oraz zbiór treningowy z LibriVox jako domenę publiczną. Informacja o zbiorze nie jest dodatkową deklaracją licencji wszystkich narzędzi. Nie rozpowszechniamy ich plików binarnych ani modelu w tym repozytorium.

Generator korzysta z [udokumentowanego wejścia JSON Pipera](https://github.com/rhasspy/piper/blob/2023.11.14-2/README.md#json-input): wiele tekstów w jednym uruchomieniu modelu, osobny WAV dla każdego. Parametry kompresji są jawne w konfiguracji. Docelowa przepływność VBR nie oznacza identycznej wielkości wszystkich klipów.

## Kontrola brzmienia — `npm run audio:verify`

`npm run audio:check` sprawdza tylko pliki. Brzmienie („zepsuty robot”) sprawdza osobne, lokalne polecenie `npm run audio:verify`, uruchamiane po `npm run audio` przy każdym nowym rozdziale. Skrypt **tylko czyta** `audio/generated/` — nie zmienia nagrań, treści ani aplikacji i nie jest częścią `npm run build`.

**Co robi.** Tekst każdego klipu bierze z `audio/generated/manifest.json`. Dekoduje nagranie przez ffmpeg z narzędzi generatora, przepuszcza je przez [whisper.cpp](https://github.com/ggml-org/whisper.cpp) (rozpoznawanie mowy offline, sam procesor, bez Pythona) i porównuje usłyszany tekst z oczekiwanym. Do tego mierzy próbki: długość względem długości tekstu, ciszę w środku, udział mowy i przesterowanie. Wynik: krótki raport `audio/.verify/raport.md` (też na ekranie), posortowany od najgorszych. Dla każdego podejrzanego: klucz hasła lub kwestii, tekst oczekiwany, usłyszany, pewność rozpoznania, pomiary, powód i ścieżka pliku do odsłuchu. Do odsłuchu skrypt kopiuje podejrzane nagrania do `audio/.verify/odsluch/` pod czytelnymi nazwami (`01-bread.ogg`, `r1-a-vegetable.ogg` dla listy rodzajników; numer jak w raporcie) i tworzy tam `index.html` z odtwarzaczami — oryginalne nazwy w `audio/generated/clips/` to skróty treści, nieczytelne dla człowieka. Katalog `odsluch/` jest odtwarzany przy każdym uruchomieniu. Katalog `audio/.verify/` jest poza Git; pamięć podręczna rozpoznań sprawia, że przy kolejnym rozdziale Whisper słucha tylko nowych klipów (`--od-nowa` wymusza wszystko).

**Kiedy klip jest podejrzany** (progi w `scripts/audio/verify-core.mjs`):

| Powód | Próg | Dlaczego tak |
| --- | --- | --- |
| Inny tekst | ponad 25% znaków różnicy albo połowa słów inna przy ≥ 12,5% znaków | Jedna literówka Whispera w dłuższym słowie (np. „beautifull”) nie alarmuje; „sandwich” → „sad wish” tak. |
| Nic nie rozpoznano | pusta transkrypcja | Szum, bełkot lub cisza. |
| Niska pewność | średnio poniżej 45% | Whisper zgadł tekst, ale niepewnie — wstępny próg, do skalibrowania. |
| Za długie / za krótkie | ponad 1,8× / poniżej 0,55× typowego tempa zestawu | Tempo = czas / (liczba liter + 4), względem mediany wszystkich klipów; „+4” wyrównuje stały narzut krótkich słówek. |
| Długa cisza w środku | ponad 0,8 s | Odstęp między zdaniami to 0,25 s; najdłuższa naturalna pauza w Food to 0,5 s. |
| Mało mowy | poniżej 35% nagrania | Krótkie słowa ze spółgłoskami zwartymi („milk”, „meat”) mają ok. 45%. |
| Przesterowanie | więcej niż 3 próbki na granicy skali | Generator ogranicza szczyt do −2 dB, więc każde przesterowanie jest błędem. |

**Normalizacja.** Przed porównaniem: małe litery, bez interpunkcji i apostrofów („I'd” = „id”), łączniki jako spacje, liczby 0–20 słownie, porównanie znaków bez spacji („milk shake” = „milkshake”). Jeśli różni się **tylko początkowy rodzajnik** („an apple” → „Apple.”), klip nie jest podejrzany, ale trafia do osobnej listy „Do odsłuchu: rodzajnik” — Whisper często gubi rodzajnik w pojedynczym słówku, a a/an jest tu treścią nauki.

**Ograniczenia.** Whisper nie dostaje podpowiedzi z oczekiwanym tekstem (żeby nie „słyszał” tego, co powinien), więc pojedyncze słówka bez kontekstu bywają rozpoznane błędnie mimo dobrej wymowy. W drugą stronę: poprawne rozpoznanie nie gwarantuje ładnego brzmienia — model rozumie też mowę lekko „robotyczną”. Raport wskazuje, co odsłuchać; nie zastępuje odsłuchu. Model `small.en` obsługuje tylko angielski; klipy w innych językach są pomijane z informacją w raporcie (francuski i włoski będą wymagały modelu wielojęzycznego). Bez Whispera: `npm run audio:verify -- --bez-rozpoznawania` wykonuje same pomiary.

**Jak czytać raport.** Przy zdaniach i dialogach Whisper ma kontekst i rzadko się myli — „inny tekst” to tam poważny sygnał. Przy pojedynczych słówkach „inny tekst” i „niska pewność” to najczęściej pomyłka Whispera, nie nagrania: po wprowadzeniu D-66 raport Food oznaczył 19 słówek, a odsłuch wykazał, że wszystkie brzmią dobrze. Dla słówek traktuj listę jako „co odsłuchać”, a nie „co jest zepsute”. Poważnym sygnałem przy słówku pozostaje pomiar: „za długie”, „za krótkie”, „długa cisza w środku” (tak wykryto przeciągnięte „bread”).

**Decyzja po raporcie** (Claude proponuje, Paulina odsłuchuje tylko podejrzane): *wygenerować ponownie* — model Pipera losuje drobne różnice intonacji przy każdej syntezie, więc nowa próba może zabrzmieć lepiej (nie zmierzono, jak bardzo różnią się kolejne syntezy); generator zachowuje poprawne pliki, więc trzeba usunąć ten jeden plik `.ogg` z `audio/generated/clips/` i uruchomić `npm run audio`; *zmienić tekst* (np. interpunkcję, która zmienia intonację) to zmiana treści w `public/content/`, po której `npm run audio`; *zostawić*, gdy po odsłuchu brzmi dobrze.

**Instalacja (raz, poza repozytorium).** W folderze narzędzi generatora (`male-kroki-audio-narzedzia/`) utwórz `whisper/` i umieść w nim:

```text
male-kroki-audio-narzedzia/
  whisper/
    Release/whisper-cli.exe   …i pozostałe pliki z whisper-bin-x64.zip
    models/ggml-small.en-q8_0.bin
```

1. Z wydania [whisper.cpp b5454](https://github.com/ggml-org/whisper.cpp/releases/tag/b5454) pobierz `whisper-bin-x64.zip` (ok. 9 MB, wersja dla procesora) i rozpakuj do `whisper/` (powstanie `Release/`).
2. Z [modeli whisper.cpp](https://huggingface.co/ggerganov/whisper.cpp/tree/main) pobierz `ggml-small.en-q8_0.bin` (ok. 264 MB) do `whisper/models/`.

Wersje i sumy SHA-256 są w `audio/verify.json`; skrypt sprawdza je przed uruchomieniem i niczego nie pobiera. Katalog narzędzi wybiera tak jak generator (`--tools`, `MALE_KROKI_AUDIO_TOOLS`, domyślna lokalizacja). Przy świadomej wymianie programu lub modelu uaktualnij `audio/verify.json`; pamięć podręczna jest związana z sumą modelu.

## Poza tym etapem

D-60 wdraża podłączenie do `Speaker`, mechanizm nagranie → synteza → zwykłe zadanie, pobieranie przez PWA i wolniejsze odtwarzanie bez dodatkowego pliku. Próby na fizycznym telefonie i automatyczny tryb obserwowania zmian pozostają na później. Sam generator nie uruchamia aplikacji ani nie zmienia wyników.
