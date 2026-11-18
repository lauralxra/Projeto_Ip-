import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EscopoIndicador } from '@prisma/client';
import { CreateIndicadorDto } from './create-indicador.dto';
import { SalvarRegistroDto } from './salvar-registro.dto';

const camposComErro = async <T extends object>(
  classe: new () => T,
  payload: Record<string, unknown>,
) => {
  const dto = plainToInstance(classe, payload);
  const erros = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { dto, campos: erros.map((e) => e.property) };
};

describe('SalvarRegistroDto', () => {
  const valido = { ano: 2026, trimestre: 'Q2', valorRealizado: 12.5 };

  it('aceita dados válidos', async () => {
    const { campos } = await camposComErro(SalvarRegistroDto, valido);
    expect(campos).toEqual([]);
  });

  it.each([
    [{ ano: 1999 }, 'ano'],
    [{ ano: 2026.5 }, 'ano'],
    [{ trimestre: 'Q5' }, 'trimestre'],
    [{ valorRealizado: -1 }, 'valorRealizado'],
    [{ valorRealizado: 1.234 }, 'valorRealizado'],
    [{ valorRealizado: '10' }, 'valorRealizado'],
  ])('recusa %p', async (alteracao, campo) => {
    const { campos } = await camposComErro(SalvarRegistroDto, {
      ...valido,
      ...alteracao,
    });
    expect(campos).toEqual([campo]);
  });

  it('recusa campos extras, como tentar forçar o status de aprovação', async () => {
    const { campos } = await camposComErro(SalvarRegistroDto, {
      ...valido,
      statusAprovacao: 'APROVADO',
    });
    expect(campos).toEqual(['statusAprovacao']);
  });
});

describe('CreateIndicadorDto', () => {
  it('normaliza strings vazias do formulário para ausentes', async () => {
    const { dto, campos } = await camposComErro(CreateIndicadorDto, {
      nome: '  Startups  ',
      escopo: EscopoIndicador.INSTITUCIONAL,
      nucleoId: '',
      programaId: '',
      descricao: '   ',
    });

    expect(campos).toEqual([]);
    expect(dto.nome).toBe('Startups');
    expect(dto.nucleoId).toBeUndefined();
    expect(dto.programaId).toBeUndefined();
    expect(dto.descricao).toBeUndefined();
  });

  it('recusa nome vazio, escopo inválido e ids que não são uuid', async () => {
    const { campos } = await camposComErro(CreateIndicadorDto, {
      nome: '   ',
      escopo: 'OUTRO',
      nucleoId: '123',
    });

    expect(campos).toEqual(
      expect.arrayContaining(['nome', 'escopo', 'nucleoId']),
    );
  });
});
