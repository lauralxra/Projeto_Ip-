import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FilterProgramaDto } from './filter-programa.dto';

describe('FilterProgramaDto', () => {
  it('aceita paginação e limite como parâmetros numéricos de query', async () => {
    const dto = plainToInstance(FilterProgramaDto, {
      pagina: '2',
      limite: '100',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.pagina).toBe(2);
    expect(dto.limite).toBe(100);
  });

  it('rejeita paginação e limite fora dos valores permitidos', async () => {
    const dto = plainToInstance(FilterProgramaDto, {
      pagina: '0',
      limite: '501',
    });

    const erros = await validate(dto);
    expect(erros.map((erro) => erro.property).sort()).toEqual([
      'limite',
      'pagina',
    ]);
  });
});
