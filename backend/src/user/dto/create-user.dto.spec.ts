import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Role } from '@prisma/client';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  const valido = {
    name: 'Maria',
    email: 'Maria@Exemplo.com ',
    password: 'Senha1234',
    confirmPassword: 'Senha1234',
    role: Role.EQUIPE_GESTAO,
  };

  const validar = async (payload: Record<string, unknown>) => {
    const dto = plainToInstance(CreateUserDto, payload);
    const errors = await validate(dto);
    return { dto, campos: errors.map((e) => e.property) };
  };

  it('aceita dados válidos e normaliza o e-mail', async () => {
    const { dto, campos } = await validar(valido);

    expect(campos).toEqual([]);
    expect(dto.email).toBe('maria@exemplo.com');
  });

  it('exige todos os campos obrigatórios', async () => {
    const { campos } = await validar({});

    expect(campos).toEqual(
      expect.arrayContaining([
        'name',
        'email',
        'password',
        'confirmPassword',
        'role',
      ]),
    );
  });

  it('recusa e-mail inválido', async () => {
    const { campos } = await validar({ ...valido, email: 'nao-e-email' });

    expect(campos).toEqual(['email']);
  });

  it('recusa senha com menos de 8 caracteres', async () => {
    const { campos } = await validar({
      ...valido,
      password: 'Abc1234',
      confirmPassword: 'Abc1234',
    });

    expect(campos).toEqual(['password']);
  });

  it('recusa confirmação de senha diferente', async () => {
    const { campos } = await validar({
      ...valido,
      confirmPassword: 'Outra1234',
    });

    expect(campos).toEqual(['confirmPassword']);
  });
});
