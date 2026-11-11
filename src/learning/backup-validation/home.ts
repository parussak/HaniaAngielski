import {slotIds} from '../../house/catalog.ts';
import {obj,integer,safeKey,identifiers} from './values.ts';

export const validHome=(h:unknown):boolean=>{
    if(!obj(h)||!integer(h.earned)||!obj(h.purchases)||h.rooms!==undefined&&!identifiers(h.rooms)||h.unlockedItems!==undefined&&!identifiers(h.unlockedItems))return false;
    const places:string[]=[];let spent=0;
    for(const [id,v] of Object.entries(h.purchases)){
        if(!safeKey(id)||!obj(v)||!integer(v.cost)||!(v.slot===null||slotIds.includes(v.slot as string)))return false;
        if(v.room!==undefined&&(typeof v.room!=='string'||v.room!=='salon'&&!(Array.isArray(h.rooms)&&h.rooms.includes(v.room))))return false;
        spent+=v.cost as number;if(v.slot!==null)places.push(`${v.room??'salon'}/${v.slot}`);
    }
    return spent<=(h.earned as number)&&new Set(places).size===places.length;
};
