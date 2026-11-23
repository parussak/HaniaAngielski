import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesSearch, normalizeSearch, searchStatus } from '../src/learning/grammar-search.ts';

test('wyszukiwanie ignoruje wielkość liter, polskie znaki i ł', () => {
    assert.equal(normalizeSearch('  Łódź '), 'lodz');
    assert.ok(matchesSearch('Czas teraźniejszy ciągły', 'TERAZNIEJSZY'));
    assert.ok(!matchesSearch('Present Simple', 'past'));
});

test('puste zapytanie pasuje do wszystkiego i nie daje komunikatu', () => {
    assert.ok(matchesSearch('cokolwiek', '  '));
    assert.equal(searchStatus('  ', 0), '');
});

test('komunikat podaje liczbę lub brak wyników', () => {
    assert.equal(searchStatus('am', 3), 'Znalezione tematy: 3');
    assert.match(searchStatus('zzz', 0), /Brak pasujących/);
});
