import {mapRoom} from './rewards.ts';
import type {Progress,Module} from '../learning/model.ts';
import {courseKey} from '../learning/scope.ts';
export {courseForModule} from '../learning/scope.ts';
import {lessons,type Journey,type JourneyIssue} from '../learning/journey.ts';
import {plannedJourney} from '../learning/section-plan.ts';
import {decorations,legacyCourse,slots,canUseSlot} from './catalog.ts';
import {placementError,itemRoom,supportingItem,boxFor,displayed,type Position} from './layout.ts';
export interface Home {
 earned:number;
 purchases:Record<string,{cost:number;slot:string|null;room?:string;position?:Position}>;
 rooms?:string[];
 unlockedItems?:string[];
}
export const freshHome=():Home=>({earned:0,purchases:{}});
// The existing English ledger stays in place. Old imports need no destructive
// transfer or migration marker; other courses never read or spend this ledger.
export function homeFor(p:Progress,course=legacyCourse):Home|undefined {
 const homes=p.adventure?.courseHomes;
 return course===legacyCourse?p.adventure:homes&&Object.hasOwn(homes,course)?homes[course]:undefined;
}
export function ensureHome(p:Progress,course=legacyCourse):Home {
 p.adventure??={version:1,earned:0,purchases:{},completed:{}};
 if(course===legacyCourse)return p.adventure;
 p.adventure.courseHomes??={};
 if(!Object.hasOwn(p.adventure.courseHomes,course))p.adventure.courseHomes[course]=freshHome();
 return p.adventure.courseHomes[course];
}
export function stars(p:Progress,course=legacyCourse){const h=homeFor(p,course);return h?h.earned-Object.values(h.purchases).reduce((n,v)=>n+v.cost,0):0;}
export function creditStars(p:Progress,amount:number,course=legacyCourse){ensureHome(p,course).earned+=amount;}
export function roomAvailable(p:Progress,course:string,room:string){return room==='salon'||!!homeFor(p,course)?.rooms?.includes(room);}
export function itemAvailable(p:Progress,course:string,id:string){const d=decorations.find(d=>d.id===id);return !!d&&(!d.reward||!!homeFor(p,course)?.unlockedItems?.includes(id));}
export function settleHouseUnlocks(p:Progress,modules:Module[],journeys:Journey[],_issues:JourneyIssue[]=[]){
 const unlocked:string[]=[];
 for(const j of journeys){
  const module=modules.find(m=>m.id===j.moduleId);
  if(!module)continue;
  const course=courseKey(module),room=mapRoom(j),items=j.rewards?.decorations??[];
  const complete=lessons(plannedJourney(j,p)).every(l=>p.adventure?.completed[l.key]);
  // Starsze wydania zapisywały wyposażenie dopiero po ukończeniu tej mapy.
  const previousReward=items.some(id=>homeFor(p,course)?.unlockedItems?.includes(id));
  if(!complete&&!previousReward)continue;
  const h=ensureHome(p,course);
  if(!roomAvailable(p,course,room.id)){
   (h.rooms??=[]).push(room.id);
   unlocked.push(room.id);
  }
  if(complete)for(const id of items)if(!itemAvailable(p,course,id))(h.unlockedItems??=[]).push(id);
 }
 return unlocked;
}
export function purchase(p:Progress,id:string,course=legacyCourse,room='salon'){
 const d=decorations.find(d=>d.id===id);if(!d)throw new Error('Nieznana dekoracja.');
 if(!itemAvailable(p,course,id)||!roomAvailable(p,course,room)||d.rooms[0]!==room||homeFor(p,course)?.purchases[id]||stars(p,course)<d.price)return false;
 const h=ensureHome(p,course),occupied=Object.values(h.purchases).some(v=>(v.room??'salon')===room&&v.slot===d.slot);
 h.purchases[id]={cost:d.price,slot:occupied?null:d.slot,...(room==='salon'?{}:{room})};return true;
}
export function slotReady(h:Home|undefined,slot:string,room:string){
 const support=slots.find(s=>s.id===slot)?.support;
 if(!support)return true;
 const table=h?.purchases[support];
 return !!table&&itemRoom(h,support)===room&&(support==='picnic-table'?displayed(table):table.slot==='rug');
}
export function place(p:Progress,id:string,slot:string|null,course=legacyCourse,room='salon'){
 const h=homeFor(p,course),item=h?.purchases[id],d=decorations.find(d=>d.id===id);
 if(!h||!item||!d||!roomAvailable(p,course,room)||itemRoom(h,id)!==room||(slot!==null&&(!canUseSlot(id,slot,room)||!slotReady(h,slot,room))))return false;
 const other=Object.entries(h.purchases).find(([key,v])=>key!==id&&slot!==null&&(v.room??'salon')===room&&v.slot===slot);
 const children=Object.entries(h.purchases).filter(([key,v])=>{
  if((v.room??'salon')!==room)return false;
  const support=v.position?supportingItem(h,key,v.position,room):slots.find(s=>s.id===v.slot)?.support;
  return !!support&&(support===id&&(item.slot!==slot||!!item.position)||support===other?.[0]);
 });
 if(other){other[1].slot=null;delete other[1].position;}
 delete item.position;
 item.slot=slot;if(room==='salon')delete item.room;else item.room=room;
 for(const [,child] of children){child.slot=null;delete child.position;}
 // Moving the table never leaves objects floating above an empty floor.
 for(const v of Object.values(h.purchases))if(v.slot&&!slotReady(h,v.slot,v.room??'salon'))v.slot=null;
 return true;
}
export function moveOnGrid(p:Progress,id:string,position:Position,course=legacyCourse,room='salon'){
 const h=homeFor(p,course);
 if(!roomAvailable(p,course,room)||placementError(h,id,position,room))return false;
 const old=boxFor(h,id,room),changed=old.x!==position.x||old.y!==position.y;
 const children=Object.entries(h!.purchases).filter(([key,v])=>changed&&v.position&&supportingItem(h,key,v.position,room)===id||v.slot&&slots.find(s=>s.id===v.slot)?.support===id&&(v.room??'salon')===room);
 const item=h!.purchases[id];item.slot=null;item.position={...position};
 for(const [,child] of children){child.slot=null;delete child.position;}
 return true;
}
