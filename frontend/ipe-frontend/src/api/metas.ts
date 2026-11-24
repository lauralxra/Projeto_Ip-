import { apiFetch } from './cliente';

export interface MetaApi {
  id: string;
  indicadorId: string;
  ano: number;
  // null = meta anual
  trimestre: string | null;
  valorMeta: number;
  valorRealizado: number | null;
  percentualAtingido: number | null;
}

interface PaginaMetas {
  itens: MetaApi[];
  total: number;
}

// GET /metas é paginado (máx. 100 por página): percorre todas as páginas
export async function buscarTodasMetas(): Promise<MetaApi[]> {
  const metas: MetaApi[] = [];
  for (let pagina = 1; ; pagina++) {
    const { itens, total } = await apiFetch<PaginaMetas>(
      `/metas?limite=100&pagina=${pagina}`,
    );
    metas.push(...itens);
    if (itens.length === 0 || metas.length >= total) return metas;
  }
}

// Meta do período exibido no card: a do trimestre, ou a anual do mesmo ano, ou qualquer meta ativa associada ao indicador
export function metaDoPeriodo(
  metas: MetaApi[],
  indicadorId: string,
  ano: number,
  trimestre?: string,
): MetaApi | undefined {
  const doIndicador = metas.filter((m) => m.indicadorId === indicadorId);
  if (doIndicador.length === 0) return undefined;

  const doAno = doIndicador.filter((m) => m.ano === ano);
  if (doAno.length > 0) {
    return (
      (trimestre && doAno.find((m) => m.trimestre === trimestre)) ||
      doAno.find((m) => m.trimestre === null) ||
      doAno[0]
    );
  }

  return doIndicador[0];
}
