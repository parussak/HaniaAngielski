# Lokalne generowanie audio — D-59

**Stan obecny:** generator i zestaw Food są gotowe. Uruchamianie i lokalizację narzędzi opisuje [instrukcja audio](../audio/README.md). Odtwarzanie w aplikacji pozostaje syntezą przeglądarki z D-58.

**Pomiar 13 listopada 2026:** 97 haseł i 23 kwestie scen dają 120 odwołań do 111 różnych klipów. Nagrania zajmują 266 115 bajtów (259,9 KiB), manifest 76 404 bajty; razem około 335 KiB. To pomiar tego zestawu, nie limit przyszłych modułów. Gotowe pliki sprawdzono przez pełne dekodowanie ffmpeg; nie wykonano nowego odsłuchu każdego słowa ani próby na telefonie.

## Uzgodniony zakres

Wybrany głos: **Cori high, brytyjski angielski**, po odsłuchaniu próbek przez Paulinę. Pliki: **Ogg Opus, mono, docelowo 16 kb/s**. Generator uruchamiamy jednym poleceniem `npm run audio`. Nie pobiera narzędzi i nie korzysta z usług sieciowych podczas generowania.

W tym etapie przygotowujemy nagrania dla Food: pełne formy wszystkich haseł z wymaganymi a/an oraz wszystkie kwestie czterech scen, z lukami uzupełnionymi pierwszą akceptowaną odpowiedzią. Nie nagrywamy polskich poleceń, objaśnień ani wszystkich wariantów odpowiedzi. Nie zmieniamy materiału podręcznikowego, identyfikatorów, wyników ani gwiazdek.

## Granice odpowiedzialności

- `public/content/` pozostaje jedynym miejscem redakcji materiału. Generator korzysta ze wspólnego odczytu materiałów i istniejącej reguły pełnej odpowiedzi, zamiast kopiować słówka lub zasady a/an.
- `audio/config.json` określa moduły, głos, parametry i wersje narzędzi poprzez sumy SHA-256. Nie zawiera kopii treści lekcji ani ścieżki konkretnego użytkownika.
- `scripts/audio/` odpowiada za plan tekstów, generowanie, kontrolę i pliki wynikowe. Aplikacja nie importuje generatora.
- `audio/generated/` zawiera gotowe nagrania i manifesty, przeznaczone do repozytorium. Pozostaje **poza `public/` i `dist/`**, dlatego strona i pamięć offline nadal nie korzystają z nagrań.
- Piper, jego biblioteki, modele głosu i ffmpeg pozostają poza projektem. Ścieżkę można podać lokalnie; nie kopiujemy setek MB narzędzi do repozytorium.

## Zachowanie generatora

1. Czyta i sprawdza aktualne materiały. Łączy identyczne teksty tego samego języka i profilu w jeden klip; manifest zachowuje osobne odwołania do słowa lub kwestii sceny.
2. Nazwa klipu wynika z tekstu, języka, głosu i parametrów oraz wskazanych wersji narzędzi/modelu. Poprawienie tekstu zmienia właściwy klip, a zmiana profilu unieważnia odpowiedni zestaw.
3. Przy kolejnym uruchomieniu sprawdza sumy istniejących plików, zachowuje prawidłowe i generuje tylko brakujące lub uszkodzone. Niezmieniony zestaw nie jest ponownie zapisywany.
4. Zachowuje parametry zatwierdzonych próbek: długość fonemów 1,08; odstęp między zdaniami 0,25 s; przycięcie nadmiaru ciszy i wyrównanie głośności. Wolniejsza wersja nie jest osobnym plikiem.
5. Przy błędzie nie zastępuje poprzedniego kompletnego zestawu. Po udanej aktualizacji usuwa wyłącznie stare pliki zarządzanego zestawu; nie czyści dowolnych katalogów ani nieznanych plików. Blokuje jednoczesne uruchomienia.
6. Oddzielna kontrola `npm run audio:check` wykrywa brakujące, nieaktualne, uszkodzone i osierocone nagrania bez uruchamiania syntezatora. W tym etapie nie podłączamy jej do zwykłego budowania strony.

## Głos i źródła

[Karta Cori high](https://huggingface.co/rhasspy/piper-voices/raw/main/en/en_GB/cori/high/MODEL_CARD) opisuje jeden brytyjski głos kobiecy oraz zbiór treningowy z LibriVox jako domenę publiczną. Informacja o zbiorze nie jest dodatkową deklaracją licencji wszystkich narzędzi. Nie rozpowszechniamy ich plików binarnych ani modelu w tym repozytorium.

Generator korzysta z [udokumentowanego wejścia JSON Pipera](https://github.com/rhasspy/piper/blob/2023.11.14-2/README.md#json-input): wiele tekstów w jednym uruchomieniu modelu, osobny WAV dla każdego. Parametry kompresji są jawne w konfiguracji. Docelowa przepływność VBR nie oznacza identycznej wielkości wszystkich klipów.

## Poza tym etapem

Podłączenie nagrań do `Speaker`, mechanizm nagranie → synteza → zwykłe zadanie, pobieranie nagrań przez PWA, zwalnianie odtwarzania i próby na telefonie należą do następnego etapu. Automatyczny tryb obserwowania zmian także pozostaje na później. Sam generator nie zmienia działania aplikacji.
