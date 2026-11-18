import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Libera a rota do JwtAuthGuard global (ex.: login e cadastro)
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
