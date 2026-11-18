import { Prisma, TipoDadoIndicador } from '@prisma/client';

// Cálculo do realizado de um período, compartilhado entre dashboard e metas para
// os dois nunca mostrarem números diferentes.
// `valores` deve vir em ordem cronológica (trimestre crescente).
// Percentuais não se somam: vale a última medição informada; os demais tipos acumulam.
export function calcularRealizado(
  tipoDado: TipoDadoIndicador,
  valores: (Prisma.Decimal | null)[],
): number | null {
  const preenchidos = valores.filter(
    (valor): valor is Prisma.Decimal => valor !== null,
  );

  if (preenchidos.length === 0) return null;
  if (tipoDado === TipoDadoIndicador.PERCENTUAL) {
    return preenchidos[preenchidos.length - 1].toNumber();
  }
  return preenchidos
    .reduce((soma, valor) => soma.plus(valor), new Prisma.Decimal(0))
    .toNumber();
}

// Percentual da meta atingido, com uma casa decimal; null sem meta ou sem medição
export function percentualAtingido(
  realizado: number | null,
  meta: number | null,
): number | null {
  return meta && realizado !== null
    ? Math.round((realizado / meta) * 1000) / 10
    : null;
}
