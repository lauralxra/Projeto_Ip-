import 'dotenv/config';
import {
  PrismaClient,
  EscopoIndicador,
  StatusRegistro,
  TipoDadoIndicador,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL não está configurado.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  let nucleo = await prisma.nucleo.findFirst({
    where: { sigla: 'TESTE', deletedAt: null },
  });

  if (!nucleo) {
    nucleo = await prisma.nucleo.create({
      data: {
        nome: 'Núcleo de Testes',
        sigla: 'TESTE',
        descricao: 'Núcleo permanente para testes de importação e exportação.',
        status: StatusRegistro.ATIVO,
      },
    });
    console.log('Núcleo de teste criado.');
  } else {
    console.log('Núcleo de teste já existia; mantido sem alterações.');
  }

  const indicadores = [
    {
      codigo: 'TESTE-001',
      nome: 'Pessoas atendidas (institucional)',
      escopo: EscopoIndicador.INSTITUCIONAL,
      nucleoId: null as string | null,
    },
    {
      codigo: 'TESTE-002',
      nome: 'Atendimentos do núcleo',
      escopo: EscopoIndicador.NUCLEO,
      nucleoId: nucleo.id,
    },
  ];

  for (const dados of indicadores) {
    const existente = await prisma.indicador.findFirst({
      where: { codigo: dados.codigo, deletedAt: null },
    });

    if (existente) {
      console.log(`Indicador ${dados.codigo} já existe; mantido sem alterações.`);
      continue;
    }

    await prisma.indicador.create({
      data: {
        codigo: dados.codigo,
        nome: dados.nome,
        escopo: dados.escopo,
        nucleoId: dados.nucleoId,
        tipoDado: TipoDadoIndicador.NUMERICO,
        unidadeMedida: 'pessoas',
        status: StatusRegistro.ATIVO,
      },
    });

    console.log(`Indicador ${dados.codigo} criado.`);
  }

  const criados = await prisma.indicador.findMany({
    where: {
      codigo: { in: ['TESTE-001', 'TESTE-002'] },
      deletedAt: null,
    },
    select: { id: true, codigo: true, nome: true, escopo: true, nucleoId: true },
    orderBy: { codigo: 'asc' },
  });

  console.log('\nIndicadores disponíveis para os testes:');
  console.table(criados);
}

main()
  .catch((erro: unknown) => {
    console.error('Falha ao preparar dados de teste:', erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
