# Ilustracje Food

Lokalne SVG w jednym stylu: pastelowe wypełnienia, fioletowy kontur, zaokrąglone kształty, przezroczyste tło. Nie zależą od wyglądu emoji na danym telefonie. Nie zawierają napisów z odpowiedziami. Są pobierane do PWA razem z materiałami.

- `word-*.svg`: ilustracje 97 haseł. Zwroty mogą mieć całą scenkę, np. proponowanie napoju albo piknik.
- `scene-*.svg`: sytuacje w gramatyce i dialogach. Obecność i brak produktów mają inne scenki; pojedyncze jajko, dwa jajka i kilka jajek są rozróżnione. Scenki przyczynowo-skutkowe łączą aktywność z jej skutkiem. Nie zastępują polecenia zadania.
- Osiem dawnych nazw plików pozostaje dostępnych dla wcześniejszych odwołań.

Przypisania i podpisy edytuje się w `public/content/02-food/slownictwo.json`, `cwiczenia.json` oraz `rozmowki.json`, niezależnie od kodu strony. Pole `scene: true` daje szerszy obrazek. Same rysunki można edytować jako SVG. `scripts/generate-food-art.mjs` zawiera ich źródłowe kształty i generuje ponownie pliki; uruchomienie go nadpisuje rysunki, lecz nie zmienia plików treści JSON.
