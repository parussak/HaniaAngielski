// Stable public API. Storage, existing backups and feature imports keep using it.
export { backup,validateBackup } from './learning/backup.ts';
export * from './learning/model.ts';
export { currentStats,score } from './learning/statistics.ts';
export { eligibleModules,inputFor,isCorrect,optionsFor,questionFor,requiresChoice,resolveItem,sessionCompatible } from './learning/questions.ts';
export { makeSession,markWord,next,recordAnswer } from './learning/session.ts';
