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

/** D-74: a "parasol" over grammar rules of several modules of one course. */
export interface GrammarTopic { id: string; title: string; summary?: string }

export interface Course {
    id: string;
    name: string;
    targetLanguage: string;
    explanationLanguage: string;
    textbook: { title: string | null; authors: string[] | null; edition: string | null };
    levels: string[] | null;
    moduleIds: string[];
    instructions: { translationPrompt: string; wordExplanationTemplate: string };
    /** D-74: file with the course's grammar topics; `grammarTopics` is filled in when the library is read. */
    grammarTopicsFile?: string;
    grammarTopics?: GrammarTopic[];
}

export interface MaterialLibrary { courses: Course[]; modules: Module[] }
export interface MaterialCatalog { version: 1; modules: string[]; coursesFile?: string }
