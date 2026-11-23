/** Jedyne, co kontroler widzi ze stanu: zapytanie wyszukiwarki gramatyki (najwęższy dostęp). */
export interface GrammarQueryStore { grammarQuery: string }

/** Zapytanie żyje w stanie, więc przerysowanie widoku go nie gubi. Widok tylko je odczytuje. */
export function createGrammarSearchController(store: GrammarQueryStore) {
    /** Zapisuje zapytanie, jeśli zdarzenie pochodzi z pola wyszukiwarki; zwraca, czy tak było. */
    function handleInput(target: { id: string; value: string }): boolean {
        if (target.id !== 'grammar-search') return false;
        store.grammarQuery = target.value;
        return true;
    }
    return { handleInput };
}
