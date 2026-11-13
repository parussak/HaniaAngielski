# Mechanika nauki — stan obecny

Dokument opisuje zachowanie kodu, nie ocenę skuteczności pedagogicznej. [Zakres przeglądu](../../README.md).

## Tryby i dobór zadań

| Tryb | Zakres obecnego Food |
| --- | --- |
| Fiszki podstawa | 38 identyfikatorów wskazanych w `basicFlashcardIds` |
| Fiszki | Wszystkie 97 haseł; obydwa zestawy współdzielą status tego samego słowa |
| Quiz słownictwa | Zadania słownikowe, obecnie 97 odwołań do haseł |
| Gramatyka | Zadania o rodzaju `grammar`, obecnie 59 |
| Rozmówki | Zadania o rodzaju `dialogue`, obecnie 12 krótkich dialogów |
| Powtórka ogólna | Trudne słowa i zadania w wybranym zakresie |
| Lekcja mapy | Stały zestaw wskazany w materiale mapy, z wprowadzeniem i przykładami |

Swobodna sesja wybiera do 10 pozycji początkowych. Pierwszeństwo mają trudne, potem niewidziane, a następnie pozostałe. Znane słowa są pomijane w fiszkach; zadania quizowe mogą nadal je sprawdzać. Opcja wcześniejszych modułów poszerza zakres według `order`, bez granicy kursu lub języka.

Błędne odpowiedzi mogą dopisać pozycje do końca sesji, więc końcowa liczba pytań może przekroczyć 10. Lekcja mapy zawiera 1–8 wskazanych słów/zadań; nie jest losowym przekrojem całego modułu.

Źródła: [makeSession](../../../src/learning/session.ts), [eligibleModules](../../../src/learning/questions.ts), [makeLessonSession i validateJourney](../../../src/adventure.ts), [testy fiszek](../../../tests/basic-flashcards.test.ts).

## Odpowiadanie i poprawki

Poza powtórkami można wybrać wpisywanie, przyciski lub tryb mieszany. Jawne warianty odpowiedzi wymuszają wybór niezależnie od preferencji. Kod rozpoznaje `responseType: "choice"` oraz pewne konstrukcje polecenia, np. warianty rozdzielone ukośnikiem lub „policzalny czy niepoliczalny”. To rozpoznawanie nie jest ogólną analizą języka naturalnego.

W obu powtórkach słówka i luki wymagają wpisania, z wyjątkiem pytań podających wybór. Zasada obowiązuje również przy renderowaniu starszej aktywnej sesji.

Po błędzie użytkownik widzi własną odpowiedź, poprawny wariant, wyróżnienie różnic, wyjaśnienie i kotka nauczyciela. Może spróbować ponownie albo przejść dalej; błędna pozycja wraca również na końcu sesji. Po dobrej odpowiedzi pojawia się zadowolony lub świętujący kotek; na koniec sesji zabawna scenka.

Pierwsza próba i późniejsze poprawki są liczone osobno. Poprawienie błędu w tej samej sesji nie zmienia pierwszej próby na poprawną i nie oznacza automatycznie trwałej znajomości słowa. Ogólna trudność może zostać usunięta przy poprawnej pierwszej próbie w nowej sesji.

Źródła: [inputFor i requiresChoice](../../../src/learning/questions.ts), [recordAnswer](../../../src/learning/session.ts), [widok ćwiczenia](../../../src/views/study.ts), [reakcje kotków](../../../src/cats.ts), [testy odpowiedzi](../../../tests/answer-comparison.test.ts), [testy obu powtórek](../../../tests/review-input.test.ts).

## Co oznacza poprawna odpowiedź

Odpowiedź musi zgadzać się z jednym z jawnych wpisów `answers`, po normalizacji. Normalizacja:

- ujednolica zapis Unicode do NFC;
- zamienia apostrofy `‘` i `’` na `'`;
- usuwa kropki, przecinki, wykrzykniki, pytajniki i wielokropek;
- usuwa skrajne oraz nadmiarowe spacje;
- domyślnie pomija wielkość liter; zadanie może wymagać jej zachowania.

Nie ma automatycznego akceptowania literówek, tłumaczenia odpowiedzi przez AI ani oceny dowolnego zdania. Akcenty i znaki językowe pozostają istotne; sam brak akcentu nie jest obecnie tolerowany. Wyświetlenie różnic nie zmienia zasad oceniania.

Źródła: [normalizeAnswer](../../../src/answers.ts), [isCorrect](../../../src/learning/questions.ts), [porównanie odpowiedzi](../../../src/answer-comparison.ts).

## Powtórki etapowe i procent utrwalenia

Każdy etap mapy ma własną kolejkę błędów. Trafiają do niej błędy lekcji tego etapu i jego powtórki. Swobodny quiz poza mapą zasila ogólne trudności, ale nie jest automatycznie przypisywany do etapu.

- Pozycja wymaga 3 poprawnych pierwszych prób w ukończonych turach powtórki.
- Poprawka lub dodatkowe wystąpienie tej samej pozycji w jednej turze nie daje dodatkowego punktu.
- Po pierwszym zaliczeniu termin jest ustawiany na turę `+2`, po drugim na `+3`; po trzecim pozycja jest utrwalona.
- Błąd zeruje serię i wyznacza powrót w następnej turze.
- Harmonogram opiera się na turach, nie dniach. Gdy nic nie jest należne, następne rozpoczęcie może przeskoczyć do najbliższej należnej tury — nie trzeba otwierać pustych sesji.
- Jedna tura zawiera do 10 należnych pozycji początkowych. Samo otwarcie kafelka nie zwiększa liczby zaliczeń; tura jest rozliczana po ukończeniu.

**Procent utrwalenia dotyczy tylko zebranych błędnych pozycji**, nie wszystkich słów i zadań modułu. To udział pozycji z 3/3; pusty zbiór daje 100% i komunikat o braku zaległości. Nie jest to pomiar opanowania całego podręcznika. Przy wspólnej pozycji w kilku etapach podsumowanie modułu uwzględnia słabszy wynik.

Źródła: [stage-review.ts](../../../src/stage-review.ts), [testy powtórek etapowych](../../../tests/stage-review.test.ts), [testy mapy w przeglądarce](../../../tests/browser/stage-review.spec.ts).

## Gwiazdki i domek

Pierwsze ukończenie lekcji daje 3 gwiazdki, także po poprawkach. Ukończenie wszystkich lekcji etapu i brak nieutrwalonych pozycji w jego kolejce daje dodatkowe 3 gwiazdki, raz. Etap bez zebranych błędów spełnia warunek powtórki. Odtwarzanie starszej historii może opóźnić premię do zakończenia sprawdzania.

Ponowne przejście lekcji i powtórki nie daje bez końca kolejnych nagród. Nie ma bieżącej dziennej premii za ogólną powtórkę. Dla obecnego Food testy sprawdzają łączny budżet 144 gwiazdek: 41 lekcji i 7 etapów.

Domek ma 6 dekoracji. Zakup jest jednorazowy, zużywa zdobyte gwiazdki, a ustawienie można zmieniać lub schować. Gwiazdki, zakupy i pokój są wspólne w obrębie zapisu użytkownika, nie osobne dla języków.

Źródła: [rewardCompletion, purchase, place](../../../src/adventure.ts), [settleStageRewards](../../../src/stage-review.ts), [test pełnej ścieżki](../../../tests/adventure.test.ts).
