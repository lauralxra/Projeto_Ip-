import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Mensagem do 403 do RolesGuard para a rota; sem ela, vale a mensagem genérica
export const ROLES_MESSAGE_KEY = 'rolesMessage';
export const RolesMessage = (mensagem: string) =>
  SetMetadata(ROLES_MESSAGE_KEY, mensagem);
