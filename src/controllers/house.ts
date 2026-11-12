import type {AppState} from '../app/state.ts';
import {currentCourse} from '../app/selectors.ts';
import {purchase,place,roomAvailable,homeFor,moveOnGrid} from '../house/progress.ts';
import {decorations} from '../house/catalog.ts';
import {itemRoom,boxFor,placementError} from '../house/layout.ts';
import type {Progress} from '../core.ts';

interface HousePorts {
    mutate: (change: (p: Progress) => void) => Promise<void>;
}

/** House interaction only. Learning still awards stars and unlocks rooms. */
export function createHouseController(state:AppState,{mutate}:HousePorts){
    async function handleAction(action:string,el:HTMLElement):Promise<boolean>{
        if(action==='house-edit'){state.houseEditing=!state.houseEditing;return true;}
        if(action==='grid-move'||action==='grid-nudge'||action==='grid-place'){
            if(!state.houseEditing)return true;
            const course=currentCourse(state)!.id,room=state.chosenRoom,id=el.dataset.id??state.chosenDecoration;
            if(el.dataset.owner&&el.dataset.owner!==(state.user?.uid??'guest'))return true;
            if(el.dataset.course&&el.dataset.course!==course||el.dataset.room&&el.dataset.room!==room)return true;
            const h=homeFor(state.progress,course),old=boxFor(h,id,room);
            const position=action==='grid-move'?{x:Number(el.dataset.x),y:Number(el.dataset.y)}:{x:old.x+Number(el.dataset.dx??0),y:old.y+Number(el.dataset.dy??0)};
            const error=placementError(h,id,position,room);
            if(error){state.notice=error;return true;}
            let moved=false;await mutate(p=>{moved=moveOnGrid(p,id,position,course,room);});
            state.chosenDecoration=id;state.notice=moved?'Pozycja zapisana.':'Nie udało się ustawić przedmiotu.';return true;
        }
        if(action==='select-room'){
            const room=el.dataset.id??'salon';
            if(roomAvailable(state.progress,currentCourse(state)!.id,room)){state.chosenRoom=room;state.chosenDecoration=room==='salon'?'pillow':'cat-toaster';}
            return true;
        }
        if(action==='house'){
            state.screen='house';
            return true;
        }
        if(action==='house-tab'){
            if(el.dataset.tab==='shop'||el.dataset.tab==='storage')state.houseTab=el.dataset.tab;
            return true;
        }
        if(action==='select-decoration'){
            state.chosenDecoration=el.dataset.id??'pillow';
            const d=decorations.find(d=>d.id===state.chosenDecoration),course=currentCourse(state)!.id;
            if(d){
                const ownRoom=itemRoom(homeFor(state.progress,course),d.id);
                if(roomAvailable(state.progress,course,ownRoom))state.chosenRoom=ownRoom;
            }
            return true;
        }
        if(action==='buy-decoration'){
            let bought=false;
            await mutate(p=>{bought=purchase(p,el.dataset.id??'',currentCourse(state)!.id,state.chosenRoom);});
            state.notice=bought?'Nowa dekoracja jest Twoja! Możesz wybrać dla niej miejsce.':'Przedmiot jest już Twój albo potrzeba jeszcze kilku gwiazdek.';
            return true;
        }
        if(action==='place-decoration'){
            let placed=false;const hidden:string[]=[];
            await mutate(p=>{
                const course=currentCourse(state)!.id,before=structuredClone(homeFor(p,course)?.purchases??{});
                const id=el.dataset.id??'';
                placed=itemRoom(homeFor(p,course),id)===state.chosenRoom&&place(p,id,el.dataset.slot||null,course,state.chosenRoom);
                if(placed)for(const [id,v] of Object.entries(homeFor(p,course)!.purchases))if(before[id]?.slot&&!v.slot)hidden.push(decorations.find(d=>d.id===id)?.name??id);
            });
            state.notice=placed?`Ustawienie domku zapisane.${hidden.length?` W schowku: ${hidden.join(', ')}.`:''}`:'Nie można ustawić tutaj tego przedmiotu. Wybierz dostępne miejsce.';
            return true;
        }
        return false;
    }
    return {handleAction};
}
