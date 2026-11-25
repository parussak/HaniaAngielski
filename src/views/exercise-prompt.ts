import type { Exercise, Item } from '../learning/model.ts';
import { e } from '../ui.ts';

export function splitExercisePrompt(text: string) {
    const parts = text.trim().match(/^([\s\S]+?)\r?\n[ \t]*\r?\n([\s\S]+)$/);
    if (!parts) return;
    return { instruction: parts[1].trim(), sentence: parts[2].trim() };
}

function legacyWrittenGapPrompt(text: string) {
    const parts = text.trim().match(/^((?:Uzupełnij|Wpisz|Wybierz)\b[^:]*:)\s+([^:]+)$/u);
    if (!parts) return;
    const sentence = parts[2].trim();
    if (!sentence.includes('___') || !/\p{L}/u.test(sentence) || parts[1].includes('___')) return;
    return { instruction: parts[1], sentence };
}

export function exercisePromptView(text: string, writtenGap: boolean) {
    const parts = splitExercisePrompt(text) ?? (writtenGap ? legacyWrittenGapPrompt(text) : undefined);
    const heading = `<h2 class="question">${e(parts?.sentence ?? text)}</h2>`;
    if (!parts && !writtenGap) return heading;
    const instruction = parts ? `<p class="exercise-instruction">${e(parts.instruction)}</p>` : '';
    return `<div class="exercise-prompt${writtenGap ? ' written-gap-prompt' : ''}">${instruction}${heading}</div>`;
}

export function bankExercisePrompt(question: Exercise, item: Pick<Item, 'presentation' | 'gapGroup'>) {
    if (item.presentation !== 'bank' || item.gapGroup || question.kind !== 'grammar' || question.dialogue) return;
    const parts = splitExercisePrompt(question.prompt);
    if (parts) return parts.sentence.includes('___') ? parts : undefined;

    // Older choice tasks use this fixed prefix without a blank line.
    const legacy = question.prompt.match(/^(Wybierz(?: słowo)?:)[ \t]+(.+)$/);
    if (legacy?.[2].includes('___')) return { instruction: legacy[1], sentence: legacy[2] };
}

export function bankSentenceLines(text: string, language?: string) {
    if (typeof Intl.Segmenter !== 'function') return [text];
    const sentences = new Intl.Segmenter(language, { granularity: 'sentence' }).segment(text);
    return Array.from(sentences, ({ segment }) => segment.trim()).filter(Boolean);
}
