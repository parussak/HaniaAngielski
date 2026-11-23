/** Zapytanie i tekst porównujemy bez wielkości liter, polskich znaków diakrytycznych i bez ł. */
export const normalizeSearch = (value: string) => value.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replaceAll('ł', 'l');

/** Puste zapytanie pasuje do wszystkiego. */
export const matchesSearch = (text: string, query: string) => normalizeSearch(text).includes(normalizeSearch(query));

export function searchStatus(query: string, count: number) {
    if (!normalizeSearch(query)) return '';
    return count ? `Znalezione tematy: ${count}` : 'Brak pasujących tematów. Spróbuj innego słowa.';
}
