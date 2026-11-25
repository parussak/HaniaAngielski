// Suwaki głośności: ciche przeciąganie, „Posłuchaj”, zapamiętanie po odświeżeniu, niezależność od przełącznika wymowy.
import {test,expect,type Page,type BrowserContext} from './fixtures.ts';

function speechMock(){
 const w=window as any;w.__spoken=[];
 w.SpeechSynthesisUtterance=class{text:string;lang='';rate=1;volume=1;voice:unknown=null;onerror:any=null;constructor(text:string){this.text=text;}};
 Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{lang:'en-GB',localService:true}],cancel(){},addEventListener(){},speak(u:any){w.__spoken.push({text:u.text,volume:u.volume});}}});
 const original=HTMLMediaElement.prototype.play;w.__cues=[];
 HTMLMediaElement.prototype.play=function(){w.__cues.push({src:this.src,volume:this.volume});return Promise.resolve();};void original;
}
const install=(context:BrowserContext)=>context.addInitScript(speechMock);
const spoken=(page:Page)=>page.evaluate(()=>(window as any).__spoken as {volume:number}[]);
const cues=(page:Page)=>page.evaluate(()=>(window as any).__cues as {src:string;volume:number}[]);
const setRange=(page:Page,id:string,value:number)=>page.locator(id).evaluate((el:HTMLInputElement,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},value);

test('suwaki: ciche przeciąganie, próbka z nową głośnością, niezależność, zapis po odświeżeniu i przełącznik wymowy',async({page,context})=>{
 await install(context);await page.goto('./');await page.getByRole('button',{name:'Konto',exact:true}).click();
 await expect(page.locator('#volume-speech-value')).toHaveText('100%');await expect(page.locator('#volume-cues-value')).toHaveText('30%');
 await setRange(page,'#volume-cues',80);await setRange(page,'#volume-speech',40);
 await expect(page.locator('#volume-cues-value')).toHaveText('80%');await expect(page.locator('#volume-speech-value')).toHaveText('40%');
 expect(await spoken(page)).toHaveLength(0);expect(await cues(page)).toHaveLength(0);
 await page.getByRole('button',{name:'Posłuchaj wymowy'}).click();expect((await spoken(page)).at(-1)!.volume).toBe(0.4);
 await page.getByRole('button',{name:'Posłuchaj sygnału poprawnej odpowiedzi'}).click();expect((await cues(page)).at(-1)!.volume).toBe(0.8);
 await page.reload();await page.getByRole('button',{name:'Konto',exact:true}).click();
 await expect(page.locator('#volume-speech-value')).toHaveText('40%');await expect(page.locator('#volume-cues-value')).toHaveText('80%');
 await setRange(page,'#volume-cues',0);await page.getByRole('button',{name:'Posłuchaj sygnału poprawnej odpowiedzi'}).click();expect((await cues(page)).at(-1)!.volume).toBe(0);
 await page.getByRole('checkbox',{name:'Włącz ćwiczenia ze słuchu'}).uncheck();await setRange(page,'#volume-speech',70);
 await expect(page.getByRole('checkbox',{name:'Włącz ćwiczenia ze słuchu'})).not.toBeChecked();
 await page.reload();await page.getByRole('button',{name:'Konto',exact:true}).click();
 await expect(page.getByRole('checkbox',{name:'Włącz ćwiczenia ze słuchu'})).not.toBeChecked();await expect(page.locator('#volume-speech-value')).toHaveText('70%');
});
