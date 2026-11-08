# Sprawdzenie opublikowanej aplikacji

Adres: https://parussak.github.io/HaniaAngielski/

Data: 8 listopada 2026 r.

Wykonano 10 testów przeglądarkowych na rzeczywistym adresie GitHub Pages (9 testów zestawu oraz dodatkową mobilną ścieżkę nauki). Wszystkie przeszły. Nie korzystano z lokalnego serwera aplikacji.

## Potwierdzone działanie

- Wczytanie modułu Food i wydzielonych plików materiałów w podkatalogu GitHub Pages.
- Widoki o szerokościach 320, 360, 390 i 430 px, bez przewijania w poziomie na sprawdzanych ekranach.
- Przyciski nawigacji i odpowiedzi o wymiarach co najmniej 44 px, obsługa dotykiem.
- Fiszki: odkrywanie, oznaczanie znajomości i potrzeby powtórki.
- Quizy z wyborem, wpisywaniem oraz pełna sesja w trybie mieszanym.
- Gramatyka: błąd, wyjaśnienie, poprawa, zakończenie sesji i wynik niezawyżony przez poprawki.
- Rozwijanie objaśnień gramatyki z plików JSON.
- Powtórka zadań, które nadal sprawiają trudność.
- Zmiana orientacji widoku i zachowanie sesji po odświeżeniu.
- Zapis odkrytej fiszki i powrót do tego samego etapu nauki.
- Eksport kopii i odtworzenie jej w odrębnym kontekście przeglądarki, symulującym drugie urządzenie.
- Anulowanie importu oraz obsługa uszkodzonego pliku bez zmiany dotychczasowych danych.
- Blokowanie równoczesnego zapisu przez drugą kartę.
- Komunikat o błędzie zapisu przy zasymulowanym braku miejsca, z zachowaniem poprzedniego stanu.
- Brak błędów wykonania i odpowiedzi HTTP 4xx/5xx dla plików aplikacji podczas dodatkowej mobilnej ścieżki.

Testy wczytywania błędnych lub zmienionych materiałów używały przechwytywania odpowiedzi wyłącznie w testowej przeglądarce. Nie zmieniono plików ani konfiguracji na GitHub. Testowe postępy były odizolowane od danych użytkownika.

## Zakres sprawdzenia

Użyto Microsoft Edge / Chromium w emulacji telefonu z dotykiem. Nie był to test na fizycznym telefonie ani w Safari. Do potwierdzenia na urządzeniu Hani pozostają zachowanie klawiatury ekranowej, pobieranie i wybieranie kopii pliku oraz trwałość danych przy ustawieniach jej przeglądarki. Działanie całkowicie bez internetu nie jest funkcją tej wersji.

## Ponowienie testów

Z folderu projektu w PowerShell:

```powershell
$env:HANIA_BASE_URL='https://parussak.github.io/HaniaAngielski/'
npx.cmd playwright test
Remove-Item Env:HANIA_BASE_URL
```

Bez zmiennej `HANIA_BASE_URL` testy używają lokalnego serwera. Zmiana konfiguracji testów nie wymaga ponownej publikacji strony.
