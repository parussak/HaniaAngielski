# Małe kroki — nauka Hani

Aplikacja internetowa: fiszki, quizy, gramatyka, lokalne postępy i opcjonalne konto z synchronizacją przez Firebase. Dostępny jest moduł 2 **Food — Fun with food**, opracowany z przesłanych zdjęć podręcznika i zeszytu ćwiczeń: 97 fiszek, 156 zadań i 9 objaśnień zasad. Materiał demonstracyjny został usunięty.

## Uruchomienie

Wymagany Node.js 22.12 lub nowszy (zalecany 24).

W Windows najprościej otworzyć plik **uruchom-aplikacje.cmd** w folderze projektu. Uruchomi stronę w przeglądarce. Okno uruchomienia należy pozostawić otwarte na czas nauki; Ctrl+C zatrzymuje serwer. Przy pierwszym uruchomieniu brakujące zależności zostaną pobrane.

```powershell
npm.cmd install
npm.cmd run dev
```

Otwórz adres wyświetlony przez serwer. Nie uruchamiaj `index.html` bezpośrednio z dysku. Bezpieczny zapis wymaga HTTPS lub lokalnego adresu localhost/127.0.0.1.

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

Testy przeglądarkowe domyślnie używają Chromium (`npx playwright install chromium`). Na Windows możesz użyć Edge, ustawiając przed testami `$env:HANIA_BROWSER_CHANNEL='msedge'`. Na innych systemach użyj `npm` i `npx` zamiast `npm.cmd` i `npx.cmd`.

```powershell
npx.cmd playwright test
```

Testy automatycznie uruchamiają i zatrzymują własny lokalny serwer na porcie 5184.

## Korzystanie

1. Wybierz moduł i rodzaj ćwiczeń.
   W module Food dostępne są „Fiszki podstawa” (38 haseł z ramek Vocabulary) oraz „Fiszki” (wszystkie 97 haseł). Oba zestawy współdzielą postępy tych samych słów.
2. Przed dotknięciem kafelka wybierz odpowiedzi zamknięte, wpisywanie lub tryb mieszany. Dotknięcie kafelka od razu zaczyna sesję. Polecenia z wariantami w nawiasie zawsze mają przyciski do wyboru.
3. Po błędzie przeczytaj wyjaśnienie i spróbuj ponownie. Pierwsza próba jest liczona osobno od poprawek. Trudne zadanie wraca raz na końcu sesji.
4. Postępy zapisują się po każdej odpowiedzi w IndexedDB. Rozpoczętą sesję można wznowić z ekranu głównego.
5. W zakładce „Kopia postępów” pobierz plik JSON. Na drugim urządzeniu wczytaj go i potwierdź zastąpienie obecnych danych. Kopie nie są scalane.

Bez logowania wyniki są przypisane do przeglądarki i adresu strony. Po zalogowaniu dodatkowo synchronizują się z kontem Firebase. Zmiana przeglądarki, portu lub adresu wymaga przeniesienia kopii. Tryb prywatny i czyszczenie danych mogą usunąć postępy. Aplikacja blokuje równoczesny zapis z drugiej karty tej samej przeglądarki. Po zamknięciu pierwszej karty odśwież drugą. Przy błędzie zapisu poprzedni zapis pozostaje, a zmiana nie jest zatwierdzana.

Konto otworzysz wskaźnikiem zapisu u góry albo przez „Kopia postępów”. Przed użyciem włącz logowanie E-mail/hasło i Firestore w projekcie Firebase oraz opublikuj reguły dostępu: [instrukcja Firebase](docs/firebase.md). Pierwsze przeniesienie wyników gościa wymaga decyzji. Zapis konta i gościa jest oddzielny, konflikty dwóch urządzeń wymagają wyboru wersji.

Po pierwszym pobraniu materiałów aplikacja działa offline i może być instalowana jako PWA z ikoną kotka. [Instrukcja instalacji i testu offline](docs/pwa.md). Konto synchronizuje lokalne zmiany po odzyskaniu połączenia w otwartej aplikacji lub przy kolejnym uruchomieniu. Nie ma automatycznego przetwarzania PDF. Do nauki z gotowych zestawów nie jest potrzebna usługa AI. Czcionki są systemowe i nie są pobierane z Google Fonts. Manifest PWA i wersjonowany service worker są częścią aplikacji.

## Edytowanie materiałów i dodawanie modułu

Treści znajdują się w **public/content**, niezależnie od kodu strony w `src`. Aplikacja pobiera je jako osobne pliki, a nie jako część programu.

- `katalog.json` — lista modułów.
- `02-food/modul.json` — opis, nazwa, numer i wersja.
- `02-food/slownictwo.json` — fiszki, tłumaczenia i akceptowane odpowiedzi.
- `02-food/quiz.json` — pytania słownikowe wskazujące słowa; poprawka słówka aktualizuje także quiz.
- `02-food/gramatyka.json` — zasady, objaśnienia i przykłady.
- `02-food/cwiczenia.json` — zadania, klucze odpowiedzi i wyjaśnienia po błędzie.

[Instrukcja edycji materiałów](public/content/README.md) zawiera przykłady. Po zmianie uruchom `npm.cmd run check:content`. Podczas lokalnej nauki wystarczy zapisać pliki i odświeżyć stronę. Po wysłaniu zmian na `main` GitHub automatycznie sprawdzi, zbuduje i opublikuje aplikację. W zainstalowanej PWA nowa wersja pojawi się jako przycisk „Wczytaj nową wersję”.

Przy zmianie znaczenia konkretnego słówka lub zadania zwiększ jego opcjonalne `rev` (domyślnie 1). Pozostałe elementy zachowują postępy. Zmiana `version` całego modułu nie resetuje wyników. Dawne kopie formatu 1 z kluczami `@1` pozostają zgodne. Kopia nie zawiera treści modułów. Zdjęcia źródłowe są w pomijanym przez Git folderze `.local-materials`.

[Zakres i źródła modułu Food](docs/materialy-food.md).

## GitHub Pages

Konfiguracja Vite używa względnych ścieżek, więc aplikacja obsługuje adres w podkatalogu repozytorium. Workflow `.github/workflows/pages.yml` automatycznie publikuje każdy push na `main`, po poprawnym przejściu testów i budowania. Można go też uruchomić ręcznie przez „Publish Pages → Run workflow”. Osobny workflow `checks.yml` sprawdza push i pull request bez publikowania strony.

Wszystkie opublikowane moduły są publicznymi plikami strony. Wyniki gościa pozostają lokalnie; wyniki konta są też synchronizowane z Firebase. Baza postępów i blokada karty są oddzielone według ścieżki aplikacji, aby różne repozytoria na GitHub Pages nie współdzieliły danych. Do testów najlepiej używać innego profilu przeglądarki.

## Dokumenty

- [Wymagania](docs/wymagania.md)
- [Plan pierwszej wersji](docs/plan-pierwszej-wersji.md)
## Test zbudowanej strony w podkatalogu

Po zbudowaniu aplikacji można sprawdzić pliki z `dist` pod ścieżką taką jak na GitHub Pages:

```powershell
npm.cmd run build
$env:HANIA_BROWSER_CHANNEL='msedge'
$env:HANIA_TEST_BUILD='1'
npx.cmd playwright test
Remove-Item Env:HANIA_TEST_BUILD
```

Testy używają odizolowanych danych. Bez zmiennej `HANIA_TEST_BUILD` uruchamiają wersję deweloperską. Zmienna `HANIA_BASE_URL` służy do sprawdzania innego adresu i ma pierwszeństwo przed lokalnym podglądem.
