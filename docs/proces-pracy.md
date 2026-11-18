# Proces pracy z agentami AI

Kto robi jaką pracę, żeby na co dzień korzystać z jednego narzędzia, oszczędzać limity Claude i zachować jakość. Zasady wspólne dla wszystkich agentów: [AGENTS.md](../AGENTS.md).

## Podział

| Rodzaj pracy | Kto | Jak często |
| --- | --- | --- |
| **Codzienna praca** — rozwijanie istniejących funkcji, poprawki, błędy z telefonu, drobne zmiany, nowe rozdziały w istniejącym formacie | ChatGPT (Codex) | na co dzień |
| **Sprawdzenie rozdziału** — poprawność językowa, zgodność z podręcznikiem i formą ćwiczeń | Claude | po każdym nowym rozdziale |
| **Duży projekt** — nowa funkcjonalność, np. dźwięk, nowy typ ćwiczenia, nowy język | Claude | gdy jest potrzebny |
| **Przegląd jakości** — architektura, jakość testów, refaktoryzacja | Claude | raz w tygodniu i przed każdym dużym projektem |
| **Decyzje, telefon, commit** | Paulina | zawsze |

Narzędzia: dla ChatGPT [instrukcja do wklejenia](instrukcja-chatgpt.md) i skill `$male-kroki-modul-ze-zdjec` (`.agents/skills/`); w Claude Code komendy `/sprawdz-rozdzial <folder modułu>` i `/przeglad-jakosci` (`.claude/commands/`, same przełączają się na Sonnet).

Lokalny Qwopus jest opcjonalnym pomocnikiem w VS Code (pytania o kod, drobiazgi w jednym pliku). Proces na nim nie polega.

## Zasady projektowania i kodu

Wspólna podstawa dla obu stron: ChatGPT pisze kod według [zasad projektowania i kodu](zasady-kodu.md), a Claude w przeglądzie jakości i przy refaktoryzacji ocenia zmiany względem nich. Zmianę samych zasad proponuje Claude, a zatwierdza Paulina.

## Codzienna praca — ChatGPT

1. Opisz zmianę. Jeśli to nowa zasada nauki, najpierw ustal ją w rozmowie i dopisz wiersz D-xx do [decyzji](decyzje.md).
2. Codex robi zmianę według `AGENTS.md`: jeden tor (treść albo mechanika), testy według ryzyka, bez zmiany oczekiwań istniejących testów bez zgody.
3. Codex podaje, co uruchomił i czego nie sprawdził, oraz commit message.
4. Klikasz wyrywkowo na telefonie i commitujesz.

Nie ma osobnej recenzji każdej zmiany — tę rolę pełnią testy, kontrole automatyczne i cotygodniowy przegląd jakości.

## Nowy rozdział — ChatGPT, potem Claude

