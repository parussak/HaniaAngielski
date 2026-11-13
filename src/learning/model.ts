import type { Adventure } from '../adventure.ts';
import type { HistoryPage, HistorySummary } from '../history.ts';
import type { Illustration, Meaning } from '../materials/model.ts';
export type { Illustration, Meaning, LanguageVariant, Course, MaterialLibrary } from '../materials/model.ts';
export interface Word {
    article?: ArticleGuidance;
    illustration?: Illustration;
    id: string;
    front: string;
    back: string;
    group?: string;
    source?: string;
    answers?: string[];
    rev?: number;
}
export interface Exercise {
    article?: ArticleGuidance;
    dialogue?: {
        speaker: string;
        text: string;
    }[];
    illustration?: Illustration;
    /** D-53: this exercise is one gap of a dialogue scene. */
    scene?: { id: string; gap: number; input: 'bank' | 'text' };
    responseType?: 'choice';
    id: string;
    wordId?: string;
    kind: 'vocabulary' | 'grammar' | 'dialogue';
    prompt: string;
    answers: string[];
    options: string[];
    explanation: string;
    requires: string[];
    caseSensitive: boolean;
    source?: string;
    ruleId?: string;
    rev?: number;
}
/** D-53: the script of a dialogue scene; every gap is an ordinary exercise. */
export interface Scene {
    id: string;
    title: string;
    prompt: string;
    lines: { speaker: string; text: string }[];
    gapIds: string[];
}
export interface GrammarRule {
    id: string;
    title: string;
    explanation: string;
    examples: string[];
    source: string;
}
export interface Module {
    courseId?: string;
    languageCode?: string;
    explanationLanguageCode?: string;
    courseOrder?: number;
    instructions?: { translationPrompt: string; wordExplanationTemplate?: string };
    meanings?: Meaning[];
    journeyPaths?: string[];
    journeyPath?: string;
    level?: string;
    id: string;
    version: number;
    order: number;
    name: string;
    subtitle: string;
    language: string;
    source: string;
    label: string;
    cover: string;
    topics: string[];
    words: Word[];
    exercises: Exercise[];
    grammar: GrammarRule[];
    scenes?: Scene[];
    basicFlashcardIds?: string[];
}
export type Mode = 'flashcards' | 'flashcards-basic' | 'quiz' | 'grammar' | 'dialogue' | 'review' | 'lesson' | 'training';
export const isFlashcardMode = (mode: Mode) => mode === 'flashcards' || mode === 'flashcards-basic';
export type AnswerMode = 'choice' | 'text' | 'mixed';
export interface Item {
    gapGroup?: string;
    pairGroup?: string;
    sceneGroup?: string;
    /** D-58: shown as a listening task when the device can speak; otherwise in its ordinary form. */
    listen?: true;
    presentation?: 'bank';
    options?: string[];
    key: string;
    moduleId: string;
    version: number;
    type: 'word' | 'exercise';
    id: string;
    input: 'choice' | 'text';
}
export interface Attempt {
    lastAnswer?: string;
    key: string;
    first: boolean;
    answer: string;
    corrections: number;
    corrected: boolean;
}
export function plainItem(item:Item):Item{const {pairGroup,gapGroup,sceneGroup,listen,presentation,options,...plain}=item;return plain;}
export interface Session {
    boardSummary?: true;
    gapSelection?: string;
    gapPlacements?: Record<string,string>;
    legendary?: true;
    pairSelection?: string;
    draftAnswer?: string;
    retentionCounted?:true;
    recall?:{stageId:string};
    ritual?:'opening'|'finale';
    fixedLength?: true;
    lessonRewarded?: true;
    scope?: { kind: 'course'; courseId: string };
    training?: { kind: 'map' | 'extra'; rewarded?: boolean };
    stageReview?: {
        id: string;
        title: string;
        round: number;
    };
    lesson?: {
        edition?: 2;
        id: string;
        title: string;
    };
    id: string;
    moduleId: string;
    mode: Mode;
    answerMode: AnswerMode;
    previous: boolean;
    startedAt: string;
    completedAt: string | null;
    items: Item[];
    index: number;
    phase: 'question' | 'revealed' | 'feedback' | 'retry';
    lastCorrect: boolean | null;
    attempts: Attempt[];
    repeatKeys: string[];
}
export interface ArticleGuidance {expected:'a'|'an'|null;explanation:string}
export interface Progress {
    encountered?: string[];
    adventure?: Adventure;
    history?: HistorySummary;
    version: 1;
    sessions: Session[];
    active: Session | null;
    words: Record<string, 'known' | 'review'>;
    difficult: string[];
}
export interface Backup {
    archives?: HistoryPage[];
    app: 'hania-language';
    version: 1;
    exportedAt: string;
    progress: Progress;
}
export const emptyProgress = (): Progress => ({ version: 1, sessions: [], active: null, words: {}, difficult: [] });
export const revisionFor = (module: Module, type: Item['type'], id: string) => (type === 'word' ? module.words.find(w => w.id === id) : module.exercises.find(q => q.id === id))?.rev ?? 1;
export const keyFor = (module: Module, type: Item['type'], id: string) => `${module.id}@${revisionFor(module, type, id)}:${type}:${id}`;
