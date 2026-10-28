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
import { Roles } from './roles.decorators';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthenticatedRequest } from './interface/request.interface';
import { LogoutSwagger } from './swagger/logout.swagger';

@ApiTags('auth')
@Roles(Role.ADMINISTRADOR)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @RegisterSwagger()
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

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
}
