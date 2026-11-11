import type {AppState} from '../app/state.ts';
import {currentCourse} from '../app/selectors.ts';
import {purchase,place,roomAvailable} from '../house/progress.ts';
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
        if(action==='select-decoration'){
            state.chosenDecoration=el.dataset.id??'pillow';
            return true;
        }
        if(action==='buy-decoration'){
            let bought=false;
            await mutate(p=>{bought=purchase(p,el.dataset.id??'',currentCourse(state)!.id,state.chosenRoom);});
            state.notice=bought?'Nowa dekoracja jest Twoja! Możesz wybrać dla niej miejsce.':'Przedmiot jest już Twój albo potrzeba jeszcze kilku gwiazdek.';
            return true;
        }
        if(action==='place-decoration'){
            await mutate(p=>{place(p,el.dataset.id??'',el.dataset.slot||null,currentCourse(state)!.id,state.chosenRoom);});
            state.notice='Ustawienie domku zapisane.';
            return true;
        }
        return false;
    }
    return {handleAction};
}
