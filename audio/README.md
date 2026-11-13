# Nagrania przygotowywane lokalnie

## Jedno polecenie

Z katalogu głównego projektu:

```powershell
npm run audio
```

Generator czyta aktualne materiały Food i tworzy lub aktualizuje nagrania. Nie trzeba ręcznie przepisywać słów, zmieniać kodu strony ani wskazywać każdego pliku. Zmień treść w `public/content/02-food/`, zapisz ją i ponownie uruchom polecenie.

Wyniki są w [generated/manifest.json](generated/manifest.json) i katalogu `generated/clips/`. Manifest jest indeksem: przy każdym haśle i wypowiedzi sceny zawiera tekst oraz identyfikator klipu. Identyczne teksty współdzielą nagranie. Pliki `.ogg` zawierają **Opus mono 16 kb/s**, nie Vorbis. Model Cori i ustawienia są w [config.json](config.json).

**Na razie aplikacja nie używa tych plików.** Nie są kopiowane do publikowanej strony, nie trafiają do pamięci PWA i nie są wysyłane do Firebase. Do Git dodaj cały katalog `audio/` wraz z gotowymi klipami. Nie edytuj ręcznie manifestu ani nazw nagrań.

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
- Zwykłe `npm run build` i `npm run check:content` nadal działają niezależnie od audio. Przed commitem nagrań uruchom osobno `npm run audio:check`.

Nazwy są skrótami zawartości i profilu, a nie obietnicą identycznej syntezy bit po bicie po skasowaniu wszystkich nagrań. Poprawne istniejące pliki są zachowywane. Wymowa i jakość wymagają odsłuchu; plik w dobrej jakości technicznej może nadal zawierać źle wymówione słowo.

[Wymagania, źródło głosu i granice etapu](../docs/generowanie-audio.md).
