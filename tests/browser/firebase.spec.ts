import {resumeStudy} from './helpers.ts';
import {openWarmup,openStageReview} from './navigation.ts';
import {openBackup} from './navigation.ts';
import {openModule,openMap} from './navigation.ts';
import {test,expect,type BrowserContext,type Page} from './fixtures.ts';
import {readFileSync} from 'node:fs';
import {backup,emptyProgress} from '../../src/core.ts';
async function savedWords(page:Page){await openBackup(page);const download=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).click();return JSON.parse(readFileSync((await(await download).path())!,'utf8')).progress.words;}
const mockSDK=String.raw`
export const restoreUser=async()=>JSON.parse(localStorage.getItem('test-user')??'null');
function accounts(){return JSON.parse(localStorage.getItem('test-accounts')??'{}');}
function saveAccounts(a){localStorage.setItem('test-accounts',JSON.stringify(a));}
export async function login(email,password,register,name=''){const a=accounts();if(password==='wrongpass'||(a[email]&&a[email].password!==password))throw new Error('Nieprawidłowy e-mail lub hasło.');if(!a[email])a[email]={uid:email,email,displayName:register?name:null,password};saveAccounts(a);const {password:p,...user}=a[email];localStorage.setItem('test-user',JSON.stringify(user));return user;}
export async function changeName(name){const user=await restoreUser();user.displayName=name.trim().replace(/\s+/g,' ');const a=accounts();a[user.email].displayName=user.displayName;saveAccounts(a);localStorage.setItem('test-user',JSON.stringify(user));return user;}
async function check(password){const user=await restoreUser(),a=accounts();if(a[user.email].password!==password)throw new Error('Obecne hasło jest nieprawidłowe.');return {user,a};}
export async function changePassword(password,next){const {user,a}=await check(password);a[user.email].password=next;saveAccounts(a);}
export async function changeEmail(email,password){await check(password);localStorage.setItem('test-pending-email',email);}
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
  await page.getByRole('button',{name:'Ustawienia konta',exact:true}).click();
  await page.getByRole('textbox',{name:'E-mail'}).fill(email);
  await page.getByLabel('Hasło',{exact:true}).fill('test-password');
  await page.getByRole('button',{name:'Zaloguj się',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Twoje konto',exact:true})).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Wyniki zapisane na koncie.');
}

test('licznik powtórki etapu przechodzi między urządzeniami, zapisuje turę po awarii chmury i jest osobny dla kont',async({browser})=>{
  const cloud=backend(),a=await browser.newContext({baseURL:test.info().project.use.baseURL,viewport:{width:390,height:844}}),b=await browser.newContext({baseURL:test.info().project.use.baseURL,viewport:{width:390,height:844}});
  try{
    await cloud.connect(a);await cloud.connect(b);const page=await a.newPage();await page.goto('./');await signIn(page);
    const p=emptyProgress(),key='unit-2-food@1:word:apple';p.adventure={version:1,earned:0,completed:{},purchases:{},reviewSchema:1,reviewArchiveHead:null,stageReviews:{'unit-2-food/food':{round:3,items:{[key]:{item:{key,moduleId:'unit-2-food',version:1,type:'word',id:'apple',input:'text'},correct:2,due:6}}}}};
    await openBackup(page);await page.locator('#import-file').setInputFiles({name:'reviews.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();
    await page.getByRole('button',{name:'Ustawienia konta',exact:true}).click();await page.getByRole('button',{name:'Synchronizuj teraz'}).click();await expect(page.getByRole('status')).toContainText('Wyniki zapisane na koncie.');
    const second=await b.newPage();await second.goto('./');await signIn(second);await second.getByRole('button',{name:'Moja nauka',exact:true}).click();await openMap(second);await openStageReview(second);await expect(second.locator('.review-meter')).toHaveCount(0);await expect(second.getByRole('textbox')).toBeVisible();
    cloud.setOffline(true);await second.getByRole('textbox').fill('apple');await second.getByRole('button',{name:/Sprawdź/}).click();await second.getByRole('button',{name:/Dalej/}).click();await expect(second.getByRole('heading',{name:'Kocia rozgrzewka ukończona!',exact:true})).toBeVisible();
    await second.reload();await openMap(second);await expect(second.locator('.has-pending,.stage-review-step')).toHaveCount(0);
    cloud.setOffline(false);await second.getByRole('button',{name:'Ustawienia konta',exact:true}).click();await second.getByRole('button',{name:'Synchronizuj teraz'}).click();await expect(second.getByRole('status')).toContainText('Wyniki zapisane na koncie.');
    expect(cloud.data.get('parent@example.test')!.progress.adventure.stageReviews['unit-2-food/food'].items[key].correct).toBe(3);
    await page.getByRole('button',{name:'Wyloguj się',exact:true}).click();await signIn(page,'other-review@example.test');await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await openMap(page);await openWarmup(page);await expect(page.locator('button[data-action="stage-review"]')).toHaveCount(0);
  }finally{await a.close();await b.close();}
});

test('domek i gwiazdki synchronizują się na drugie urządzenie i nie przechodzą na inne konto',async({browser})=>{
  const cloud=backend(),a=await browser.newContext({baseURL:test.info().project.use.baseURL,viewport:{width:390,height:844}}),b=await browser.newContext({baseURL:test.info().project.use.baseURL,viewport:{width:390,height:844}});
  try{
    await cloud.connect(a);await cloud.connect(b);const page=await a.newPage();await page.goto('./');await signIn(page);
    const fixture={...emptyProgress(),adventure:{version:1 as const,earned:20,completed:{},purchases:{}}};
    await openBackup(page);await page.locator('#import-file').setInputFiles({name:'profile.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(fixture)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();
    await page.getByRole('button',{name:'Domek',exact:true}).click();await page.getByRole('button',{name:'Kup za 6 ★',exact:true}).click();await page.getByRole('button',{name:'Pod oknem',exact:true}).click();
    await page.getByRole('button',{name:'Ustawienia konta',exact:true}).click();await page.getByRole('button',{name:'Synchronizuj teraz'}).click();await expect(page.getByRole('status')).toContainText('Wyniki zapisane na koncie.');
    const second=await b.newPage();await second.goto('./');await signIn(second);await second.getByRole('button',{name:'Domek',exact:true}).click();await expect(second.locator('.star-wallet')).toContainText('14');await expect(second.locator('.room-decoration')).toHaveClass(/slot-window/);
    await page.getByRole('button',{name:'Wyloguj się',exact:true}).click();await signIn(page,'other-house@example.test');await page.getByRole('button',{name:'Domek',exact:true}).click();await expect(page.locator('.star-wallet')).toContainText('0');await expect(page.locator('.room-decoration')).toHaveCount(0);
  }finally{await a.close();await b.close();}
});

test('awatar otwiera konto na komputerze i telefonie, także klawiaturą',async({page})=>{
  for(const width of [1280,390]){
    await page.setViewportSize({width,height:844});await page.goto('./');
    const profile=page.getByRole('button',{name:'Ustawienia konta',exact:true});
    await expect(profile).toBeVisible();expect((await profile.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    if(width===1280){await profile.focus();await profile.press('Enter');}else await profile.click();
    await expect(page.getByRole('heading',{name:'Konto i synchronizacja',exact:true})).toBeVisible();
    await expect(page.getByLabel('E-mail',{exact:true})).toBeVisible();
  }
});

test('konto: migracja gościa, automatyczny zapis, drugie urządzenie i wylogowanie',async({browser})=>{
  const cloud=backend(),a=await browser.newContext({baseURL:test.info().project.use.baseURL,viewport:{width:390,height:844}}),b=await browser.newContext({baseURL:test.info().project.use.baseURL,viewport:{width:390,height:844}});
  try{
    await cloud.connect(a);await cloud.connect(b);const page=await a.newPage();await page.goto('./');
    const guest=emptyProgress();guest.words['unit-2-food@1:word:apple']='known';
    await openBackup(page);
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
    expect(await savedWords(second)).toEqual(guest.words);
    await page.getByRole('button',{name:'Wyloguj się',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Zaloguj się',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Moje postępy',exact:true}).click();
    expect(await savedWords(page)).toEqual(guest.words);
    // Inne konto nie otrzymuje automatycznie wyników gościa ani poprzedniego konta.
    await signIn(page,'other@example.test');expect(cloud.data.has('other@example.test')).toBe(false);
    await page.getByRole('button',{name:'Moje postępy',exact:true}).click();expect(await savedWords(page)).toEqual({});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }finally{await a.close();await b.close();}
});

test('konto: błędne logowanie, odzyskanie hasła i zapis bez sieci zachowany po odświeżeniu',async({page,context})=>{
  const cloud=backend();await cloud.connect(context);await page.goto('./');
  await page.getByRole('button',{name:'Ustawienia konta',exact:true}).click();
  await page.getByLabel('E-mail').fill('parent@example.test');await page.getByLabel('Hasło',{exact:true}).fill('wrongpass');
  await page.getByRole('button',{name:'Zaloguj się',exact:true}).click();await expect(page.locator('.account-error')).toContainText('Nieprawidłowy');
  await page.getByLabel('E-mail').fill('parent@example.test');await page.getByRole('button',{name:'Nie pamiętam hasła'}).click();await expect(page.getByRole('status')).toContainText('otrzymasz wiadomość');
  await signIn(page);cloud.setOffline(true);
  await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await openModule(page);await page.getByRole('button',{name:'Fiszki podstawa',exact:true}).click();
  const first=await page.locator('.question').innerText();await page.locator('.option').first().click();await expect(page.locator('.feedback')).toBeVisible();
  await page.reload();await resumeStudy(page);await expect(page.locator('.question')).toHaveText(first);await expect(page.locator('.feedback')).toBeVisible();
  cloud.setOffline(false);await openBackup(page);await page.getByRole('button',{name:'Otwórz konto',exact:true}).click();await page.getByRole('button',{name:'Synchronizuj teraz'}).click();await expect(page.getByRole('status')).toContainText('Wyniki zapisane na koncie.');
  expect(cloud.data.get('parent@example.test')!.progress.active.attempts).toHaveLength(1);
});

test('konto: konflikt nie nadpisuje drugiego urządzenia i zachowuje kopię po wyborze',async({page,context})=>{
  const cloud=backend();await cloud.connect(context);await page.goto('./');await signIn(page);cloud.setOffline(true);
  await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await openModule(page);await page.getByRole('button',{name:'Fiszki podstawa',exact:true}).click();
  await page.locator('.option').first().click();await expect(page.locator('.feedback')).toBeVisible();
  const other=emptyProgress();other.words['unit-2-food@1:word:apple']='known';cloud.data.set('parent@example.test',{revision:1,progress:other});
  cloud.setOffline(false);await openBackup(page);await page.getByRole('button',{name:'Otwórz konto',exact:true}).click();await page.getByRole('button',{name:'Synchronizuj teraz'}).click();
  await expect(page.getByRole('region',{name:'Różne wersje wyników'})).toBeVisible();expect(cloud.data.get('parent@example.test')!.progress).toEqual(other);
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Użyj wyników z urządzenia',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Wyniki zapisane na koncie.');
  expect(cloud.data.get('parent@example.test')!.progress.active.attempts).toHaveLength(1);
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię sprzed zmiany',exact:true}).click();
  const path=await(await downloaded).path();expect(JSON.parse(readFileSync(path!,'utf8')).progress).toEqual(other);
});

test('konto: imię, hasło, potwierdzana zmiana e-maila i osobny profil testowy',async({page,context})=>{
  const cloud=backend();await cloud.connect(context);await page.setViewportSize({width:390,height:844});await page.goto('./');
  await page.getByRole('button',{name:'Ustawienia konta',exact:true}).click();await page.getByRole('button',{name:'Nie mam konta — utwórz konto'}).click();
  await page.getByLabel('Imię',{exact:true}).fill('Paulina');await page.getByLabel('E-mail',{exact:true}).fill('paulina@example.test');await page.getByLabel('Hasło — co najmniej 8 znaków').fill('first-password');await page.getByRole('button',{name:'Utwórz konto',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Twoje konto',exact:true})).toBeVisible();await expect(page.getByLabel('Twoje imię')).toHaveValue('Paulina');
  await page.getByLabel('Twoje imię').fill('Paulina Test');await page.getByRole('button',{name:'Zapisz imię',exact:true}).click();await expect(page.getByText('Imię zostało zapisane.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await expect(page.getByRole('heading',{name:/^Dobrze Cię widzieć, Paulina Test/})).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-sync-label]')).toHaveText('Zapis na koncie');
  await expect.poll(()=>page.evaluate(()=>new Promise(resolve=>{
    const request=indexedDB.open(`hania-language:${new URL('.',location.href).pathname}`,1);
    request.onsuccess=()=>{
      const db=request.result,tx=db.transaction('progress','readonly'),read=tx.objectStore('progress').get('firebase-user');
      tx.oncomplete=()=>{db.close();resolve(read.result?.displayName);};
    };
  }))).toBe('Paulina Test');
  await expect(page.getByRole('heading',{name:/^Dobrze Cię widzieć, Paulina Test/})).toBeVisible();
  await page.getByRole('button',{name:'Ustawienia konta',exact:true}).click();await page.locator('.account-settings summary').filter({hasText:'Zmień hasło'}).click();
  const fillPasswords=async(current:string,next:string,confirm=next)=>{await page.getByLabel('Obecne hasło',{exact:true}).fill(current);await page.getByLabel('Nowe hasło — co najmniej 8 znaków').fill(next);await page.getByLabel('Powtórz nowe hasło').fill(confirm);await page.getByRole('button',{name:'Zmień hasło',exact:true}).click();};
  await fillPasswords('wrongpass','second-password');await expect(page.locator('.account-error')).toContainText('Obecne hasło jest nieprawidłowe');
  await fillPasswords('first-password','second-password','third-password');await expect(page.locator('.account-error')).toContainText('Nowe hasła nie są takie same');
  await fillPasswords('first-password','second-password');await expect(page.getByText('Hasło zostało zmienione.',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Zmień konto',exact:true}).click();
  await page.getByLabel('E-mail',{exact:true}).fill('paulina@example.test');await page.getByLabel('Hasło',{exact:true}).fill('second-password');await page.getByRole('button',{name:'Zaloguj się',exact:true}).click();await expect(page.getByLabel('Twoje imię')).toHaveValue('Paulina Test');
  await page.getByText('Zmień e-mail',{exact:true}).click();await page.getByLabel('Nowy e-mail',{exact:true}).fill('paulina-new@example.test');await page.getByLabel('Obecne hasło — potwierdzenie zmiany e-maila').fill('second-password');await page.getByRole('button',{name:'Wyślij potwierdzenie zmiany e-maila'}).click();
  await expect(page.locator('.account-email')).toHaveText('paulina@example.test');await expect(page.getByText('Wysłaliśmy link na nowy adres.',{exact:false})).toBeVisible();
  // Symulacja kliknięcia potwierdzenia po stronie Firebase — UID pozostaje stały.
  await page.evaluate(()=>{
    const accounts=JSON.parse(localStorage.getItem('test-accounts')!);const old=accounts['paulina@example.test'];delete accounts['paulina@example.test'];accounts['paulina-new@example.test']={...old,email:'paulina-new@example.test'};localStorage.setItem('test-accounts',JSON.stringify(accounts));
    const {password,...user}=accounts['paulina-new@example.test'];localStorage.setItem('test-user',JSON.stringify(user));
  });
  await page.getByRole('button',{name:'Odśwież dane konta'}).click();await expect(page.locator('.account-email')).toHaveText('paulina-new@example.test');await expect(page.getByLabel('Twoje imię')).toHaveValue('Paulina Test');
  await page.screenshot({path:'test-results/account-settings-mobile.png',fullPage:true});
  await page.reload();await page.getByRole('button',{name:'Ustawienia konta',exact:true}).click();await expect(page.locator('.account-email')).toHaveText('paulina-new@example.test');
  await page.getByRole('button',{name:'Zmień konto',exact:true}).click();await page.getByRole('button',{name:'Nie mam konta — utwórz konto'}).click();await page.getByLabel('Imię',{exact:true}).fill('Tester');await page.getByLabel('E-mail',{exact:true}).fill('tester@example.test');await page.getByLabel('Hasło — co najmniej 8 znaków').fill('tester-password');await page.getByRole('button',{name:'Utwórz konto',exact:true}).click();await expect(page.getByLabel('Twoje imię')).toHaveValue('Tester');
  await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await expect(page.getByRole('heading',{name:/^Dobrze Cię widzieć, Tester/})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
