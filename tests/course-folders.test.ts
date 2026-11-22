import assert from 'node:assert/strict';
import test from 'node:test';
import { readLibrary } from '../src/materials/library.ts';
import { courseFixture } from './fixtures/course-materials.ts';

/** U-11: the same synthetic course, read from the flat layout and from a course folder. */
function folderLayout(courseId = 'english-book') {
    const f = courseFixture();
    const { moduleIds, ...course } = f.courses[0];
    const files: Record<string, unknown> = { 'katalog.json': { version: 1, courseFolders: [courseId] }, [`${courseId}/kurs.json`]: { ...course, id: courseId, modules: ['english'] } };
    for (const [path, data] of Object.entries(f.files)) if (path.startsWith('english/')) files[`${courseId}/${path}`] = data;
    const read = async (path: string) => { if (!(path in files)) throw new Error(`Brak pliku testowego: ${path}`); return structuredClone(files[path]); };
    return { files, read, moduleIds };
}

test('kurs w własnym folderze: moduły i ich id pochodzą z folderu kursu', async () => {
    const { read, moduleIds } = folderLayout();
    const library = await readLibrary(read);
    assert.deepEqual(library.courses.map(c => c.id), ['english-book']);
    assert.deepEqual(library.courses[0].moduleIds, moduleIds);
    assert.deepEqual(library.modules.map(m => m.id), moduleIds);
});

test('kurs w własnym folderze: identyfikator kursu musi być nazwą folderu', async () => {
    const { files, read } = folderLayout();
    files['english-book/kurs.json'] = { ...(files['english-book/kurs.json'] as object), id: 'inny-kurs' };
    await assert.rejects(readLibrary(read), /nazwą jego folderu/);
});

test('kurs w własnym folderze: brak listy modułów jest odrzucony', async () => {
    const { files, read } = folderLayout();
    files['english-book/kurs.json'] = { ...(files['english-book/kurs.json'] as object), modules: [] };
    await assert.rejects(readLibrary(read), /opis kursu/);
});

test('katalog bez modułów i bez folderów kursów jest odrzucony', async () => {
    await assert.rejects(readLibrary(async () => ({ version: 1 })), /katalog/);
});

test('plik tematów gramatyki kursu leży w folderze kursu', async () => {
    const { files, read } = folderLayout();
    files['english-book/kurs.json'] = { ...(files['english-book/kurs.json'] as object), grammarTopicsFile: 'tematy-gramatyki.json' };
    // The file is read from the course folder (a missing file fails loudly, it is not skipped).
    await assert.rejects(readLibrary(read), /Brak pliku testowego: english-book\/tematy-gramatyki\.json/);
});
