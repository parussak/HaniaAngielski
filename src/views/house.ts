import type {Progress,Module} from '../learning/model.ts';
import {lessons, journeyKey, type Journey, type JourneyIssue} from '../learning/journey.ts';
import {homeFor,stars,roomAvailable,itemAvailable,settleHouseUnlocks} from '../house/progress.ts';
import {decorations,roomFor,type Room,type Decoration} from '../house/catalog.ts';
import {decorationMaps,mapRoom} from '../house/rewards.ts';
import {placementControls,ownedLocation} from './house-placement.ts';
import {houseRoom} from './house-room.ts';
import {itemRoom} from '../house/layout.ts';
import {courseKey} from '../learning/scope.ts';
import { act, e } from '../ui.ts';
const asset=(file:string)=>e(new URL(`game/${file}`,document.baseURI).href);
export function houseView(progress:Progress,course:string,chosenRoom:string,selected:string,cat:(id:string)=>string,modules:Module[],journeys:Journey[],issues:JourneyIssue[],tab:'shop'|'storage'='shop',editing=false,overview=true){
 // Project old completed maps immediately, including a freshly imported backup.
 // Persistence uses the same settlement in prepareProgress; rendering never mutates it.
 const p=structuredClone(progress);settleHouseUnlocks(p,modules,journeys,issues);
 const h=homeFor(p,course),room=roomAvailable(p,course,chosenRoom)?chosenRoom:'salon',balance=stars(p,course);
 // D-67: which items and rooms are rewards comes from this course's content files.
 const maps=modules.filter(m=>courseKey(m)===course).flatMap(m=>journeys.filter(j=>j.moduleId===m.id));
 const rewardMaps=decorationMaps(modules,journeys,course);
 const heading=`<div class="journey-top"><button class="back" ${act(overview?'journeys':'house')}>← ${overview?'Twoje mapy':'Cały domek'}</button><span class="star-wallet" aria-label="${balance} gwiazdek">${balance} <span aria-hidden="true">★</span></span></div>`;
 const rooms=maps.map(j=>({room:mapRoom(j),map:j}));
 const roomInfo=rooms.find(r=>r.room.id===room)?.room??roomFor(room);
 if(overview){
  const open=(r:Room)=>`<button class="house-cell room-open" ${act('select-room')} data-id="${e(r.id)}"><img src="${asset(r.image)}" alt=""><strong>${e(r.name)}</strong></button>`;
  const tiles=rooms.map(({room:r,map})=>roomAvailable(p,course,r.id)?open(r):`<article class="house-cell room-locked"><span aria-hidden="true">🔒</span><p>Ukończ mapę „${e(map.title)}”, żeby odkryć ten pokój.</p><a href="#screen=map&amp;module=${encodeURIComponent(map.moduleId)}&amp;map=${encodeURIComponent(journeyKey(map))}" class="room-map-link" ${act('map')} data-id="${e(map.moduleId)}" data-journey="${e(journeyKey(map))}">Przejdź do mapy „${e(map.title)}” →</a></article>`);
  // Dawny pokój pozostaje dostępny także przy chwilowo niedostępnej mapie.
  const legacy=(h?.rooms??[]).filter(id=>!rooms.some(r=>r.room.id===id)&&roomFor(id).id===id);
  return heading+`<h1>Koci domek</h1><div class="house-cutaway"><div class="house-roof" aria-hidden="true"></div><div class="house-storeys">${open(roomFor('salon'))}${tiles.join('')}${legacy.map(id=>open(roomFor(id))).join('')}</div></div>`;
 }
 // Unlocked items stay offered even if the content no longer lists them.
 const offered=(d:Decoration)=>!d.reward||rewardMaps.has(d.id)||!!h?.unlockedItems?.includes(d.id);
 const mapTitle=(id:string)=>rewardMaps.get(id)?.title??'';
 const visible=decorations.filter(d=>itemRoom(h,d.id)===room&&offered(d));
 const collection=decorations.filter(d=>!!h?.purchases[d.id]);
 const listed=tab==='storage'?collection:visible;
 const item=listed.find(d=>d.id===selected)??listed[0]??visible[0];
 const available=item&&itemAvailable(p,course,item.id),roomName=roomInfo.name;
 const compatible=decorations.filter(d=>d.reward&&offered(d)&&itemRoom(h,d.id)!==room&&itemAvailable(p,course,d.id));
 const badges=journeys.filter(j=>j.rewards?.badge&&modules.some(m=>m.id===j.moduleId&&courseKey(m)===course)&&lessons(j).every(l=>p.adventure?.completed[l.key]));
 return heading+`<h1>${e(roomName)}</h1>${houseRoom(h,room,roomName,new URL(`game/${roomInfo.image}`,document.baseURI).href,item?.id??'',editing,cat)}
 ${badges.map(j=>`<div class="module-award">★ ${e(j.rewards!.badge!)} · mapa „${e(j.title)}” ukończona!</div>`).join('')}
 <div class="house-tabs" role="group" aria-label="Wyposażenie i zakupy"><button class="secondary" ${act('house-tab')} data-tab="storage" aria-pressed="${tab==='storage'}">Moje rzeczy (${collection.length})</button><button class="secondary" ${act('house-tab')} data-tab="shop" aria-pressed="${tab==='shop'}">Sklep</button></div>
 <div class="house-wardrobe ${tab==='storage'?'show-storage':''}">
 ${listed.length&&itemRoom(h,item.id)===room?placementControls(h,item,room,available,balance,mapTitle(item.id),editing):listed.length?'<p>Ten przedmiot pasuje do innego pokoju. Wybierz go poniżej, aby przejść do właściwego pomieszczenia.</p>':''}
 <section class="panel house-shop"><h2>${tab==='storage'?'Moje rzeczy':'Wybierz dekorację'}</h2><p>${tab==='storage'?'Wszystkie Twoje zakupy w tym kursie. Dotknij przedmiotu, aby go ustawić lub schować.':'Dotknij dekoracji, aby zobaczyć cenę albo wybrać dla niej miejsce.'}</p>${!listed.length?'<p>Schowek jest jeszcze pusty. Pierwsze wyposażenie znajdziesz w sklepie.</p>':''}<div class="decoration-grid">${listed.map(d=>`<button class="decoration-card ${d.id===item.id?'is-selected':''}" ${act('select-decoration')} data-id="${d.id}" aria-pressed="${d.id===item.id}"><img src="${asset(d.id+'.svg')}" alt="" width="88" height="70"><strong>${e(d.name)}</strong><span>${h?.purchases[d.id]?e(ownedLocation(h,d.id)):itemAvailable(p,course,d.id)?`${d.price} ★`:`Ukończ mapę: ${e(mapTitle(d.id))}`}</span></button>`).join('')}</div></section></div>
 ${compatible.length?`<section class="panel"><h2>Wyposażenie do innych pokoi</h2>${compatible.map(d=>`<p>${e(d.name)} · ${d.price} ★ · wybierz ${e(roomFor(itemRoom(h,d.id)).choose)}, aby kupić lub ustawić.</p>`).join('')}</section>`:''}
 <button class="primary" ${act('journeys')}>Wróć po kolejne małe kroki →</button><p class="muted">Zakupy są za gwiazdki z nauki. Nie ma płatności ani kar za przerwę. Każdy kurs ma własny domek i portfel; wszystko zapisuje się z Twoimi postępami.</p>`;
}
