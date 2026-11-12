import type {Progress,Module} from '../core.ts';
import {lessons,type Journey,type JourneyIssue} from '../adventure.ts';
import {homeFor,stars,roomAvailable,itemAvailable,settleHouseUnlocks} from '../house/progress.ts';
import {decorations,slots,roomRewards,mapNames,decorationLayer} from '../house/catalog.ts';
import {placementControls,ownedLocation} from './house-placement.ts';
import {courseKey} from '../learning/scope.ts';
import {e} from '../ui.ts';
const asset=(file:string)=>e(new URL(`game/${file}`,document.baseURI).href);
export function houseView(progress:Progress,course:string,chosenRoom:string,selected:string,cat:(id:string)=>string,modules:Module[],journeys:Journey[],issues:JourneyIssue[],tab:'shop'|'storage'='shop'){
 // Project old completed maps immediately, including a freshly imported backup.
 // Persistence uses the same settlement in prepareProgress; rendering never mutates it.
 const p=structuredClone(progress);settleHouseUnlocks(p,modules,journeys,issues);
 const h=homeFor(p,course),room=roomAvailable(p,course,chosenRoom)?chosenRoom:'salon',balance=stars(p,course);
 const rewards=roomRewards.filter(r=>modules.some(m=>m.id===r.moduleId&&courseKey(m)===course));
 const belongs=(map?:string)=>!map||modules.some(m=>courseKey(m)===course&&m.id===map.split('/')[0]);
 const visible=decorations.filter(d=>d.rooms.includes(room)&&belongs(d.map));
 const collection=decorations.filter(d=>!!h?.purchases[d.id]);
 const listed=tab==='storage'?collection:visible;
 const item=listed.find(d=>d.id===selected)??listed[0]??visible[0];
 const available=itemAvailable(p,course,item.id),roomName=room==='salon'?'Koci salonik':roomRewards.find(r=>r.id===room)!.name;
 const compatible=decorations.filter(d=>d.map&&belongs(d.map)&&!d.rooms.includes(room)&&itemAvailable(p,course,d.id));
 const food=journeys.find(j=>j.moduleId==='unit-2-food'&&!j.id&&belongs(j.moduleId));
 const foodBadge=food&&lessons(food).every(l=>p.adventure?.completed[l.key]);
 return `<div class="journey-top"><button class="back" data-action="journeys">← Twoje mapy</button><span class="star-wallet" aria-label="${balance} gwiazdek">${balance} <span aria-hidden="true">★</span></span></div><h1>Koci domek</h1><p class="lead">Twój domek i gwiazdki w tym kursie. Mapa daje wyposażenie, cały moduł — nowy pokój.</p>
 <div class="house-rooms" role="group" aria-label="Pokoje"><button class="secondary ${room==='salon'?'is-selected':''}" data-action="select-room" data-id="salon" aria-pressed="${room==='salon'}">Koci salonik</button>${rewards.map(r=>`<button class="secondary ${room===r.id?'is-selected':''}" data-action="select-room" data-id="${r.id}" aria-pressed="${room===r.id}" ${roomAvailable(p,course,r.id)?'':'disabled'}>${e(r.name)}${roomAvailable(p,course,r.id)?'':' · ukończ wszystkie mapy Food'}</button>`).join('')}</div>
 <h2>${e(roomName)}</h2><figure class="cat-house ${room==='kitchen'?'kitchen-room':''}" aria-label="Twój koci pokój"><img class="room-background" src="${asset(room==='salon'?'room.svg':roomRewards.find(r=>r.id===room)!.image)}" alt="${e(roomName)} — pokój z oknem" width="620" height="380">${Object.entries(h?.purchases??{}).filter(([id,v])=>v.slot&&(v.room??'salon')===room&&visible.some(d=>d.id===id)).map(([id,v])=>`<button class="room-decoration layer-${decorationLayer(id)} slot-${e(v.slot)} ${id===item.id?'is-selected':''}" data-action="select-decoration" data-id="${e(id)}" aria-label="${e(decorations.find(d=>d.id===id)!.name)}, ${e(slots.find(s=>s.id===v.slot)!.name)}"><img src="${asset(id+'.svg')}" alt="" width="100" height="100"></button>`).join('')}<div class="house-cat cat-olus">${cat('olus')}</div><div class="house-cat cat-maja">${cat('maja')}</div></figure>
 ${foodBadge?'<div class="module-award">★ Odznaka kociego kucharza · pierwsza mapa Food ukończona!</div>':''}
 ${rewards.filter(r=>roomAvailable(p,course,r.id)).map(r=>`<div class="room-award">★ ${e(r.name)} zdobyta za cały moduł Food!</div>`).join('')}
 <div class="house-tabs" role="group" aria-label="Wyposażenie i zakupy"><button class="secondary" data-action="house-tab" data-tab="storage" aria-pressed="${tab==='storage'}">Moje rzeczy (${collection.length})</button><button class="secondary" data-action="house-tab" data-tab="shop" aria-pressed="${tab==='shop'}">Sklep</button></div>
 <div class="house-wardrobe ${tab==='storage'?'show-storage':''}">
 ${listed.length&&item.rooms.includes(room)?placementControls(h,item,room,available,balance,mapNames[item.map!]??item.map??''):listed.length?'<p>Ten przedmiot pasuje do innego pokoju. Wybierz go poniżej, aby przejść do właściwego pomieszczenia.</p>':''}
 <section class="panel house-shop"><h2>${tab==='storage'?'Moje rzeczy':'Wybierz dekorację'}</h2><p>${tab==='storage'?'Wszystkie Twoje zakupy w tym kursie. Dotknij przedmiotu, aby go ustawić lub schować.':'Dotknij dekoracji, aby zobaczyć cenę albo wybrać dla niej miejsce.'}</p>${!listed.length?'<p>Schowek jest jeszcze pusty. Pierwsze wyposażenie znajdziesz w sklepie.</p>':''}<div class="decoration-grid">${listed.map(d=>`<button class="decoration-card ${d.id===item.id?'is-selected':''}" data-action="select-decoration" data-id="${d.id}" aria-pressed="${d.id===item.id}"><img src="${asset(d.id+'.svg')}" alt="" width="88" height="70"><strong>${e(d.name)}</strong><span>${h?.purchases[d.id]?e(ownedLocation(h,d.id)):itemAvailable(p,course,d.id)?`${d.price} ★`:`Ukończ mapę: ${e(mapNames[d.map!]??d.map)}`}</span></button>`).join('')}</div></section></div>
 ${compatible.length?`<section class="panel"><h2>Wyposażenie do innych pokoi</h2>${compatible.map(d=>`<p>${e(d.name)} · ${d.price} ★ · wybierz ${d.rooms.includes('salon')?'Koci salonik':'Kocią kuchnię'}, aby kupić lub ustawić.</p>`).join('')}${!roomAvailable(p,course,'kitchen')?'<p>Kuchnię zdobędziesz po wszystkich mapach modułu Food.</p>':''}</section>`:''}
 <button class="primary" data-action="journeys">Wróć po kolejne małe kroki →</button><p class="muted">Zakupy są za gwiazdki z nauki. Nie ma płatności ani kar za przerwę. Każdy kurs ma własny domek i portfel; wszystko zapisuje się z Twoimi postępami.</p>`;
}
