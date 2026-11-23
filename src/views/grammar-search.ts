import type { AppState } from '../app/state.ts';
import { matchesSearch, searchStatus } from '../learning/grammar-search.ts';

/** Wyszukiwarka gramatyki: zapytanie żyje w stanie, więc przerysowanie widoku go nie gubi. */
export function bindGrammarSearch(root: HTMLElement, state: AppState) {
    root.addEventListener('input', ev => {
        const input = ev.target;
        if (!(input instanceof HTMLInputElement) || input.id !== 'grammar-search') return;
        state.grammarQuery = input.value;
        let count = 0;
        for (const topic of root.querySelectorAll<HTMLElement>('[data-grammar-text]')) {
            topic.hidden = !matchesSearch(topic.dataset.grammarText!, input.value);
            if (!topic.hidden) count++;
        }
        const status = root.querySelector<HTMLElement>('.grammar-search-status');
        if (status) status.textContent = searchStatus(input.value, count);
    });
}
