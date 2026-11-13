import {sceneCats,type CatCatalog} from '../cats.ts';
import type {Scene,Session} from '../core.ts';
import {catView} from './cat.ts';
export type SceneActor=(speaker:string,line:number,whole:boolean)=>string;
export function sceneActor(catalog:CatCatalog|null,session:Pick<Session,'id'>,scene:Scene):SceneActor{
 const cast=catalog?sceneCats(catalog,session,scene):undefined;
 return (speaker,line,whole)=>{
  const cat=cast?.get(speaker);if(!cat||!catalog)return '';
  return `<div class="scene-actor" aria-hidden="true">${catView(catalog,{cat,mood:'happy',frame:cat.happy},false,`scene-${scene.id}-${line}-${whole?'whole':'step'}`)}</div>`;
 };
}
