import {decorationLayer,decorations} from './catalog.ts';
import type {Home} from './progress.ts';

export const grid={columns:24,rows:15};
export interface Position {x:number;y:number}
export interface Box extends Position {w:number;h:number}
// Sizes belong to the item, never to a location or a screen breakpoint.
const sizes:Record<string,[number,number]>={pillow:[3,3],yarn:[2,2],scratcher:[3,6],plant:[3,3],books:[3,3],basket:[4,3],bowls:[3,2],lemonade:[2,3],'picnic-basket':[4,3],'picnic-blanket':[7,4],'fruit-bowl':[3,2],'cat-toaster':[3,3],mugs:[4,3],table:[7,5]};
export const sizeFor=(id:string)=>{const [w,h]=sizes[id]??[3,3];return {w,h};};
export const itemRoom=(h:Home|undefined,id:string)=>h?.purchases[id]?(h.purchases[id].room??'salon'):(decorations.find(d=>d.id===id)?.rooms[0]??'salon');
const anchors:Record<string,Position>={left:{x:1,y:6},window:{x:6,y:7},right:{x:19,y:10},rug:{x:10,y:10},shelf:{x:13,y:1},front:{x:5,y:11},'floor-cover':{x:9,y:10},'floor-cushion':{x:3,y:11},'shelf-left':{x:10,y:1},'shelf-right':{x:19,y:1},'table-left':{x:10,y:9},'table-right':{x:13,y:9},counter:{x:18,y:5},'floor-side':{x:1,y:12}};
export function boxFor(h:Home|undefined,id:string,room:string):Box {
 const v=h?.purchases[id],size=sizeFor(id);
 let at=v?.position??anchors[v?.slot??decorations.find(d=>d.id===id)?.slot??'front']??anchors.front;
 if(!v?.position&&room==='kitchen'){
  if(v?.slot==='window')at={x:10,y:5};
  if(v?.slot==='shelf')at={x:16,y:5};
  if(v?.slot==='rug')at={x:9,y:9};
 }
 return {...size,x:Math.max(0,Math.min(at.x,grid.columns-size.w)),y:Math.max(0,Math.min(at.y,grid.rows-size.h))};
}
export const displayed=(v:Home['purchases'][string])=>!!(v.slot||v.position);
export function inArea(id:string,box:Box,room:string){
 const bottom=box.y+box.h,center=box.x+box.w/2;
 if(decorationLayer(id)!=='objects')return bottom>=12;
 return bottom>=12 || (room==='kitchen'?bottom>=7&&bottom<=9&&center>=9:bottom>=3&&bottom<=5&&center>=10||bottom>=6&&bottom<=9&&center<=9);
}
function overlaps(a:Box,b:Box){return a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;}
export function supportingItem(h:Home|undefined,id:string,position:Position,room:string){
 if(id==='table'||decorationLayer(id)!=='objects'||itemRoom(h,id)!==room||!h?.purchases.table||!displayed(h.purchases.table)||itemRoom(h,'table')!==room)return null;
 const table=boxFor(h,'table',room),b={...position,...sizeFor(id)},surface=Math.round(table.y+table.h/2);
 return b.x>=table.x&&b.x+b.w<=table.x+table.w&&b.y+b.h>=surface&&b.y+b.h<=surface+1?'table':null;
}
export function placementError(h:Home|undefined,id:string,position:Position,room:string):string|null {
 if(!h?.purchases[id]||itemRoom(h,id)!==room)return 'Ten przedmiot należy do innego pokoju albo nie został kupiony.';
 const b={...position,...sizeFor(id)};
 if(!Number.isInteger(b.x)||!Number.isInteger(b.y)||b.x<0||b.y<0||b.x+b.w>grid.columns||b.y+b.h>grid.rows)return 'Przedmiot musi zmieścić się w pokoju.';
 if(!inArea(id,b,room)&&!supportingItem(h,id,b,room))return 'Wybierz pasujący obszar: podłogę, półkę lub blat.';
 const collision=Object.entries(h.purchases).find(([other,v])=>other!==id&&displayed(v)&&itemRoom(h,other)===room&&decorationLayer(other)===decorationLayer(id)&&overlaps(b,boxFor(h,other,room)));
 return collision?`To miejsce zajmuje ${decorations.find(d=>d.id===collision[0])?.name??'inny przedmiot'}. Przesuń obok.`:null;
}
