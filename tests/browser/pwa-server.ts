import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../dist/',import.meta.url));
const sdk=`
export const restoreUser=async()=>JSON.parse(localStorage.getItem('test-user')??'null');
export async function login(email){const u={uid:email,email};localStorage.setItem('test-user',JSON.stringify(u));return u;}
export async function logout(){localStorage.removeItem('test-user');}
export async function resetPassword(){}
export const firebaseMessage=e=>e.message;
async function request(uid,body){const r=await fetch(new URL('__cloud/'+encodeURIComponent(uid),document.baseURI),body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});if(!r.ok)throw new Error('Cloud offline');return r.json();}
export const fetchProgress=uid=>request(uid);
export const pushProgress=(uid,progress,revision)=>request(uid,{progress,revision});
`;

// Osobny serwer pozwala testować prawdziwy service worker bez przechwytywania
// jego żądań przez Playwright. Jedynie adapter Firebase jest zastąpiony atrapą.
export async function pwaServer(){
  let version=1;
  const remote=new Map<string,{revision:number;progress:any}>();
  const server=http.createServer(async(req,res)=>{
    try{
      const pathname=decodeURIComponent(new URL(req.url!,'http://localhost').pathname),mount='/HaniaAngielski/';
      if(!pathname.startsWith(mount))throw new Error('not found');
      const file=pathname.slice(mount.length)||'index.html';
      if(file.startsWith('__cloud/')){
        const uid=file.slice('__cloud/'.length);
        if(req.method==='POST'){
          const chunks=[];for await(const chunk of req)chunks.push(chunk);
          const {progress,revision}=JSON.parse(Buffer.concat(chunks).toString());
          if((remote.get(uid)?.revision??0)!==revision){res.writeHead(409);res.end('conflict');return;}
          remote.set(uid,{revision:revision+1,progress});
        }
        res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(remote.get(uid)??null));return;
      }
      const absolute=path.resolve(root,file),relative=path.relative(root,absolute);
      if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('not found');
      let body:Buffer|string=await readFile(absolute);
      if(/^assets\/firebase-[^/]+\.js$/.test(file))body=sdk;
      if(file==='sw.js' && version>1)body=body.toString().replace(/const CACHE=PREFIX\+'[^']+';/,`const CACHE=PREFIX+'test-release-${version}';`);
      if(file==='content/02-food/modul.json' && version>1){const data=JSON.parse(body.toString());data.subtitle='Nowe materiały — test aktualizacji';body=JSON.stringify(data);}
      const type:Record<string,string>={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ogg':'audio/ogg'};
      res.writeHead(200,{'Content-Type':type[path.extname(file)]??'application/octet-stream','Cache-Control':'no-cache'});res.end(body);
    }catch{res.writeHead(404);res.end('not found');}
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=(server.address() as {port:number}).port;
  return {url:`http://127.0.0.1:${port}/HaniaAngielski/`,remote,setVersion:(n:number)=>version=n,close:()=>new Promise<void>(resolve=>{server.close(()=>resolve());server.closeAllConnections();})};
}