1. **ChatGPT:** ze zdjęć podręcznika i zeszytu (skill `$male-kroki-modul-ze-zdjec`) przygotowuje pliki w `public/content/<moduł>/`, kartę pokrycia i listę niepewności — według [dodawania modułu](dodawanie-modulow.md). `check:content` i `npm test` muszą przejść.
2. **Claude** (`/sprawdz-rozdzial <folder modułu>`)**:** sprawdza rozdział — poprawność językową, zgodność z podręcznikiem, formę ćwiczeń (D-35: w luce brakujące słowo, nie całe zdanie), odpowiedzi i wyjaśnienia. Szczególnie treści napisane do odsłuchu (sceny-adaptacje, kwestie dialogów), bo nie pochodzą wprost z podręcznika. Zwraca listę poprawek.
3. **ChatGPT** nanosi poprawki (albo Claude, jeśli są drobne).
4. **Paulina** rozstrzyga sporne miejsca z listy niepewności.
5. **Nagrania:** `npm run audio` generuje klipy (Piper), potem `npm run audio:verify` przepuszcza każde nagranie przez Whisper i porównuje z tekstem ([kontrola brzmienia](generowanie-audio.md#kontrola-brzmienia--npm-run-audioverify)). Claude czyta tylko raport `audio/.verify/raport.md` z podejrzanymi nagraniami i proponuje: wygenerować ponownie, zmienić tekst albo zostawić. Paulina odsłuchuje wyłącznie podejrzane.
6. **Paulina:** wyrywkowo na telefonie, commit.

Jeśli rozdział wymaga czegoś, czego format nie obsługuje, zatrzymujemy się — to duży projekt dla Claude.

## Duży projekt — Claude

1. Ustalenie zasad z Pauliną → decyzja D-xx i opis w odpowiednim dokumencie (np. [nauka](03-nauka.md)).
2. Najpierw testy opisujące decyzję, potem kod.
3. Projekt kończy się zaktualizowaną [architekturą](05-architektura.md), jeśli zmieniły się granice lub pojawiły nowe pliki.
4. Opcjonalnie jedna recenzja w ChatGPT — inny model łapie inne błędy.

Po zakończeniu funkcja przechodzi do codziennej pracy w ChatGPT.

Przed projektem robimy przegląd jakości, żeby zaczynać od czystej bazy.

## Przegląd jakości — Claude

Raz w tygodniu i przed każdym dużym projektem, komendą `/przeglad-jakosci` w nowej sesji Claude Code. Claude przegląda zmiany od poprzedniego przeglądu (`git log` / `git diff` od ostatniego znacznika) i sprawdza:

- czy zachowane są [zasady projektowania i kodu](zasady-kodu.md), granice z [architektury](05-architektura.md) i tory z `AGENTS.md`,
- jakość testów: czy sprawdzają efekt, czy oczekiwania nie zostały dopasowane do kodu bez zgody,
- powtórzenia, rosnące pliki i miejsca do refaktoryzacji.

Wynik to krótka lista w rozmowie. Paulina wybiera, co poprawić; refaktoryzację robi Claude w tej samej lub kolejnej sesji. Listy nie zapisujemy w dokumentacji.

### Znacznik ostatniego przeglądu

Po przeglądzie Paulina zaznacza w Git commit, do którego sięgnął przegląd. Znacznik (tag) to stała nazwa przyklejona do commita; kolejny przegląd zaczyna od najnowszego znacznika `przeglad-…`. Claude podaje gotowe polecenie na końcu przeglądu, np.:

```bash
git tag przeglad-2026-11-23 a1b2c3d
```

Format nazwy: `przeglad-RRRR-MM-DD` (data przeglądu, bez polskich znaków). Znacznik jest lokalny; żeby był widoczny także na GitHubie i w innych kopiach repozytorium, wyślij go: `git push origin przeglad-2026-11-23`. Gdy nie ma żadnego znacznika, przegląd obejmuje ostatnie 7 dni.

## Jak oszczędzać limity Claude

- **Jedno zadanie = jedna nowa sesja.** Długa rozmowa kosztuje przy każdej wiadomości; zasady agent i tak czyta z `AGENTS.md`.
- **Sonnet** do sprawdzania rozdziałów i przeglądu; **Opus** tylko do projektowania dużych funkcji.
- Claude czyta zmiany (diff) i listy niepewności, a nie całe repo.

## Na koniec każdej pracy

Każdy agent — ChatGPT i Claude — kończy krótkim podsumowaniem:

```
Zrobione: <jedno zdanie>
Sprawdzone: <polecenia i wyniki>; niesprawdzone: <co>
Commit: <gotowy commit message>
Następny krok: <np. „sprawdzenie rozdziału w Claude” albo „commit”>
```

## Do przygotowania

- **Zatwierdzenie [zasad projektowania i kodu](zasady-kodu.md)** przez Paulinę (dziś: projekt do zatwierdzenia).
- **Pierwszy przegląd jakości** i pierwszy znacznik `przeglad-…`.
- Wklejenie [instrukcji](instrukcja-chatgpt.md) do projektu w ChatGPT.

Gotowe: instrukcja dla ChatGPT/Codex, skill modułu ze zdjęć dla Codexa, komendy Claude Code, znacznik przeglądu.
