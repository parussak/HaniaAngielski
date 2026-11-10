# Przygotowanie do treningu i odporność map na błędy

Zmiana po etapie 4, 10 listopada 2026 r. Poprawia dwa ograniczenia wskazane w przeglądzie dokumentacji. Nie zmienia materiałów Food, identyfikatorów lekcji, ukończeń ani zasad nagród.

## Trening bez poznanej puli

Trening mapowy nadal korzysta wyłącznie z faktycznie poznanego materiału wcześniejszych map tego samego kursu. Nie zastępujemy go pytaniami bieżącej mapy, pustym zaliczeniem ani nowym materiałem pokazanym pierwszy raz w treningu.

Gdy pula jest pusta, wejście do treningu pokazuje **„Przygotuj się do treningu”**. Przycisk **„Poznaj wcześniejszy materiał”** otwiera odblokowaną zwykłą lekcję wcześniejszej mapy: pierwszą jeszcze nieukończoną, a przy komplecie dawnych ukończeń bez zapisanych prób — lekcję do powtórzenia. Tekst wskazuje mapę, do której należy potem wrócić. Powrót odbywa się przez katalog map; nie ma automatycznego przenoszenia po ukończeniu przygotowania.

Samo obejrzenie ekranu przygotowania lub wprowadzenia nie zapisuje znajomości i nie daje gwiazdek. Po odpowiedziach w lekcji materiał trafia do poznanej puli. Właściwy trening można wtedy uruchomić; przy małej puli jest krótszy, zgodnie z D-20. Zwykła lekcja przygotowująca podlega dotychczasowym zasadom: 3 ★ tylko za pierwsze ukończenie. Powtórzenie dawnej zaliczonej lekcji nie daje kolejnej nagrody. Trening daje 3 ★ tylko za pierwsze ukończenie, bez zmian.

Jeśli potrzebna wcześniejsza mapa nie jest dostępna, ekran pokazuje możliwość ponownego wczytania map oraz wyboru innej przygody. Nie podszywa się pod ukończony trening. Otwarcie drugiej mapy nadal nie wymaga automatycznego zaliczenia pierwszej.

## Błąd jednej mapy

Mapy są odczytywane i walidowane niezależnie. Błąd pobrania, JSON lub odwołań jednej mapy nie usuwa poprawnych map z listy. Zachowana jest kolejność poprawnych map. Przy powtórzonej tożsamości odrzucamy wszystkie konfliktujące definicje, ponieważ nie można bezpiecznie przypisać ich do wyników; pozostałe mapy działają.

Katalog pokazuje komunikat przy odpowiednim module i przycisk **„Spróbuj wczytać mapy ponownie”**. Przycisk odświeża stronę i ponawia odczyt; nie czyści pamięci ani nie resetuje sesji. Po odzyskaniu poprawnego pliku mapa wraca z tymi samymi kluczami i ukończeniami. Usterka samych plików modułu lub rejestru kursów nadal jest oddzielnym błędem całej biblioteki — ta zmiana izoluje mapy.

Rozpoczęta sesja dostępnej mapy działa dalej. Jeśli nie można wczytać mapy jej własnej lekcji lub powtórki, zapis sesji zostaje, a ekran proponuje ponowienie pobrania albo inną mapę. Po naprawie sesję można wznowić od zapisanego pytania. Wstrzymanie zapobiega zgubieniu przypisania nowych błędów do etapu.

## Ochrona zapisu

Informacja o niedostępnych mapach jest stanem interfejsu `AppState.journeyIssues`, nie nowym polem postępów ani kopii. Przy niepełnym katalogu aplikacja nie zamyka migracji starszych błędów, nie przesuwa jej kursora i odkłada rozliczenie premii etapowych do odzyskania kompletu map. Zwykłe nagrody za ukończone lekcje pozostają działające. Archiwizacja zachowuje sesje jak dotychczas. Już zdobyte gwiazdki, zakupy i ukończenia nie są usuwane.

Nie zmieniono wersji kopii, kluczy IndexedDB, reguł Firebase ani produkcyjnych plików treści. Nie dodano bibliotek ani ilustracji.

## Miejsca w kodzie i sprawdzenie

- `src/adventure.ts`: `readJourneys` i `loadJourneys` zwracają poprawne mapy oraz problemy odczytu.
- `src/learning/training.ts`: wspólna pula treningu i dobór wcześniejszej lekcji przygotowującej.
- `src/views/training-preparation.ts`, `src/views/catalog.ts`, `src/views/study.ts`: przygotowanie, ponowienie i zachowanie sesji niedostępnej mapy.
- `src/controllers/progress.ts`: odroczenie migracji i premii przy niepełnych danych.
- `tests/map-recovery.test.ts` i `tests/browser/map-recovery.spec.ts`: regresje awarii, odzyskiwania map, przygotowania treningu oraz ochrony wyników.

Wynik końcowych kontroli znajduje się w [zasadach i wynikach testowania](07-testy.md). Testy przeglądarkowe korzystają z lokalnych plików i atrap usług; nie zmieniają prawdziwego konta Hani.
