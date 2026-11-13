# Dziennik zmian z dawnego spisu dokumentacji

Do 13 listopada 2026 r. `docs/README.md` zawierał na górze komunikaty o kolejnych wdrożeniach. Przeniesiono je tutaj bez zmian treści, gdy spis skrócono do jednej strony. Obowiązujące zasady: [decyzje](../decyzje.md) i dokumenty `01…07`.

**D-64 — łapki i poprawki:** wszystkie luki wymagają próby, błędne odpowiedzi można poprawiać, a oceną końcową są kocie łapki niezależne od gwiazdek do domku. [Zasady](../03-nauka.md), [zapis](../06-zapis.md), [testy](../07-testy.md).

**D-63 — odsłuch klasycznych fiszek i quizu:** po sprawdzeniu odpowiedzi, także w poznanym materiale kursu; te same tempa i PWA offline. [Reguły](../03-nauka.md), [testy](../07-testy.md).

**D-65 — próbne tempo:** słówka 0,95×, dialogi 0,90×; „Wolniej” dodatkowo zwalnia o 30%, także offline. [Reguły](../03-nauka.md), [realizacja](../05-architektura.md).

**D-60 — nagrania w aplikacji i PWA offline:** [zasady odtwarzania](../03-nauka.md), [architektura](../05-architektura.md), [testy](../07-testy.md). Pierwszeństwo ma gotowy klip, następnie synteza urządzenia, na końcu zwykłe zadanie. Bez zmiany wyników i gwiazdek.

**D-59 — generator lokalnych nagrań Food:** [wymagania i granice](../generowanie-audio.md), [jedno polecenie i obsługa](../../audio/README.md). Cori, Opus mono 24 kb/s; gotowe pliki w repozytorium. W D-60 podłączono je do aplikacji i pamięci PWA.

**D-54 — wdrożone:** każda z czterech historyjek Food stanowi całą lekcję, z 4–5 lukami i kocimi rozmówcami. Obsada jest stała przez sesję i wznowienie; nie zmienia formatu zapisu. [Zasady nauki](../03-nauka.md), [oprawa](../01-produkt.md).

