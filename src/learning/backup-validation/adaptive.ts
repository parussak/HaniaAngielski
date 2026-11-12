import {obj,integer,safeKey,identifiers} from './values.ts';
import {validItem} from './session.ts';

const stageKey=(k:string)=>/^[a-z0-9-]+\/[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(k);
export function validAdaptiveState(a:unknown){
 if(!obj(a))return false;
 if(a.sectionPlans!==undefined&&(!obj(a.sectionPlans)||!Object.entries(a.sectionPlans).every(([key,plan])=>stageKey(key)&&obj(plan)&&Array.isArray(plan.baseIds)&&identifiers(plan.baseIds)&&plan.baseIds.length===7&&Array.isArray(plan.after)&&plan.after.length===2&&plan.after.every(n=>integer(n)&&n>=2&&n<=6)&&plan.after[1]-plan.after[0]>=2)))return false;
 if(a.memory!==undefined&&(!obj(a.memory)||!Object.entries(a.memory).every(([key,entry])=>safeKey(key)&&obj(entry)&&validItem(entry.item)&&obj(entry.item)&&entry.item.key===key&&entry.item.options===undefined&&integer(entry.correct)&&entry.correct<=3)))return false;
 return true;
}
