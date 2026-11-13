# Jak utrzymywać dokumentację bez rozrastania kontekstu

Dokumentacja ma pomagać człowiekowi i AI znaleźć właściwe miejsce zmiany. Nie jest drugą kopią kodu ani zapisem całej rozmowy. Opisuj po polsku, krótko i konkretnie: co działa, po co, na jakiej podstawie oraz czego jeszcze nie wdrożono.

## Przed zmianą: przeczytaj tylko potrzebną część

Zacznij od celu użytkownika, zakresu zmian w plikach i [spisu dokumentacji](README.md). Następnie wybierz właściwy wiersz. Nie wczytuj domyślnie wszystkich raportów, materiałów i testów.

| Zmieniany obszar | Dokument główny | Sprawdź w projekcie |
| --- | --- | --- |
| Przeznaczenie, wejścia i ekrany | [Produkt](01-produkt.md) | Właściwy widok i przebieg w interfejsie |
| Obiekty, format, rodzaje pytań | [Mechanika](02-mechanika.md), [format materiałów](format-materialow.md) | Typy, odczyt i walidacja danych |
| Lekcje, mapy, dobór treningu, błędy i nagrody | [Nauka](03-nauka.md) | Reguły nauki i testy efektów |
| Nowy podręcznik lub moduł | [Dodawanie modułów](dodawanie-modulow.md), karta kursu w [kursach](kursy/README.md) | Źródła, JSON i karta pokrycia modułu |
| Odpowiedzi, tłumaczenia i objaśnienia | [Merytoryka](04-merytoryka.md) | Konkretna treść i materiał źródłowy |
| Podział kodu i odpowiedzialności | [Architektura](05-architektura.md) | Importy, odpowiednie moduły i ich wywołania |
| Konta, offline, synchronizacja, historia i kopie | [Zapis](06-zapis.md) | Walidacja, zapisywanie i testy zgodności |
| Zakres kontroli i nowe testy | [Testy](07-testy.md) | Polecenia, scenariusze i faktyczne wyniki |
| Nowa lub zmieniona zasada produktu | [Decyzje](decyzje.md) i odpowiedni dokument wyżej | Uzgodnienie użytkownika, nie domysł na podstawie kodu |

Jeżeli zmiana dotyka kilku granic, przeczytaj ich właściwe fragmenty. Raport poprzedniego etapu otwieraj, gdy potrzebujesz kontekstu zgodności lub uzasadnienia. Brakujące fragmenty można wyszukać po nazwie funkcji, identyfikatorze materiału lub numerze decyzji.

## Rozróżniaj trzy stany

- **Stan obecny:** potwierdzony w odpowiednim kodzie, materiale lub teście. Obecność testu nie oznacza, że właśnie go uruchomiono.
- **Uzgodnione docelowe:** użytkownik zatwierdził zasadę, lecz może nie być wdrożona. Podaj odnośnik do decyzji i informację o rozbieżności.
- **Do ustalenia / propozycja:** otwarta sprawa lub rekomendacja. Nie opisuj jej jako obowiązującej reguły ani wykonanej funkcji.

Przy sprzeczności nie dopasowuj automatycznie wymagań do kodu. Zapisz, co jest ustalone, co faktycznie działa i jaka zmiana lub decyzja jest potrzebna. Aktualizacja opisu nie daje zgody na naprawę aplikacji poza zleconym zakresem. Uzgodnione wcześniej decyzje pozostają ważne; nie pytaj o nie ponownie.

## Co aktualizować

1. Zmień bieżący opis w dokumencie odpowiedzialnym za daną zasadę. Użyj odnośnika w innych dokumentach zamiast powielania akapitów.
2. Przy zmianie materiału uzupełnij kartę kursu i kartę modułu; nie kopiuj słówek i odpowiedzi do Markdown. Przy małej korekcie nie twórz nowego raportu wdrożenia.
3. Przy istotnej zmianie kilku obszarów można dodać krótki raport: zakres, ochrona wyników, wykonane kontrole i ograniczenia. Zaktualizuj spis i odnośniki. Nie przenoś bieżącej specyfikacji wyłącznie do raportu.
4. Rejestr decyzji aktualizuj, gdy pojawiło się rzeczywiste uzgodnienie albo wdrożono już uzgodnioną rzecz. Nie zmieniaj znaczenia starych decyzji i nie zamykaj zaparkowanych pytań przy okazji porządków.
5. Sprawdź główny `README.md` oraz instrukcję `public/content/README.md`, jeśli zmiana wpływa na pierwsze uruchomienie, widoczne możliwości albo edytowanie treści. Unikaj mnożenia liczników, które trzeba zmieniać w wielu miejscach.

Katalog `docs/archiwum/` (stan obecny sprzed zmian, audyty, raporty etapów) jest historyczny i nie jest czytany domyślnie. Nie przepisuj dawnych wyników testów na dzisiejsze. Jeśli starszy opis może wprowadzać w błąd, dodaj krótkie oznaczenie historycznego zakresu i odnośnik do bieżącego dokumentu. Już istniejące historyczne liczby nie są same w sobie błędem.

## Weryfikacja proporcjonalna do zmiany

**Tylko dokumentacja:** przeczytaj zmienione fragmenty, sprawdź zgodność z właściwym kodem/treściami/testami, odnośniki i zakres różnic. Nie trzeba uruchamiać całej aplikacji ani dopisywać testów dopasowanych do brzmienia akapitów.

**Materiały lub zachowanie aplikacji:** stosuj [zasady testowania](07-testy.md). Polecenia i scenariusze, które faktycznie wykonano, wraz z wynikiem podaj w podsumowaniu zmiany i w opisie commita — nie dopisuj ich do dokumentacji. Nowy obszar, którego testy automatyczne nie sprawdzają, dopisz do odpowiedniej listy w [testach](07-testy.md). Nie dopisuj „przetestowane offline” wyłącznie dlatego, że service worker istnieje. Nie zastępuj recenzji językowej walidacją JSON.

Pomocniczy skrypt dostarczony ze skillem sprawdza lokalne odnośniki plikowe w dokumentacji i kompletność prostego opisu skilla:

```powershell
node scripts/check-docs.mjs
```

Skrypt niczego nie zapisuje. Nie sprawdza kotwic nagłówków, zewnętrznych stron, zgodności opisów z zachowaniem ani poprawności językowej ćwiczeń. Takie ustalenia wymagają przeczytania właściwych źródeł.

## Korzystanie ze skilla

Instrukcja jest w [SKILL.md](../.agents/skills/male-kroki-dokumentacja/SKILL.md). Skill jest częścią projektu i podlega temu samemu przeglądowi zmian. Można poprosić:

> Użyj $male-kroki-dokumentacja: sprawdź dokumentację względem zmian w tym zadaniu i uaktualnij tylko dotknięte opisy. Nie zmieniaj aplikacji.

Można też wskazać plik skilla wprost. Jeśli nie pojawia się na liście w bieżącej sesji, nie zakładaj, że jest już załadowany — otwórz nową sesję w projekcie lub wskaż jego ścieżkę. Nie wymaga Spec Kit, nowych bibliotek ani usług. Skill nie działa sam w tle i nie zastępuje kontroli przy zmianie.

Na końcu pracy wystarczy krótko podać: co poprawiono w dokumentacji, jakie rozbieżności zostały, co sprawdzono oraz czego nie sprawdzono, jeśli ma to znaczenie. Bez udawania publikacji i bez przepisywania całego planu projektu.
