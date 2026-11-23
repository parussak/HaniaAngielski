# Instrukcja dla ChatGPT i Codex

Gotowy tekst do wklejenia, żeby ChatGPT pracował według [procesu pracy](proces-pracy.md). Zasady są w [AGENTS.md](../AGENTS.md) i [zasadach kodu](zasady-kodu.md) — tutaj tylko do nich odsyłamy.

## Czy Codex sam czyta `AGENTS.md`?

**Tak.** Według dokumentacji Codex czyta `AGENTS.md` z repozytorium przed każdą pracą (limit łączny 32 KiB — nasz plik jest dużo mniejszy). Strony o Codexie w chmurze nie powtarzają tego wprost, więc tekst poniżej i tak każe przeczytać `AGENTS.md` — nic to nie kosztuje.

**Zwykła rozmowa w ChatGPT (bez Codexa) nie widzi repozytorium** i nie zna `AGENTS.md`, dopóki go nie wkleisz lub nie podłączysz repozytorium. Dlatego tekst warto mieć w instrukcjach projektu w ChatGPT.

## Gdzie wkleić

- **Projekt „Małe kroki” w ChatGPT** → instrukcje projektu. Działa w każdej nowej rozmowie w tym projekcie.
- **Codex** nie potrzebuje wklejania — czyta `AGENTS.md`. Tekst możesz wkleić na początek zadania, jeśli chcesz mieć pewność.

## Tekst do wklejenia

```text
Pracujesz nad aplikacją „Małe kroki” (nauka języków dla Hani i Pauliny). Odpowiadaj po polsku i prosto — Paulina uczy się tych narzędzi.

Zanim cokolwiek zmienisz, przeczytaj AGENTS.md. Przy zmianie kodu przeczytaj też docs/zasady-kodu.md. Kto co robi: docs/proces-pracy.md.

- Jedna zmiana = jeden tor: treść ALBO mechanika ALBO audio ALBO dokumentacja.
- Nowy rozdział ze zdjęć podręcznika: użyj skilla $male-kroki-modul-ze-zdjec i zatrzymaj się po planie.
- Kod mechaniki piszesz TDD: najpierw test, który nie przechodzi, potem minimum kodu, potem porządki. Przestrzegaj „Konstytucji kodu” z AGENTS.md (jedna odpowiedzialność, zależności w jedną stronę, czyste planery i jedna powłoka ze skutkami, najwęższy dostęp do stanu, typy zamiast napisów).
- Nie zmieniaj oczekiwań istniejących testów bez zgody Pauliny.
- Nie rób commita ani pushu — commituje Paulina.

Przekaż pracę do Claude (napisz to wprost w „Następny krok”), gdy:
- nowy rozdział jest gotowy → sprawdzenie rozdziału w Claude;
- treść nie mieści się w obecnym formacie albo potrzebny jest nowy typ ćwiczenia, nowy ekran większy niż drobna zmiana, nowy język lub nowa zasada nauki;
- zmiana dotyczy zapisu postępów, kopii lub synchronizacji kont;
- zmiana łamie granice z docs/05-architektura.md albo wymaga nowej biblioteki.

Na koniec zawsze podaj:
Zrobione: <jedno zdanie>
Sprawdzone: <polecenia i wyniki>; niesprawdzone: <co>
Commit: <gotowy commit message>
Następny krok: <np. „commit” albo „sprawdzenie rozdziału w Claude”>
```
