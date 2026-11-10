import type { Module,ArticleGuidance } from '../learning/model.ts';

export interface Illustration {
    symbol?: string;
    src?: string;
    caption: string;
    scene?: boolean;
}

export interface LanguageVariant {
    text: string;
    forms?: string[];
    examples?: string[];
}

/** One meaning, not every possible sense of the same spelling. */
export interface Meaning {
    articles?: Record<string,ArticleGuidance>;
    id: string;
    variants: Record<string, LanguageVariant>;
    answers?: Record<string, string[]>;
    illustration?: Illustration;
    source: string;
    group?: string;
    rev?: number;
}

export interface Course {
    id: string;
    name: string;
    targetLanguage: string;
    explanationLanguage: string;
    textbook: { title: string | null; authors: string[] | null; edition: string | null };
    levels: string[] | null;
    moduleIds: string[];
    instructions: { translationPrompt: string; wordExplanationTemplate: string };
}

export interface MaterialLibrary { courses: Course[]; modules: Module[] }
export interface MaterialCatalog { version: 1; modules: string[]; coursesFile?: string }
