import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';

// Ikony pochodzą z istniejącego kociego SVG; bez zewnętrznych grafik ani fontów.
const source=await readFile(new URL('../public/cat.svg',import.meta.url),'utf8');
const browser=await chromium.launch({channel:process.env.HANIA_BROWSER_CHANNEL||(process.platform==='win32'?'msedge':undefined)});
try{
  const page=await browser.newPage();
  await mkdir(new URL('../public/icons/',import.meta.url),{recursive:true});
  for(const [name,size,maskable] of [['cat-192',192,false],['cat-512',512,false],['cat-maskable-512',512,true]]){
    const svg=maskable?source.replace('<rect width="64" height="64" rx="16" fill="#eee5fb"/>','<rect width="64" height="64" fill="#eee5fb"/><g transform="translate(4.8 4.8) scale(.85)">').replace('</svg>','</g></svg>'):source;
    const png=await page.evaluate(async({svg,size})=>{
      const img=new Image();img.src='data:image/svg+xml;base64,'+btoa(svg);await img.decode();
      const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;canvas.getContext('2d').drawImage(img,0,0,size,size);
      return canvas.toDataURL('image/png').split(',')[1];
    },{svg,size});
    await writeFile(new URL(`../public/icons/${name}.png`,import.meta.url),Buffer.from(png,'base64'));
  }
}finally{await browser.close();}
