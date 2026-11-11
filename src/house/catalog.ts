// Editable rewards and decoration data, separate from progression rules.
export {legacyCourse} from '../materials/identity.ts';
export const slots=[{id:'left',name:'Lewy kącik'},{id:'window',name:'Pod oknem'},{id:'right',name:'Prawy kącik'},{id:'rug',name:'Na dywanie'},{id:'shelf',name:'Na półce'},{id:'front',name:'Z przodu'}];
export const slotIds=slots.map(slot=>slot.id);
export interface Decoration {id:string;name:string;price:number;slot:string;rooms:string[];map?:string}
export const decorations:Decoration[]=[
 {id:'pillow',name:'Poduszka',price:6,slot:'rug',rooms:['salon']},
 {id:'yarn',name:'Kłębek',price:4,slot:'front',rooms:['salon']},
 {id:'scratcher',name:'Drapak',price:12,slot:'left',rooms:['salon']},
 {id:'plant',name:'Roślinka',price:8,slot:'window',rooms:['salon']},
 {id:'books',name:'Książeczki',price:10,slot:'shelf',rooms:['salon']},
 {id:'basket',name:'Koszyk',price:8,slot:'right',rooms:['salon']},
 {id:'bowls',name:'Kocie miseczki',price:6,slot:'front',rooms:['salon','kitchen'],map:'unit-2-food'},
 {id:'lemonade',name:'Dzbanek lemoniady',price:8,slot:'window',rooms:['salon','kitchen'],map:'unit-2-food'},
 {id:'picnic-basket',name:'Koszyk piknikowy',price:10,slot:'right',rooms:['salon','kitchen'],map:'unit-2-food'},
 {id:'picnic-blanket',name:'Koc piknikowy',price:12,slot:'rug',rooms:['salon'],map:'unit-2-food'},
 {id:'fruit-bowl',name:'Misa owoców',price:6,slot:'shelf',rooms:['salon','kitchen'],map:'unit-2-food/food-w-praktyce'},
 {id:'cat-toaster',name:'Toster z kocimi uszami',price:10,slot:'window',rooms:['kitchen'],map:'unit-2-food/food-w-praktyce'},
 {id:'mugs',name:'Półeczka z kubkami',price:12,slot:'shelf',rooms:['kitchen'],map:'unit-2-food/food-w-praktyce'},
 {id:'table',name:'Stolik z krzesełkami',price:18,slot:'rug',rooms:['kitchen'],map:'unit-2-food/food-w-praktyce'},
];
export const roomRewards=[{id:'kitchen',name:'Kocia kuchnia',moduleId:'unit-2-food',maps:['unit-2-food','unit-2-food/food-w-praktyce'],image:'kitchen.svg'}];
export const mapNames:Record<string,string>={'unit-2-food':'Przygotowania do kociego pikniku','unit-2-food/food-w-praktyce':'Kocia kuchnia — Food w praktyce'};
