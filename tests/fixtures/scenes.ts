import {validateModules} from '../../src/content-validation.ts';
import {compileScene} from '../../src/learning/scenes.ts';
import type {Journey} from '../../src/adventure.ts';
import {engineModule} from './engine.ts';

/** A synthetic scene in the authored format: four gaps, bank and typing interleaved. */
export const sceneEntry=(id='talk',moduleId='scene-unit')=>({id,kind:'dialogue',title:`Rozmowa ${id}`,prompt:'Uzupełnij rozmowę.',
 dialogue:[{speaker:'Ala',text:`Alpha ___ ${id}?`},{speaker:'Olek',text:'Beta ___ and gamma ___.'},{speaker:'Ala',text:'No gap here.'},{speaker:'Olek',text:'Delta ___!'}],
 gaps:[
  {id:'one',input:'bank',answers:['uno'],options:['uno','nope','never'],explanation:'Wyjaśnienie pierwszej luki.'},
  {id:'two',input:'text',answers:['duo'],options:['duo','nope'],explanation:'Wyjaśnienie drugiej luki.'},
  {id:'three',input:'bank',answers:['trio'],options:['trio','nope'],explanation:'Wyjaśnienie trzeciej luki.'},
  {id:'four',input:'text',answers:['quattro','4'],options:['quattro','nope'],explanation:'Wyjaśnienie czwartej luki.'}],
 requires:[moduleId],caseSensitive:false,source:'Dane syntetyczne — adaptacja testowa.'});

/** The engine module with two scenes and one ordinary single-gap dialogue. Any course id works. */
export function sceneModule(id='scene-unit',courseId='scene-course',entries:unknown[]=[sceneEntry('talk',id),sceneEntry('shop',id)]){
 const base=engineModule(id,courseId),compiled=entries.map(compileScene);
 const single={id:'single-talk',kind:'dialogue' as const,prompt:'Uzupełnij jedną lukę.',dialogue:[{speaker:'Ala',text:'Solo ___.'},{speaker:'Olek',text:'Fine.'}],answers:['mono'],options:['mono','nope'],explanation:'Wyjaśnienie.',requires:[id],caseSensitive:false,source:'Dane syntetyczne'};
 return validateModules([{...base,exercises:[...base.exercises,single,...compiled.flatMap(c=>c.exercises)],scenes:compiled.map(c=>c.scene)}])[0];
}
/** One stage: a word lesson and a lesson with two words, one dialogue and the scene. */
export const sceneJourney=(moduleId='scene-unit'):Journey=>({version:1,moduleId,title:'Mapa scen',stages:[{id:'one',title:'Etap',cat:'albert',illustration:'illustrations/test.svg',lessons:[
 {id:'words',title:'Słowa',intro:'',wordIds:['word-0','word-1','word-2','word-3'],exerciseIds:[],ruleIds:[]},
 {id:'talk',title:'Rozmowa',intro:'',wordIds:['word-4','word-5'],exerciseIds:['single-talk','talk--one','talk--two','talk--three','talk--four'],ruleIds:[]},
]}]});
