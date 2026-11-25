import type { Exercise, Item } from '../learning/model.ts';

export function splitExercisePrompt(text: string) {
    const parts = text.trim().match(/^([\s\S]+?)\r?\n[ \t]*\r?\n([\s\S]+)$/);
    if (!parts) return;
    return { instruction: parts[1].trim(), sentence: parts[2].trim() };
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
