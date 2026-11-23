import { isOwnedBy, unhandled } from '../app/actions.ts';
import { speaker } from '../speech.ts';
// D-58: odsłuchanie nie zmienia postępów, więc nie zapisuje i nie przerysowuje ekranu.
export function createSpeechController() {
    /** `true`, gdy dźwięk ruszył; `false`, gdy się nie udał (wtedy ekran trzeba odświeżyć) albo to nie akcja odsłuchu. */
    function handleAction(action: string, el: HTMLElement): boolean {
        if (!isOwnedBy('speech', action))
            return false;
        switch (action) {
            case 'listen': return speaker().speak(el.dataset.say ?? '', el.dataset.lang, el.dataset.slow === 'true', el.dataset.speechKind === 'dialogue' ? 'dialogue' : 'word');
            default: return unhandled(action);
        }
    }
    return { handleAction };
}
