/** Native mouse drag and Pointer Events for touch. All drops use the same checked action as clicks. */
export function bindGapDrag(root:HTMLElement,place:(key:string,answer:string)=>void){
 let suppress=false,start:{x:number;y:number;answer:string;id:number}|undefined,ghost:HTMLElement|undefined;
 const target=(x:number,y:number)=>document.elementFromPoint(x,y)?.closest<HTMLElement>('.gap-target:not(:disabled),.bank-options');
 const source=(el:EventTarget|null)=>(el as Element).closest<HTMLButtonElement>('.bank-token:not(:disabled):not(.bank-empty),.gap-target[data-token]:not(:disabled)');
 const value=(el:HTMLButtonElement)=>el.dataset.token??el.dataset.answer!;
 const cleanup=()=>{ghost?.remove();ghost=undefined;start=undefined;};
 root.addEventListener('dragstart',event=>{const token=source(event.target);if(token){event.dataTransfer?.setData('text/plain',value(token));if(event.dataTransfer)event.dataTransfer.effectAllowed='move';}});
 root.addEventListener('dragover',event=>{if((event.target as Element).closest('.gap-target:not(:disabled),.bank-options'))event.preventDefault();});
 root.addEventListener('drop',event=>{const gap=(event.target as Element).closest<HTMLElement>('.gap-target:not(:disabled),.bank-options');if(gap){event.preventDefault();place(gap.dataset.key??'',event.dataTransfer?.getData('text/plain')??'');}});
 root.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse')return;const token=source(event.target);if(token)start={x:event.clientX,y:event.clientY,answer:value(token),id:event.pointerId};});
 window.addEventListener('pointermove',event=>{if(!start||start.id!==event.pointerId)return;if(!ghost&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>8){ghost=document.createElement('div');ghost.className='gap-drag-ghost';ghost.textContent=start.answer;document.body.append(ghost);}if(ghost){event.preventDefault();ghost.style.left=`${event.clientX}px`;ghost.style.top=`${event.clientY}px`;}},{passive:false});
 window.addEventListener('pointerup',event=>{if(!start||start.id!==event.pointerId)return;if(ghost){const gap=target(event.clientX,event.clientY),answer=start.answer;suppress=true;cleanup();if(gap)place(gap.dataset.key??'',answer);}else cleanup();});
 window.addEventListener('pointercancel',cleanup);
 return {consumeClick:()=>{const value=suppress;suppress=false;return value;}};
}
