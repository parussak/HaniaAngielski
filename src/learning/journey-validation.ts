/** Walidacja map modułów i wczytywanie ich z izolacją błędów. Czyta przez wstrzyknięte `read` — bez sieci. */
import {decorations,rewardRooms} from '../house/catalog.ts';
import {journeyKey,journeyPaths,type Journey,type JourneyIssue} from './journey.ts';
import {storyGroups} from './scenes.ts';
import type {Module} from './model.ts';
// D-67: mapa wymienia tylko przedmioty z katalogu oznaczone jako nagroda, bez powtórzeń.
function validRewards(r:unknown){
  if(!r||typeof r!=='object'||Array.isArray(r))return false;
  const {decorations:ids,badge,room,...rest}=r as Record<string,unknown>;
  if(Object.keys(rest).length||room!==undefined&&!rewardRooms.some(r=>r.id===room))return false;
  if(ids!==undefined&&(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length||!ids.every(id=>decorations.some(d=>d.id===id&&d.reward))))return false;
  return badge===undefined||typeof badge==='string'&&badge.trim().length>0;
}
export function validateJourney(value:unknown,m:Module):Journey {
  const j=value as Journey,fail=():never=>{throw new Error('Niepoprawna mapa modułu.');};
  if(!j || j.version!==1 || j.moduleId!==m.id || !/^[a-z0-9-]+$/.test(j.moduleId) || typeof j.title!=='string' || !Array.isArray(j.stages)||!j.stages.length)return fail();
  if(j.theme!==undefined&&j.theme!=='space-station')return fail();
  if(j.id!==undefined&&!/^[a-z0-9-]+$/.test(j.id))return fail();
  if(j.rewards!==undefined&&!validRewards(j.rewards))return fail();
  const ids=new Set<string>(),stageIds=new Set<string>();
  for(const stage of j.stages){
    if(!stage || !/^[a-z0-9-]+$/.test(stage.id) || stageIds.has(stage.id) || typeof stage.title!=='string'||!['albert','olus','felix','maja','krzywolap'].includes(stage.cat)||!/^illustrations\/[a-z0-9-]+\.(?:svg|png)$/.test(stage.illustration)||!Array.isArray(stage.lessons)||!stage.lessons.length)return fail();
    stageIds.add(stage.id);
    if(stage.adaptiveReviews!==undefined&&(stage.adaptiveReviews!==true||stage.lessons.length!==7||stage.lessons.some(l=>l.id.startsWith(`${stage.id}-recall-`))))return fail();
    for(const l of stage.lessons){
      if(!l || !/^[a-z0-9-]+$/.test(l.id)||ids.has(l.id)||typeof l.title!=='string'||typeof l.intro!=='string'||![l.wordIds,l.exerciseIds,l.ruleIds].every(Array.isArray)||l.wordIds.length+l.exerciseIds.length<(l.role==='training'?0:1)||l.wordIds.length+l.exerciseIds.length>10)return fail();
      // D-53, D-68: a lesson takes a dialogue scene or a reading whole — all of its tasks or none.
      for(const group of storyGroups(m)){const listed=group.filter(id=>l.exerciseIds.includes(id)).length;if(listed&&listed!==group.length)return fail();}
      if(l.role!==undefined&&l.role!=='training'||l.targetCount!==undefined&&(!Number.isInteger(l.targetCount)||l.targetCount<6||l.targetCount>10)||l.role==='training'&&(l.wordIds.length+l.exerciseIds.length+l.ruleIds.length>0))return fail();
      const wholeStory=l.wordIds.length===0&&storyGroups(m).some(group=>group.length===l.exerciseIds.length&&group.every(id=>l.exerciseIds.includes(id)));
      if(j.id&&l.role!=='training'&&!wholeStory&&l.wordIds.length+l.exerciseIds.length<6)return fail();
      ids.add(l.id);
      if(new Set([...l.wordIds,...l.exerciseIds]).size!==l.wordIds.length+l.exerciseIds.length || !l.wordIds.every(id=>m.words.some(w=>w.id===id))||!l.exerciseIds.every(id=>m.exercises.some(q=>q.id===id&&q.requires.every(id=>id===m.id)))||!l.ruleIds.every(id=>m.grammar.some(r=>r.id===id)))return fail();
      if(l.edition!==undefined&&l.edition!==2)return fail();
      if(l.update!==undefined){
        if(!l.update||l.update.edition!==2||l.role||'update' in l.update||'id' in l.update||'role' in l.update)return fail();
        validateJourney({...j,id:j.id??'updated',stages:[{...stage,adaptiveReviews:undefined,lessons:[{...l.update,id:l.id}]}]},m);
      }
    }
  }
  return structuredClone(j);
}
export async function readJourneys(modules:Module[],read:(path:string)=>Promise<unknown>):Promise<{journeys:Journey[];issues:JourneyIssue[]}>{
  const requests=modules.flatMap(m=>journeyPaths(m).map(path=>({m,path})));
  const results=await Promise.allSettled(requests.map(async({m,path})=>validateJourney(await read(path),m)));
  const counts=new Map<string,number>();
  for(const result of results)if(result.status==='fulfilled'){const key=journeyKey(result.value);counts.set(key,(counts.get(key)??0)+1);}
  const journeys:Journey[]=[],issues:JourneyIssue[]=[];
  results.forEach((result,index)=>{
    if(result.status==='fulfilled'&&counts.get(journeyKey(result.value))===1)journeys.push(result.value);
    else issues.push({moduleId:requests[index].m.id,path:requests[index].path});
  });
  return {journeys,issues};
}
