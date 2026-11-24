import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UserService } from './user.service';
import {
  opcoesUploadImagem,
  removerUpload,
  urlDoUpload,
} from '../common/upload-imagem';
import { isUUID } from 'class-validator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserEmailDto } from './dto/update-user-email.dto';
import { CreateUserSwagger } from './swagger/user.post.swagger';
import { UpdateUserSwagger } from './swagger/user.patch.swagger';
import { NucleosAssociadosSwagger } from './swagger/user.nucleos.swagger';
import { ContagemUsuariosSwagger } from './swagger/user.contagem.swagger';
import { ChangePasswordSwagger } from './swagger/user.password.swagger';
import { NucleoService } from '../nucleo/nucleo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorators';
import type { AuthenticatedRequest } from '../auth/interface/request.interface';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('user')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly nucleoService: NucleoService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @CreateUserSwagger()
  create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.userService.create(createUserDto, { id: req.user.id, ip });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  findAll() {
    return this.userService.findAll();
  }

  // Rotas estáticas ficam antes de ':id' para não serem capturadas como identificador
  @Get('me/nucleos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DIRETORES_NUCLEOS, Role.EQUIPE_GESTAO)
  @NucleosAssociadosSwagger()
  findMyNucleos(@Req() req: AuthenticatedRequest) {
    return this.nucleoService.findAssociados(req.user.id);
  }

  @Get('contagem')
  @UseGuards(JwtAuthGuard)
  @ContagemUsuariosSwagger()
  countAtivos() {
    return this.userService.countAtivos();
  }

  @Patch('profile/photo')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['photo'],
      properties: { photo: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('photo', opcoesUploadImagem('photos')))
  updatePhoto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const fotoUrl = urlDoUpload('photos', file.filename);
    return this.userService.updatePhoto(req.user.id, fotoUrl, {
      id: req.user.id,
      ip,
    });
  }

  // Próprio perfil, para qualquer perfil de acesso. Trocar o e-mail exige a senha atual
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.userService.atualizarPerfil(req.user.id, dto, {
      id: req.user.id,
      ip,
    });
  }

  @Patch('profile/password')
  @UseGuards(JwtAuthGuard)
  @ChangePasswordSwagger()
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.userService.changePassword(req.user.id, dto, {
      id: req.user.id,
      ip,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @UpdateUserSwagger()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    // A Administração edita nome e e-mail de qualquer usuário
    return this.userService.atualizarDados(id, updateUserDto, {
      id: req.user.id,
      ip,
    });
  }

  @Patch(':id/permissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  updatePermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserPermissionsDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.userService.updatePermissions(id, dto, {
      id: req.user.id,
      ip,
    });
  }
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.userService.updateStatus(id, dto.ativo, {
      id: req.user.id,
      ip,
    });
  }

  @Patch(':id/email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  updateEmail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserEmailDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.userService.updateEmail(id, dto.email, {
      id: req.user.id,
      ip,
    });
  }

  @Patch(':id/password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.userService.redefinirSenha(id, dto.newPassword, {
      id: req.user.id,
      ip,
    });
  }

  // Foto de outro usuário, enviada pela Administração (multipart, campo "photo")
  @Patch(':id/photo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @UseInterceptors(FileInterceptor('photo', opcoesUploadImagem('photos')))
  async updateUserPhoto(
    // O interceptor grava o arquivo antes dos pipes: o id é validado aqui
    // para descartar o arquivo quando for inválido
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const fotoUrl = urlDoUpload('photos', file.filename);
    if (!isUUID(id)) {
      removerUpload(fotoUrl);
      throw new BadRequestException('Identificador de usuário inválido.');
    }

    try {
      return await this.userService.updatePhoto(id, fotoUrl, {
        id: req.user.id,
        ip,
      });
    } catch (error) {
      removerUpload(fotoUrl);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.userService.remove(id, { id: req.user.id, ip });
  }
}
