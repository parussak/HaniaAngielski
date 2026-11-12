import type { Mode } from './core.ts';
export const labels: Record<Mode, string> = { 'flashcards-basic': 'Fiszki podstawa', flashcards: 'Fiszki', quiz: 'Quiz słownictwa', grammar: 'Gramatyka', dialogue: 'Rozmówki', review: 'Kocia rozgrzewka', lesson: 'Kocia lekcja', training: 'Kocia rozgrzewka' };
export const lessonTitle=(lesson:{role?:string;title:string})=>lesson.role==='training'?'Kocia rozgrzewka':lesson.title;
