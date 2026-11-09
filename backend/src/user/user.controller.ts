import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Ip,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserSwagger } from './swagger/user.post.swagger';
import { UpdateUserSwagger } from './swagger/user.patch.swagger';
import { NucleoService } from '../nucleo/nucleo.service';
import { NucleosAssociadosSwagger } from './swagger/user.nucleos.swagger';
import { ContagemUsuariosSwagger } from './swagger/user.contagem.swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorators';
import type { AuthenticatedRequest } from '../auth/interface/request.interface';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
import { UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('user')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly nucleoService: NucleoService,
  ) {}

  @Get('me/nucleos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DIRETORES_NUCLEOS, Role.EQUIPE_GESTAO)
  @NucleosAssociadosSwagger()
  findMyNucleos(@Req() req: AuthenticatedRequest) {
    return this.nucleoService.findAssociados(req.user.id);
  }

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

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @UpdateUserSwagger()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
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
  // Declarada antes de ':id' para não ser capturada como identificador
  @Get('contagem')
  @UseGuards(JwtAuthGuard)
  @ContagemUsuariosSwagger()
  countAtivos() {
    return this.userService.countAtivos();
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
  return this.userService.update(id, updateUserDto);
}
@Patch('profile/photo')
@UseGuards(JwtAuthGuard)
@UseInterceptors(
  FileInterceptor('photo', {
    storage: diskStorage({
      destination: './uploads/photos',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `photo-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.mimetype)) {
        return cb(
          new BadRequestException('Formato de imagem inválido. Use JPEG, PNG ou WEBP.'),
          false,
        );
      }
      cb(null, true);
    },
  }),
)
updatePhoto(
  @UploadedFile() file: Express.Multer.File,
  @Req() req: AuthenticatedRequest,
  @Ip() ip: string,
) {
  if (!file) {
    throw new BadRequestException('Nenhum arquivo enviado.');
  }

  const fotoUrl = `/uploads/photos/${file.filename}`;
  return this.userService.updatePhoto(req.user.id, fotoUrl, {
    id: req.user.id,
    ip,
  });
}
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  findOne(@Param('id') id: string) {
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
