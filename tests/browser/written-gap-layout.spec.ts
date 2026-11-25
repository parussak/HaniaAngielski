import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { AppState } from '../../src/app/state.ts';
import { emptyProgress } from '../../src/learning/model.ts';
import { makeSession } from '../../src/learning/session.ts';
import { studyView } from '../../src/views/study.ts';
import { engineModule } from '../fixtures/engine.ts';
import { exerciseOnScreen } from './helpers.ts';

test.use({ viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true, offline: true });

test('jeden widok wpisywania mieści starsze i nowe polecenia na małym ekranie', async ({ page }) => {
    const styles = ['style', 'theme'].map(name =>
        readFileSync(new URL(`../../src/${name}.css`, import.meta.url), 'utf8'),
    ).join('\n');
    for (const [id, instruction, separator, sentence] of [
        ['first-unit', 'Wpisz nazwę opakowania (butelka):', ' ', 'a ___ of water.'],
        ['second-unit', 'Uzupełnij opis urządzenia.', '\n\n', 'The letter G is on the ___.'],
    ]) {
        const module = engineModule(id);
        const progress = emptyProgress();
        const session = makeSession([module], module, 'grammar', 'text', false, progress);
        const exercise = module.exercises.find(task => task.id === session.items[0].id)!;
        exercise.prompt = instruction + separator + sentence;
        progress.active = session;
        const state = new AppState();
        state.modules = [module];
        state.progress = progress;
        await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}</style><body class="studying"><main><div class="content">${studyView(state)}</div></main></body>`);

        const heading = page.getByRole('heading', { name: sentence, exact: true });
        const instructionText = page.getByText(instruction, { exact: true });
        await expect(instructionText).toHaveCSS('font-size', '15px');
        await expect(heading).toHaveCSS('font-size', '22px');
        expect((await instructionText.boundingBox())!.y).toBeLessThan((await heading.boundingBox())!.y);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await expect(page.getByRole('textbox')).toHaveAttribute('aria-describedby', 'answer-hint');
        await expect(page.getByRole('button', { name: 'Sprawdź' })).toBeVisible();
        expect(await exerciseOnScreen(page, module.exercises)).toBe(exercise);
    }
});
