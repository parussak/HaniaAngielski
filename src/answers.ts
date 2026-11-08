/** Pomijamy różnice zapisu, nie brakujące słowa ani znaki języka. */
export function normalizeAnswer(input: string, caseSensitive = false) {
  const value = input.normalize('NFC').replace(/[’‘]/g, "'").replace(/[.,!?…]/g, '').trim().replace(/\s+/g, ' ');
  return caseSensitive ? value : value.toLocaleLowerCase();
}
