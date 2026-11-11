import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SearchNucleoDto } from './search-nucleo.dto';

describe('SearchNucleoDto', () => {
  // Query strings chegam sempre como texto
  const validar = async (query: Record<string, string>) => {
    const dto = plainToInstance(SearchNucleoDto, query);
    const errors = await validate(dto);
    return { dto, campos: errors.map((e) => e.property) };
  };

  it('aceita a busca sem filtros com paginação padrão', async () => {
    const { dto, campos } = await validar({});

    expect(campos).toEqual([]);
    expect(dto.pagina).toBe(1);
    expect(dto.limite).toBe(20);
  });

  it('aceita todos os filtros e converte números', async () => {
    const { dto, campos } = await validar({
      termo: '  ambiental ',
      programaId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      status: 'ATIVO',
      dataInicio: '2026-01-01',
      dataFim: '2026-12-31',
      ano: '2026',
      trimestre: 'Q2',
      pagina: '2',
      limite: '50',
    });

    expect(campos).toEqual([]);
    expect(dto.termo).toBe('ambiental');
    expect(dto).toMatchObject({ ano: 2026, pagina: 2, limite: 50 });
  });

  it.each([
    [{ programaId: '123' }, 'programaId'],
    [{ status: 'EXCLUIDO' }, 'status'],
    [{ dataInicio: '01/01/2026' }, 'dataInicio'],
    [{ dataFim: '2026-02-30' }, 'dataFim'],
    [{ trimestre: 'Q5', ano: '2026' }, 'trimestre'],
    [{ ano: 'dois mil' }, 'ano'],
    [{ pagina: '0' }, 'pagina'],
    [{ limite: '101' }, 'limite'],
    [{ termo: 'a'.repeat(151) }, 'termo'],
  ])('recusa %o', async (query, campo) => {
    const { campos } = await validar(query);

    expect(campos).toEqual([campo]);
  });

  it('exige o ano ao filtrar por trimestre', async () => {
    const { campos } = await validar({ trimestre: 'Q1' });

    expect(campos).toEqual(['ano']);
  });
});
