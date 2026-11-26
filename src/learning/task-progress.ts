// D-81: które zadania trwającej sesji są ukończone. Wynika z `items`, `index` i `attempts`, więc nic nie zapisujemy.
import {solved} from './boards.ts';
import type {Item,Session} from './model.ts';

/** Podgląd to wyłącznie stan ekranu: która sesja i które zadanie (od 0). */
export interface TaskPreview {sessionId:string;position:number}

const group=(item:Item)=>item.sceneGroup??item.pairGroup??item.gapGroup;

/**
 * Ukończone to zadanie z odpowiedzią, od którego sesja przeszła dalej — także z błędem.
 * Poprawka w scenie lub na planszy cofa `index`; rozwiązane zadania tej grupy zostają ukończone.
 * Zadanie na ekranie (z informacją zwrotną lub poprawką) jeszcze ukończone nie jest.
 */
export function completedTasks(s:Session):Set<number>{
 const current=s.items[s.index],currentGroup=current&&group(current);
 return new Set(s.items.flatMap((item,position)=>{
  if(position===s.index||!s.attempts.some(a=>a.key===item.key))return [];
  const passed=position<s.index||!!currentGroup&&group(item)===currentGroup&&solved(s,item.key);
  return passed?[position]:[];
 }));
}

/** Zadanie otwarte w podglądzie albo `undefined`, gdy podgląd nie pasuje do tej sesji. */
export function previewedTask(s:Session,preview?:TaskPreview){
 return preview?.sessionId===s.id&&completedTasks(s).has(preview.position)?preview.position:undefined;
}
