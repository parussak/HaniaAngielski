import {test,expect,type BrowserContext} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {backup,emptyProgress} from '../../src/core.ts';
const mockSDK=`
export const restoreUser=async()=>JSON.parse(localStorage.getItem('test-user')??'null');
export async function login(email,password,register){if(password==='wrongpass'){throw new Error('Nieprawidłowy e-mail lub hasło.');}const user={uid:email,email};localStorage.setItem('test-user',JSON.stringify(user));return user;}
export async function logout(){localStorage.removeItem('test-user');}
export async function resetPassword(email){if(!email.includes('@'))throw new Error('Sprawdź adres e-mail.');}
export const firebaseMessage=e=>e.message;
async function request(uid,body){const r=await fetch(new URL('__test/cloud/'+encodeURIComponent(uid),document.baseURI),body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});if(!r.ok)throw new Error('Chmura niedostępna');return r.json();}
export const fetchProgress=uid=>request(uid);
export const pushProgress=(uid,progress,revision)=>request(uid,{progress,revision});
`;
function backend(){
  const data=new Map<string,{revision:number;progress:any}>();let offline=false;
  return {data,setOffline:(value:boolean)=>offline=value,connect:async(context:BrowserContext)=>{
    // Zastępujemy wyłącznie adapter SDK; rzeczywista logika synchronizacji i IndexedDB działa w aplikacji.
    await context.route(/\/(?:assets\/firebase-[^/]+\.js|src\/firebase\.ts)(?:\?.*)?$/,r=>r.fulfill({contentType:'application/javascript',body:mockSDK}));
    await context.route('**/__test/cloud/*',async route=>{
      if(offline){await route.fulfill({status:503,body:'offline'});return;}
      const uid=decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1)!);
      if(route.request().method()==='POST'){
        const {progress,revision}=route.request().postDataJSON();
        // Właściwy CAS jest osobno testowany w sync.test.ts i wymuszony przez Firestore.
        expect(revision).toBe(data.get(uid)?.revision??0);data.set(uid,{revision:revision+1,progress});
      }
      await route.fulfill({json:data.get(uid)??null});
    });
  }};
}
async function signIn(page:any,email='parent@example.test'){
  await page.getByRole('button',{name:'Konto i synchronizacja',exact:true}).click();
  await page.getByRole('textbox',{name:'E-mail rodzica'}).fill(email);
  await page.getByLabel('Hasło',{exact:true}).fill('test-password');
  await page.getByRole('button',{name:'Zaloguj się',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Twoje konto',exact:true})).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Wyniki zapisane na koncie.');
}

test('konto: migracja gościa, automatyczny zapis, drugie urządzenie i wylogowanie',async({browser})=>{
  const cloud=backend(),a=await browser.newContext({baseURL:test.info().project.use.baseURL,viewport:{width:390,height:844}}),b=await browser.newContext({baseURL:test.info().project.use.baseURL,viewport:{width:390,height:844}});
  try{
    await cloud.connect(a);await cloud.connect(b);const page=await a.newPage();await page.goto('./');
    const guest=emptyProgress();guest.words['unit-2-food@1:word:apple']='known';
    await page.getByRole('button',{name:'Kopia postępów',exact:true}).click();
    await page.locator('#import-file').setInputFiles({name:'guest.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(guest)))});
    await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();
    await signIn(page);
    await expect(page.getByRole('heading',{name:'Masz wcześniejsze postępy na tym urządzeniu'})).toBeVisible();
    expect(cloud.data.size).toBe(0);
    await page.getByRole('button',{name:'Przenieś postępy na konto',exact:true}).click();
    await expect(page.getByRole('status')).toContainText('Wyniki zapisane na koncie.');
    await expect.poll(()=>cloud.data.get('parent@example.test')?.progress.words).toEqual(guest.words);
    await page.screenshot({path:'test-results/firebase-account-mobile.png',fullPage:true});
    const second=await b.newPage();await second.goto('./');await signIn(second);
    await second.getByRole('button',{name:'Moje postępy',exact:true}).click();
    await expect(second.locator('.stats-grid article').first().locator('strong')).toHaveText('1');
    await page.getByRole('button',{name:'Wyloguj się',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Zaloguj się',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Moje postępy',exact:true}).click();
    await expect(page.locator('.stats-grid article').first().locator('strong')).toHaveText('1');
    // Inne konto nie otrzymuje automatycznie wyników gościa ani poprzedniego konta.
    await signIn(page,'other@example.test');expect(cloud.data.has('other@example.test')).toBe(false);
    await page.getByRole('button',{name:'Moje postępy',exact:true}).click();await expect(page.locator('.stats-grid article').first().locator('strong')).toHaveText('0');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }finally{await a.close();await b.close();}
});

test('konto: błędne logowanie, odzyskanie hasła i zapis bez sieci zachowany po odświeżeniu',async({page,context})=>{
  const cloud=backend();await cloud.connect(context);await page.goto('./');
  await page.getByRole('button',{name:'Konto i synchronizacja',exact:true}).click();
  await page.getByLabel('E-mail rodzica').fill('parent@example.test');await page.getByLabel('Hasło',{exact:true}).fill('wrongpass');
  await page.getByRole('button',{name:'Zaloguj się',exact:true}).click();await expect(page.locator('.account-error')).toContainText('Nieprawidłowy');
  await page.getByLabel('E-mail rodzica').fill('parent@example.test');await page.getByRole('button',{name:'Nie pamiętam hasła'}).click();await expect(page.getByRole('status')).toContainText('otrzymasz wiadomość');
  await signIn(page);cloud.setOffline(true);
  await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await page.getByRole('button',{name:'Otwórz moduł Food — Fun with food'}).click();await page.getByRole('button',{name:'Fiszki podstawa',exact:true}).click();
  const first=await page.locator('.question').innerText();await page.locator('.option').first().click();await expect(page.locator('.feedback')).toBeVisible();
  await page.reload();await page.getByRole('button',{name:'Kontynuuj',exact:true}).click();await expect(page.locator('.question')).toHaveText(first);await expect(page.locator('.feedback')).toBeVisible();
  cloud.setOffline(false);await page.getByRole('button',{name:'Kopia postępów',exact:true}).click();await page.getByRole('button',{name:'Otwórz konto',exact:true}).click();await page.getByRole('button',{name:'Synchronizuj teraz'}).click();await expect(page.getByRole('status')).toContainText('Wyniki zapisane na koncie.');
  expect(cloud.data.get('parent@example.test')!.progress.active.attempts).toHaveLength(1);
});

test('konto: konflikt nie nadpisuje drugiego urządzenia i zachowuje kopię po wyborze',async({page,context})=>{
  const cloud=backend();await cloud.connect(context);await page.goto('./');await signIn(page);cloud.setOffline(true);
  await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await page.getByRole('button',{name:'Otwórz moduł Food — Fun with food'}).click();await page.getByRole('button',{name:'Fiszki podstawa',exact:true}).click();
  await page.locator('.option').first().click();await expect(page.locator('.feedback')).toBeVisible();
  const other=emptyProgress();other.words['unit-2-food@1:word:apple']='known';cloud.data.set('parent@example.test',{revision:1,progress:other});
  cloud.setOffline(false);await page.getByRole('button',{name:'Kopia postępów',exact:true}).click();await page.getByRole('button',{name:'Otwórz konto',exact:true}).click();await page.getByRole('button',{name:'Synchronizuj teraz'}).click();
  await expect(page.getByRole('region',{name:'Różne wersje wyników'})).toBeVisible();expect(cloud.data.get('parent@example.test')!.progress).toEqual(other);
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Użyj wyników z urządzenia',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Wyniki zapisane na koncie.');
  expect(cloud.data.get('parent@example.test')!.progress.active.attempts).toHaveLength(1);
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię sprzed zmiany',exact:true}).click();
  const path=await(await downloaded).path();expect(JSON.parse(readFileSync(path!,'utf8')).progress).toEqual(other);
});
