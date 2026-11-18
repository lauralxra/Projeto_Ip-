import { PickType } from '@nestjs/swagger';
import { ChangePasswordDto } from './change-password.dto';

// Redefinição pelo administrador: mesmas regras de complexidade da troca de senha,
// sem a senha atual (que só o próprio usuário conhece)
export class ResetPasswordDto extends PickType(ChangePasswordDto, [
  'newPassword',
  'confirmNewPassword',
] as const) {}
