/** Map definitions and stable keys. No storage, rewards or house dependencies. */
export interface Lesson {id:string;title:string;intro:string;wordIds:string[];exerciseIds:string[];ruleIds:string[];role?:'training'|'recall';targetCount?:number;edition?:2;update?:{edition:2;title:string;intro:string;wordIds:string[];exerciseIds:string[];ruleIds:string[]}}
export interface Stage {id:string;title:string;cat:string;illustration:string;lessons:Lesson[];adaptiveReviews?:true}
export interface Journey {version:1;moduleId:string;id?:string;title:string;stages:Stage[]}
export interface JourneyIssue {moduleId:string;path:string}
export const journeyKey=(journey:Journey)=>journey.id?`${journey.moduleId}/${journey.id}`:journey.moduleId;
export const lessonKey=(journey:Journey,lesson:Lesson)=>`${journeyKey(journey)}/${lesson.id}`;
export function lessons(journey:Journey){return journey.stages.flatMap(stage=>stage.lessons.map(lesson=>({stage,lesson,key:lessonKey(journey,lesson)})));}