**D-58 — wdrożone, źródło dźwięku rozszerzone w D-60:** słuchanie z obsługą syntezy mowy przeglądarki, z powrotem do zwykłej formy zadania bez dźwięku; głosy prawdziwych urządzeń do [sprawdzenia ręcznego](../07-testy.md#d-58--słuchanie). [Reguły nauki](../03-nauka.md). **D-53 — wdrożone:** sceny dialogowe z kilkoma lukami, wspólne dla wszystkich kursów; cztery sceny Food czekają na [recenzję językową](../recenzja-scen-food.md). [Reguły nauki](../03-nauka.md), [format](../format-materialow.md#scena-dialogowa-z-kilkoma-lukami). **D-52 — wdrożone:** ukończona lekcja zostaje ukończona po zmianie treści; każde konto widzi aktualną treść, a rozpoczęte sesje zachowują swój zestaw. [Reguły nauki](../03-nauka.md), [edycja treści](../format-materialow.md#aktualizacja-wydanej-lekcji). **D-51 — wdrożone**, z otwartą listą starszych testów przeglądarkowych do uzgodnienia — [testy](../07-testy.md).

**D-50 — wdrożone:** po lekcji mapowej: Kolejna lekcja, Poziom legendarny (+1 ★ za pełną powtórkę), Wróć do mapy. Nowe sesje automatycznie mieszają formy odpowiedzi i poznany materiał; są plansze par oraz bank propozycji do luk. Obie mapy Food, stare sesje i dorobek pozostają. [Reguły nauki](../03-nauka.md), [interfejs](../01-produkt.md), [zapis](../06-zapis.md).

Aktualizacja układu: **10 listopada 2026 r.** Rozdzielamy stan obecny, uzgodnione założenia docelowe i sprawy do ustalenia. Sam zapis założeń nie wdraża ich w aplikacji.

**Status po audycie — 11 listopada 2026:** najważniejsze porządki wykonano w czterech etapach refaktoringu. [Co jest zamknięte, co zostało i co sprawdzono](status-audytu.md). Pozostałe propozycje nie są automatycznie planem kolejnej przebudowy.

**Wdrożono etapy 1–4.** Pozostałe pytania są zaparkowane. [Raport nauki](wdrozenie-nauki.md) opisuje etap 1, [raport kursów](wdrozenie-kursow.md) etap 2, a [wybór kursu i globalne ćwiczenia](wdrozenie-zakresow.md) etap 3. [Audyt i uzupełnienie Food](wdrozenie-food.md) opisuje etap 4. Autorów materiałów obowiązuje [format kursów i znaczeń](../format-materialow.md). Historyczny katalog `archiwum/stan-obecny/` nadal przedstawia punkt odniesienia sprzed tych zmian.

Po przeglądzie dokumentacji poprawiono dwa ograniczenia: [przygotowanie do treningu i odporność map](../odpornosc-map.md). Pozostałe mapy działają przy błędzie jednej, a trening bez poznanej puli prowadzi do wcześniejszej lekcji. Zapisane wyniki i zasady nagród pozostają zachowane.

Wprowadzono też swobodny wybór lekcji, stałą długość nowych sesji, nowe menu z Mapami, łagodniejszą informację zwrotną, jawne zasady a/an dla słówek oraz 1 ★ za pełne nowe powtórzenie lekcji — [D-36–D-40](../decyzje.md). Historyczne raporty zachowują opis poprzedniego działania i dawne wyniki testów.

12 listopada rozbudowano [koci domek](../koci-domek.md) o dodatkowe miejsca, osobne warstwy i kolekcję „Moje rzeczy”. Stare zakupy, ustawienia, gwiazdki i postępy pozostają zachowane; nowe miejsca działają także offline i w kopiach.

**Wdrożono D-44–D-45:** domek ma przesuwanie po siatce 24 × 15, stałe rozmiary wyposażenia i własne kolekcje pokojów. Jest przeciąganie myszą/dotykiem i strzałki pod podglądem. Stare zakupy i ustawienia pozostają czytelne bez przymusowej migracji. [Specyfikacja domku](../koci-domek.md).
**Wdrożono D-48–D-49:** stabilna sekcja 7 + 2 dla nie rozpoczętych „Ilości i opakowania”, krótkie powtórki wcześniejszych błędów ze wspólnym licznikiem, kocie zaproszenia do rozgrzewki, treningu i Misji Kociego Mistrza. Rozpoczęte sekcje, ukończenia i dorobek pozostają. [Zasady i zakres](../03-nauka.md), [wygląd zaproszeń](../01-produkt.md).

**Wdrożono D-46–D-47:** „Kocia rozgrzewka” zastępuje treningi — na mapie jest wymagana, dodatkowa dobrowolna. Ukończone mapy i etapy pokazują sukces bez liczników zaległych błędów, a krótkie sesje mają wyraźne zakończenie. Stare ukończenia, gwiazdki i rozpoczęte sesje zostają. [Zasady, zakres i ochrona wyników](../03-nauka.md).

11 listopada 2026 wykonano [etap 1 refaktoringu: zależności i wspólne stałe](refaktoring-etap-1.md). Usunięto cykl mapy–domek, zachowując działanie, wygląd i format postępów. To osobny etap porządkowania po wcześniejszych etapach rozwoju funkcji 1–4.

[Etap 2 refaktoringu](refaktoring-etap-2.md) oddziela syntetyczne testy mechaniki, regresje Food wybieranego po ID i kontrole całej rozbudowywanej biblioteki. Nie zmienia kodu aplikacji ani produkcyjnych treści.

[Etap 3 refaktoringu](refaktoring-etap-3.md) wydziela obsługę przycisków domku do osobnego kontrolera. Rozliczanie ukończenia nauki, wygląd i zapis pozostają bez zmian.

[Etap 4 refaktoringu](refaktoring-etap-4.md) dzieli walidację kopii na mniejsze części. Zachowuje obsługę starych plików, kryteria walidacji i format postępów; zgodność sprawdza zestaw wyników sprzed podziału.

Przegląd zgodności **10 listopada 2026 r.** objął bieżące opisy produktu, mechaniki, nauki, zapisu, architektury, instrukcji materiałów i PWA. Porównano je z właściwym kodem, odczytanym katalogiem treści, scenariuszami testów i workflow. Poprawiono rozbieżności pozostawione po etapach 1–4; znane ograniczenia są jawnie opisane w [nauce](../03-nauka.md) i [architekturze](../05-architektura.md). Był to przegląd dokumentacji, bez zmian aplikacji, ponownego uruchamiania pełnych testów, nowej recenzji podręcznika ani weryfikacji opublikowanej strony. Historyczne wyniki testów zachowują swoje pierwotne znaczenie.

Pierwotne uporządkowanie dokumentacji nie zmieniało aplikacji. Późniejsze wdrożenia i wyniki kontroli opisują raporty etapów 1–4. Historycznego katalogu `archiwum/` nie aktualizujemy wstecz. Następnie dodano instrukcje pracy i skill utrzymania dokumentacji, bez zmiany zachowania aplikacji. Nie dodano Spec Kit.
