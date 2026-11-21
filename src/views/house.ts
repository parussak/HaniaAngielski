import type {Progress,Module} from '../core.ts';
import {lessons,type Journey,type JourneyIssue} from '../adventure.ts';
import {homeFor,stars,roomAvailable,itemAvailable,settleHouseUnlocks} from '../house/progress.ts';
import {decorations,roomFor,type Decoration} from '../house/catalog.ts';
import {decorationMaps,moduleRooms} from '../house/rewards.ts';
import {placementControls,ownedLocation} from './house-placement.ts';
import {houseRoom} from './house-room.ts';
import {itemRoom} from '../house/layout.ts';
import {courseKey} from '../learning/scope.ts';
import {e} from '../ui.ts';
const asset=(file:string)=>e(new URL(`game/${file}`,document.baseURI).href);
export function houseView(progress:Progress,course:string,chosenRoom:string,selected:string,cat:(id:string)=>string,modules:Module[],journeys:Journey[],issues:JourneyIssue[],tab:'shop'|'storage'='shop',editing=false){
 // Project old completed maps immediately, including a freshly imported backup.
 // Persistence uses the same settlement in prepareProgress; rendering never mutates it.
 const p=structuredClone(progress);settleHouseUnlocks(p,modules,journeys,issues);
 const h=homeFor(p,course),room=roomAvailable(p,course,chosenRoom)?chosenRoom:'salon',balance=stars(p,course);
 // D-67: which items and rooms are rewards comes from this course's content files.
 const rewards=moduleRooms(modules,course),rewardMaps=decorationMaps(modules,journeys,course);
 // Unlocked items stay offered even if the content no longer lists them.
 const offered=(d:Decoration)=>!d.reward||rewardMaps.has(d.id)||!!h?.unlockedItems?.includes(d.id);
 const mapTitle=(id:string)=>rewardMaps.get(id)?.title??'';
 const visible=decorations.filter(d=>itemRoom(h,d.id)===room&&offered(d));
 const collection=decorations.filter(d=>!!h?.purchases[d.id]);
 const listed=tab==='storage'?collection:visible;
 const item=listed.find(d=>d.id===selected)??listed[0]??visible[0];
 const available=itemAvailable(p,course,item.id),roomName=roomFor(room).name;
 const compatible=decorations.filter(d=>d.reward&&offered(d)&&itemRoom(h,d.id)!==room&&itemAvailable(p,course,d.id));
 const badges=journeys.filter(j=>j.rewards?.badge&&modules.some(m=>m.id===j.moduleId&&courseKey(m)===course)&&lessons(j).every(l=>p.adventure?.completed[l.key]));
 return `<div class="journey-top"><button class="back" data-action="journeys">← Twoje mapy</button><span class="star-wallet" aria-label="${balance} gwiazdek">${balance} <span aria-hidden="true">★</span></span></div><h1>Koci domek</h1><p class="lead">Twój domek i gwiazdki w tym kursie. Mapa daje wyposażenie, cały moduł — nowy pokój.</p>
 <div class="house-rooms" role="group" aria-label="Pokoje"><button class="secondary ${room==='salon'?'is-selected':''}" data-action="select-room" data-id="salon" aria-pressed="${room==='salon'}">Koci salonik</button>${rewards.map(({room:r,module:m})=>`<button class="secondary ${room===r.id?'is-selected':''}" data-action="select-room" data-id="${r.id}" aria-pressed="${room===r.id}" ${roomAvailable(p,course,r.id)?'':'disabled'}>${e(r.name)}${roomAvailable(p,course,r.id)?'':` · ukończ wszystkie mapy modułu ${e(m.cover)}`}</button>`).join('')}</div>
 <h2>${e(roomName)}</h2>${houseRoom(h,room,roomName,new URL(`game/${roomFor(room).image}`,document.baseURI).href,item.id,editing,cat)}
 ${badges.map(j=>`<div class="module-award">★ ${e(j.rewards!.badge!)} · mapa „${e(j.title)}” ukończona!</div>`).join('')}
 ${rewards.filter(({room:r})=>roomAvailable(p,course,r.id)).map(({room:r,module:m})=>`<div class="room-award">★ ${e(r.name)} zdobyta za cały moduł ${e(m.cover)}!</div>`).join('')}
 <div class="house-tabs" role="group" aria-label="Wyposażenie i zakupy"><button class="secondary" data-action="house-tab" data-tab="storage" aria-pressed="${tab==='storage'}">Moje rzeczy (${collection.length})</button><button class="secondary" data-action="house-tab" data-tab="shop" aria-pressed="${tab==='shop'}">Sklep</button></div>
 <div class="house-wardrobe ${tab==='storage'?'show-storage':''}">
 ${listed.length&&itemRoom(h,item.id)===room?placementControls(h,item,room,available,balance,mapTitle(item.id),editing):listed.length?'<p>Ten przedmiot pasuje do innego pokoju. Wybierz go poniżej, aby przejść do właściwego pomieszczenia.</p>':''}
 <section class="panel house-shop"><h2>${tab==='storage'?'Moje rzeczy':'Wybierz dekorację'}</h2><p>${tab==='storage'?'Wszystkie Twoje zakupy w tym kursie. Dotknij przedmiotu, aby go ustawić lub schować.':'Dotknij dekoracji, aby zobaczyć cenę albo wybrać dla niej miejsce.'}</p>${!listed.length?'<p>Schowek jest jeszcze pusty. Pierwsze wyposażenie znajdziesz w sklepie.</p>':''}<div class="decoration-grid">${listed.map(d=>`<button class="decoration-card ${d.id===item.id?'is-selected':''}" data-action="select-decoration" data-id="${d.id}" aria-pressed="${d.id===item.id}"><img src="${asset(d.id+'.svg')}" alt="" width="88" height="70"><strong>${e(d.name)}</strong><span>${h?.purchases[d.id]?e(ownedLocation(h,d.id)):itemAvailable(p,course,d.id)?`${d.price} ★`:`Ukończ mapę: ${e(mapTitle(d.id))}`}</span></button>`).join('')}</div></section></div>
 ${compatible.length?`<section class="panel"><h2>Wyposażenie do innych pokoi</h2>${compatible.map(d=>`<p>${e(d.name)} · ${d.price} ★ · wybierz ${e(roomFor(itemRoom(h,d.id)).choose)}, aby kupić lub ustawić.</p>`).join('')}${rewards.filter(({room:r})=>!roomAvailable(p,course,r.id)).map(({room:r,module:m})=>`<p>${e(r.name)} czeka na ukończenie wszystkich map modułu ${e(m.cover)}.</p>`).join('')}</section>`:''}
 <button class="primary" data-action="journeys">Wróć po kolejne małe kroki →</button><p class="muted">Zakupy są za gwiazdki z nauki. Nie ma płatności ani kar za przerwę. Każdy kurs ma własny domek i portfel; wszystko zapisuje się z Twoimi postępami.</p>`;
}
