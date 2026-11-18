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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UserService } from './user.service';
import { opcoesUploadImagem, urlDoUpload } from '../common/upload-imagem';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
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
    return this.userService.updateName(id, updateUserDto.name, {
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
