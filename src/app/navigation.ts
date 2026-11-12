import type {AppState,Screen} from './state.ts';
import {lessons,journeyForProgress,journeyKey} from '../adventure.ts';
const screens:Screen[]=['home','setup','study','progress','backup','account','summary','map','lesson-intro','house','journeys','module-list','courses','course-practice','warmup'];
let replacing=false,pendingPop=false;
let restoredUi:{openStages?:string[];scroll?:number}|undefined;
function snapshot(s:AppState){return {app:'male-kroki',owner:s.user?.uid??'guest',screen:s.screen,course:s.selectedCourseId,module:s.selected?.id,journey:s.selectedJourneyKey,lesson:s.introLessonId,session:s.screen==='summary'?(s.lastSession??s.progress.sessions.at(-1))?.id:s.screen==='study'?s.progress.active?.id:undefined,room:s.chosenRoom,reward:s.lastReward,bonus:s.lastStageReward};}
const route=(v:ReturnType<typeof snapshot>)=>JSON.stringify([v.owner,v.screen,v.course,v.module,v.journey,v.lesson,v.session,v.room]);
export function restoreNavigation(s:AppState,value:unknown=history.state){
 replacing=true;
 restoredUi=undefined;
 const v=value as ReturnType<typeof snapshot>|null;
 if(!v||v.app!=='male-kroki'||v.owner!==(s.user?.uid??'guest')||!screens.includes(v.screen)){s.screen='home';return;}
 if(v.course&&!s.courses.some(c=>c.id===v.course)){s.screen='home';return;}
 const ui=value as {openStages?:unknown;scroll?:unknown};restoredUi={...(Array.isArray(ui.openStages)&&ui.openStages.every(id=>typeof id==='string'&&/^[a-z0-9-]+$/.test(id))?{openStages:ui.openStages}:{}),...(typeof ui.scroll==='number'&&Number.isFinite(ui.scroll)&&ui.scroll>=0&&ui.scroll<=1e6?{scroll:ui.scroll}:{})};
 s.selectedCourseId=v.course;
 s.selected=s.modules.find(m=>m.id===v.module&&(!v.course||m.courseId===v.course))??s.modules.find(m=>m.courseId===v.course)??s.modules[0];
 s.selectedJourneyKey=typeof v.journey==='string'?v.journey:'';s.introLessonId=typeof v.lesson==='string'?v.lesson:'';
 if(['salon','kitchen'].includes(v.room))s.chosenRoom=v.room;
 s.screen=v.screen;
 if(s.screen==='study'&&s.progress.active?.id!==v.session){const completed=s.progress.sessions.find(x=>x.id===v.session);if(completed){s.lastSession=completed;s.screen='summary';}else s.screen='home';}
 if(s.screen==='summary'){const completed=s.progress.sessions.find(x=>x.id===v.session);if(!completed){s.screen='home';return;}s.lastSession=completed;s.lastReward=Number.isInteger(v.reward)&&v.reward>=0&&v.reward<=1000?v.reward:0;s.lastStageReward=Number.isInteger(v.bonus)&&v.bonus>=0&&v.bonus<=1000?v.bonus:0;}
 if(s.screen==='lesson-intro'&&!s.journeys.some(j=>j.moduleId===s.selected.id&&(!s.selectedJourneyKey||journeyKey(j)===s.selectedJourneyKey)&&lessons(journeyForProgress(j,s.progress)).some(e=>e.lesson.id===s.introLessonId)))s.screen='map';
}
export function saveNavigation(s:AppState){
 if(!s.ready||pendingPop)return;
 const next=snapshot(s),previous=history.state as ReturnType<typeof snapshot>|null;
 const url=next.screen==='home'?location.pathname+location.search:`#${new URLSearchParams({screen:next.screen,...(next.module?{module:next.module}:{}),...(next.journey?{map:next.journey}:{}),...(next.lesson?{lesson:next.lesson}:{})})}`;
 const same=previous?.app==='male-kroki'&&route(previous)===route(next),stored=same?{...previous,...next}:next;
 if(replacing||!previous||previous.app!=='male-kroki'||previous.owner!==next.owner||same)history.replaceState(stored,'',url);
 else history.pushState(next,'',url);
 replacing=false;
}
export function bindNavigation(s:AppState,run:(task:()=>Promise<void>)=>Promise<void>){
 window.addEventListener('popstate',event=>{if(!s.ready)return;pendingPop=true;const target=event.state;const apply=()=>{if(s.busy){setTimeout(apply,30);return;}void run(async()=>{pendingPop=false;restoreNavigation(s,target);});};apply();});
 document.addEventListener('toggle',event=>{if(s.screen==='map'&&(event.target as Element).matches('.journey-stage')&&history.state?.app==='male-kroki')history.replaceState({...history.state,openStages:Array.from(document.querySelectorAll<HTMLDetailsElement>('.journey-stage[open]')).map(el=>el.dataset.stageId!)},'');},true);
 let frame=0;window.addEventListener('scroll',()=>{if(frame||!s.ready)return;frame=requestAnimationFrame(()=>{frame=0;if(history.state?.app==='male-kroki')history.replaceState({...history.state,scroll:window.scrollY},'');});},{passive:true});
}
export function restoreViewContext(root:HTMLElement){
 const ui=restoredUi;if(!ui)return;restoredUi=undefined;
 if(ui.openStages)root.querySelectorAll<HTMLDetailsElement>('.journey-stage').forEach(el=>el.open=ui.openStages!.includes(el.dataset.stageId!));
 if(ui.scroll!==undefined)requestAnimationFrame(()=>window.scrollTo(0,ui.scroll!));
}
