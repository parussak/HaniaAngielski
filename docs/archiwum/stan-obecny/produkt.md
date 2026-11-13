# Produkt i ekrany — stan obecny

Stan z 9–10 listopada 2026 r.; zakres i sposób weryfikacji: [spis dokumentacji](../../README.md).

## Cel i użytkownicy

„Małe kroki” to aplikacja do nauki na podstawie przygotowanych materiałów podręcznikowych. Obecna treść i oprawa są skierowane przede wszystkim do Hani: polskie objaśnienia, krótkie ćwiczenia, kotki, mapy i domek za gwiazdki.

Kod pozwala zakładać wiele kont, ale nie zawiera profilu wieku, roli rodzica, osobnego trybu dorosłego ani przypisania kursów do osoby. Imię jest ustawieniem konta, nie osobnym profilem ucznia. W trybie bez konta interfejs domyślnie zwraca się do Hani.

**Obecny katalog produkcyjny zawiera tylko angielski moduł Food.** Francuski i włoski są kierunkami rozwoju, nie gotowymi kursami. Pole poziomu Food ma wartość `A2`; jest to metadana materiału, a nie wynik niezależnego pomiaru poziomu.

Źródła: [katalog](../../../public/content/katalog.json), [opis Food](../../../public/content/02-food/modul.json), [model danych](../../../src/learning/model.ts), [widok strony startowej](../../../src/views/home.ts), [konto](../../../src/views/account.ts).

## Strona startowa

Kolejność treści jest następująca:

1. Ramka aktualizacji, wyłącznie gdy nowa wersja oczekuje na wczytanie.
2. Powitanie z imieniem i ramka **Twój następny krok** z kotkiem.
3. Główna ramka z dotychczasowym kotkiem z książką i wejściem **Wybierz przygodę**.
4. Mniejsze wejście **Przejdź do modułów** do ćwiczeń po swojemu.
5. Rozwijana pomoc o instalacji, offline, koncie i kopiach.

Nawigacja obejmuje naukę, domek, postępy i kopię postępów. Profil otwiera ustawienia konta. Na telefonie główna nawigacja znajduje się na dole ekranu.

Źródła: [homeView](../../../src/views/home.ts), [powłoka aplikacji](../../../src/views/shell.ts), [style strony startowej](../../../src/home.css), [testy strony startowej](../../../tests/browser/home.spec.ts).

## Dwa wejścia do nauki

| Wejście | Co otrzymuje użytkownik |
| --- | --- |
| Kocie przygody | Karty map z tytułem przygody, opisem modułu, liczbą ukończonych lekcji i informacją o powtórkach |
| Moduły do ćwiczeń | Wybór fiszek podstawowych, wszystkich fiszek, quizu słownictwa, gramatyki, rozmówek lub powtórki błędów |

Mapa Food „Przygotowania do kociego pikniku” ma 7 etapów i 41 lekcji. Przejście dalej zależy od ukończenia lekcji; zaległe powtórki nie blokują kolejnych lekcji.

Źródła: [katalogi](../../../src/views/catalog.ts), [ustawienia ćwiczeń](../../../src/views/setup.ts), [mapa](../../../public/content/02-food/sciezka.json), [mechanika nauki](nauka.md).

## Ramka następnego kroku

1. Najpierw proponuje wznowienie aktywnej sesji — także quizu lub powtórki. Jeśli brak zgodnego materiału, pokazuje informację i wejście do modułów, zamiast zastępować zapis.
2. Gdy nie ma aktywnej sesji, szuka nieukończonej lekcji, zaczynając od ostatnio używanej mapy. Kolejność map wynika z globalnego `order`; po późniejszych mapach może wrócić do wcześniejszych nieukończonych.
3. Dopiero gdy nie ma nieukończonych lekcji w dostępnych mapach, proponuje zaległą powtórkę etapową, następnie ogólną, a na końcu ćwiczenia po swojemu.

Ramka wylicza wybór z istniejących wyników. Nie zapisuje dodatkowego wskaźnika „następnej lekcji”. Obecnie wybór nie jest ograniczony do języka ani kursu, bo taki podział jeszcze nie istnieje.

Źródła: [getNextStep](../../../src/next-step.ts), [obsługa kliknięcia](../../../src/controllers/learning.ts), [testy wyboru](../../../tests/next-step.test.ts), [scenariusze przeglądarkowe](../../../tests/browser/next-step.spec.ts).

## Dostarczanie aplikacji i treści

Aplikacja jest stroną statyczną z możliwością instalacji jako PWA. Używa TypeScript, Vite i Firebase dla kont oraz synchronizacji. Nie ma własnego serwera aplikacyjnego do generowania ćwiczeń.

Podczas nauki aplikacja nie odpytuje AI. Wyświetla wcześniej przygotowane pliki JSON i lokalne ilustracje. Nie ma w niej formularza dodawania PDF/zdjęć, OCR, automatycznego tworzenia modułu, nagrywania wymowy, powiadomień ani widgetu systemowego.

Obecna oprawa i mechanizmy nagród są wspólne dla wszystkich kont. Materiały są wspólne i serwowane jako statyczne pliki; logowanie rozdziela wyniki użytkowników, nie dostęp do osobnych zestawów treści.

Źródła: [zależności i polecenia](../../../package.json), [ładowanie treści](../../../src/content.ts), [PWA](../../../src/pwa.ts), [workflow publikacji](../../../.github/workflows/pages.yml).
