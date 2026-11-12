import {grid,placementError,type Position} from './layout.ts';
import type {Home} from './progress.ts';

interface Context {h:Home|undefined;room:string;course:string;owner:string;editing:boolean;busy:boolean;epoch:object}
export function bindHouseDrag(root:HTMLElement,context:()=>Context,commit:(id:string,at:Position,scope:Context)=>void){
 let drag:{node:HTMLElement;scene:HTMLElement;pointer:number;startX:number;startY:number;offsetX:number;offsetY:number;at:Position;original:string;scope:Context;moved:boolean}|null=null;
 let suppressUntil=0,suppressId='';
 let tap:{node:HTMLElement;pointer:number;x:number;y:number}|null=null;
 let tapped:HTMLElement|null=null;
 const restore=()=>{if(drag){const old=drag;drag=null;old.node.setAttribute('style',old.original);old.node.classList.remove('dragging','invalid');if(old.node.hasPointerCapture(old.pointer))old.node.releasePointerCapture(old.pointer);}};
 root.addEventListener('pointerdown',ev=>{
  const node=(ev.target as HTMLElement).closest<HTMLElement>('.grid-item'),scene=node?.closest<HTMLElement>('[data-grid-room]'),scope=context();
  if(ev.pointerType==='touch'&&scope.editing&&!scope.busy&&!node){
   const button=(ev.target as HTMLElement).closest<HTMLElement>('.grid-toolbar button,.house-edit');
   if(button)tap={node:button,pointer:ev.pointerId,x:ev.clientX,y:ev.clientY};
  }
  if(!node||!scene||!scope.editing||scope.busy||ev.button!==0||!ev.isPrimary)return;
  const rect=node.getBoundingClientRect();
  drag={node,scene,pointer:ev.pointerId,startX:ev.clientX,startY:ev.clientY,offsetX:ev.clientX-rect.left,offsetY:ev.clientY-rect.top,at:{x:Number(node.dataset.x),y:Number(node.dataset.y)},original:node.getAttribute('style')??'',scope,moved:false};
  node.setPointerCapture(ev.pointerId);
 });
 root.addEventListener('pointermove',ev=>{
  if(tap&&tap.pointer===ev.pointerId&&Math.hypot(ev.clientX-tap.x,ev.clientY-tap.y)>8)tap=null;
  if(!drag||drag.pointer!==ev.pointerId)return;
  if(!drag.moved&&Math.hypot(ev.clientX-drag.startX,ev.clientY-drag.startY)<4)return;
  drag.moved=true;
  const r=drag.scene.getBoundingClientRect();
  drag.at={x:Math.round((ev.clientX-r.left-drag.offsetX)/r.width*grid.columns),y:Math.round((ev.clientY-r.top-drag.offsetY)/r.height*grid.rows)};
  const error=placementError(drag.scope.h,drag.node.dataset.id!,drag.at,drag.scope.room);
  drag.node.classList.add('dragging');drag.node.classList.toggle('invalid',!!error);
  drag.node.style.left=`${drag.at.x/grid.columns*100}%`;drag.node.style.top=`${drag.at.y/grid.rows*100}%`;
  const message=root.querySelector('[data-grid-message]');if(message)message.textContent=error??'Puszczaj, aby zapisać pozycję.';
 });
 root.addEventListener('pointerup',ev=>{
  if(tap&&tap.pointer===ev.pointerId){
   const target=tap;tap=null;
   if(target.node.contains(ev.target as Node)&&target.node.isConnected){tapped=target.node;target.node.click();}
  }
  if(!drag||drag.pointer!==ev.pointerId)return;
  const finished=drag,now=context();restore();
  if(!finished.moved)return;
  suppressUntil=Date.now()+500;suppressId=finished.node.dataset.id!;
  if(now.epoch!==finished.scope.epoch||now.owner!==finished.scope.owner||now.course!==finished.scope.course||now.room!==finished.scope.room||!now.editing||now.busy)return;
  // Finish the native touch/click lifecycle before replacing the room DOM.
  requestAnimationFrame(()=>{
   const latest=context();
   if(latest.epoch===finished.scope.epoch&&latest.owner===finished.scope.owner&&latest.course===finished.scope.course&&latest.room===finished.scope.room&&latest.editing&&!latest.busy)commit(finished.node.dataset.id!,finished.at,finished.scope);
  });
 });
 root.addEventListener('pointercancel',()=>{tap=null;if(drag){suppressUntil=Date.now()+500;suppressId=drag.node.dataset.id!;}restore();});
 root.addEventListener('lostpointercapture',ev=>{if(drag?.pointer===ev.pointerId)restore();});
 window.addEventListener('resize',()=>{tap=null;restore();});
 window.addEventListener('blur',()=>{tap=null;restore();});
 return {consumeClick:(ev:MouseEvent)=>{
  if(ev.isTrusted&&tapped?.contains(ev.target as Node)){tapped=null;return true;}
  return Date.now()<suppressUntil&&(ev.target as HTMLElement).closest<HTMLElement>('.grid-item')?.dataset.id===suppressId;
 }};
}
