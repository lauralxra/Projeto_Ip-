import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Ip,
  ParseUUIDPipe,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiTags,
} from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import {
  opcoesUploadImagem,
  removerUpload,
  urlDoUpload,
} from '../common/upload-imagem';
import { Role } from '@prisma/client';
import { NucleoService } from './nucleo.service';
import { CreateNucleoDto } from './dto/create-nucleo.dto';
import { SearchNucleoDto } from './dto/search-nucleo.dto';
import { UpdateNucleoDto } from './dto/update-nucleo.dto';
import { CreateNucleoSwagger } from './swagger/nucleo.post.swagger';
import {
  FindOneNucleoSwagger,
  SearchNucleoSwagger,
} from './swagger/nucleo.get.swagger';
import { DeleteNucleoSwagger } from './swagger/nucleo.delete.swagger';
import { DeactivateNucleoSwagger } from './swagger/nucleo.deactivate.swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, RolesMessage } from '../auth/roles.decorators';
import type { AuthenticatedRequest } from '../auth/interface/request.interface';

@ApiTags('nucleo')
@Controller('nucleos')
export class NucleoController {
  constructor(private readonly nucleoService: NucleoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @CreateNucleoSwagger()
  create(
    @Body() createNucleoDto: CreateNucleoDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.nucleoService.create(createNucleoDto, { id: req.user.id, ip });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.ADMINISTRADOR,
    Role.DIRETORES_NUCLEOS,
    Role.EQUIPE_GESTAO,
    Role.EQUIPE_COMUNICACAO,
  )
  @SearchNucleoSwagger()
  search(@Query() filtros: SearchNucleoDto, @Req() req: AuthenticatedRequest) {
    return this.nucleoService.search(filtros, req.user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.ADMINISTRADOR,
    Role.DIRETORES_NUCLEOS,
    Role.EQUIPE_GESTAO,
    Role.EQUIPE_COMUNICACAO,
  )
  @FindOneNucleoSwagger()
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.nucleoService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @RolesMessage('Você não possui permissão para atualizar o núcleo.')
  @ApiBearerAuth('JWT-auth')
  @ApiForbiddenResponse({
    description: 'Você não possui permissão para atualizar o núcleo.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNucleoDto: UpdateNucleoDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.nucleoService.update(id, updateNucleoDto, {
      id: req.user.id,
      ip,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @DeleteNucleoSwagger()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.nucleoService.remove(id, { id: req.user.id, ip });
  }

  // multipart/form-data com o campo "imagem" (JPEG, PNG ou WEBP, até 5 MB)
  @Patch(':id/imagem')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['imagem'],
      properties: { imagem: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('imagem', opcoesUploadImagem('nucleos')))
  atualizarImagem(
    // O interceptor grava o arquivo antes dos pipes; o id é validado aqui para
    // poder descartar o arquivo quando for inválido
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhuma imagem enviada.');
    }

    const imagemUrl = urlDoUpload('nucleos', file.filename);
    if (!isUUID(id)) {
      removerUpload(imagemUrl);
      throw new BadRequestException('Identificador de núcleo inválido.');
    }

    return this.nucleoService.atualizarImagem(id, imagemUrl, {
      id: req.user.id,
      ip,
    });
  }

  @Get(':id/pendencias')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @ApiBearerAuth('JWT-auth')
  verificarPendencias(@Param('id', ParseUUIDPipe) id: string) {
    return this.nucleoService.verificarPendencias(id);
  }

  @Patch(':id/desativar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @DeactivateNucleoSwagger()
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.nucleoService.deactivate(id, { id: req.user.id, ip });
  }

  @Patch(':id/reativar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @ApiBearerAuth('JWT-auth')
  reactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.nucleoService.reactivate(id, { id: req.user.id, ip });
  }
}
