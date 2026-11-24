/** D-68: on a computer → works like „Dalej” in a reading, but never while typing. */
export function bindReadingShortcut(root: HTMLElement) {
    document.addEventListener('keydown', ev => {
        if (ev.key !== 'ArrowRight' || ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey || (ev.target as HTMLElement | null)?.closest?.('input,textarea,select,[contenteditable]')) return;
        const step = root.querySelector<HTMLButtonElement>('[data-reading-next]:not([disabled])');
        if (!step) return;
        ev.preventDefault();
        step.click();
    });
}
