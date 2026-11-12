import {decorations,slots,layers,decorationLayer,canUseSlot,type Decoration} from '../house/catalog.ts';
import {slotReady,type Home} from '../house/progress.ts';
import {e} from '../ui.ts';
import {displayed} from '../house/layout.ts';

export const roomLabel=(room:string)=>room==='salon'?'W saloniku':'W kuchni';
export function ownedLocation(h:Home|undefined,id:string){
 const v=h?.purchases[id];
 return !v?'':v.position?`${roomLabel(v.room??'salon')} · siatka ${v.position.x+1}, ${v.position.y+1}`:v.slot?`${roomLabel(v.room??'salon')} · ${slots.find(s=>s.id===v.slot)?.name??v.slot}`:'W schowku';
}
export function placementControls(h:Home|undefined,item:Decoration,room:string,available:boolean,balance:number,lockedMap:string,editing=false){
 const owned=h?.purchases[item.id];
 return `<section class="panel decoration-controls" id="house-placement" tabindex="-1" aria-label="Urządzanie pokoju"><h2>${e(item.name)}</h2>${owned?`
 <p class="owned-location">${e(ownedLocation(h,item.id))}</p><p>Ta rzecz należy do tego pokoju. Jej rozmiar jest stały.</p>
 ${editing?'<p>Przeciągaj w pokoju lub użyj strzałek pod jego podglądem. Ruch zapisuje się od razu.</p>':'<button class="secondary" data-action="house-edit">Przejdź do urządzania</button>'}
 <h3>Gotowe miejsca — skróty</h3>
 <p class="house-layer-label">Warstwa: ${layers.find(l=>l.id===decorationLayer(item.id))!.name}</p>
 <div class="placement-buttons">${slots.filter(s=>canUseSlot(item.id,s.id,room)).sort((a,b)=>Number(b.layer===decorationLayer(item.id))-Number(a.layer===decorationLayer(item.id))).map(slot=>{
  const occupant=Object.entries(h!.purchases).find(([id,v])=>id!==item.id&&v.slot===slot.id&&(v.room??'salon')===room);
  const ready=slotReady(h,slot.id,room),selected=owned.slot===slot.id&&(owned.room??'salon')===room;
  const children=occupant?.[0]==='table'&&Object.values(h!.purchases).some(v=>(v.room??'salon')===room&&slots.find(s=>s.id===v.slot)?.support==='table');
  const caption=!ready?'Najpierw ustaw stolik na dywanie':occupant?`Do schowka: ${decorations.find(d=>d.id===occupant[0])?.name??occupant[0]}${children?' i drobiazgi ze stolika':''}`:selected?'Tutaj jest teraz':'Wolne miejsce';
  return `<button class="secondary ${selected?'is-selected':''}" data-action="place-decoration" data-id="${item.id}" data-slot="${slot.id}" aria-label="${slot.name}" aria-describedby="place-${slot.id}" aria-pressed="${selected}" ${ready?'':'disabled'}><span>${slot.name}</span><small id="place-${slot.id}">${e(caption)}</small></button>`;
 }).join('')}</div><button class="text-button house-hide" data-action="place-decoration" data-id="${item.id}" data-slot="" ${displayed(owned)?'':'disabled'}>Schowaj do schowka</button>
 ${item.id==='table'?'<p>Przeniesienie lub schowanie stolika z dywanu schowa też stojące na nim drobiazgi. Wszystkie pozostaną w „Moich rzeczach”.</p>':''}`:!available?`<p class="locked-decoration">Odblokujesz po ukończeniu mapy „${e(lockedMap)}”.</p>`:`<p>${balance>=item.price?'Ten przedmiot może zamieszkać u Twoich kotków.':`Do zakupu brakuje ${item.price-balance} gwiazdek w tym kursie.`}</p><button class="primary" data-action="buy-decoration" data-id="${item.id}" ${balance<item.price?'disabled':''}>Kup za ${item.price} ★</button>`}</section>`;
}
