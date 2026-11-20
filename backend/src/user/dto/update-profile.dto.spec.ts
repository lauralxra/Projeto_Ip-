import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProfileDto } from './update-profile.dto';

describe('UpdateProfileDto (UC04 — validação e sanitização de nome)', () => {
  const validar = async (payload: Record<string, unknown>) => {
    const dto = plainToInstance(UpdateProfileDto, payload);
    const errors = await validate(dto);
    return { dto, campos: errors.map((e) => e.property) };
  };

  it.each([
    ['Maria da Silva', 'Maria da Silva'],
    ['  Maria   da   Silva  ', 'Maria da Silva'],
    ['João Pedro Gonçalves', 'João Pedro Gonçalves'],
    ['Ana-Clara Souza', 'Ana-Clara Souza'],
    ["Luísa D'Ávila", "Luísa D'Ávila"],
  ])(
    'aceita nome válido %p e sanitiza para %p',
    async (entrada, esperado) => {
      const { dto, campos } = await validar({ name: entrada });

      expect(campos).toEqual([]);
      expect(dto.name).toBe(esperado);
    },
  );

  it.each([
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    '<b>Maria</b>',
    'javascript:alert(1)',
    'Maria123',
    '123456',
    'Maria@Silva',
    'Maria!#$%&*()',
    "' OR '1'='1",
    '--DROP TABLE users;',
    'Maria--Silva',
    '-Maria',
    'Maria-',
    "Maria''Silva",
    'Maria\nSilva',
    'Maria\u0000Silva',
    '   ',
    'A',
    'A'.repeat(151),
  ])('rejeita nome inválido ou malicioso: %p', async (entrada) => {
    const { campos } = await validar({ name: entrada });

    expect(campos).toEqual(['name']);
  });
});
