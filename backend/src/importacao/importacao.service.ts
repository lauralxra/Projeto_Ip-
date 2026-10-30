import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role, StatusImportacao, TrimestreEnum } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type LinhaCsv = {
  numero: number;
  indicadorId: string;
  ano: number;
  trimestre: TrimestreEnum;
  valorRealizado: number | null;
};

@Injectable()
export class ImportacaoService {
  constructor(private readonly prisma: PrismaService) {}

  async importarCsv(
    arquivoNome: string,
    conteudo: string,
    userId: string,
    role: Role,
  ) {
    if (!conteudo.trim()) {
      throw new BadRequestException('O arquivo CSV está vazio.');
    }

    const linhas = conteudo.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
    if (linhas.length < 2) {
      throw new BadRequestException('O CSV precisa conter cabeçalho e pelo menos uma linha de dados.');
    }

    const separar = (linha: string, delimitador: string) => {
      const campos: string[] = [];
      let campo = '';
      let aspas = false;

      for (let i = 0; i < linha.length; i++) {
        const c = linha[i];
        if (c === '"' && aspas && linha[i + 1] === '"') {
          campo += '"';
          i++;
        } else if (c === '"') {
          aspas = !aspas;
        } else if (c === delimitador && !aspas) {
          campos.push(campo.trim());
          campo = '';
        } else {
          campo += c;
        }
      }

      campos.push(campo.trim());
      return campos;
    };

    const delimitador = (linhas[0].match(/;/g) ?? []).length >
      (linhas[0].match(/,/g) ?? []).length ? ';' : ',';
    const cabecalho = separar(linhas[0], delimitador).map((c) =>
      c.toLowerCase().replace(/[\s_]/g, ''),
    );
    const indice = (nomes: string[]) => cabecalho.findIndex((c) => nomes.includes(c));

    const colunas = {
      indicadorId: indice(['indicadorid', 'idindicador']),
      ano: indice(['ano']),
      trimestre: indice(['trimestre', 'periodo']),
      valor: indice(['valorrealizado', 'valor']),
    };

    if (Object.values(colunas).some((i) => i < 0)) {
      throw new BadRequestException(
        'Cabeçalho obrigatório: indicadorId, ano, trimestre, valorRealizado.',
      );
    }

    const erros: { linha: number; mensagem: string }[] = [];
    const validas: LinhaCsv[] = [];

    linhas.slice(1).forEach((linha, i) => {
      const numero = i + 2;
      const campos = separar(linha, delimitador);
      const indicadorId = campos[colunas.indicadorId];
      const anoTexto = campos[colunas.ano];
      const ano = Number(anoTexto);
      const trimestre = campos[colunas.trimestre]?.toUpperCase() as TrimestreEnum;
      const valorTexto = campos[colunas.valor]?.trim().replace(',', '.');
      const valorRealizado =
        valorTexto === '' || valorTexto === undefined ? null : Number(valorTexto);

      if (!indicadorId || !anoTexto || !Number.isInteger(ano) || ano < 1900 || ano > 2200) {
        erros.push({ linha: numero, mensagem: 'Indicador ou ano inválido.' });
        return;
      }
      if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(trimestre)) {
        erros.push({ linha: numero, mensagem: 'Trimestre deve ser Q1, Q2, Q3 ou Q4.' });
        return;
      }
      if (valorRealizado !== null && !Number.isFinite(valorRealizado)) {
        erros.push({ linha: numero, mensagem: 'Valor realizado inválido.' });
        return;
      }
      validas.push({ numero, indicadorId, ano, trimestre, valorRealizado });
    });

    const usuario = await this.prisma.user.findFirst({
      where: { id: userId, ativo: true, deletedAt: null },
      include: { nucleos: { select: { nucleoId: true } } },
    });
    if (!usuario || usuario.perfil !== role) {
      throw new ForbiddenException('Usuário inválido ou perfil alterado. Entre novamente.');
    }

    const nucleosPermitidos = new Set(usuario.nucleos.map((n) => n.nucleoId));
    const importacao = await this.prisma.importacao.create({
      data: {
        userId,
        arquivoNome,
        status: StatusImportacao.PROCESSANDO,
        totalLinhas: linhas.length - 1,
        linhasOk: 0,
      },
    });

    let linhasOk = 0;

    for (const linha of validas) {
      try {
        const indicador = await this.prisma.indicador.findFirst({
          where: { id: linha.indicadorId, deletedAt: null, status: 'ATIVO' },
        });

        if (!indicador) {
          erros.push({ linha: linha.numero, mensagem: 'Indicador não encontrado ou inativo.' });
          continue;
        }

        if (
          role !== Role.ADMINISTRADOR &&
          indicador.nucleoId !== null &&
          !nucleosPermitidos.has(indicador.nucleoId)
        ) {
          erros.push({ linha: linha.numero, mensagem: 'Sem permissão para este núcleo.' });
          continue;
        }

        const registroExistente = await this.prisma.indicadorRegistro.findFirst({
          where: {
            indicadorId: linha.indicadorId,
            ano: linha.ano,
            trimestre: linha.trimestre,
            deletedAt: null,
          },
        });

        if (registroExistente) {
          await this.prisma.indicadorRegistro.update({
            where: { id: registroExistente.id },
            data: {
              valorRealizado: linha.valorRealizado,
              importacaoId: importacao.id,
            },
          });
        } else {
          await this.prisma.indicadorRegistro.create({
            data: {
              indicadorId: linha.indicadorId,
              ano: linha.ano,
              trimestre: linha.trimestre,
              valorRealizado: linha.valorRealizado,
              importacaoId: importacao.id,
            },
          });
        }

        linhasOk++;
      } catch (erro) {
        console.error(`Erro ao importar linha ${linha.numero}:`, erro);
        erros.push({
          linha: linha.numero,
          mensagem: 'Falha ao gravar o registro; verifique se os dados são válidos.',
        });
      }
    }

    const status =
      erros.length === 0
        ? StatusImportacao.CONCLUIDA
        : linhasOk > 0
          ? StatusImportacao.CONCLUIDA_COM_ERROS
          : StatusImportacao.FALHA;

    return this.prisma.importacao.update({
      where: { id: importacao.id },
      data: {
        status,
        linhasOk,
        erros: erros as object[],
        finalizadoEm: new Date(),
      },
    });
  }
}

