import { readFileSync } from 'node:fs';
import { readLibrary } from '../src/materials/library.ts';
const base = new URL('../public/content/', import.meta.url);
const read = (path: string) => JSON.parse(readFileSync(new URL(path,base),'utf8'));
export const library = await readLibrary(async path => read(path));
export const modules = library.modules;
export const courses = library.courses;
