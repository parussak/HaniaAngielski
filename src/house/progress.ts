import type {Progress,Module} from '../learning/model.ts';
import {courseKey} from '../learning/scope.ts';
export {courseForModule} from '../learning/scope.ts';
import {journeyKey,lessons,type Journey,type JourneyIssue} from '../learning/journey.ts';
import {plannedJourney} from '../learning/section-plan.ts';
import {decorations,legacyCourse,roomRewards,slots,canUseSlot} from './catalog.ts';
import {placementError,itemRoom,supportingItem,boxFor,type Position} from './layout.ts';
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
export function itemAvailable(p:Progress,course:string,id:string){const d=decorations.find(d=>d.id===id);return !!d&&(!d.map||!!homeFor(p,course)?.unlockedItems?.includes(id));}
export function settleHouseUnlocks(p:Progress,modules:Module[],journeys:Journey[],issues:JourneyIssue[]=[]){
 const unlocked:string[]=[];
 const complete=(key:string)=>{const j=journeys.find(j=>journeyKey(j)===key);return !!j&&lessons(plannedJourney(j,p)).every(l=>p.adventure?.completed[l.key]);};
 for(const m of modules){
  const course=courseKey(m);
  const maps=journeys.filter(j=>j.moduleId===m.id);
  for(const d of decorations.filter(d=>d.map&&maps.some(j=>journeyKey(j)===d.map))){
   if(complete(d.map!)&&!itemAvailable(p,course,d.id)){const h=ensureHome(p,course);(h.unlockedItems??=[]).push(d.id);}
  }
  for(const r of roomRewards.filter(r=>r.moduleId===m.id)){
   // A partial map catalog must never falsely award a completed module.
   if(!issues.some(i=>i.moduleId===m.id)&&maps.length>=r.maps.length&&r.maps.every(complete)&&maps.every(j=>complete(journeyKey(j)))&&!roomAvailable(p,course,r.id)){
    const h=ensureHome(p,course);(h.rooms??=[]).push(r.id);unlocked.push(r.name);
   }
  }
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
 return !support||!!h?.purchases[support]&&h.purchases[support].slot==='rug'&&(h.purchases[support].room??'salon')===room;
}
export function place(p:Progress,id:string,slot:string|null,course=legacyCourse,room='salon'){
 const h=homeFor(p,course),item=h?.purchases[id],d=decorations.find(d=>d.id===id);
 if(!h||!item||!d||!roomAvailable(p,course,room)||itemRoom(h,id)!==room||(slot!==null&&(!canUseSlot(id,slot,room)||!slotReady(h,slot,room))))return false;
 const other=Object.entries(h.purchases).find(([key,v])=>key!==id&&slot!==null&&(v.room??'salon')===room&&v.slot===slot);
 const children=Object.entries(h.purchases).filter(([key,v])=>v.position&&(supportingItem(h,key,v.position,room)===id||!!other&&supportingItem(h,key,v.position,room)===other[0]));
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
