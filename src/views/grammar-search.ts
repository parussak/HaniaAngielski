import { matchesSearch, searchStatus } from '../learning/grammar-search.ts';

/** Stosuje zapytanie do już narysowanych tematów gramatyki i odświeża status; stanu nie zapisuje. */
export function filterGrammarTopics(root: HTMLElement, query: string) {
    let count = 0;
    for (const topic of root.querySelectorAll<HTMLElement>('[data-grammar-text]')) {
        topic.hidden = !matchesSearch(topic.dataset.grammarText!, query);
        if (!topic.hidden) count++;
    }
    const status = root.querySelector<HTMLElement>('.grammar-search-status');
    if (status) status.textContent = searchStatus(query, count);
}
