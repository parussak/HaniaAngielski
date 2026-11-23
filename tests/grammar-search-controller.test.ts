import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import ts from 'typescript';
import { createGrammarSearchController } from '../src/controllers/grammar-search.ts';
import { matchesSearch } from '../src/learning/grammar-search.ts';

test('zapytanie z pola wyszukiwania trafia do stanu i zostaje po przerysowaniu', () => {
    const store = { grammarQuery: '' };
    const search = createGrammarSearchController(store);
    assert.equal(search.handleInput({ id: 'grammar-search', value: 'pc-basic' }), true);
    assert.equal(store.grammarQuery, 'pc-basic');
});

test('inne pola nie zmieniają zapytania', () => {
    const store = { grammarQuery: 'abc' };
    const search = createGrammarSearchController(store);
    assert.equal(search.handleInput({ id: 'answer', value: 'x' }), false);
    assert.equal(store.grammarQuery, 'abc');
});

test('puste zapytanie czyści stan i pokazuje wszystkie tematy', () => {
    const store = { grammarQuery: 'abc' };
    createGrammarSearchController(store).handleInput({ id: 'grammar-search', value: '' });
    assert.equal(store.grammarQuery, '');
    assert.ok(matchesSearch('dowolny temat', store.grammarQuery));
});

// Zasada 3 (docs/zasady-kodu.md): widok tylko składa HTML i stosuje filtr do DOM — stanu nie zapisuje.
const views = new URL('../src/views/', import.meta.url);
test('żaden plik w src/views/ nie przypisuje do state.*', () => {
    const offenders: string[] = [];
    for (const name of readdirSync(views).filter(n => n.endsWith('.ts'))) {
        const file = ts.createSourceFile(name, readFileSync(new URL(name, views), 'utf8'), ts.ScriptTarget.ES2022, true);
        const root = (e: ts.Expression): ts.Expression => ts.isPropertyAccessExpression(e) || ts.isElementAccessExpression(e) ? root(e.expression) : e;
        const visit = (n: ts.Node) => {
            const target = ts.isBinaryExpression(n) && n.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && n.operatorToken.kind <= ts.SyntaxKind.LastAssignment ? n.left
                : (ts.isPrefixUnaryExpression(n) || ts.isPostfixUnaryExpression(n)) && (n.operator === ts.SyntaxKind.PlusPlusToken || n.operator === ts.SyntaxKind.MinusMinusToken) ? n.operand : undefined;
            if (target && (ts.isPropertyAccessExpression(target) || ts.isElementAccessExpression(target))) {
                const base = root(target);
                if (ts.isIdentifier(base) && base.text === 'state') offenders.push(name);
            }
            ts.forEachChild(n, visit);
        };
        visit(file);
    }
    assert.deepEqual(offenders, []);
});
