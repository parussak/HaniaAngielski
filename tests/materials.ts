import { readFileSync } from 'node:fs';
import { readLibrary } from '../src/materials/library.ts';
import {moduleById,courseById} from './fixtures/select.ts';
import {growingLibrary} from './fixtures/growing-library.ts';
const base = new URL('../public/content/', import.meta.url);
const read = (path: string) => JSON.parse(readFileSync(new URL(path,base),'utf8'));
export const library = await readLibrary(process.env.HANIA_TEST_GROWTH==='1'?growingLibrary(async path=>read(path)):async path=>read(path));
export const modules = library.modules;
export const courses = library.courses;
export const food=moduleById(library,'unit-2-food');
export const foodCourse=courseById(library,'angielski-hani');
// Food regressions intentionally exercise this module alone. General engine
// tests use synthetic data; catalog tests use the full library above.
export const foodModules=[food];
export const foodCourses=[foodCourse];
