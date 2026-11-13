import { defineConfig } from 'vite';
import {runtimeAudioAssets} from './scripts/audio/publish.mjs';
export default defineConfig(({command})=>({ base: './',plugins:[{
 name:'validated-course-audio',
 async buildStart(){if(command==='build')for(const [fileName,source] of await runtimeAudioAssets(process.cwd()))this.emitFile({type:'asset',fileName,source});},
 configureServer(server){
  let assets:Map<string,Buffer>|undefined;
  server.middlewares.use(async(req,res,next)=>{
   const path=new URL(req.url??'/', 'http://localhost').pathname.slice(1);if(!path.startsWith('audio/'))return next();
   try{if(!assets||path==='audio/catalog.json')assets=await runtimeAudioAssets(server.config.root);const body=assets.get(path);if(!body){res.statusCode=404;res.end();return;}
    res.setHeader('Content-Type',path.endsWith('.ogg')?'audio/ogg':'application/json');res.setHeader('Cache-Control','no-cache');res.end(body);
   }catch(error){server.config.logger.error(String(error));res.statusCode=503;res.end('Nagrania wymagają npm run audio.');}
  });
 }
}] }));
