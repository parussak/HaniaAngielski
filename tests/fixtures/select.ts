import type {MaterialLibrary} from '../../src/materials/model.ts';
/** Identity, never position, selects production regressions from a growing library. */
export function moduleById(library:MaterialLibrary,id:string){
 const m=library.modules.find(m=>m.id===id);if(!m)throw Error(`Brak wymaganego modułu testu: ${id}`);return m;
}
export function courseById(library:MaterialLibrary,id:string){
 const c=library.courses.find(c=>c.id===id);if(!c)throw Error(`Brak wymaganego kursu testu: ${id}`);return c;
}
