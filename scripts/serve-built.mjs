import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const mount='/HaniaAngielski/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
http.createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname==='/'){res.writeHead(302,{Location:mount});res.end();return;}
    if(!pathname.startsWith(mount))throw new Error('Not found');
    const file=path.resolve(root,pathname.slice(mount.length)||'index.html');
    const relative=path.relative(root,file);
    if(relative.startsWith('..')||path.isAbsolute(relative)||!(await stat(file)).isFile())throw new Error('Not found');
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]??'application/octet-stream','Cache-Control':'no-cache'});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(5184,'127.0.0.1',()=>console.log(`Built preview: http://127.0.0.1:5184${mount}`));
