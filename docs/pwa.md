# Instalacja i nauka bez internetu

## Na telefonie Hani

1. Wyślij nowe pliki projektu na GitHub i zaczekaj na udaną publikację Pages.
2. W Chrome na Androidzie otwórz dotychczasowy adres `https://parussak.github.io/HaniaAngielski/`. Użyj tej samej przeglądarki, w której są postępy.
3. Poczekaj, aż na stronie głównej pojawi się **Materiały gotowe do nauki bez internetu**. Pierwsze przygotowanie wymaga internetu i obejmuje kod aplikacji, wszystkie opublikowane moduły oraz ilustracje.
4. Kliknij **Zainstaluj aplikację**, jeśli przycisk jest dostępny, albo otwórz menu Chrome **⋮ → Dodaj do ekranu głównego → Zainstaluj**. Dokładna nazwa opcji zależy od telefonu i przeglądarki.
5. Uruchamiaj aplikację ikoną fioletowego kotka. Powinna otwierać się w osobnym oknie bez paska adresu.

Jeżeli był już wcześniejszy skrót, nie czyść danych strony. Instalacja nie zmienia adresu, nazwy bazy wyników ani sposobu logowania. Przed zmianą przeglądarki warto pobrać plik kopii lub sprawdzić zapis na koncie.

## Co działa offline

Po pełnym przygotowaniu: uruchomienie strony, obie mapy Food, treningi, fiszki podstawowe i pełne, quizy, gramatyka, rozmówki, powtórki, ilustracje, wyjaśnienia, statystyki i lokalny zapis rozpoczętej sesji. Przy kolejnym uruchomieniu bez sieci zachowany zostaje także lokalny zapis wcześniej używanego konta.

Rejestracja, nowe logowanie i odzyskanie hasła wymagają internetu. Jeśli konto jest już zapisane na urządzeniu, można dalej uczyć się offline. Po odzyskaniu połączenia wyniki są synchronizowane, gdy aplikacja jest otwarta. Jeśli była zamknięta, synchronizacja nastąpi przy kolejnym uruchomieniu z internetem. Nie gwarantujemy wysyłania wyników przy całkowicie zamkniętej aplikacji.

Tryb prywatny, usunięcie danych strony i automatyczne zwolnienie miejsca przez przeglądarkę mogą usunąć pliki offline oraz lokalne postępy. Warto zachowywać kopię i korzystać z konta na zwykłym profilu przeglądarki.

## Aktualizacje

Po publikacji nowej wersji otwórz aplikację z internetem. Pobieranie nowej wersji odbywa się w tle. Dopiero po pobraniu kompletu pojawi się komunikat **Nowa wersja dostępna** z przyciskiem **Zaktualizuj**. Kliknięcie odświeży aplikację, zachowując postępy i zapisaną sesję. W razie rozpoczętej sesji aplikacja poprosi o potwierdzenie.

Nie przełączamy automatycznie aplikacji i materiałów podczas ćwiczenia. Aktualizacja nie kasuje IndexedDB, danych logowania ani kopii wyników. Cache jest oddzielony według ścieżki aplikacji na GitHub Pages.

## Powiadomienia i widżet

Ta wersja nie prosi o zgodę na powiadomienia. Androidowe PWA mogą odbierać Web Push po udzieleniu zgody. Przypomnienia przy zamkniętej aplikacji wymagają dodatkowej usługi wysyłającej wiadomości; sam kod w przeglądarce nie zapewnia niezawodnego codziennego harmonogramu. Można to dobudować jako osobny etap.

Standardowy widżet pulpitu Androida, np. z kotkiem i postępem jak w Duolingo, wymaga komponentu natywnego. Można go dodać po opakowaniu aplikacji jako Android, np. przez Capacitor; sama instalacja PWA go nie tworzy.

Źródła: [Web Push i działanie w tle](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation), [widżety Androida](https://developer.android.com/develop/ui/views/appwidgets/overview).

## Budowanie i weryfikacja

`npm run build` po Vite uruchamia `scripts/build-sw.mjs`. Generator tworzy wersję z sumy treści plików i pobiera atomowo komplet jawnie wskazanych publicznych zasobów. Obejmuje również plik z biblioteką Firebase, potrzebny do odtworzenia konta. Żądania sieciowe Firebase, tokeny, hasła i wyniki użytkowników nie są cache'owane przez service worker. Wyniki nadal przechowuje odrębna baza IndexedDB.

Ikony PNG 192 i 512 oraz wariant maskowalny powstały z istniejącego `public/cat.svg`. W razie zmiany kotka można odtworzyć je przez `npm run icons:generate` (wymaga przeglądarki Playwright; Edge można wybrać przez `HANIA_BROWSER_CHANNEL`). Normalny build używa zapisanych ikon i nie wymaga przeglądarki.

W trybie `npm run dev` nie rejestrujemy service workera. Pozwala to edytować treści i kod bez ingerencji produkcyjnego cache. Test PWA wymaga zbudowanej aplikacji:

```powershell
npm.cmd run build
$env:HANIA_TEST_BUILD='1'
$env:HANIA_BROWSER_CHANNEL='msedge'
npx.cmd playwright test
```

Testy niezwiązane z PWA domyślnie blokują service workery, aby izolować testowane zmiany materiałów i adaptery Firebase. Dedykowane testy PWA używają rzeczywistego service workera: sprawdzają uruchomienie od zera bez sieci, wszystkie główne tryby nauki, wznowienie po odświeżeniu, konto offline i późniejszą synchronizację oraz aktualizację ze zmianą treści bez utraty sesji. W teście konta jedynie adapter Firebase jest atrapą; nie tworzymy kont ani nie wysyłamy wyników do rzeczywistego projektu. Fizyczna instalacja WebAPK na telefonie wymaga osobnej próby po publikacji.
