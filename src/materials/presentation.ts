import type { Module, Word } from '../learning/model.ts';

export function wordExplanation(module: Pick<Module, 'instructions'>, word: Pick<Word, 'front' | 'back'>) {
    const template = module.instructions?.wordExplanationTemplate ?? '„{answer}” oznacza „{cue}”.';
    return template.replace(/\{(answer|cue)\}/g, (_, key: string) => key === 'answer' ? word.back : word.front);
}
