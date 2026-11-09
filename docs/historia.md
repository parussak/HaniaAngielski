# Historia bez rosnącego pojedynczego dokumentu

## Przed publikacją tej wersji

W konsoli Firebase wybierz projekt **male-kroki-nauka → Firestore Database → Rules / Reguły**. Zastąp reguły **całą aktualną zawartością pliku `firestore.rules` z projektu** i kliknij **Publish / Opublikuj**. Następnie wyślij aplikację na GitHub. Workflow GitHub Pages publikuje stronę, lecz nie publikuje reguł Firebase.

Dodana reguła pozwala właścicielowi konta czytać i tworzyć własne niezmienne części historii w `users/{uid}/history/{hash}`. Nie daje publicznego dostępu, listowania, nadpisywania ani usuwania tych części. Dotychczasowa reguła `users/{uid}/progress/main` pozostaje zachowana. Reguły trzeba opublikować jednorazowo; lokalne testy nie publikują ich automatycznie.

Bez nowych reguł świeże małe wyniki mogą się synchronizować, ale zapis zawierający przeniesione do archiwum sesje będzie oczekiwał lokalnie, ponieważ Firebase odmówi utworzenia ich części. Nie kasuj danych przeglądarki — opublikuj reguły i użyj „Synchronizuj teraz”.

## Co jest przechowywane

- Bieżący zapis: ostatnie maksymalnie 30 pełnych sesji (zwykle także nie więcej niż około 90 KB ich treści), rozpoczęta sesja, słówka i trudności, podsumowania starszych wyników, postęp mapy, gwiazdki i domek.
- Starsze sesje: osobne niezmienne części o docelowym rozmiarze do około 140 KB, maksymalnie 200 KB. Każda wskazuje poprzednią część. Bieżący zapis przechowuje tylko identyfikator najnowszej, a nie coraz dłuższą listę wszystkich części.
- Podsumowania: liczba sesji i wyniki według modułu oraz pozycji materiału. Dzięki temu statystyki i wybór niewidzianych zadań uwzględniają również starszą historię. Wielkość tych podsumowań zależy głównie od zakresu materiałów, nie od liczby powtórek tego samego zadania.

Granica 700 KB pozostaje zabezpieczeniem pojedynczej bieżącej migawki; pełne dawne odpowiedzi nie odkładają się w niej bez końca. Wyjątkowo duża pojedyncza sesja z importu może wymagać osobnego opracowania; aplikacja zgłosi problem i zachowa poprzedni zapis. Nie zwiększamy automatycznie limitów usług ani nie włączamy płatnego planu.

## Bezpieczeństwo przejścia

Najpierw zapisujemy starsze części w IndexedDB, dopiero później zmieniamy bieżący zapis. W chmurze części są wysyłane od najstarszej, a transakcja bieżącego dokumentu jest zatwierdzana dopiero po ich zapisaniu. Przerwane wysyłanie nie potwierdza niepełnej historii. SHA-256 wiąże identyfikator części z jej treścią i poprzednikiem. Istniejące części nie są przepisywane przy każdym ćwiczeniu.

Dotychczasowe klucze IndexedDB i format kopii 1 są zachowane; nowe pola są opcjonalne. Małe dawne kopie działają bez zmian. Dłuższe historie są automatycznie dzielone przy wczytaniu lokalnego zapisu/konta lub zapisie zmiany. Odpowiedzi, daty, pierwsze wyniki i poprawki nie są usuwane. Konflikt konta nadal wymaga świadomego wyboru wersji, a kopia sprzed zmiany pozostaje dostępna.

W „Moich postępach” przycisk **Pokaż starsze sesje** pobiera kolejną część. Brakujące na nowym urządzeniu części wymagają internetu, lecz bieżąca nauka i jej statystyki działają offline bez pobierania całego archiwum. Pobrane części zostają lokalnie. Nie pobieramy całej wieloletniej historii przy każdym uruchomieniu aplikacji.

## Kopie

„Zapisz kopię postępów” dołącza wszystkie części do jednego pliku razem z mapą, gwiazdkami i domkiem. Eksport nie tworzy cichej niepełnej kopii: jeśli brakuje części i nie da się jej pobrać, prosi o połączenie z internetem. Import sprawdza zawartość, sumy, powiązania i kompletność historii przed zastąpieniem wyników. Obsługiwany limit pliku wynosi 50 MB. Kopia nie zawiera loginu ani hasła.

Pełna historia nadal zajmuje miejsce w urządzeniu i w Firestore — nie obiecujemy nieskończonej pamięci. Podział usuwa praktyczny problem rosnącego pojedynczego dokumentu i ogranicza ilość danych wysyłanych przy każdej odpowiedzi.
