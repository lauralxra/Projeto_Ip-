import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  EscopoIndicador,
  Role,
  StatusImportacao,
  TipoDadoIndicador,
  TrimestreEnum,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type LinhaCsv = {
  numero: number;
  indicadorId?: string;
  indicadorNome?: string;
  indicadorCodigo?: string;
  nucleoId?: string;
  nucleoNome?: string;
  programaId?: string;
  programaNome?: string;
  unidadeMedida?: string | null;
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
      nomeIndicador: indice(['nomeindicador', 'indicadornome', 'nome', 'nome_do_indicador']),
      codigoIndicador: indice(['codigoindicador', 'codigo', 'codigo_do_indicador']),
      nucleoId: indice(['nucleoid', 'idnucleo']),
      nucleoNome: indice(['nucleo', 'nomenucleo', 'nome_do_nucleo', 'nucleo_nome', 'siglanucleo', 'nucleo_sigla']),
      programaId: indice(['programaid', 'idprograma']),
      programaNome: indice(['programa', 'nomeprograma', 'nome_do_programa', 'programa_nome']),
      unidadeMedida: indice(['unidademedida', 'unidade', 'unidade_medida']),
      escopo: indice(['escopo']),
      tipoDado: indice(['tipodado', 'tipo_dado']),
      ano: indice(['ano']),
      trimestre: indice(['trimestre', 'periodo']),
      valor: indice(['valorrealizado', 'valor']),
    };

    const temIndicadorReferenciado = colunas.indicadorId >= 0;
    const temIndicadorNomeOuCodigo =
      colunas.nomeIndicador >= 0 || colunas.codigoIndicador >= 0;
    const temNucleoReferenciado = colunas.nucleoId >= 0 || colunas.nucleoNome >= 0;
    const temProgramaReferenciado = colunas.programaId >= 0 || colunas.programaNome >= 0;

    if (
      !temIndicadorReferenciado &&
      !temIndicadorNomeOuCodigo
    ) {
      throw new BadRequestException(
        'Cabeçalho obrigatório: deve conter pelo menos um identificador do indicador (indicadorId, nomeIndicador ou codigoIndicador), além de nucleo, programa, ano, trimestre e valorRealizado. A unidade de medida é opcional.',
      );
    }

    if (!temNucleoReferenciado || !temProgramaReferenciado) {
      throw new BadRequestException(
        'Cabeçalho obrigatório: deve conter nucleo e programa (ou nucleoId e programaId), além de ano, trimestre e valorRealizado. A unidade de medida é opcional.',
      );
    }

    if (colunas.ano < 0 || colunas.trimestre < 0 || colunas.valor < 0) {
      throw new BadRequestException(
        'Cabeçalho obrigatório: ano, trimestre e valorRealizado. Campos obrigatórios adicionais: nucleo e programa. A unidade de medida é opcional.',
      );
    }

    const erros: { linha: number; mensagem: string }[] = [];
    const validas: LinhaCsv[] = [];

    linhas.slice(1).forEach((linha, i) => {
      const numero = i + 2;
      const campos = separar(linha, delimitador);
      const indicadorId = colunas.indicadorId >= 0 ? campos[colunas.indicadorId]?.trim() : undefined;
      const indicadorNome =
        colunas.nomeIndicador >= 0 ? campos[colunas.nomeIndicador]?.trim() : undefined;
      const indicadorCodigo =
        colunas.codigoIndicador >= 0 ? campos[colunas.codigoIndicador]?.trim() : undefined;
      const nucleoId =
        colunas.nucleoId >= 0 ? campos[colunas.nucleoId]?.trim() || undefined : undefined;
      const nucleoNome =
        colunas.nucleoNome >= 0 ? campos[colunas.nucleoNome]?.trim() || undefined : undefined;
      const programaId =
        colunas.programaId >= 0 ? campos[colunas.programaId]?.trim() || undefined : undefined;
      const programaNome =
        colunas.programaNome >= 0 ? campos[colunas.programaNome]?.trim() || undefined : undefined;
      const unidadeMedida =
        colunas.unidadeMedida >= 0 ? campos[colunas.unidadeMedida]?.trim() || 'unidade' : 'unidade';
      const anoTexto = campos[colunas.ano];
      const ano = Number(anoTexto);
      const trimestre = campos[colunas.trimestre]?.toUpperCase() as TrimestreEnum;
      const valorTexto = campos[colunas.valor]?.trim().replace(',', '.');
      const valorRealizado =
        valorTexto === '' || valorTexto === undefined ? null : Number(valorTexto);

      if ((!indicadorId && !indicadorNome && !indicadorCodigo) || !anoTexto || !Number.isInteger(ano) || ano < 1900 || ano > 2200) {
        erros.push({ linha: numero, mensagem: 'Indicador ou ano inválido.' });
        return;
      }
      if ((!nucleoId && !nucleoNome) || (!programaId && !programaNome)) {
        erros.push({ linha: numero, mensagem: 'Núcleo e programa são obrigatórios.' });
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
      validas.push({
        numero,
        indicadorId,
        indicadorNome,
        indicadorCodigo,
        nucleoId,
        nucleoNome,
        programaId,
        programaNome,
        unidadeMedida,
        ano,
        trimestre,
        valorRealizado,
      });
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
        let nucleoVinculado = null as any;

        if (linha.nucleoId) {
          nucleoVinculado = await this.prisma.nucleo.findFirst({
            where: {
              id: linha.nucleoId,
              deletedAt: null,
              status: 'ATIVO',
            },
          });
        } else if (linha.nucleoNome) {
          nucleoVinculado = await this.prisma.nucleo.findFirst({
            where: {
              OR: [
                { nome: { equals: linha.nucleoNome, mode: 'insensitive' } },
                { sigla: { equals: linha.nucleoNome, mode: 'insensitive' } },
              ],
              deletedAt: null,
              status: 'ATIVO',
            },
          });
        }

        if (linha.nucleoNome && !nucleoVinculado) {
          erros.push({ linha: linha.numero, mensagem: 'Núcleo não encontrado ou inativo. Cadastre o núcleo antes de importar os indicadores.' });
          continue;
        }

        let programaVinculado = null as any;

        if (linha.programaId) {
          programaVinculado = await this.prisma.programa.findFirst({
            where: {
              id: linha.programaId,
              deletedAt: null,
              status: 'ATIVO',
              ...(nucleoVinculado ? { nucleoId: nucleoVinculado.id } : {}),
            },
          });
        } else if (linha.programaNome) {
          programaVinculado = await this.prisma.programa.findFirst({
            where: {
              nome: { equals: linha.programaNome, mode: 'insensitive' },
              deletedAt: null,
              status: 'ATIVO',
              ...(nucleoVinculado ? { nucleoId: nucleoVinculado.id } : {}),
            },
          });
        }

        if (linha.programaNome && !programaVinculado) {
          erros.push({ linha: linha.numero, mensagem: 'Programa não encontrado, inativo ou incompatível com o núcleo. Cadastre o programa antes de importar os indicadores.' });
          continue;
        }

        if (nucleoVinculado && programaVinculado && programaVinculado.nucleoId && nucleoVinculado.id !== programaVinculado.nucleoId) {
          erros.push({
            linha: linha.numero,
            mensagem: 'Núcleo e programa informados são incompatíveis.',
          });
          continue;
        }

        let indicador = linha.indicadorId
          ? await this.prisma.indicador.findFirst({
              where: { id: linha.indicadorId, deletedAt: null, status: 'ATIVO' },
            })
          : null;

        if (!indicador && (linha.indicadorNome || linha.indicadorCodigo)) {
          const nome = linha.indicadorNome?.trim() || linha.indicadorCodigo?.trim() || 'Indicador importado';
          const codigo = linha.indicadorCodigo?.trim() || null;

          indicador =
            (codigo &&
              (await this.prisma.indicador.findFirst({
                where: {
                  OR: [
                    { codigo, deletedAt: null, status: 'ATIVO' },
                    { nome: { equals: nome, mode: 'insensitive' }, deletedAt: null, status: 'ATIVO' },
                  ],
                },
              }))) ||
            (await this.prisma.indicador.create({
              data: {
                nome,
                codigo,
                descricao: null,
                unidadeMedida: linha.unidadeMedida || 'unidade',
                escopo: nucleoVinculado || programaVinculado ? EscopoIndicador.NUCLEO : EscopoIndicador.INSTITUCIONAL,
                tipoDado: TipoDadoIndicador.NUMERICO,
                nucleoId: nucleoVinculado?.id ?? null,
                programaId: programaVinculado?.id ?? null,
              },
            }));
        }

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
            indicadorId: indicador.id,
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
              indicadorId: indicador.id,
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

