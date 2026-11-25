/** The translation becomes ordinary page text only after opening the disclosure. */
export function bindListeningTranslation(root: HTMLElement) {
    root.addEventListener('toggle', ({ target }) => {
        if (!(target instanceof HTMLDetailsElement) || !target.open || !target.classList.contains('listen-translation')) return;
        const template = target.querySelector('template');
        if (template) template.replaceWith(template.content);
    }, true);
}
