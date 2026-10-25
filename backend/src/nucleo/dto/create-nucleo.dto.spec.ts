import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateNucleoDto } from './create-nucleo.dto';

describe('CreateNucleoDto', () => {
  const valido = {
    nome: '  Núcleo de Educação Ambiental ',
    sigla: ' nea ',
    descricao: 'Projetos de educação ambiental.',
    corHex: '#2e7d32',
    imagemUrl: 'https://cdn.instituto-ipe.org.br/nucleos/nea.png',
  };

  const validar = async (payload: Record<string, unknown>) => {
    const dto = plainToInstance(CreateNucleoDto, payload);
    const errors = await validate(dto);
    return { dto, campos: errors.map((e) => e.property) };
  };

  it('aceita dados válidos, remove espaços e põe a sigla em maiúsculas', async () => {
    const { dto, campos } = await validar(valido);

    expect(campos).toEqual([]);
    expect(dto.nome).toBe('Núcleo de Educação Ambiental');
    expect(dto.sigla).toBe('NEA');
  });

  it('aceita somente nome e sigla (atributos visuais opcionais)', async () => {
    const { campos } = await validar({ nome: 'Núcleo', sigla: 'NUC' });

    expect(campos).toEqual([]);
  });

  it('exige nome e sigla', async () => {
    const { campos } = await validar({ nome: '   ', sigla: '' });

    expect(campos).toEqual(['nome', 'sigla']);
  });

  it('respeita os tamanhos máximos do banco', async () => {
    const { campos } = await validar({
      nome: 'a'.repeat(151),
      sigla: 'S'.repeat(21),
    });

    expect(campos).toEqual(['nome', 'sigla']);
  });

  it('recusa cor fora do formato #RRGGBB e URL de imagem inválida', async () => {
    const { campos } = await validar({
      ...valido,
      corHex: 'verde',
      imagemUrl: 'nao-e-url',
    });

    expect(campos).toEqual(['corHex', 'imagemUrl']);
  });
});
