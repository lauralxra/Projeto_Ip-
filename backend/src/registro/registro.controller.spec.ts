import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../auth/roles.decorators';
import { RegistroController } from './registro.controller';

// Trava as permissões de cada rota: mudar um perfil aqui deve ser uma decisão
// consciente, não efeito colateral de outra alteração
describe('RegistroController — permissões', () => {
  const reflector = new Reflector();
  const perfis = (metodo: keyof RegistroController) =>
    reflector.get<Role[] | undefined>(
      ROLES_KEY,
      RegistroController.prototype[metodo] as () => unknown,
    );

  it.each([
    ['update', [Role.ADMINISTRADOR, Role.DIRETORES_NUCLEOS]],
    ['enviarParaRevisao', [Role.ADMINISTRADOR, Role.DIRETORES_NUCLEOS]],
    // Aprovar, devolver e publicar são exclusivos da Administração
    ['aprovar', [Role.ADMINISTRADOR]],
    ['devolver', [Role.ADMINISTRADOR]],
    ['publicar', [Role.ADMINISTRADOR]],
    ['inativar', [Role.ADMINISTRADOR]],
    ['reativar', [Role.ADMINISTRADOR]],
    ['remove', [Role.ADMINISTRADOR]],
  ] as const)('%s exige os perfis %j', (metodo, esperado) => {
    expect(perfis(metodo)).toEqual(esperado);
  });

  it.each(['findAll', 'findOne'] as const)(
    '%s é aberto a todo usuário autenticado (o serviço filtra a visibilidade)',
    (metodo) => {
      expect(perfis(metodo)).toBeUndefined();
    },
  );
});
