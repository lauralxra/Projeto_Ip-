import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChangePasswordDto } from './change-password.dto';

describe('ChangePasswordDto', () => {
  const valido = {
    currentPassword: 'SenhaAtual123',
    newPassword: 'NovaSenhaForte2026',
    confirmNewPassword: 'NovaSenhaForte2026',
  };

  const validar = async (payload: Record<string, unknown>) => {
    const dto = plainToInstance(ChangePasswordDto, payload);
    const errors = await validate(dto);
    return errors.map((e) => e.property);
  };

  it('aceita dados válidos', async () => {
    await expect(validar(valido)).resolves.toEqual([]);
  });

  it('exige todos os campos', async () => {
    await expect(validar({})).resolves.toEqual(
      expect.arrayContaining([
        'currentPassword',
        'newPassword',
        'confirmNewPassword',
      ]),
    );
  });

  it('recusa nova senha com menos de 8 caracteres (RN01)', async () => {
    await expect(
      validar({
        ...valido,
        newPassword: 'Ab1234',
        confirmNewPassword: 'Ab1234',
      }),
    ).resolves.toEqual(['newPassword']);
  });

  it('recusa nova senha puramente numérica (RN01)', async () => {
    await expect(
      validar({
        ...valido,
        newPassword: '58302917461',
        confirmNewPassword: '58302917461',
      }),
    ).resolves.toEqual(['newPassword']);
  });

  it.each(['password123', 'Senha@123', 'QWERTY123', 'ufrpe2026'])(
    'recusa senha comum "%s" (RN01)',
    async (comum) => {
      await expect(
        validar({ ...valido, newPassword: comum, confirmNewPassword: comum }),
      ).resolves.toEqual(['newPassword']);
    },
  );

  it('recusa nova senha acima de 72 bytes', async () => {
    const longa = 'ç'.repeat(40);
    await expect(
      validar({ ...valido, newPassword: longa, confirmNewPassword: longa }),
    ).resolves.toEqual(['newPassword']);
  });

  it('recusa confirmação diferente da nova senha', async () => {
    await expect(
      validar({ ...valido, confirmNewPassword: 'OutraSenha2026' }),
    ).resolves.toEqual(['confirmNewPassword']);
  });
});
