/** Map definitions and stable keys. No storage, rewards or house dependencies. */
export interface Lesson {id:string;title:string;intro:string;wordIds:string[];exerciseIds:string[];ruleIds:string[];role?:'training'|'recall';targetCount?:number;edition?:2;update?:{edition:2;title:string;intro:string;wordIds:string[];exerciseIds:string[];ruleIds:string[]}}
export interface Stage {id:string;title:string;cat:string;illustration:string;lessons:Lesson[];adaptiveReviews?:true}
// D-67: nagrody za ukończenie mapy — przedmioty do kupienia w domku i opcjonalna odznaka.
export interface JourneyRewards {decorations?:string[];badge?:string}
export interface Journey {version:1;moduleId:string;id?:string;theme?:'space-station';title:string;rewards?:JourneyRewards;stages:Stage[]}
export interface JourneyIssue {moduleId:string;path:string}
export const journeyKey=(journey:Journey)=>journey.id?`${journey.moduleId}/${journey.id}`:journey.moduleId;
export const lessonKey=(journey:Journey,lesson:Lesson)=>`${journeyKey(journey)}/${lesson.id}`;
/** Mapy modułu deklarowane w modul.json: lista `journeyPaths` albo starsze pojedyncze `journeyPath`. */
export function journeyPaths(m:{journeyPaths?:string[];journeyPath?:string}):string[]{return m.journeyPaths??(m.journeyPath?[m.journeyPath]:[]);}
export function lessons(journey:Journey){return journey.stages.flatMap(stage=>stage.lessons.map(lesson=>({stage,lesson,key:lessonKey(journey,lesson)})));}
