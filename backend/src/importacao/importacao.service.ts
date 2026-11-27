import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import {
  AcaoAuditoria,
  Indicador,
  Nucleo,
  Programa,
  Role,
  StatusAprovacao,
  StatusImportacao,
  TrimestreEnum,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  alterarValorRegistro,
  bloqueioDeAlteracao,
} from '../registro/regras-registro';

type LinhaCsv = {
  numero: number;
  indicadorId?: string;
  indicadorNome?: string;
  indicadorCodigo?: string;
  nucleoId?: string;
  nucleoNome?: string;
  programaId?: string;
  programaNome?: string;
  ano: number;
  trimestre: TrimestreEnum;
  valorRealizado: number | null;
  meta?: number | null;
};

// Cabeçalhos são comparados sem acento, maiúsculas, espaços ou "_":
// "Núcleo", "NUCLEO" e "nome_do_nucleo" viram "nucleo" / "nomedonucleo"
export const normalizarCabecalho = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_]/g, '');

@Injectable()
export class ImportacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async importarCsv(
    arquivoNome: string,
    conteudo: string,
    userId: string,
    role: Role,
  ) {
    if (!conteudo.trim()) {
      throw new BadRequestException('O arquivo CSV está vazio.');
    }

    const linhas = conteudo
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (linhas.length < 2) {
      throw new BadRequestException(
        'O CSV precisa conter cabeçalho e pelo menos uma linha de dados.',
      );
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

    const delimitador =
      (linhas[0].match(/;/g) ?? []).length >
      (linhas[0].match(/,/g) ?? []).length
        ? ';'
        : ',';
    const cabecalho = separar(linhas[0], delimitador).map(normalizarCabecalho);
    const indice = (nomes: string[]) => {
      const aceitos = nomes.map(normalizarCabecalho);
      return cabecalho.findIndex((c) => aceitos.includes(c));
    };

    const colunas = {
      indicadorId: indice(['indicadorid', 'idindicador']),
      nomeIndicador: indice([
        'nomeindicador',
        'indicadornome',
        'nome',
        'nome_do_indicador',
      ]),
      codigoIndicador: indice([
        'codigoindicador',
        'codigo',
        'codigo_do_indicador',
      ]),
      nucleoId: indice(['nucleoid', 'idnucleo']),
      nucleoNome: indice([
        'nucleo',
        'nomenucleo',
        'nome_do_nucleo',
        'nucleo_nome',
        'siglanucleo',
        'nucleo_sigla',
      ]),
      programaId: indice(['programaid', 'idprograma']),
      programaNome: indice([
        'programa',
        'nomeprograma',
        'nome_do_programa',
        'programa_nome',
      ]),
      ano: indice(['ano']),
      trimestre: indice(['trimestre', 'periodo']),
      valor: indice(['valorrealizado', 'valor']),
      meta: indice(['meta', 'valormeta', 'metaaplicada', 'valor_meta']),
    };

    const temIndicadorReferenciado = colunas.indicadorId >= 0;
    const temIndicadorNomeOuCodigo =
      colunas.nomeIndicador >= 0 || colunas.codigoIndicador >= 0;
    const temNucleoReferenciado =
      colunas.nucleoId >= 0 || colunas.nucleoNome >= 0;
    const temProgramaReferenciado =
      colunas.programaId >= 0 || colunas.programaNome >= 0;

    if (!temIndicadorReferenciado && !temIndicadorNomeOuCodigo) {
      throw new BadRequestException(
        'Cabeçalho obrigatório: deve conter pelo menos um identificador do indicador (indicadorId, nomeIndicador ou codigoIndicador), além de nucleo, programa, ano, trimestre e valorRealizado.',
      );
    }

    if (!temNucleoReferenciado || !temProgramaReferenciado) {
      throw new BadRequestException(
        'Cabeçalho obrigatório: deve conter nucleo e programa (ou nucleoId e programaId), além de ano, trimestre e valorRealizado.',
      );
    }

    if (colunas.ano < 0 || colunas.trimestre < 0 || colunas.valor < 0) {
      throw new BadRequestException(
        'Cabeçalho obrigatório: ano, trimestre e valorRealizado. Campos obrigatórios adicionais: nucleo e programa.',
      );
    }

    const erros: { linha: number; mensagem: string }[] = [];
    const validas: LinhaCsv[] = [];

    linhas.slice(1).forEach((linha, i) => {
      const numero = i + 2;
      const campos = separar(linha, delimitador);
      const indicadorId =
        colunas.indicadorId >= 0
          ? campos[colunas.indicadorId]?.trim()
          : undefined;
      const indicadorNome =
        colunas.nomeIndicador >= 0
          ? campos[colunas.nomeIndicador]?.trim()
          : undefined;
      const indicadorCodigo =
        colunas.codigoIndicador >= 0
          ? campos[colunas.codigoIndicador]?.trim()
          : undefined;
      const nucleoId =
        colunas.nucleoId >= 0
          ? campos[colunas.nucleoId]?.trim() || undefined
          : undefined;
      const nucleoNome =
        colunas.nucleoNome >= 0
          ? campos[colunas.nucleoNome]?.trim() || undefined
          : undefined;
      const programaId =
        colunas.programaId >= 0
          ? campos[colunas.programaId]?.trim() || undefined
          : undefined;
      const programaNome =
        colunas.programaNome >= 0
          ? campos[colunas.programaNome]?.trim() || undefined
          : undefined;
      const anoTexto = campos[colunas.ano];
      const ano = Number(anoTexto);
      const trimestre = campos[
        colunas.trimestre
      ]?.toUpperCase() as TrimestreEnum;
      const valorTexto = campos[colunas.valor]?.trim().replace(',', '.');
      const valorRealizado =
        valorTexto === '' || valorTexto === undefined
          ? null
          : Number(valorTexto);
      const metaTexto =
        colunas.meta >= 0
          ? campos[colunas.meta]?.trim().replace(',', '.')
          : undefined;
      const meta =
        metaTexto === '' || metaTexto === undefined ? null : Number(metaTexto);

      if (
        (!indicadorId && !indicadorNome && !indicadorCodigo) ||
        !anoTexto ||
        !Number.isInteger(ano) ||
        ano < 1900 ||
        ano > 2200
      ) {
        erros.push({ linha: numero, mensagem: 'Indicador ou ano inválido.' });
        return;
      }
      if ((!nucleoId && !nucleoNome) || (!programaId && !programaNome)) {
        erros.push({
          linha: numero,
          mensagem: 'Núcleo e programa são obrigatórios.',
        });
        return;
      }
      if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(trimestre)) {
        erros.push({
          linha: numero,
          mensagem: 'Trimestre deve ser Q1, Q2, Q3 ou Q4.',
        });
        return;
      }
      if (valorRealizado !== null && !Number.isFinite(valorRealizado)) {
        erros.push({ linha: numero, mensagem: 'Valor realizado inválido.' });
        return;
      }
      if (meta !== null && !Number.isFinite(meta)) {
        erros.push({ linha: numero, mensagem: 'Valor da meta inválido.' });
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
        ano,
        trimestre,
        valorRealizado,
        meta,
      });
    });

    const usuario = await this.prisma.user.findFirst({
      where: { id: userId, ativo: true, deletedAt: null },
      include: { nucleos: { select: { nucleoId: true } } },
    });
    if (!usuario || usuario.perfil !== role) {
      throw new ForbiddenException(
        'Usuário inválido ou perfil alterado. Entre novamente.',
      );
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
    const ehAdministrador = role === Role.ADMINISTRADOR;
    const semPermissao = 'Sem permissão para este núcleo.';

    for (const linha of validas) {
      const erro = (mensagem: string) =>
        erros.push({ linha: linha.numero, mensagem });

      try {
        // 1) Núcleo: precisa existir, estar ativo e ser do usuário (RN02).
        //    A permissão é checada antes de qualquer gravação.
        let nucleoVinculado: Nucleo | null = null;
        if (linha.nucleoId) {
          nucleoVinculado = await this.prisma.nucleo.findFirst({
            where: { id: linha.nucleoId, deletedAt: null, status: 'ATIVO' },
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
        if (!nucleoVinculado) {
          erro(
            'Núcleo não encontrado ou inativo. Cadastre o núcleo antes de importar os indicadores.',
          );
          continue;
        }
        if (!ehAdministrador && !nucleosPermitidos.has(nucleoVinculado.id)) {
          erro(semPermissao);
          continue;
        }

        // 2) Programa: precisa existir, estar ativo e pertencer ao núcleo
        let programaVinculado: Programa | null = null;
        if (linha.programaId) {
          programaVinculado = await this.prisma.programa.findFirst({
            where: {
              id: linha.programaId,
              deletedAt: null,
              status: 'ATIVO',
              nucleoId: nucleoVinculado.id,
            },
          });
        } else if (linha.programaNome) {
          programaVinculado = await this.prisma.programa.findFirst({
            where: {
              nome: { equals: linha.programaNome, mode: 'insensitive' },
              deletedAt: null,
              status: 'ATIVO',
              nucleoId: nucleoVinculado.id,
            },
          });
        }
        if (!programaVinculado) {
          erro(
            'Programa não encontrado, inativo ou incompatível com o núcleo. Cadastre o programa antes de importar os indicadores.',
          );
          continue;
        }

        // 3) Indicador: só busca; a importação nunca cria indicadores
        const referencia =
          linha.indicadorNome || linha.indicadorCodigo || linha.indicadorId;
        let indicador: Indicador | null = null;
        if (linha.indicadorId) {
          indicador = await this.prisma.indicador.findFirst({
            where: { id: linha.indicadorId, deletedAt: null, status: 'ATIVO' },
          });
        } else if (linha.indicadorCodigo) {
          indicador = await this.prisma.indicador.findFirst({
            where: {
              codigo: linha.indicadorCodigo,
              deletedAt: null,
              status: 'ATIVO',
            },
          });
        }
        if (!indicador && !linha.indicadorId && linha.indicadorNome) {
          indicador = await this.prisma.indicador.findFirst({
            where: {
              nome: { equals: linha.indicadorNome, mode: 'insensitive' },
              deletedAt: null,
              status: 'ATIVO',
              nucleoId: nucleoVinculado.id,
              programaId: programaVinculado.id,
            },
          });
        }
        if (!indicador) {
          erro(`Indicador não encontrado: ${referencia}`);
          continue;
        }

        // Indicador buscado por id/código pode ser de outro núcleo: mesma regra
        // do lançamento manual (institucional fica com a administração)
        if (
          !ehAdministrador &&
          (!indicador.nucleoId || !nucleosPermitidos.has(indicador.nucleoId))
        ) {
          erro(semPermissao);
          continue;
        }

        // 4) Registro existente: mesma regra de alterarValorRegistro, checada
        //    antes de gravar o valor ou a meta
        const registroExistente = await this.prisma.indicadorRegistro.findFirst(
          {
            where: {
              indicadorId: indicador.id,
              ano: linha.ano,
              trimestre: linha.trimestre,
              deletedAt: null,
            },
          },
        );
        if (
          registroExistente &&
          bloqueioDeAlteracao(registroExistente, role) !== null
        ) {
          const statusAtual =
            registroExistente.status === 'INATIVO'
              ? 'INATIVO'
              : registroExistente.statusAprovacao;
          erro(
            `Indicador ${indicador.nome} está com status ${statusAtual} e não pode ser alterado via importação.`,
          );
          continue;
        }

        const temMeta =
          linha.meta !== null &&
          linha.meta !== undefined &&
          Number.isFinite(linha.meta);
        const extras = {
          importacaoId: importacao.id,
          ...(temMeta && { metaAplicada: linha.meta as number }),
        };

        if (registroExistente) {
          // Grava, muda o status conforme o fluxo e audita (ATUALIZAR)
          await alterarValorRegistro(
            this.prisma,
            this.audit,
            registroExistente,
            linha.valorRealizado,
            { id: userId, role },
            undefined,
            { dados: extras, auditoria: { importacaoId: importacao.id } },
          );
        } else {
          const criado = await this.prisma.indicadorRegistro.create({
            data: {
              indicadorId: indicador.id,
              ano: linha.ano,
              trimestre: linha.trimestre,
              valorRealizado: linha.valorRealizado,
              statusAprovacao: StatusAprovacao.EM_PREENCHIMENTO,
              responsavelId: userId,
              ...extras,
            },
          });
          await this.audit.registrarAcao({
            userId,
            acao: AcaoAuditoria.CRIAR,
            entidade: 'IndicadorRegistro',
            entidadeId: criado.id,
            dadosNovos: {
              indicadorId: indicador.id,
              ano: linha.ano,
              trimestre: linha.trimestre,
              valorRealizado: linha.valorRealizado,
              statusAprovacao: criado.statusAprovacao,
              importacaoId: importacao.id,
            },
          });
        }

        if (temMeta) {
          const metaExistente = await this.prisma.meta.findFirst({
            where: {
              indicadorId: indicador.id,
              ano: linha.ano,
              trimestre: linha.trimestre,
              deletedAt: null,
            },
          });

          if (metaExistente) {
            await this.prisma.meta.update({
              where: { id: metaExistente.id },
              data: { valorMeta: linha.meta as number, status: 'ATIVO' },
            });
          } else {
            await this.prisma.meta.create({
              data: {
                indicadorId: indicador.id,
                ano: linha.ano,
                trimestre: linha.trimestre,
                valorMeta: linha.meta as number,
                status: 'ATIVO',
              },
            });
          }
        }

        linhasOk++;
      } catch (falha) {
        // Ex.: registro alterado por outra operação no meio da importação
        if (falha instanceof HttpException) {
          erro(falha.message);
          continue;
        }
        console.error(`Erro ao importar linha ${linha.numero}:`, falha);
        erro('Falha ao gravar o registro; verifique se os dados são válidos.');
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
        erros,
        finalizadoEm: new Date(),
      },
    });
  }
}
