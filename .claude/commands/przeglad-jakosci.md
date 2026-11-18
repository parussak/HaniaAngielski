---
description: Cotygodniowy przegląd jakości kodu od ostatniego znacznika przeglad-RRRR-MM-DD. Wynik to lista w rozmowie.
argument-hint: "[opcjonalnie: znacznik lub commit, od którego zacząć]"
model: sonnet
allowed-tools: Bash(git tag *), Bash(git log *), Bash(git status *)
---

Robisz przegląd jakości aplikacji „Małe kroki” według sekcji „Przegląd jakości” w `docs/proces-pracy.md`.

Znaczniki poprzednich przeglądów (najnowszy pierwszy):
!`git tag --list "przeglad-*" --sort=-refname`

Ostatnie commity i stan katalogu roboczego:
!`git log --oneline -15`
!`git status --short`

## Od czego zacząć

- Jeśli podano argument (`$ARGUMENTS`), zacznij od niego.
- W przeciwnym razie od najnowszego znacznika `przeglad-…` z listy wyżej.
- Jeśli znacznika nie ma, to pierwszy przegląd: weź commity z ostatnich 7 dni (`git log --since="7 days ago"`) i napisz to na początku wyniku.

Zakres to `git log <początek>..HEAD` i `git diff <początek>..HEAD`. Niezatwierdzone zmiany z `git status` wymień osobno i nie oceniaj ich jak gotowych. Czytaj diff i tylko te pliki, których dotyczy. Produkcyjne JSON-y kursów (`public/content/`) przeglądaj tylko pod kątem torów, bo treść sprawdza `/sprawdz-rozdzial`.

## Względem czego

1. Lista kontrolna z sekcji 5 w `docs/zasady-kodu.md`. To jest główna miara: idź punkt po punkcie.
2. Granice i miejsca odpowiedzialności z `docs/05-architektura.md`.
3. Tory pracy z `AGENTS.md`: czy jeden commit nie miesza treści z mechaniką.
4. **Jakość testów** (`docs/07-testy.md`): czy nowe zachowanie ma test efektu i przypadku brzegowego; czy oczekiwania istniejących testów nie zostały zmienione bez zgody (szukaj zmienionych `assert`/`expect` w diffie i sprawdź opis commita); czy testy nie sprawdzają wewnętrznej budowy funkcji ani tekstu w plikach `.ts`.
5. **Refaktoryzacja:** powtórzony kod, rosnące pliki (> ~10 KB), oraz czy zmiany dotknęły kandydatów z sekcji 6 w `docs/zasady-kodu.md` (pogorszyły, czy przy okazji można poprawić).

Niczego nie zmieniaj w trakcie przeglądu. Testów nie musisz uruchamiać. Jeśli jakiś wniosek wymaga ich uruchomienia, uruchom tylko wąski zakres i napisz, co uruchomiono.

## Wynik — krótka lista w rozmowie (nie zapisuj jej w dokumentacji)

1. **Zakres:** od którego znacznika lub commita, ile commitów, `HEAD` (skrót).
2. **Naruszenia zasad**, od najpoważniejszych: plik i linia, która zasada (punkt listy kontrolnej lub D-xx), dlaczego to problem, proponowana poprawka.
3. **Testy:** braki i wątpliwe zmiany oczekiwań.
4. **Propozycje refaktoryzacji:** co, korzyść, szacowana wielkość (mała / średnia / duża), czy pasuje do najbliższego dużego projektu.
5. **Zgodność dokumentacji:** czy zmiany granic lub nowe pliki są w architekturze, a nowe zasady w D-xx.

Paulina wybiera, co poprawić. Nie zaczynaj refaktoryzacji bez jej wyboru.

Podaj Paulinie polecenie, które zaznaczy ten przegląd (`<skrót HEAD>` to commit, do którego sięgnął przegląd, a data dzisiejsza):

```
git tag przeglad-RRRR-MM-DD <skrót HEAD>
```

Na koniec blok z sekcji „Na koniec każdej pracy” w `docs/proces-pracy.md`:

```
Zrobione: <jedno zdanie>
Sprawdzone: <zakres commitów i co przeczytano>; niesprawdzone: <np. czego nie uruchomiono, telefon>
Commit: <brak — przegląd niczego nie zmienia>
Następny krok: <„Paulina wybiera poprawki i tworzy znacznik przeglądu”>
```
