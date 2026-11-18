import { parseCorsOrigins } from './cors-origins';

describe('parseCorsOrigins', () => {
  it('sem CORS_ORIGIN libera apenas o frontend local', () => {
    expect(parseCorsOrigins(undefined)).toEqual(['http://localhost:5173']);
    expect(parseCorsOrigins('')).toEqual(['http://localhost:5173']);
  });

  it('aceita várias origens separadas por vírgula', () => {
    expect(
      parseCorsOrigins('https://app.exemplo.com, http://localhost:5173'),
    ).toEqual(['https://app.exemplo.com', 'http://localhost:5173']);
  });

  it('remove a barra final, que faria o navegador bloquear a origem', () => {
    expect(parseCorsOrigins('https://app.exemplo.com/')).toEqual([
      'https://app.exemplo.com',
    ]);
  });

  it('ignora itens vazios', () => {
    expect(parseCorsOrigins(' , https://app.exemplo.com,')).toEqual([
      'https://app.exemplo.com',
    ]);
  });
});
