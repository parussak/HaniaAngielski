# Stan pierwszej wersji

8 listopada 2026 r.

## Aktualizacja: moduł 2 Food

Materiał przykładowy zastąpiono modułem z przesłanych zdjęć: 97 fiszek, 156 zadań i 9 objaśnień zasad. Treści przeniesiono do osobnego folderu `public/content` i są wczytywane jako pliki niezależne od kodu aplikacji. Szczegóły: [zakres i źródła](materialy-food.md), [instrukcja edycji](../public/content/README.md). Poniższy opis demonstracji dokumentuje wcześniejszy etap; demonstracja nie jest już dostępna do nauki. Publikacja na GitHub Pages i sprawdzenie na fizycznym telefonie pozostają do wykonania.

Po zmianie materiałów przeszło 11 testów logiki i danych, 9 testów przeglądarkowych oraz budowanie wersji do publikacji. Sprawdzono także edycję plików bez zmian kodu, wyświetlanie ściągi i czytelny błąd po uszkodzeniu pliku materiałów.

## Zrealizowane lokalnie

- Responsywna aplikacja „Małe kroki” dla Hani.
- Wyraźnie oznaczony, autorski przykładowy moduł angielskiego: 6 fiszek i 10 zadań, w tym gramatyka czasownika „to be”. Wybór języka jest demonstracyjny i nie przesądza o podręczniku Hani.
- Fiszki, quizy z wyborem i wpisywaniem, tryb mieszany, gramatyka i powtórka błędów.
- Polskie objaśnienia, ponowne próby i powrót trudnych zadań raz na końcu sesji.
- Oddzielne wyniki pierwszych prób i poprawek.
- IndexedDB, automatyczny zapis odpowiedzi, wznowienie sesji wraz z etapem wyjaśnienia lub odkrytą fiszką.
- Ochrona przed nadpisywaniem z dwóch kart i obsługa błędów zapisu.
- Eksport oraz import wersjonowanego pliku JSON, potwierdzenie zastąpienia i walidacja przed zmianą danych.
- Zachowanie historii nieobecnych modułów i blokowanie wznowienia sesji przy niezgodnej wersji materiału.
- Konfiguracja budowania z względnymi ścieżkami oraz ręcznie uruchamiany workflow GitHub Pages.

## Weryfikacja

- Testy logiki: ocenianie, poprawki, filtrowanie zakresu, fiszki, archiwizacja i walidacja kopii.
- Testy IndexedDB: zapis, odtworzenie i zachowanie poprzednich danych po błędzie transakcji.
- Testy w Microsoft Edge: pełna sesja, błąd i poprawa, odświeżenie, odkryta fiszka, blokada drugiej karty, eksport i import do osobnego kontekstu przeglądarki, anulowanie importu i błędny JSON.
- Sprawdzenie widoku telefonu 390 × 844 oraz komputera; zrzuty do inspekcji wizualnej.
- Budowanie plików do publikacji.

## Pozostało

- Zastąpić lub uzupełnić demonstrację materiałem z podręcznika po otrzymaniu zdjęć i potwierdzeniu języka.
- Sprawdzić aplikację na rzeczywistym telefonie Hani; test szerokości mobilnej nie zastępuje testu na Androidzie lub iOS.
- Wskazać docelowe repozytorium, opublikować na GitHub Pages i sprawdzić docelowy adres. Na razie nie wykonano publikacji.
- Automatyczny import PDF-ów, konta, synchronizacja i pełne działanie offline pozostają poza pierwszą wersją.

Warunek planu dotyczący prawdziwego modułu został na życzenie użytkownika odłożony; implementacja korzysta z oznaczonego przykładu.

## Wygląd i sprawdzenie na telefonie

- Dodano pastelowy róż, błękit i fiolet, koci znak aplikacji oraz autorską ilustrację kotka z książką.
- Na telefonie nawigacja jest stale dostępna na dole ekranu; uwzględnia dolny bezpieczny obszar urządzenia.
- Powiększono tekst, przyciski, warianty odpowiedzi i pole wpisywania. Ilustracja nie nachodzi na tekst powitania.
- Przeprowadzono 7 testów przeglądarkowych, w tym 5 dedykowanych urządzeniom mobilnym: szerokości 320, 360, 390 i 430 px, dotyk, wybór odpowiedzi, wpisywanie, poprawa błędu, wznowienie i obrót do widoku poziomego.
- Sprawdzono brak poziomego przewijania na ekranach nauki, wyboru sesji, postępów i kopii oraz cele dotykowe nawigacji i odpowiedzi co najmniej 44 px.
- Testy wykonano w emulacji mobilnej przeglądarki Chromium (Edge), nie na rzeczywistym telefonie Hani. Klawiatura systemowa, wybieranie pliku z Androida/iOS i zachowanie konkretnej przeglądarki wymagają jeszcze sprawdzenia na jej telefonie.
- Podgląd: `podglad-telefon.png` i `podglad-cwiczenia-telefon.png` w tym folderze.
