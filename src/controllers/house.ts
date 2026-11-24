import type {Screen} from '../app/state.ts';
import {purchase,place,roomAvailable,homeFor,moveOnGrid} from '../house/progress.ts';
import {decorations} from '../house/catalog.ts';
import {itemRoom,boxFor,placementError} from '../house/layout.ts';
import type {Progress} from '../learning/model.ts';
import type {AccountUser} from '../firebase.ts';
import {isOwnedBy,unhandled} from '../app/actions.ts';

/**
 * Jedyne, co kontroler domku widzi ze stanu (najwęższy dostęp). Stan ekranu domku zmieniają wyłącznie
 * nazwane operacje kontrolera (`openOverview`, `openRoom`, `chooseDecoration` …). Dane postępu
 * (gwiazdki, zakupy, ustawienia) zmienia tylko port `mutate`; `progress` kontroler tylko czyta.
 */
export interface HouseState {
    readonly progress: Progress;
    notice: string;
    screen: Screen;
    houseOverview: boolean;
    houseEditing: boolean;
    houseTab: 'shop' | 'storage';
    chosenRoom: string;
    chosenDecoration: string;
    readonly user: AccountUser | null;
}

interface HousePorts {
    mutate: (change: (p: Progress) => void) => Promise<void>;
    /** Identyfikator bieżącego kursu (jego portfel i domek). */
    courseId: () => string;
}

/** House interaction only. Learning still awards stars and unlocks rooms. */
export function createHouseController(state:HouseState,{mutate,courseId}:HousePorts){
    function announce(text:string){state.notice=text;}
    function toggleEditing(){state.houseEditing=!state.houseEditing;}
    function openOverview(){state.screen='house';state.houseOverview=true;state.houseEditing=false;}
    function openRoom(room:string){
        state.screen='house';state.houseOverview=false;state.houseEditing=false;state.houseTab='shop';state.chosenRoom=room;
        state.chosenDecoration=decorations.find(d=>d.rooms[0]===room)?.id??'';
    }
    function showTab(tab:string|undefined){if(tab==='shop'||tab==='storage')state.houseTab=tab;}
    function chooseDecoration(id:string,room?:string){state.chosenDecoration=id;if(room!==undefined)state.chosenRoom=room;}
    async function handleAction(action:string,el:HTMLElement):Promise<boolean>{
        if(!isOwnedBy('house',action))return false;
        switch(action){
        case 'house-edit':{toggleEditing();return true;}
        case 'grid-move':case 'grid-nudge':case 'grid-place':{
            if(!state.houseEditing)return true;
            const course=courseId(),room=state.chosenRoom,id=el.dataset.id??state.chosenDecoration;
            if(el.dataset.owner&&el.dataset.owner!==(state.user?.uid??'guest'))return true;
            if(el.dataset.course&&el.dataset.course!==course||el.dataset.room&&el.dataset.room!==room)return true;
            const h=homeFor(state.progress,course),old=boxFor(h,id,room);
            const position=action==='grid-move'?{x:Number(el.dataset.x),y:Number(el.dataset.y)}:{x:old.x+Number(el.dataset.dx??0),y:old.y+Number(el.dataset.dy??0)};
            const error=placementError(h,id,position,room);
            if(error){announce(error);return true;}
            let moved=false;await mutate(p=>{moved=moveOnGrid(p,id,position,course,room);});
            chooseDecoration(id);announce(moved?'Pozycja zapisana.':'Nie udało się ustawić przedmiotu.');return true;
        }
        case 'select-room':{
            const room=el.dataset.id??'salon';
            if(roomAvailable(state.progress,courseId(),room))openRoom(room);
            return true;
        }
        case 'house':{openOverview();return true;}
        case 'house-tab':{showTab(el.dataset.tab);return true;}
        case 'select-decoration':{
            const id=el.dataset.id??'pillow',d=decorations.find(d=>d.id===id),course=courseId();
            chooseDecoration(id);
            if(d){
                const ownRoom=itemRoom(homeFor(state.progress,course),d.id);
                if(roomAvailable(state.progress,course,ownRoom))chooseDecoration(id,ownRoom);
            }
            return true;
        }
        case 'buy-decoration':{
            let bought=false;
            await mutate(p=>{bought=purchase(p,el.dataset.id??'',courseId(),state.chosenRoom);});
            announce(bought?'Nowa dekoracja jest Twoja! Możesz wybrać dla niej miejsce.':'Przedmiot jest już Twój albo potrzeba jeszcze kilku gwiazdek.');
            return true;
        }
        case 'place-decoration':{
            let placed=false;const hidden:string[]=[];
            await mutate(p=>{
                const course=courseId(),before=structuredClone(homeFor(p,course)?.purchases??{});
                const id=el.dataset.id??'';
                placed=itemRoom(homeFor(p,course),id)===state.chosenRoom&&place(p,id,el.dataset.slot||null,course,state.chosenRoom);
                if(placed)for(const [id,v] of Object.entries(homeFor(p,course)!.purchases))if(before[id]?.slot&&!v.slot)hidden.push(decorations.find(d=>d.id===id)?.name??id);
            });
            announce(placed?`Ustawienie domku zapisane.${hidden.length?` W schowku: ${hidden.join(', ')}.`:''}`:'Nie można ustawić tutaj tego przedmiotu. Wybierz dostępne miejsce.');
            return true;
        }
        default:return unhandled(action);
        }
    }
    return {handleAction};
}
