import {test,expect,type Page} from './fixtures.ts';
import {openBackup,openMap} from './navigation.ts';
import {resumeStudy,answerCurrent,finishCurrent} from './helpers.ts';
import {backup,emptyProgress,makeSession,questionFor,isCorrect,type Progress} from '../../src/core.ts';
import {foodModules as modules} from '../materials.ts';
import {pwaServer} from './pwa-server.ts';
import {readFileSync} from 'node:fs';
const m=modules[0];
async function restore(page:Page,p:Progress){await page.goto('./');await openBackup(page);await page.locator('#import-file').setInputFiles({name:'board.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await resumeStudy(page);}
async function exported(page:Page){await openBackup(page);const wait=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).click();return JSON.parse(readFileSync((await(await wait).path())!,'utf8')).progress as Progress;}
function gaps(){const p=emptyProgress(),qs=m.exercises.filter(q=>q.kind==='grammar'&&q.prompt.includes('___')),first=qs[0],second=qs.find(q=>q.answers[0]!==first.answers[0])!;p.active=makeSession(modules,m,'grammar','mixed',false,p);const group=`${m.id}@${first.rev??1}:exercise:${first.id}`;p.active.items=[first,second].map(q=>({key:`${m.id}@${q.rev??1}:exercise:${q.id}`,moduleId:m.id,version:q.rev??1,type:'exercise',id:q.id,input:'choice',presentation:'bank',gapGroup:group}));return p;}
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test('pary: czerwony błysk zamiast przerwy, zapis błędu i jedno podsumowanie całej planszy',async({page})=>{
 await page.goto('./');await openMap(page);await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).click();await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();
 await answerCurrent(page,modules,false);await expect(page.locator('.pair-board')).toBeVisible();await expect(page.locator('.feedback,.grammar-explanation')).toHaveCount(0);await expect(page.getByRole('button',{name:/Dalej/})).toHaveCount(1);await expect.poll(()=>page.locator('.match-flash').first().evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe('rgb(246, 183, 189)');
 await answerCurrent(page,modules);await expect(page.locator('.board-summary')).toContainText('Plansza ukończona');await expect(page.locator('.board-summary')).not.toContainText('poprawnie za pierwszym razem');await page.getByRole('button',{name:/Dalej/}).click();await finishCurrent(page,modules);
 const p=await exported(page);expect(p.sessions.at(-1)!.attempts.some(a=>!a.first&&a.corrected)).toBeTruthy();expect(p.sessions.at(-1)!.items).toHaveLength(5);
});
test('dwa zdania i dwa słowa: klik słowa i luki, odświeżenie i sprawdzenie planszy',async({page})=>{
 const p=gaps();await restore(page,p);await expect(page.locator('.gap-target')).toHaveCount(2);await expect(page.locator('.bank-token')).toHaveCount(2);await expect(page.getByText(/W luce:/)).toHaveCount(0);
 const item=p.active!.items[0],q=questionFor(modules,item);await page.getByRole('button',{name:q.answers[0],exact:true}).click();await page.locator('.gap-target').first().click();await expect(page.locator('.gap-target').first()).toContainText(q.answers[0]);await page.reload();await expect(page.locator('.gap-target').first()).toContainText(q.answers[0]);
 await answerCurrent(page,modules);await expect(page.locator('.board-summary')).toBeVisible();await page.screenshot({path:'test-results/multi-gap-board-summary.png',fullPage:true});
});
test('rzeczywisty gest dotykowy przenosi słowo w lukę',async({page,context})=>{
 const p=gaps();await restore(page,p);const q=questionFor(modules,p.active!.items[0]);const token=page.getByRole('button',{name:q.answers[0],exact:true}),target=page.locator('.gap-target').first();await token.scrollIntoViewIfNeeded();const a=(await token.boundingBox())!,b=(await target.boundingBox())!,cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x+a.width/2,y:a.y+a.height/2,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(target).toContainText(q.answers[0]);await expect(page.locator('.gap-drag-ghost')).toHaveCount(0);
});

test('Dalej po błędzie i pustej luce kończy planszę bez blokady i bez odebrania gwiazdek',async({page})=>{
 const p=gaps(),[a,b]=p.active!.items,qb=questionFor(modules,b);p.adventure={version:1,earned:23,purchases:{},completed:{}};await restore(page,p);
 const gap=page.locator(`.gap-target[data-key=${JSON.stringify(a.key)}]`);await page.getByRole('button',{name:qb.answers[0],exact:true}).click();await gap.click();
 await expect(gap).toHaveClass(/gap-incorrect/);await expect.poll(()=>gap.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(252, 226, 232)');await page.reload();await expect(gap).toHaveClass(/gap-incorrect/);
 await page.getByRole('button',{name:/Dalej/}).click();await expect(page.locator('.summary')).toBeVisible();const saved=await exported(page);expect(saved.active).toBeNull();expect(saved.sessions.at(-1)!.attempts).toHaveLength(2);expect(saved.adventure!.earned).toBe(23);
});

test('wyjaśnienia po całej planszy zachowują zdania i luki, a czerwony znika po poprawie',async({page})=>{
 const p=gaps(),[a,b]=p.active!.items,qa=questionFor(modules,a),qb=questionFor(modules,b);await restore(page,p);
 const gapA=page.locator(`.gap-target[data-key=${JSON.stringify(a.key)}]`),gapB=page.locator(`.gap-target[data-key=${JSON.stringify(b.key)}]`);
 await page.getByRole('button',{name:qb.answers[0],exact:true}).click();await gapA.click();await expect(page.locator('.board-explanation')).toHaveCount(0);
 await page.getByRole('button',{name:qa.answers[0],exact:true}).click();await gapB.click();await expect(page.locator('.gap-explanation')).toHaveCount(2);await expect(page.locator('.gap-sentence')).toHaveCount(2);await expect(page.locator('.gap-incorrect')).toHaveCount(2);
 await expect(page.locator('.board-explanation')).not.toContainText('poprawnie za pierwszym razem');await page.screenshot({path:'test-results/gaps-wrong-explanation-mobile.png',fullPage:true});
 await gapB.click();await gapA.click();await expect(gapA).toHaveClass(/gap-correct/);await expect(gapA).not.toHaveClass(/gap-incorrect/);await expect(gapB).toHaveClass(/gap-incorrect/);
 await page.getByRole('button',{name:qb.answers[0],exact:true}).click();await gapB.click();await expect(page.locator('.board-summary .answer-bank')).toBeVisible();await expect(page.locator('.gap-correct')).toHaveCount(2);await expect(page.locator('.board-explanation')).toContainText('Tak jest!');await page.screenshot({path:'test-results/gaps-correct-explanation-mobile.png',fullPage:true});
 expect(await page.locator('.study-card').evaluate(el=>getComputedStyle(el).overflowY)).toBe('auto');await page.locator('.gap-explanation').last().scrollIntoViewIfNeeded();await expect(page.locator('.gap-explanation').last()).toBeInViewport();await page.screenshot({path:'test-results/gaps-explanation-scrolled-mobile.png',fullPage:true});
 await page.getByRole('button',{name:/Dalej/}).click();await expect(page.locator('.summary')).toBeVisible();
});

test('błędne słowo można przenieść między lukami i odłożyć; bank zostawia puste miejsce',async({page})=>{
 const p=gaps(),[a,b]=p.active!.items,qa=questionFor(modules,a),qb=questionFor(modules,b);await restore(page,p);
 const gapA=page.locator(`.gap-target[data-key=${JSON.stringify(a.key)}]`),gapB=page.locator(`.gap-target[data-key=${JSON.stringify(b.key)}]`);
 const token=page.locator(`.bank-token[data-answer=${JSON.stringify(qb.answers[0])}]`),before=(await token.boundingBox())!;
 expect(await token.locator('span').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(15);
 await token.click();await gapA.click();await expect(gapA).toHaveClass(/match-flash/);await expect(gapA).toContainText(qb.answers[0]);
 await expect(page.locator('.bank-empty')).toHaveCount(1);expect((await token.boundingBox())!.width).toBeCloseTo(before.width,0);
 await page.reload();await expect(gapA).toContainText(qb.answers[0]);await gapA.click();await expect(gapA).toHaveClass(/is-selected/);
 await gapA.dragTo(page.locator('.bank-options'));await expect(gapA).toHaveText('…');await expect(page.locator('.bank-empty')).toHaveCount(0);
 await page.getByRole('button',{name:qb.answers[0],exact:true}).click();await gapA.click();await gapA.click();await gapB.click();await expect(gapB).toHaveClass(/gap-correct/);await expect(gapA).toHaveText('…');await page.screenshot({path:'test-results/gap-empty-bank-mobile.png',fullPage:true});
 await page.getByRole('button',{name:qa.answers[0],exact:true}).click();await gapA.click();await expect(page.locator('.board-summary')).toBeVisible();
 const saved=await exported(page);expect(saved.active!.attempts).toHaveLength(2);expect(saved.active!.attempts.find(t=>t.key===a.key)!.first).toBe(false);
});
test('cofanie, odświeżenie, kontynuacja i restart nie kasują gwiazdek',async({page})=>{
 await page.goto('./');await openMap(page);const mapUrl=page.url();await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).click();const title=await page.locator('h1').innerText();await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();await expect(page.locator('.pair-board')).toBeVisible();await page.reload();await expect(page.locator('.pair-board')).toBeVisible();
 await page.goBack();await expect(page.locator('.lesson-resume-actions')).toBeVisible();await expect(page.getByRole('button',{name:'Kontynuuj',exact:true})).toBeVisible();await page.goBack();await expect(page.locator('.journey-path')).toBeVisible();expect(page.url()).toBe(mapUrl);await page.goForward();await expect(page.locator('h1')).toHaveText(title);
 await page.getByRole('button',{name:'Kontynuuj',exact:true}).click();await answerCurrent(page,modules,false);await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await expect(page.locator('.course-context')).toBeVisible();await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).click();await expect(page.locator('.lesson-resume-actions')).toBeVisible();await expect(page.locator('.course-context')).toHaveCount(0);
 await page.getByRole('button',{name:'Zacznij od nowa',exact:true}).click();await expect(page.locator('.pair-board')).toBeVisible();const saved=await exported(page);expect(saved.active!.index).toBe(0);expect(saved.active!.attempts).toHaveLength(0);expect(saved.adventure!.earned).toBe(0);expect(Object.keys(saved.adventure!.memory??{}).length).toBeGreaterThan(0);
});
test('rozgrzewka jest przed drugą mapą i używa wcześniej poznanego Food',async({page})=>{
 const p=emptyProgress();p.encountered=[`${m.id}@1:word:apple`];p.active=makeSession(modules,m,'quiz','text',false,p);p.active=null;
 await page.goto('./');await openBackup(page);await page.locator('#import-file').setInputFiles({name:'known.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();await page.getByRole('button',{name:'Mapy',exact:true}).click();await page.getByRole('button',{name:'Otwórz mapę Kocia kuchnia — Food w praktyce',exact:true}).click();await expect(page.locator('.course-context')).toHaveCount(0);await page.getByRole('button',{name:/Rozgrzej łapki/}).click();await expect(page.locator('.study-heading h1')).toHaveText('Kocia rozgrzewka');await expect(page.locator('.question')).toHaveText('jabłko');
});
test.describe('ramka aktualizacji',()=>{
 test.use({serviceWorkers:'allow'});
 test('pojawia się poza lekcją i nie czyści formularza konta',async({page})=>{
  test.skip(process.env.HANIA_TEST_BUILD!=='1'||!!process.env.HANIA_BASE_URL,'Wymaga lokalnej PWA.');const server=await pwaServer();try{
   await page.goto(server.url);await expect(page.locator('[data-offline-status]')).toContainText('Materiały gotowe');await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBeTruthy();await page.getByRole('button',{name:'Konto',exact:true}).click();await page.getByRole('textbox',{name:'E-mail'}).fill('draft@example.test');server.setVersion(2);await page.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration())!.update();});await expect(page.locator('.update-banner')).toBeVisible();await expect(page.getByRole('textbox',{name:'E-mail'})).toHaveValue('draft@example.test');
   await openMap(page);await expect(page.locator('.update-banner')).toBeVisible();await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).click();await expect(page.locator('.update-banner')).toBeVisible();await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();await expect(page.locator('.pair-board')).toBeVisible();await expect(page.locator('.update-banner')).toHaveCount(0);await finishCurrent(page,modules);await expect(page.locator('.update-banner')).toBeVisible();
  }finally{await server.close();}
 });
});
