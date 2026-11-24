import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterSwagger } from './swagger/register.swagger';
import { LoginSwagger } from './swagger/login.swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LimiteRecuperacaoGuard } from './limite-recuperacao.guard';
import { Public } from './public.decorator';
import type { AuthenticatedRequest } from './interface/request.interface';
import { LogoutSwagger } from './swagger/logout.swagger';
import { RequestRecoveryDto } from './dto/request-recovery.dto';
import { ValidateCodeDto } from './dto/validate-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  RecoveryRequestSwagger,
  RecoveryResendSwagger,
  RecoveryResetSwagger,
  RecoveryValidateSwagger,
} from './swagger/recovery.swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @RegisterSwagger()
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @LoginSwagger()
  login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.login(loginDto, { ip, userAgent });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @LogoutSwagger()
  logout(
    @Req() request: AuthenticatedRequest,
    @Ip() ip: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.clearCookie('access_token', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return this.authService.logout(request.user.id, ip);
  }

  // UC02 - Recuperação de senha (rotas públicas)

  @Public()
  @UseGuards(LimiteRecuperacaoGuard)
  @Post('recovery/request')
  @HttpCode(HttpStatus.OK)
  @RecoveryRequestSwagger()
  requestRecovery(@Body() dto: RequestRecoveryDto) {
    return this.authService.solicitarRecuperacao(dto.email);
  }

  @Public()
  @UseGuards(LimiteRecuperacaoGuard)
  @Post('recovery/validate')
  @HttpCode(HttpStatus.OK)
  @RecoveryValidateSwagger()
  validateRecoveryCode(@Body() dto: ValidateCodeDto) {
    return this.authService.validarCodigoRecuperacao(dto);
  }

  // RN07: gera um novo código e invalida o anterior
  @Public()
  @UseGuards(LimiteRecuperacaoGuard)
  @Post('recovery/resend')
  @HttpCode(HttpStatus.OK)
  @RecoveryResendSwagger()
  resendRecoveryCode(@Body() dto: RequestRecoveryDto) {
    return this.authService.solicitarRecuperacao(dto.email);
  }

  @Public()
  @UseGuards(LimiteRecuperacaoGuard)
  @Post('recovery/reset')
  @HttpCode(HttpStatus.OK)
  @RecoveryResetSwagger()
  resetPassword(@Body() dto: ResetPasswordDto, @Ip() ip: string) {
    return this.authService.redefinirSenha(dto, ip);
  }
}
