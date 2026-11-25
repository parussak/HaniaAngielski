import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { AppState } from '../../src/app/state.ts';
import { emptyProgress } from '../../src/learning/model.ts';
import { makeSession } from '../../src/learning/session.ts';
import { studyView } from '../../src/views/study.ts';
import { engineModule } from '../fixtures/engine.ts';
import { exerciseOnScreen } from './helpers.ts';

test.use({ viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true, offline: true });

test('zwykły wybór pokazuje jedno duże pytanie i czytelne odpowiedzi pod nim', async ({ page }) => {
    const styles = ['style', 'theme'].map(name =>
        readFileSync(new URL(`../../src/${name}.css`, import.meta.url), 'utf8'),
    ).join('\n');
    const module = engineModule();
    const progress = emptyProgress();
    const session = makeSession([module], module, 'grammar', 'choice', false, progress);
    const exercise = module.exercises.find(task => task.id === session.items[0].id)!;
    const options = ['A small park', 'A very large library in the middle of the town', 'A swimming pool'];
    exercise.answers = [options[1]];
    exercise.options = options;
    progress.active = session;
    const state = new AppState();
    state.modules = [module];
    state.progress = progress;

    for (const [instruction, separator, question] of [
        ['Wybierz:', ' ', 'Which place has many books?'],
        ['Wybierz nazwę miejsca.', '\n\n', 'Where can you read a book?'],
        ['', '', 'Which place can you visit to borrow books?'],
    ]) {
        exercise.prompt = instruction + separator + question;
        await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}</style><body class="studying"><main><div class="content">${studyView(state)}</div></main></body>`);
        const heading = page.getByRole('heading', { name: question, exact: true });
        await expect(heading).toHaveCSS('font-size', '22px');
        if (instruction) {
            const instructionText = page.getByText(instruction, { exact: true });
            await expect(instructionText).toHaveCSS('font-size', '15px');
            expect((await instructionText.boundingBox())!.y).toBeLessThan((await heading.boundingBox())!.y);
        }
        const answers = page.locator('.answer-options');
        await expect(answers.getByRole('button')).toHaveCount(3);
        for (const option of options) {
            const button = answers.getByRole('button', { name: option, exact: true });
            await expect(button).toBeVisible();
            expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        }
        expect((await heading.boundingBox())!.y).toBeLessThan((await answers.boundingBox())!.y);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await expect(page.getByRole('textbox')).toHaveCount(0);
        expect(await exerciseOnScreen(page, module.exercises)).toBe(exercise);
    }
});
