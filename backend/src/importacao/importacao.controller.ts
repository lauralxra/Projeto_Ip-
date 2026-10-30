
import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { memoryStorage } from 'multer';
import * as XLSX from 'xlsx';
import { ImportacaoService } from './importacao.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequisicaoAutenticada extends Request {
  user: { id: string; role: Role };
}

@Controller('importacoes')
@UseGuards(JwtAuthGuard)
export class ImportacaoController {
  constructor(private readonly importacaoService: ImportacaoService) {}

  @Post('csv')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  importarCsv(
    @UploadedFile()
    arquivo:
      | { originalname: string; mimetype: string; buffer: Buffer }
      | undefined,
    @Req() req: RequisicaoAutenticada,
  ) {
    const perfisPermitidos: Role[] = [
      Role.ADMINISTRADOR,
      Role.DIRETORES_NUCLEOS,
      Role.EQUIPE_GESTAO,
    ];

    if (!perfisPermitidos.includes(req.user.role)) {
      throw new ForbiddenException(
        'Seu perfil não pode importar indicadores.',
      );
    }

    if (!arquivo) {
      throw new BadRequestException(
        'Envie um arquivo no campo "arquivo".',
      );
    }

    const nome = arquivo.originalname.toLowerCase();
    let conteudo: string;

    if (nome.endsWith('.csv')) {
      conteudo = arquivo.buffer.toString('utf-8');
    } else if (nome.endsWith('.xlsx') || nome.endsWith('.xls')) {
      try {
        const workbook = XLSX.read(arquivo.buffer, {
          type: 'buffer',
        });

        const primeiraAba = workbook.SheetNames[0];

        if (!primeiraAba) {
          throw new BadRequestException(
            'A planilha não contém nenhuma aba.',
          );
        }

        const planilha = workbook.Sheets[primeiraAba];

        if (!planilha) {
          throw new BadRequestException(
            'Não foi possível ler a primeira aba da planilha.',
          );
        }

        conteudo = XLSX.utils.sheet_to_csv(planilha);
      } catch (erro) {
        if (erro instanceof BadRequestException) {
          throw erro;
        }

        throw new BadRequestException(
          'Não foi possível ler a planilha. Verifique se o arquivo está válido.',
        );
      }
    } else {
      throw new BadRequestException(
        'Formato não permitido. Envie um arquivo CSV, XLSX ou XLS.',
      );
    }

    return this.importacaoService.importarCsv(
      arquivo.originalname,
      conteudo,
      req.user.id,
      req.user.role,
    );
  }
}
