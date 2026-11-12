import {journeyForProgress,journeyKey,lessonKey,lessons,orderedJourneys,type Journey,type Lesson} from '../adventure.ts';
import {keyFor,type Module,type Progress,type Session,type AnswerMode} from './model.ts';
import {inputFor,questionFor,shuffle} from './questions.ts';
import {sameCourse,compareModules} from './scope.ts';
import {errorItems,memoryFor} from './retention.ts';
import {mapTrainingPool,practicedItems,selectTrainingItems} from './training.ts';

export function earlierSectionKeys(modules:Module[],journeys:Journey[],j:Journey,l:Lesson,p:Progress){
 const m=modules.find(m=>m.id===j.moduleId);if(!m)return new Set<string>();
 if(!journeys.some(source=>journeyKey(source)===journeyKey(j)))return new Set<string>();
 const allowed=new Set<string>();
 for(const source of orderedJourneys(modules.filter(v=>sameCourse(v,m)),journeys)){
  const mod=modules.find(v=>v.id===source.moduleId)!;
  for(const stage of journeyForProgress(source,p).stages){
   if(journeyKey(source)===journeyKey(j)&&stage.lessons.some(v=>v.id===l.id))return allowed;
   for(const prior of stage.lessons){for(const id of prior.wordIds)allowed.add(keyFor(mod,'word',id));for(const id of prior.exerciseIds)allowed.add(keyFor(mod,'exercise',id));}
  }
 }
 return allowed;
}
export function makeRecallSession(modules:Module[],journeys:Journey[],j:Journey,l:Lesson,p:Progress):Session|null{
 if(l.role!=='recall')return null;
 const stage=j.stages.find(s=>s.lessons.some(v=>v.id===l.id));if(!stage)return null;
 const allowed=earlierSectionKeys(modules,journeys,j,l,p);
 const errors=shuffle(errorItems(modules,p).filter(i=>allowed.has(i.key))).sort((a,b)=>(memoryFor(p,a.key)?.correct??0)-(memoryFor(p,b.key)?.correct??0));
 const items=(errors.length?errors:selectTrainingItems(mapTrainingPool(modules,journeys,j,p,l),5)).slice(0,5);
 if(!items.length)return null;
 items.forEach(item=>item.input=inputFor(questionFor(modules,item),'text','review'));
 return {fixedLength:true,id:crypto.randomUUID(),moduleId:j.moduleId,mode:'lesson',lesson:{id:lessonKey(j,l),title:'Kocia powtórka'},recall:{stageId:`${journeyKey(j)}/${stage.id}`},answerMode:'text',previous:true,items,index:0,phase:'question',startedAt:new Date().toISOString(),completedAt:null,lastCorrect:null,attempts:[],repeatKeys:[]};
}
export function moduleFinished(modules:Module[],journeys:Journey[],m:Module,p:Progress){
 const maps=journeys.filter(j=>j.moduleId===m.id),expected=m.journeyPaths?.length??(m.journeyPath?1:maps.length);
 return maps.length>0&&maps.length===expected&&maps.every(j=>lessons(journeyForProgress(j,p)).every(l=>p.adventure?.completed[l.key]));
}
export function makeRitualSession(modules:Module[],journeys:Journey[],m:Module,p:Progress,kind:'opening'|'finale',answerMode:AnswerMode):Session|null{
 if(kind==='finale'&&!moduleFinished(modules,journeys,m,p))return null;
 const pool=practicedItems(modules,m,p).filter(v=>kind==='finale'?v.item.moduleId===m.id:modules.some(source=>source.id===v.item.moduleId&&sameCourse(source,m)&&compareModules(source,m)<0));
 const items=selectTrainingItems(pool,kind==='opening'?5:8);if(!items.length)return null;
 items.forEach((item,i)=>item.input=inputFor(questionFor(modules,item),answerMode==='mixed'?(i%2?'text':'choice'):answerMode));
 return {fixedLength:true,id:crypto.randomUUID(),moduleId:m.id,mode:'training',training:{kind:'extra'},ritual:kind,answerMode,previous:true,items,index:0,phase:'question',startedAt:new Date().toISOString(),completedAt:null,lastCorrect:null,attempts:[],repeatKeys:[]};
}
