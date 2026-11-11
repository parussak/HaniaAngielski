# Refaktoring — etap 3: osobny kontroler domku

Data: 11 listopada 2026. Cel: oddzielić interakcje z domkiem od prowadzenia nauki, bez zmiany wyglądu, zasad Food i zapisanych postępów.

## Wykonane zmiany

- [Kontroler domku](../src/controllers/house.ts) obsługuje pięć istniejących akcji: `house`, `select-room`, `select-decoration`, `buy-decoration`, `place-decoration`. Zachowuje nazwy akcji, wartości domyślne, warunki dostępności i treść komunikatów.
- [Rozruch](../src/main.ts) tworzy ten kontroler z tym samym stanem aplikacji i funkcją `mutate`, z których korzystały akcje w kontrolerze nauki.
- [Obsługa zdarzeń](../src/app/events.ts) przekazuje akcję najpierw kontrolerowi domku, potem dotychczasowym kontrolerom. Każdy zwraca informację, czy obsłużył akcję; nie dodano nowego systemu zdarzeń ani rejestru.
- [Kontroler nauki](../src/controllers/learning.ts) nadal prowadzi sesję i rozlicza jej ukończenie: gwiazdki, premie i odblokowanie pokoju po ostatniej lekcji. To połączenie wyniku nauki z nagrodą pozostaje w dotychczasowym miejscu. Kontroler domku odpowiada za oglądanie i urządzanie zdobytych pokoi, nie za zaliczanie lekcji.

## Ochrona zgodności

Nie zmieniono widoków, stylów, grafik, treści Food, mechanizmu zakupów, identyfikatorów, cen i nagród. Zapis nadal przechodzi przez tę samą funkcję `mutate`, kontrolę transakcji i synchronizację. Błąd zapisu propaguje się do istniejącej obsługi w rendererze; kontroler nie ogłasza wtedy sukcesu.

Przed wydzieleniem zapisano wynik sekwencji 12 akcji, obejmującej otwarcie domku, wybór pokoju i przedmiotu, zakup, ustawienie, schowanie, ponowną próbę zakupu oraz przełączenie kursu. Po wydzieleniu cały zapis kontrolny był identyczny bajt po bajcie: wyniki obsługi, postępy z aktywną sesją, wybrane elementy i komunikaty.

## Testy

[house-controller.test.ts](../tests/house-controller.test.ts) używa danych syntetycznych i sprawdza:

1. Nawigacja i wybór elementów domku nie zapisują ani nie zastępują aktywnej lekcji; zablokowany pokój pozostaje niedostępny.
2. Zakup, przestawianie i schowanie zachowują osobne portfele kursów, zapisaną sesję i zgodność kopii; ponowny zakup nie pobiera drugi raz gwiazdek.
3. Nieudany zapis zakupu lub ustawienia nie zmienia zatwierdzonych postępów i nie ogłasza sukcesu.
4. Kontroler domku nie przechwytuje akcji nauki, a kontroler nauki przekazuje akcje domku dalej bez zmiany stanu.

Dotychczasowe testy przeglądarkowe domku, map, powtórek, treningów, kont i PWA pozostają kontrolą połączenia kontrolerów przez rzeczywiste przyciski. Nie zmieniano ich oczekiwań w tym etapie.

## Weryfikacja — 11 listopada 2026

- Przed zmianą: 166/166 testów Node.
- Po zmianie: **170/170 testów Node i 88/88 testów Playwright** gotowej aplikacji w Chrome. Scenariusze obejmują mapy i naukę Food, pokój i zakupy, kursy, konta, kopie, drugie urządzenie i PWA offline.
- `npm run build` przeszedł walidację treści, TypeScript, budowanie oraz przygotowanie 206 zasobów offline. Style zachowały tę samą zawartość; zmiana kodu sterowania powoduje nową wersję wydania PWA.
- Kontrola dokumentacji i `git diff --check` przeszły. Nie wykonywano prób na fizycznym telefonie ani prawdziwym koncie Hani; synchronizacja jest sprawdzana przez testowy adapter.

## Dalszy zakres

Podział walidatora kopii, wspólna obsługa potwierdzania zastąpienia sesji i pozostałe propozycje audytu nie należą do tej zmiany. Nie zmieniono zasad uczenia ani utrwalania.
