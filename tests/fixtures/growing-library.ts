import {courseFixture} from './course-materials.ts';
/** Virtual additions: never write synthetic learning material to public/. */
export function growingLibrary(read:(path:string)=>Promise<any>){
 const f=courseFixture();
 for(const c of f.courses){c.id=`test-growth-${c.id}`;c.moduleIds=c.moduleIds.map(id=>`test-growth-${id}`);}
 for(const [i,folder] of ['english','french','italian'].entries()){
  const m=f.files[`${folder}/modul.json`] as any;m.id=f.courses[i].moduleIds[0];
 }
 // The English test module joins the real course inside its folder; French and Italian are separate (flat) courses.
 const place=(path:string)=>path.startsWith('english/')?`angielski-hani/test-growth-${path}`:`test-growth-${path}`;
 const extra=Object.fromEntries(Object.entries(f.files).filter(([path])=>path.includes('/')).map(([path,data])=>[place(path),data]));
 return async(path:string)=>{
  if(path==='katalog.json'){const base=await read(path);return {...base,coursesFile:'kursy.json',modules:['test-growth-french','test-growth-italian']};}
  if(path==='kursy.json')return {version:1,courses:f.courses.slice(1)};
  if(path==='angielski-hani/kurs.json'){const base=await read(path);return {...base,modules:[...base.modules,'test-growth-english']};}
  return path in extra?structuredClone(extra[path]):read(path);
 };
}
