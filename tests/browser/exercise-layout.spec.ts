import { expect, test } from './fixtures.ts';
import { resumeStudy } from './helpers.ts';
import { openBackup } from './navigation.ts';
import { modules } from '../materials.ts';
import { backup } from '../../src/learning/backup.ts';
import { emptyProgress, keyFor, type Exercise, type Item } from '../../src/learning/model.ts';
import { makeSession } from '../../src/learning/session.ts';

test.use({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });

test('pilotaż Technology: polecenie nad zdaniem w luce i wyborze, z obsługą starszego zapisu tekstu', async ({ page }, testInfo) => {
    const module = modules.find(entry => entry.id === 'unit-3-technology')!;
    const examples = [
        { id: 'send-email', input: 'text', instruction: 'Wpisz czasownik z wyrażenia „wysłać e-mail”.', sentence: 'I ___ an email to my teacher every Friday.' },
        { id: 'paper-in', input: 'choice', instruction: 'Wybierz:', sentence: 'To print my homework, I put paper in the ___.' },
    ] as const;
    await page.route('**/content/angielski-hani/kurs.json', async route => {
        const response = await route.fetch();
        await route.fulfill({ response, json: { ...await response.json(), modules: ['03-technology'] } });
    });
    await page.route('**/content/angielski-hani/03-technology/cwiczenia.json', async route => {
        const response = await route.fetch();
        const tasks: Exercise[] = await response.json();
        await route.fulfill({
            response,
            json: tasks.map(task => {
                const example = examples.find(candidate => candidate.id === task.id);
                return example ? { ...task, prompt: `${example.instruction}\n\n${example.sentence}` } : task;
            }),
        });
    });
    const progress = emptyProgress();
    progress.active = makeSession(modules, module, 'grammar', 'text', false, progress);
    const tasks = [...examples, { id: 'now-i-am', input: 'choice' }] as const;
    progress.active.items = tasks.map(({ id, input }): Item => ({
        key: keyFor(module, 'exercise', id), moduleId: module.id, version: 1, type: 'exercise', id, input,
    }));
    await page.goto('./');
    await openBackup(page);
    await page.locator('#import-file').setInputFiles({
        name: 'pilotaż.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup(progress))),
    });
    await page.getByRole('button', { name: 'Zastąp postępy', exact: true }).tap();
    await expect(page.locator('#app')).toHaveAttribute('aria-busy', 'false');
    await page.getByRole('button', { name: 'Moja nauka', exact: true }).tap();
    await resumeStudy(page);

    for (const example of examples) {
        const instruction = page.getByText(example.instruction, { exact: true });
        const question = page.getByRole('heading', { name: example.sentence, exact: true });
        await expect(instruction).toBeVisible();
        await expect(question).toBeVisible();
        expect((await instruction.boundingBox())!.y).toBeLessThan((await question.boundingBox())!.y);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`technologia-${example.input}.png`) });

        if (example.input === 'text') {
            await page.getByRole('textbox').fill('send');
            await page.getByRole('button', { name: /Sprawdź/ }).tap();
        } else {
            await expect(page.locator('.option')).toHaveCount(3);
            await page.getByRole('button', { name: 'printer', exact: true }).tap();
        }
        await expect(page.locator('.feedback.correct')).toBeVisible();
        await page.getByRole('button', { name: /Dalej/ }).tap();
    }

    const legacy = module.exercises.find(task => task.id === 'now-i-am')!;
    await expect(page.getByRole('heading', { name: legacy.prompt, exact: true })).toBeVisible();
});
