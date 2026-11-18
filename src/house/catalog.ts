// Editable rewards and decoration data, separate from progression rules.
export {legacyCourse} from '../materials/identity.ts';
export type HouseLayer='textiles'|'furniture'|'objects';
export const layers:{id:HouseLayer;name:string}[]=[{id:'textiles',name:'Tekstylia'},{id:'furniture',name:'Meble i koszyki'},{id:'objects',name:'Drobiazgi'}];
export const slots:{id:string;name:string;layer:HouseLayer;legacy?:boolean;rooms?:string[];support?:string}[]=[
 {id:'left',name:'Lewy kącik',layer:'furniture',legacy:true},
 {id:'window',name:'Pod oknem',layer:'objects',legacy:true},
 {id:'right',name:'Prawy kącik',layer:'furniture',legacy:true},
 {id:'rug',name:'Na dywanie',layer:'furniture',legacy:true},
 {id:'shelf',name:'Na półce',layer:'objects',legacy:true},
 {id:'front',name:'Z przodu',layer:'objects',legacy:true},
 {id:'floor-cover',name:'Koc pod meblami',layer:'textiles'},
 {id:'floor-cushion',name:'Poduszka przy dywanie',layer:'textiles'},
 {id:'shelf-left',name:'Lewa strona półki',layer:'objects'},
 {id:'shelf-right',name:'Prawa strona półki',layer:'objects'},
 {id:'table-left',name:'Lewa strona stolika',layer:'objects',rooms:['kitchen'],support:'table'},
 {id:'table-right',name:'Prawa strona stolika',layer:'objects',rooms:['kitchen'],support:'table'},
 {id:'counter',name:'Na blacie',layer:'objects',rooms:['kitchen']},
 {id:'floor-side',name:'Na podłodze z boku',layer:'objects'},
];
export const slotIds=slots.map(slot=>slot.id);
// D-67: `reward` = do kupienia dopiero po mapie, która wymienia przedmiot w `rewards.decorations` (sciezka.json).
export interface Decoration {id:string;name:string;price:number;slot:string;rooms:string[];reward?:true}
export const decorations:Decoration[]=[
 {id:'pillow',name:'Poduszka',price:6,slot:'rug',rooms:['salon']},
 {id:'yarn',name:'Kłębek',price:4,slot:'front',rooms:['salon']},
 {id:'scratcher',name:'Drapak',price:12,slot:'left',rooms:['salon']},
 {id:'plant',name:'Roślinka',price:8,slot:'window',rooms:['salon']},
 {id:'books',name:'Książeczki',price:10,slot:'shelf',rooms:['salon']},
 {id:'basket',name:'Koszyk',price:8,slot:'right',rooms:['salon']},
 {id:'bowls',name:'Kocie miseczki',price:6,slot:'front',rooms:['salon','kitchen'],reward:true},
 {id:'lemonade',name:'Dzbanek lemoniady',price:8,slot:'window',rooms:['salon','kitchen'],reward:true},
 {id:'picnic-basket',name:'Koszyk piknikowy',price:10,slot:'right',rooms:['salon','kitchen'],reward:true},
 {id:'picnic-blanket',name:'Koc piknikowy',price:12,slot:'rug',rooms:['salon'],reward:true},
 {id:'fruit-bowl',name:'Misa owoców',price:6,slot:'shelf',rooms:['salon','kitchen'],reward:true},
 {id:'cat-toaster',name:'Toster z kocimi uszami',price:10,slot:'window',rooms:['kitchen'],reward:true},
 {id:'mugs',name:'Półeczka z kubkami',price:12,slot:'shelf',rooms:['kitchen'],reward:true},
 {id:'table',name:'Stolik z krzesełkami',price:18,slot:'rug',rooms:['kitchen'],reward:true},
];
export const decorationLayer=(id:string):HouseLayer=>['pillow','picnic-blanket'].includes(id)?'textiles':['scratcher','basket','picnic-basket','table'].includes(id)?'furniture':'objects';
// Existing positions remain readable and movable, including unusual old layouts.
export const canUseSlot=(id:string,slot:string,room:string)=>{
 const target=slots.find(s=>s.id===slot);
 return !!target&&(!target.rooms||target.rooms.includes(room))&&(target.legacy||target.layer===decorationLayer(id));
};
// Pokoje domku. Salonik ma każdy kurs; pozostałe daje moduł, który wskazuje je w `houseRoom` (modul.json, D-67).
export interface Room {id:string;name:string;image:string}
export const rooms:Room[]=[{id:'salon',name:'Koci salonik',image:'room.svg'},{id:'kitchen',name:'Kocia kuchnia',image:'kitchen.svg'}];
export const rewardRooms=rooms.filter(r=>r.id!=='salon');
export const roomFor=(id:string)=>rooms.find(r=>r.id===id)??rooms[0];
