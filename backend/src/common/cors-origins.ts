const ORIGEM_PADRAO = 'http://localhost:5173';

// Converte CORS_ORIGIN ("https://a.com, http://localhost:5173") na lista de origens permitidas.
// O navegador compara a origem exatamente, então a barra final é removida.
export function parseCorsOrigins(valor?: string): string[] {
  const origens = (valor ?? '')
    .split(',')
    .map((origem) => origem.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return origens.length > 0 ? origens : [ORIGEM_PADRAO];
}
