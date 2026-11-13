import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {readLibrary} from '../../src/materials/library.ts';
import {createPlan} from './plan.mjs';
import {checkGenerated} from './files.mjs';
import {speechKey} from '../../src/speech/text.ts';

/** Publish only a lightweight index and validated clips; never the tools or generator manifest. */
export async function runtimeAudioAssets(root){
 const config=JSON.parse(await readFile(join(root,'audio/config.json'),'utf8'));
 const {modules}=await readLibrary(async path=>JSON.parse(await readFile(join(root,'public/content',path),'utf8')));
 const plan=createPlan(modules,config),generated=join(root,'audio/generated');await checkGenerated(plan,generated);
 const entries=new Map(),assets=new Map();
 for(const c of plan.clips){
  const key=speechKey(c.text,c.language),file=`clips/${c.id}.ogg`,existing=entries.get(key);
  if(existing&&existing.file!==file)throw Error('Audio: niejednoznaczny głos dla tego samego tekstu i języka.');
  entries.set(key,{text:c.text,language:c.language,file});assets.set(`audio/${file}`,await readFile(join(generated,file)));
 }
 assets.set('audio/catalog.json',Buffer.from(JSON.stringify({version:1,entries:[...entries.values()]})+'\n'));return assets;
}
