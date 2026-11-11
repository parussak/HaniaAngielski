import {courseFixture} from './course-materials.ts';
/** Virtual additions: never write synthetic learning material to public/. */
export function growingLibrary(read:(path:string)=>Promise<any>){
 const f=courseFixture();
 for(const c of f.courses){c.id=`test-growth-${c.id}`;c.moduleIds=c.moduleIds.map(id=>`test-growth-${id}`);}
 for(const [i,folder] of ['english','french','italian'].entries()){
  const m=f.files[`${folder}/modul.json`] as any;m.id=f.courses[i].moduleIds[0];
 }
 const extra=Object.fromEntries(Object.entries(f.files).filter(([path])=>path.includes('/')).map(([path,data])=>[`test-growth-${path}`,data]));
 return async(path:string)=>{
  if(path==='katalog.json'){const base=await read(path);return {...base,modules:['test-growth-french','test-growth-italian','test-growth-english',...base.modules]};}
  if(path==='kursy.json'){
   const base=await read(path);return {...base,courses:[...f.courses.slice(1),...base.courses.map((c:any)=>c.id==='angielski-hani'?{...c,moduleIds:[...c.moduleIds,...f.courses[0].moduleIds]}:c)]};
  }
  return path in extra?structuredClone(extra[path]):read(path);
 };
}
