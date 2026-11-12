import {resumeStudy} from './helpers.ts';
import {openBackup} from './navigation.ts';
import { test, expect, type Page } from './fixtures.ts';
import { readFileSync } from 'node:fs';
import { courseFixture } from '../fixtures/course-materials.ts';
import { foodModules as modules } from '../materials.ts';
import { readLibrary } from '../../src/materials/library.ts';
import { backup, emptyProgress, keyFor, makeSession, next, questionFor, recordAnswer, type Item, type Module, type Progress } from '../../src/core.ts';
import { openModule } from './navigation.ts';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const m = modules[0];
const item = (m: Module, id: string, type: Item['type'] = 'word'): Item => ({ key: keyFor(m,type,id), moduleId:m.id, version:1, type, id, input:'text' });
function seed(all: Module[], items: Item[]) {
    const p=emptyProgress();
    for(const i of items){p.active=makeSession(all,all.find(m=>m.id===i.moduleId)!,'quiz','text',false,p);p.active.items=[i];recordAnswer(p,questionFor(all,i),questionFor(all,i).answers[0]);next(p);}
    return p;
}
async function restore(page: Page, p: Progress) {
    await page.goto('./');await openBackup(page);
    await page.locator('#import-file').setInputFiles({name:'known.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});
    await page.getByRole('button',{name:'Zastąp postępy',exact:true}).tap();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();
}
async function choose(page: Page, id: string) {
    await page.getByRole('button',{name:'Wybierz kurs',exact:true}).tap();await page.getByRole('button',{name:`Wybierz kurs Test: ${id}`,exact:true}).tap();
}
async function global(page: Page) { await page.getByRole('button',{name:'Ćwicz cały poznany materiał →',exact:true}).tap(); }
async function downloaded(page: Page) {
    await openBackup(page);const pending=page.waitForEvent('download');
    await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).tap();const file=await(await pending).path();return JSON.parse(readFileSync(file!,'utf8')).progress as Progress;
}

test('Food: puste globalne zestawy mają wyjaśnienie i nie blokują mapy ani modułu',async({page})=>{
    await page.setViewportSize({width:320,height:640});await page.goto('./');await global(page);
    await expect(page.getByRole('heading',{name:'Cały poznany materiał',exact:true})).toBeVisible();
    await expect(page.locator('[data-action="course-mode"]')).toHaveCount(3);
    for(const button of await page.locator('[data-action="course-mode"]').all())await expect(button).toBeDisabled();
    await expect(page.locator('.course-empty')).toContainText('Najpierw spróbuj odpowiedzieć');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.getByRole('button',{name:'Przejdź do modułów',exact:true}).tap();
    await expect(page.getByRole('button',{name:'Otwórz moduł Food — Fun with food'})).toBeVisible();
});

test('Food: globalne fiszki wracają do zaliczonych słów, a modułowe i gwiazdki działają jak wcześniej',async({page})=>{
    const p=seed(modules,[item(m,'apple'),item(m,'bread'),item(m,'g-so-sport','exercise')]);await restore(page,p);await global(page);
    await expect(page.getByRole('button',{name:/Fiszki z poznanego materiału/})).toContainText('2 poznane hasła');
    await expect(page.getByRole('button',{name:/Quiz z poznanego materiału/})).toContainText('2 poznane pytania');
    await expect(page.getByRole('button',{name:/Gramatyka z poznanego materiału/})).toContainText('1 poznane pytanie');
    await page.getByText('Wybieram odpowiedź',{exact:true}).tap();await page.getByRole('button',{name:/Fiszki z poznanego materiału/}).tap();
    await expect(page.locator('.study-heading .tag')).toHaveText('1 / 2');
    while(await page.locator('.question').count()){
        const cue=await page.locator('.question').innerText(),word=m.words.find(w=>w.front===cue)!;expect(['apple','bread']).toContain(word.id);
        expect((await page.locator('.option').allTextContents()).join(' ')).not.toContain('water');
        await page.getByRole('button',{name:word.back,exact:true}).tap();await page.getByRole('button',{name:/Dalej/}).tap();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
    }
    await expect(page.getByRole('button',{name:'Wróć do poznanego materiału',exact:true})).toBeVisible();
    const saved=await downloaded(page);expect(saved.sessions.at(-1)!.scope).toEqual({kind:'course',courseId:'angielski-hani'});expect(saved.adventure?.earned??0).toBe(0);
    expect(saved.words[keyFor(m,'word','apple')]).toBe('known');expect(saved.words[keyFor(m,'word','bread')]).toBe('known');
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await openModule(page);
    await page.getByRole('button',{name:'Fiszki podstawa',exact:true}).tap();
    expect(['jabłko','chleb']).not.toContain(await page.locator('.question').innerText());
});

test('globalny quiz zachowuje opcje, błąd i poprawę po odświeżeniu',async({page})=>{
    await restore(page,seed(modules,[item(m,'apple'),item(m,'bread')]));await global(page);await page.getByText('Wybieram odpowiedź',{exact:true}).tap();
    await page.getByRole('button',{name:/Quiz z poznanego materiału/}).tap();await expect(page.locator('.option')).toHaveCount(2);
    const prompt=await page.locator('.question').innerText(),q=m.exercises.find(q=>q.prompt===prompt)!;
    await page.getByRole('button',{name:q.answers[0]==='apple'?'bread':'apple',exact:true}).tap();await expect(page.locator('.feedback.incorrect')).toBeVisible();
    await page.reload();await resumeStudy(page);
    await expect(page.locator('.question')).toHaveText(prompt);await expect(page.locator('.feedback.incorrect')).toBeVisible();
    await page.getByRole('button',{name:'Spróbuję jeszcze raz',exact:true}).tap();await expect(page.locator('.option')).toHaveCount(2);
    await page.getByRole('button',{name:q.answers[0],exact:true}).tap();await expect(page.locator('.feedback.correct')).toBeVisible();
});

test('globalna gramatyka pokazuje tylko wcześniej próbowane pytanie i wyjaśnia regułę',async({page})=>{
    await restore(page,seed(modules,[item(m,'g-so-sport','exercise')]));await global(page);
    await page.getByText('Wpisuję odpowiedź',{exact:true}).tap();await page.getByRole('button',{name:/Gramatyka z poznanego materiału/}).tap();
    await expect(page.locator('.study-heading .tag')).toHaveText('1 / 1');await expect(page.locator('.question')).toHaveText(m.exercises.find(q=>q.id==='g-so-sport')!.prompt);
    await expect(page.locator('.option')).toHaveCount(2);await page.getByRole('button',{name:'so',exact:true}).tap();
    await expect(page.locator('.grammar-explanation')).toContainText('Dlaczego tak?');
});

test('wybór kursu filtruje moduły, zapisuje się lokalnie i zachowuje globalną sesję innego kursu',async({page})=>{
    const f=courseFixture(),all=(await readLibrary(f.read)).modules;
    await page.route('**/content/**',route=>{const path=new URL(route.request().url()).pathname.split('/content/')[1];return path in f.files?route.fulfill({json:f.files[path]}):route.continue();});
    const en=all[0],fr=all[1],p=seed(all,[item(en,'coffee-drink'),item(fr,'coffee-drink')]);await restore(page,p);await choose(page,'french-book');
    await page.getByRole('button',{name:/Przejdź do modułów/}).tap();await expect(page.locator('.module-card')).toHaveCount(1);await expect(page.locator('.module-card')).toContainText('french-book');
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await global(page);await page.getByRole('button',{name:/Quiz z poznanego materiału/}).tap();
    await expect(page.locator('.question')).toHaveText('Podaj po francusku: kawa');await expect(page.getByRole('textbox')).toBeVisible();
    await page.getByRole('textbox').fill('cafe');await page.getByRole('button',{name:/Sprawdź/}).tap();await expect(page.locator('.feedback.incorrect')).toBeVisible();
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await choose(page,'italian-book');
    await expect(page.locator('.course-context')).toContainText('italian-book');await expect(page.locator('.course-resume')).toContainText('french-book');
    await page.reload();await expect(page.locator('.course-context')).toContainText('italian-book');
    await page.getByRole('button',{name:'Wróć do rozpoczętej sesji',exact:true}).tap();
    await expect(page.locator('.question')).toHaveText('Podaj po francusku: kawa');await expect(page.locator('.feedback.incorrect')).toBeVisible();
    const original=(await downloaded(page)).active!;
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await choose(page,'english-book');await global(page);
    page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:/Fiszki z poznanego materiału/}).tap();
    await expect(page.getByRole('heading',{name:'Cały poznany materiał',exact:true})).toBeVisible();
    expect((await downloaded(page)).active).toEqual(original);
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await page.screenshot({path:'test-results/course-choice-session-mobile.png',fullPage:true});
});

test('pierwsza próba pozostaje poznana po zastąpieniu nieukończonej sesji',async({page})=>{
    await page.goto('./');await openModule(page);await page.getByText('Wpisuję odpowiedź',{exact:true}).tap();await page.getByRole('button',{name:'Fiszki podstawa',exact:true}).tap();
    const prompt=await page.locator('.question').innerText(),word=m.words.find(w=>w.front===prompt)!;
    await page.getByRole('textbox').fill(word.back);await page.getByRole('button',{name:/Sprawdź/}).tap();await expect(page.locator('.feedback.correct')).toBeVisible();
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await global(page);
    page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:/Fiszki z poznanego materiału/}).tap();await expect(page.locator('.question')).toHaveText(prompt);
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await global(page);
    await expect(page.getByRole('button',{name:/Fiszki z poznanego materiału/})).toContainText('1 poznane hasło');
});
