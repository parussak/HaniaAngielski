/** Sesja lekcji z mapy i nagroda za jej ukończenie. */
import {creditStars} from '../house/progress.ts';
import {courseForModule} from './scope.ts';
import {rewardStars} from './rewards.ts';
import {lessonKey,type Journey,type Lesson} from './journey.ts';
import {lessonForProgress,unlocked} from './journey-progress.ts';
import {freshAdventure} from './adventure-state.ts';
import {inputFor,questionFor} from './questions.ts';
import {keyFor,type AnswerMode,type Item,type Module,type Progress,type Session} from './model.ts';
import {groupScenes} from './scenes.ts';
export function makeLessonSession(modules:Module[],journey:Journey,lesson:Lesson,answerMode:AnswerMode,p:Progress):Session {
  lesson=lessonForProgress(journey,lesson,p);
  if(lesson.role)throw new Error('Trening i powtórka wymagają doboru wcześniej poznanego materiału.');
  if(!unlocked(journey,lesson,p))throw new Error('Najpierw ukończ wcześniejszą lekcję.');
  const m=modules.find(m=>m.id===journey.moduleId)!;
  const items:Item[]=[...lesson.wordIds.map(id=>({key:keyFor(m,'word',id),moduleId:m.id,version:m.words.find(w=>w.id===id)?.rev??1,type:'word' as const,id,input:'text' as const})),...lesson.exerciseIds.map(id=>({key:keyFor(m,'exercise',id),moduleId:m.id,version:m.exercises.find(q=>q.id===id)?.rev??1,type:'exercise' as const,id,input:'text' as const}))];
  items.forEach((item,i)=>item.input=inputFor(questionFor(modules,item),answerMode==='mixed'?(i%2?'text':'choice'):answerMode));
  return groupScenes(modules,{fixedLength:true,id:crypto.randomUUID(),moduleId:m.id,mode:'lesson',lesson:{id:lessonKey(journey,lesson),title:lesson.title,...(lesson.edition?{edition:lesson.edition}:{})},answerMode,previous:false,startedAt:new Date().toISOString(),completedAt:null,items,index:0,phase:'question',lastCorrect:null,attempts:[],repeatKeys:[]} as Session,'end') as Session;
}
export function rewardCompletion(p:Progress,s:Session,modules:Module[]=[]){
  if(!s.completedAt || !s.items.every(i=>s.attempts.some(a=>a.key===i.key)))return 0;
  const a=p.adventure??freshAdventure();
  let reward=0;
  const saved=p.sessions.find(session=>session.id===s.id);
  if(s.lesson && !Object.hasOwn(a.completed,s.lesson.id)){a.completed[s.lesson.id]={at:s.completedAt,...(s.lesson.edition?{edition:s.lesson.edition}:{})};reward=rewardStars.firstLesson;}
  else if(s.lesson&&s.fixedLength&&saved&&!saved.lessonRewarded)reward=rewardStars.lessonReplay;
  if(s.lesson&&reward){s.lessonRewarded=true;if(saved)saved.lessonRewarded=true;}
  if(s.training?.kind==='extra'){
    const saved=p.sessions.find(session=>session.id===s.id);
    if(saved?.training?.kind==='extra'&&!saved.training.rewarded){saved.training.rewarded=true;s.training.rewarded=true;reward=rewardStars.extraTraining;}
  }
  if(reward){p.adventure=a;creditStars(p,reward,courseForModule(modules,s.moduleId));}
  return reward;
}
