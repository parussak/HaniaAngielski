// D-67: nagrody domku przypisuje treść kursu — mapa wymienia przedmioty (`rewards.decorations`),
// moduł wskazuje pokój (`houseRoom`). Katalog przedmiotów i pokoi zostaje wspólną oprawą.
import type {Module} from '../learning/model.ts';
import {courseKey} from '../learning/scope.ts';
import {journeyKey,type Journey} from '../learning/journey.ts';
import {roomFor,type Room} from './catalog.ts';

/** Przedmioty-nagrody kursu i mapa, która je odblokowuje. */
export function decorationMaps(modules:Module[],journeys:Journey[],course:string):Map<string,Journey>{
 const inCourse=new Set(modules.filter(m=>courseKey(m)===course).map(m=>m.id));
 const result=new Map<string,Journey>();
 for(const j of journeys)if(inCourse.has(j.moduleId))for(const id of j.rewards?.decorations??[])if(!result.has(id))result.set(id,j);
 return result;
}
/** Pokoje, które dają moduły kursu, w kolejności modułów. */
export function moduleRooms(modules:Module[],course:string):{room:Room;module:Module}[]{
 return modules.filter(m=>courseKey(m)===course&&m.houseRoom).map(m=>({room:roomFor(m.houseRoom!),module:m}));
}
/** Kontrola treści: w jednym kursie każdy przedmiot i każdy pokój jest nagrodą najwyżej raz. */
export function houseRewardProblems(modules:Module[],journeys:Journey[]):string[]{
 const problems:string[]=[];
 for(const course of new Set(modules.map(courseKey))){
  const seen=new Map<string,string>();
  for(const j of journeys.filter(j=>modules.some(m=>m.id===j.moduleId&&courseKey(m)===course)))for(const id of j.rewards?.decorations??[]){
   const earlier=seen.get(id);
   if(earlier)problems.push(`Przedmiot ${id} jest nagrodą dwóch map: ${earlier} i ${journeyKey(j)}.`);else seen.set(id,journeyKey(j));
  }
  const rooms=modules.filter(m=>courseKey(m)===course&&m.houseRoom).map(m=>m.houseRoom!);
  for(const room of new Set(rooms.filter((r,i)=>rooms.indexOf(r)!==i)))problems.push(`Pokój ${room} jest nagrodą kilku modułów kursu ${course}.`);
 }
 return problems;
}
