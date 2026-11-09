# Firebase — konto i zapis wyników

Projekt: `male-kroki-nauka`. Strona pozostaje na GitHub Pages. Nie potrzeba Firebase Hosting, Cloud Functions, Storage ani planu z rozliczaniem zużycia. Konfiguracja aplikacji WWW jest w `src/firebase-config.ts`; to publiczna konfiguracja, nie klucz administratora.

## Co włączyć w konsoli Firebase

1. Otwórz https://console.firebase.google.com/ i wybierz `male-kroki-nauka`.
2. W **Build → Authentication → Get started → Sign-in method** włącz **Email/Password (E-mail/hasło)**. Logowanie przez link e-mail nie jest potrzebne.
3. W **Authentication → Settings → Authorized domains** dodaj `parussak.github.io`. Wpisz samą nazwę hosta, bez `https://` i `/HaniaAngielski/`. Do pracy lokalnej dodaj `localhost` i `127.0.0.1`.
4. W **Build → Firestore Database → Create database** utwórz bazę **Standard**, identyfikator `(default)`, w regionie europejskim, np. Frankfurt `europe-west3`. Wybierz **tryb produkcyjny**, a nie testowy.
5. W zakładce **Rules / Reguły** zastąp zawartość całym plikiem `firestore.rules` z projektu. Kliknij **Publish / Opublikuj**. Reguły dopuszczają odczyt i zapis wyłącznie własnego rekordu zalogowanego użytkownika; brak ogólnego publicznego dostępu.
6. Pozostań na bezpłatnym planie **Spark**. Do tych funkcji nie trzeba dodawać karty ani włączać Analytics.

Alternatywnie osoba korzystająca z Firebase CLI może wdrożyć same reguły przez `firebase deploy --only firestore:rules --project male-kroki-nauka`. Nie uruchamia tego workflow GitHub Pages.

## Pierwsze użycie po publikacji aplikacji

1. Na telefonie, na którym są postępy Hani, otwórz aplikację.
2. Kliknij wskaźnik zapisu u góry lub **Kopia postępów → Zaloguj się lub utwórz konto**.
3. Utwórz konto rodzica na jego adres e-mail. Hasło wpisuje się wyłącznie w aplikacji, nie w plikach ani wiadomościach. Aplikacja wymaga przy rejestracji co najmniej 8 znaków.
4. Wybierz **Przenieś postępy na konto**. Bez tej decyzji wyniki gościa nie są wysyłane. Zapis bez konta zostaje zachowany oddzielnie.
5. Poczekaj na komunikat **Wyniki zapisane na koncie**. Na drugim urządzeniu zaloguj się na to samo konto — aplikacja pobierze zapis.
6. Warto również pobrać zwykły plik kopii. Nie zawiera hasła, tokenów logowania ani konfiguracji Firebase.

## Zachowanie synchronizacji

- Każda zmiana najpierw trafia do IndexedDB. Zapis gościa zachowuje dotychczasowy klucz `current`; każde konto ma odrębny rekord `account:{uid}` w tej samej bazie. Nazwa bazy i format kopii postępów 1 pozostają zgodne ze starszą aplikacją.
- Firebase jest ładowany dopiero przy użyciu konta lub jego przywróceniu. Nauka bez konta nie wymaga połączenia z Firebase.
- Zmiany są wysyłane około 1,2 s po ostatniej czynności. Aplikacja ponawia zapis po odzyskaniu internetu. Dostępny jest także przycisk **Synchronizuj teraz**. Nie należy traktować zamknięcia karty jako potwierdzenia wysłania — potwierdza je komunikat zapisu na koncie.
- Przy braku internetu działa lokalny zapis już otwartej aplikacji i pamięć konta. Po przygotowaniu materiałów PWA umożliwia też ponowne uruchamianie bez internetu: [instrukcja PWA](pwa.md).
- Na koncie zapisujemy wersjonowany dokument `users/{uid}/progress/main`, zawierający JSON kopii, numer rewizji i czas serwera. Transakcja porównuje numer wersji przed zapisem. Nie opieramy kolejności na zegarze telefonu.
- Jeżeli dwa urządzenia zmienią zapis niezależnie, automatyczne nadpisanie zostaje zatrzymane. W **Konto i synchronizacja** można pobrać obie wersje i wskazać wersję do dalszej nauki. Nie łączymy automatycznie historii i rozpoczętych sesji.
- Przegrana wersja pozostaje w lokalnej **kopii sprzed zmiany**. Przechowywana jest jedna taka kopia na konto; kolejny świadomy wybór wersji zastąpi tę kopię. Warto pobrać pliki przed następnym wyborem.
- Wylogowanie przywraca osobny zapis gościa. Nie kopiuje wyników konta do gościa ani do innego konta. Lokalna pamięć konta pozostaje na tym urządzeniu; aplikacja jest przeznaczona do zaufanych urządzeń rodzinnych.
- Limit pojedynczego zapisu wynosi 700 000 bajtów. Po przekroczeniu limitu dalsza nauka zapisuje się lokalnie, pojawia się informacja i można pobrać kopię. Rozdzielenie dużej historii na wiele dokumentów jest możliwym kolejnym krokiem.

## Weryfikacja

`npm test` obejmuje zapis offline, ponowne połączenie, konflikt dwóch urządzeń, wybór wersji, utracone potwierdzenie, zmianę konta oraz zapis nowej odpowiedzi podczas trwającego wysyłania. Testy przeglądarkowe kont używają zastępczego adaptera sieciowego, nie tworzą prawdziwych kont i nie wysyłają wiadomości.

Reguły trzeba opublikować w rzeczywistym projekcie. Testy lokalne nie zastępują próby logowania i synchronizacji z Firebase po konfiguracji. Nie wykonano automatycznego wdrożenia reguł ani publikacji strony.

Dokumentacja: [Firebase WWW](https://firebase.google.com/docs/web/setup), [E-mail i hasło](https://firebase.google.com/docs/auth/web/password-auth), [transakcje Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions), [reguły dostępu](https://firebase.google.com/docs/firestore/security/rules-conditions).
