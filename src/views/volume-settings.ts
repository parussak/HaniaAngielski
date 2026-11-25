import {act, icon} from '../ui.ts';
import type {VolumeGroup} from '../volume.ts';

const slider = (group: VolumeGroup, label: string, percent: number, preview: string) =>
    `<div class="volume-row"><label for="volume-${group}">${label}</label><div class="volume-control"><input type="range" id="volume-${group}" data-volume="${group}" min="0" max="100" step="1" value="${percent}" aria-valuetext="${percent}%"><output for="volume-${group}" id="volume-${group}-value">${percent}%</output>${preview}</div></div>`;

/** Dwa suwaki głośności. Przeciąganie jest ciche; dźwięk gra tylko po „Posłuchaj”. */
export function volumeSettingsView(levels: Readonly<Record<VolumeGroup, number>>, sample?: {text: string; language: string}) {
    const speechPreview = sample?.text
        ? `<button class="secondary" ${act('listen', {speechKind: 'word', say: sample.text, lang: sample.language})} aria-label="Posłuchaj wymowy">${icon('sound')} Posłuchaj</button>`
        : '<button class="secondary" disabled aria-label="Posłuchaj wymowy">Posłuchaj</button>';
    const cuePreview = `<button class="secondary" data-preview-cue="correct" aria-label="Posłuchaj sygnału poprawnej odpowiedzi">${icon('sound')} Posłuchaj</button>`;
    return `<section class="panel volume-settings"><h2>Głośność</h2><p>Suwaki działają od następnego dźwięku. Przy 0% wyciszona jest tylko ta grupa.</p>${slider('speech', 'Głośność wymowy', levels.speech, speechPreview)}${slider('cues', 'Głośność efektów', levels.cues, cuePreview)}</section>`;
}
