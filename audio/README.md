# Nagrania przygotowywane lokalnie

## Jedno polecenie

Z katalogu głównego projektu:

```powershell
npm run audio
```

Generator czyta aktualne materiały Food i tworzy lub aktualizuje nagrania. Nie trzeba ręcznie przepisywać słów, zmieniać kodu strony ani wskazywać każdego pliku. Zmień treść w `public/content/02-food/`, zapisz ją i ponownie uruchom polecenie.

Wyniki są w [generated/manifest.json](generated/manifest.json) i katalogu `generated/clips/`. Manifest jest indeksem: przy każdym haśle i wypowiedzi sceny zawiera tekst oraz identyfikator klipu. Identyczne teksty współdzielą nagranie. Pliki `.ogg` zawierają **Opus mono 24 kb/s**, nie Vorbis. Model Cori i ustawienia są w [config.json](config.json).

**Aplikacja korzysta z nagrań (D-60).** Budowanie sprawdza ich zgodność i publikuje klipy oraz mały indeks `audio/catalog.json`; PWA zapisuje je offline razem z wydaniem. Do Firebase nie wysyłamy dźwięku. Do Git dodaj cały katalog `audio/` wraz z gotowymi klipami. Nie edytuj ręcznie manifestu ani nazw nagrań.

## Tempo odtwarzania

Od D-62 aplikacja odtwarza słówka w tempie A (0,88×), dialogi w tempie B (0,75×), a „Wolniej” zwalnia je jeszcze o 30%. Ustawienia są w `src/speech/tempo.ts`; generator pozostawia klipy bazowe, aby nie stosować zwolnienia dwukrotnie. Nie trzeba generować osobnej wolnej wersji ani ponownie uruchamiać generatora przy zmianie samego tempa odtwarzacza.

## Wymagane narzędzia na komputerze przygotowującym dźwięk

Domyślnie generator szuka folderu `male-kroki-audio-narzedzia` obok projektu, w układzie:

```text
male-kroki-audio-narzedzia/
  ffmpeg.exe
  piper/
    piper.exe
    ...biblioteki i espeak-ng-data z tej samej paczki Pipera...
  voices/
    en_GB-cori-high.onnx
    en_GB-cori-high.onnx.json
```

To pobrane wcześniej narzędzia: Piper 2023.11.14-2, ffmpeg 9.0.2 oraz Cori high. Generator sprawdza konkretne sumy SHA-256 wymienione w konfiguracji. Nie pobiera, nie instaluje ani nie aktualizuje programów. Zachowaj pełną paczkę Pipera z bibliotekami; samo `piper.exe` nie wystarcza.

Jeśli narzędzia są gdzie indziej:

```powershell
npm run audio -- --tools "D:\Moje narzędzia\male-kroki-audio-narzedzia"
```

Można też ustawić zmienną środowiskową `MALE_KROKI_AUDIO_TOOLS`. Kolejność wyboru: parametr `--tools`, zmienna, domyślna lokalizacja. Ścieżka użytkownika nie jest zapisywana w manifeście. Obecna konfiguracja uruchamiania jest przygotowana dla pobranych narzędzi Windows.

## Sprawdzenie bez syntezatora

```powershell
npm run audio:check
```

Ta kontrola działa również na komputerze bez Pipera i ffmpeg: porównuje materiały i ustawienia z manifestem, sumy plików i strukturę Ogg Opus, mono oraz czas trwania. Wykrywa brak, zmianę tekstu, uszkodzenie i osierocone pliki. Nie zastępuje odsłuchu wymowy. Nie pobiera archiwów ani żadnych usług.

Podgląd planu, bez zapisywania i bez narzędzi:

```powershell
npm run audio -- --plan
```

## Co dzieje się po poprawkach

- Poprawienie hasła lub odpowiedzi w scenie zmienia tylko potrzebne nagrania. Zmiana polskiego tłumaczenia bez zmiany odczytywanego tekstu nie uruchamia syntezy ponownie.
- Zmiana głosu, jego modelu, tempa, obróbki, kompresji lub wskazanych wersji narzędzi zmienia identyfikatory nagrań. Przy świadomej wymianie narzędzia lub modelu uaktualnij jego sumę i profil. Nie omijaj błędu sumy, jeśli nie wiesz, skąd pochodzi plik.
- Po udanej aktualizacji stare klipy z poprzedniego manifestu są usuwane. Nieznany plik w katalogu wynikowym zatrzymuje operację, zamiast zostać usunięty.
- Błąd syntezy lub kompresji pozostawia poprzedni zestaw. Prace tymczasowe i blokada są pomijane przez Git. Po awarii procesu plik `audio/.generator.lock` można usunąć dopiero po upewnieniu się, że generator już nie działa.
- `npm run build` sprawdza zgodność nagrań z materiałem i zatrzymuje publikację przy brakujących, nieaktualnych lub uszkodzonych plikach. Nie wymaga Pipera ani ffmpeg i nie generuje dźwięku. Po zmianie odczytywanego tekstu uruchom `npm run audio`, a następnie dodaj zaktualizowany zestaw do Git. `npm run check:content` nadal sprawdza wyłącznie materiały.

Nazwy są skrótami zawartości i profilu, a nie obietnicą identycznej syntezy bit po bicie po skasowaniu wszystkich nagrań. Poprawne istniejące pliki są zachowywane. Wymowa i jakość wymagają odsłuchu; plik w dobrej jakości technicznej może nadal zawierać źle wymówione słowo.

[Wymagania, źródło głosu i granice etapu](../docs/generowanie-audio.md).
