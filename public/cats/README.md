# Kocia ekipa

Zaakceptowane postacie: Albert (biało-biszkoptowy ragdoll), Oluś (rosyjski niebieski), Felix (syjamski), Maja (biało-szary ragdoll), Krzywołap (puszysty rudy kot).

`catalog.json` opisuje 25 wariantów: po jednym nauczycielskim, zadowolonym i świętującym oraz po dwie zabawne scenki każdego kotka. Trzy plansze PNG są oryginalnymi zaakceptowanymi ilustracjami. Nie przerysowujemy ich przy wyświetlaniu.

- `happy-teachers.png` — zatwierdzona plansza po poprawieniu łapek i ogona Feliksa oraz nazwaniu Krzywołapa.
- `play-celebrate.png` — zabawne scenki z motylkiem, kulką, pudełkiem, piórkiem i ogonem oraz świętowanie.
- `more-fun.png` — dodatkowe scenki, z poprawionym Albertem bez motylka i siedzącym Olusiem.

Każdy kadr wskazuje `sheet`, `x`, `y`, `width`, `height`. Opcjonalne `clip` jest listą punktów wielokąta we współrzędnych planszy, pozwalającą ominąć podpis lub fragment sąsiedniej postaci. Aplikacja pokazuje kadr przez SVG, zachowując proporcje ilustracji. Same pliki źródłowe pozostają bez zmian.

Po błędnej odpowiedzi pojawia się `teacher`. Po poprawnej losowane jest `happy` lub `celebrating`. Na końcu sesji pojawia się jeden z wariantów `funny`, również gdy w lekcji były błędy. Losowa kolejność kotków zależy od identyfikatora sesji; pięć kolejnych pytań ma różne postacie. Powrót do tej samej odpowiedzi odtwarza tę samą ilustrację. Nie zmieniamy formatu postępów ani kopii.

Katalog oraz plansze są objęte pobieraniem PWA do nauki offline. Brak dekoracji nie blokuje ćwiczeń. Pierwsze pobranie jest większe o około 5,8 MB — plansze są współdzielone przez wszystkie warianty.
