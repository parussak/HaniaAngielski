import type {AppState} from '../app/state.ts';
import {currentCourse} from '../app/selectors.ts';
import {purchase,place,roomAvailable,homeFor} from '../house/progress.ts';
import {decorations} from '../house/catalog.ts';
import type {Progress} from '../core.ts';

interface HousePorts {
    mutate: (change: (p: Progress) => void) => Promise<void>;
}

/** House interaction only. Learning still awards stars and unlocks rooms. */
export function createHouseController(state:AppState,{mutate}:HousePorts){
    async function handleAction(action:string,el:HTMLElement):Promise<boolean>{
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
            if(d&&!d.rooms.includes(state.chosenRoom)){
                const ownRoom=homeFor(state.progress,course)?.purchases[d.id]?.room??'salon';
                state.chosenRoom=d.rooms.includes(ownRoom)&&roomAvailable(state.progress,course,ownRoom)?ownRoom:d.rooms.find(r=>roomAvailable(state.progress,course,r))??state.chosenRoom;
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
                placed=place(p,el.dataset.id??'',el.dataset.slot||null,course,state.chosenRoom);
                if(placed)for(const [id,v] of Object.entries(homeFor(p,course)!.purchases))if(before[id]?.slot&&!v.slot)hidden.push(decorations.find(d=>d.id===id)?.name??id);
            });
            state.notice=placed?`Ustawienie domku zapisane.${hidden.length?` W schowku: ${hidden.join(', ')}.`:''}`:'Nie można ustawić tutaj tego przedmiotu. Wybierz dostępne miejsce.';
            return true;
        }
        return false;
    }
    return {handleAction};
}
