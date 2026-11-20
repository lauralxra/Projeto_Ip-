import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Svg } from './config/assets';
import { NavBar } from './NavBar';
import { User } from './UserBar';
import { BtnCriar } from './BtnCriar';
import { CustomDropdown } from './CustomDropdown';
import {
  Archive,
  CheckCircle2,
  Circle,
  Clock,
  History,
  RotateCcw,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { Programa } from './dados/programas';
import { type Indicador } from './dados/indicadores';
import { Search } from 'lucide-react';
import { UsuarioAtual } from './dados/usuarios';
import type { Nucleo } from './dados/nucleos';
import { API_BASE_URL } from './config/api';
import { apiFetch, ErroApi, mensagemDeErro } from './api/cliente';
import { buscarTodasMetas, metaDoPeriodo, type MetaApi } from './api/metas';

function infoStatusAprovacao(status?: string) {
  switch (status) {
    case 'APROVADO':
    case 'PUBLICADO':
      return {
        rotulo: 'Aprovado',
        classe: 'bg-[#d5e4d1] text-[#24421e]',
      };
    case 'ENVIADO_REVISAO':
      return {
        rotulo: 'Em Análise',
        classe: 'bg-[#fbd3ee]/70 text-[#832b62]',
      };
    case 'NECESSITA_CORRECAO':
      return {
        rotulo: 'Devolvido para Correção',
        classe: 'bg-[#f8d7da] text-[#7a1f2b]',
      };
    case 'EM_PREENCHIMENTO':
      return {
        rotulo: 'Em Preenchimento',
        classe: 'bg-[#ffdfbf] text-[#5c3310]',
      };
    default:
      return {
        rotulo: 'Pendente',
        classe: 'bg-[rgba(102,70,102,0.16)] text-[#3b142f]',
      };
  }
}

function TotalProgresso({ progresso }: { progresso: number }) {
  // Cálculo matemático para preencher o círculo SVG proporcionalmente
  // O raio do círculo é 82.5, logo a circunferência aproximada é 2 * pi * 82.5 ≈ 518.36
  const raio = 82.5;
  const circunferencia = 2 * Math.PI * raio;
  const progressoSeguro = Number.isFinite(progresso)
    ? Math.max(0, Math.min(progresso, 100))
    : 0;
  const deslocamento =
    circunferencia - (circunferencia * progressoSeguro) / 100;

  return (
    <div
      className="border-2 border-[#3b142f] border-solid flex flex-1 flex-col gap-[12px] items-center justify-center min-w-[200px] px-[10px] py-[16px] rounded-[10px]"
      data-name="TotalProgresso"
    >
      <p className="font-semibold text-[#3c3b3b] text-[18px] text-center w-full">
        Progresso geral
      </p>

      <div
        className="inline-grid leading-[0] size-[130px] place-items-start relative shrink-0"
        data-name="Barra"
      >
        {/* Circulo SVG Dinâmico */}
        <div className="col-1 size-[130px] row-1">
          <svg
            className="absolute block inset-0 size-full -rotate-90"
            height="130"
            viewBox="0 0 182 182"
            width="130"
          >
            <g id="Group 69">
              {/* Círculo de fundo cinza */}
              <circle
                cx="91"
                cy="91"
                id="Ellipse 35"
                r={raio}
                stroke="#D0CFCF"
                strokeWidth="17"
                fill="none"
              />

              {/* Círculo de progresso dinâmico */}
              <circle
                cx="91"
                cy="91"
                id="Ellipse 36"
                r={raio}
                stroke="url(#paint0_linear_0_44)"
                strokeLinecap="round"
                strokeWidth="17"
                fill="none"
                strokeDasharray={circunferencia}
                strokeDashoffset={deslocamento}
                style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
              />
            </g>
            <defs>
              <linearGradient
                gradientUnits="userSpaceOnUse"
                id="paint0_linear_0_44"
                x1="9.5"
                x2="192.5"
                y1="100"
                y2="98"
              >
                <stop offset="0.524038" stopColor="#3B142F" />
                <stop offset="1" stopColor="#A13680" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Porcentagem */}
        <p className="col-1 font-normal ml-[42px] mt-[52px] absolute align-center justify-center row-1 text-[#3c3b3b] text-[18px]">
          {progressoSeguro}%
        </p>
      </div>
    </div>
  );
}

function TotalIndicadores({ valor }: { valor: number }) {
  return (
    <div
      className="border-2 border-[#3b142f] border-solid flex flex-1 flex-col gap-[8px] h-[200px] items-center justify-center min-w-[200px] px-[10px] py-[16px] rounded-[10px] text-[#3c3b3b] text-center"
      data-name="TotalIndicadores"
    >
      <p className="font-semibold text-[18px] w-full">Total de indicadores</p>
      <div className="flex flex-col font-normal justify-center text-[36px] w-full">
        <p className="leading-[normal]">{valor}</p>
      </div>
    </div>
  );
}

function TotalParticipantes() {
  return (
    <div
      className="border-2 border-[#3b142f] border-solid flex flex-1 flex-col gap-[8px] h-[200px] items-center justify-center min-w-[200px] px-[10px] py-[16px] rounded-[10px] text-[#3c3b3b] text-center"
      data-name="TotalParticipantes"
    >
      <p className="font-semibold text-[18px] w-full">Participantes ativos</p>
      <div className="flex flex-col font-normal justify-center text-[36px] w-full">
        <p className="leading-[normal]">13</p>
      </div>
    </div>
  );
}

function BtnImportIco({ ico, id }: { ico: string; id: string }) {
  return (
    <div className="flex items-center justify-center size-[24px]">
      <div className="flex-none rotate-90">
        <div className="size-[24px]" data-name={id}>
          <svg className={ico} fill="none" viewBox="0 0 34 34">
            <g id="btnDeslogar">
              <path d={Svg.p324b2780} fill="#3B142F" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

function Top() {
  return (
    <div className="bg-[#3b142f] flex items-center justify-between min-h-[48px] px-[20px] py-[8px] rounded-t-[24px] w-full">
      <div className="flex flex-1 items-center justify-center">
        <p className="font-normal text-[15px] text-white">Indicador</p>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <p className="font-normal text-[15px] text-white">Ano</p>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <p className="font-normal text-[15px] text-white">Trimestre</p>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <p className="font-normal text-[15px] text-white">Unidade</p>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <p className="font-normal text-[15px] text-white">Meta</p>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <p className="font-normal text-[15px] text-white">Realizado</p>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <p className="font-normal text-[15px] text-white">Progresso</p>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <p className="font-normal text-[15px] text-white">Ações</p>
      </div>
    </div>
  );
}

function Lista({
  leList,
  editIndic,
  setIndicVal,
  arquivarIndic,
  reativarIndic,
  enviarRevisaoIndic,
  delIndic,
  aprovIndic,
  abrirHistorico,
}: {
  leList: Indicador[];
  editIndic: (arg0: Indicador) => void;
  setIndicVal: (indic: Indicador) => void;
  arquivarIndic: (indic: Indicador) => void;
  reativarIndic: (indic: Indicador) => void;
  enviarRevisaoIndic: (indic: Indicador) => void;
  delIndic: (indic: Indicador) => void;
  aprovIndic: (indic: Indicador) => void;
  abrirHistorico: (indic: Indicador) => void;
}) {
  if (leList.length === 0) {
    return (
      <div className="bg-[#f2eff4] rounded-xl px-[20px] py-[28px] text-center text-sm text-slate-500 w-full">
        Nenhum indicador encontrado para os filtros selecionados.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start gap-[12px] w-full">
      {leList.map((indicador) => {
        const statusNormalizado = (indicador.status ?? 'ATIVO').toUpperCase();
        const ehAtivo = statusNormalizado === 'ATIVO';
        const statusAprov = indicador.statusAprovacao;
        const ehEmAnalise = statusAprov === 'ENVIADO_REVISAO';
        const ehAprovado =
          statusAprov === 'APROVADO' || statusAprov === 'PUBLICADO';
        const ehDevolvido = statusAprov === 'NECESSITA_CORRECAO';
        const podeEnviarAnalise =
          ehAtivo &&
          Boolean(indicador.registroId) &&
          (statusAprov === 'EM_PREENCHIMENTO' ||
            statusAprov === 'NECESSITA_CORRECAO');
        // UC038 Regras 2 e 3: editável enquanto em preenchimento/devolvido; bloqueado em análise ou aprovado no ciclo
        const podeEditarValor =
          ehAtivo &&
          !ehAprovado &&
          !ehEmAnalise &&
          (UsuarioAtual.tipo == 'ADM' || UsuarioAtual.tipo == 'DN');
        const badgeRevisao = infoStatusAprovacao(statusAprov);
        const numRealizado = parseFloat(indicador.valAtual) || 0;
        const numMeta = parseFloat(indicador.meta || '0');

        let progressoPercent = 0;
        if (numMeta > 0) {
          progressoPercent = Math.min((numRealizado / numMeta) * 100, 100);
        }

        return (
          <div
            key={indicador.id}
            className={`rounded-xl px-[20px] py-[12px] flex items-center justify-between gap-[15px] shadow-xs hover:shadow-md transition-shadow w-full ${
              ehAtivo
                ? 'bg-[#f2eff4]'
                : 'bg-[#f2eff4]/75 border border-[#832b62]/20'
            }`}
          >
            <div className="flex items-center justify-between min-h-[40px] w-full text-[15px]">
              <div className="flex flex-1 flex-col font-normal justify-center text-black">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{indicador.nome}</p>
                  {!ehAtivo && (
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        statusNormalizado === 'ARQUIVADO'
                          ? 'bg-[#ffdfbf] text-[#5c3310]'
                          : 'bg-[rgba(102,70,102,0.16)] text-[#3b142f]'
                      }`}
                    >
                      {statusNormalizado === 'ARQUIVADO'
                        ? 'Arquivado'
                        : 'Inativo'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {indicador.registroId && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeRevisao.classe}`}
                      title={
                        ehDevolvido && indicador.justificativaDevolucao
                          ? `Motivo da devolução: ${indicador.justificativaDevolucao}`
                          : undefined
                      }
                    >
                      {badgeRevisao.rotulo}
                    </span>
                  )}
                  {indicador.registros && indicador.registros.length > 0 && (
                    <button
                      type="button"
                      onClick={() => abrirHistorico(indicador)}
                      className="text-[11px] font-semibold text-[#832b62] bg-[#832b62]/10 hover:bg-[#832b62]/20 px-2 py-0.5 rounded-full cursor-pointer flex items-center gap-1 w-fit transition-colors"
                      title="Ver todas as medições trimestrais cadastradas"
                    >
                      <History className="size-3" />
                      <span>
                        {indicador.registros.length}{' '}
                        {indicador.registros.length === 1
                          ? 'período'
                          : 'períodos'}
                      </span>
                    </button>
                  )}
                </div>
                {ehDevolvido && indicador.justificativaDevolucao && (
                  <p className="text-[11px] text-[#7a1f2b] mt-1 line-clamp-2">
                    <strong>Correção solicitada:</strong>{' '}
                    {indicador.justificativaDevolucao}
                  </p>
                )}
              </div>
              <div className="flex flex-1 flex-col font-normal justify-center text-black">
                <p>{indicador.ano ?? '-'}</p>
              </div>
              <div className="flex flex-1 flex-col font-normal justify-center text-black">
                <p>{indicador.trimestre ?? '-'}</p>
              </div>
              <div className="flex flex-1 flex-col font-normal justify-center text-black">
                <p>{indicador.unidade}</p>
              </div>

              <div className="flex flex-1 flex-col font-normal justify-center text-black">
                <p>
                  {indicador.meta != null
                    ? indicador.meta +
                      (indicador.simbolUni ? indicador.simbolUni : '')
                    : 'Sem meta'}
                </p>
              </div>

              {podeEditarValor ? (
                <>
                  {/* Realizado */}
                  <button
                    title="Definir / Corrigir Valor Atual"
                    onClick={() => setIndicVal(indicador)}
                    className="flex flex-1 gap-[16px] items-center cursor-pointer"
                  >
                    <p className="font-normal text-[#3c3b3b] whitespace-nowrap">
                      {indicador.valAtual +
                        (indicador.simbolUni ? indicador.simbolUni : '')}
                    </p>

                    {/* Botao Editar */}
                    <div className="flex items-center p-[2px] size-[14px]">
                      <svg
                        className="block size-full"
                        fill="none"
                        viewBox="0 0 14.6791 14.6795"
                      >
                        <path
                          d={Svg.p1dac9e00}
                          stroke="#3B142F"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                        <path
                          d={Svg.pa46f980}
                          stroke="#3B142F"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <div
                    className="flex flex-1 gap-[16px] items-center"
                    title={
                      !ehAtivo
                        ? 'Indicador arquivado/inativo: somente consulta'
                        : ehAprovado
                          ? 'Aprovado no ciclo: edição bloqueada'
                          : ehEmAnalise
                            ? 'Em análise pela Administração: edição bloqueada'
                            : undefined
                    }
                  >
                    <p className="font-normal text-[#3c3b3b] whitespace-nowrap">
                      {indicador.valAtual +
                        (indicador.simbolUni ? indicador.simbolUni : '')}
                    </p>
                  </div>
                </>
              )}

              {/* Container barra */}
              <div className="flex items-center flex-1">
                <div className="bg-[#c2c2c2] flex flex-col h-[8px] items-start rounded-[100px] w-[90px] overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#3b142f] to-[#77275e] h-full rounded-[100px] w-[60%]"
                    style={{ width: `${progressoPercent}%` }}
                  />
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-1 gap-[12px] items-center">
                {UsuarioAtual.tipo == 'ADM' && ehAtivo ? (
                  <button
                    title="Editar Indicador"
                    onClick={() => editIndic(indicador)}
                    className="size-[24px] cursor-pointer"
                  >
                    <svg
                      className="block size-full"
                      fill="none"
                      viewBox="0 0 39 39"
                    >
                      <path d={Svg.p36224900} fill="#3C3B3B" />
                    </svg>
                  </button>
                ) : (
                  ''
                )}

                <button
                  type="button"
                  title={
                    ehAtivo
                      ? 'Histórico de Medições (ver e adicionar novos anos/trimestres)'
                      : 'Consultar Histórico de Medições (somente leitura)'
                  }
                  onClick={() => abrirHistorico(indicador)}
                  className="size-[24px] cursor-pointer text-[#3c3b3b] hover:text-[#832b62] transition-colors"
                >
                  <History className="size-full" />
                </button>

                <Link
                  title={`Ver gráfico do indicador "${indicador.nome}" no Dashboard`}
                  className="size-[24px] hover:opacity-75 transition-opacity cursor-pointer"
                  to={`/dashboard?indicadorId=${indicador.id}&nome=${encodeURIComponent(indicador.nome)}`}
                >
                  <div className="size-full">
                    <svg
                      className="block size-full"
                      fill="none"
                      viewBox="0 0 32.5 32.5001"
                    >
                      <path d={Svg.p19cd0a80} fill="#3C3B3B" />
                    </svg>
                  </div>
                </Link>

                {podeEnviarAnalise &&
                  (UsuarioAtual.tipo == 'ADM' || UsuarioAtual.tipo == 'DN') && (
                    <button
                      type="button"
                      title="Enviar para Análise da Administração"
                      onClick={() => enviarRevisaoIndic(indicador)}
                      className="size-[24px] cursor-pointer text-[#3c3b3b] hover:text-[#832b62] transition-colors"
                    >
                      <Send className="size-full" />
                    </button>
                  )}

                {UsuarioAtual.tipo == 'ADM' && ehAtivo ? (
                  <button
                    type="button"
                    title="Arquivar / Desativar Indicador"
                    onClick={() => arquivarIndic(indicador)}
                    className="size-[24px] cursor-pointer text-[#3c3b3b] hover:text-[#832b62] transition-colors"
                  >
                    <Archive className="size-full" />
                  </button>
                ) : (
                  ''
                )}

                {UsuarioAtual.tipo == 'ADM' && !ehAtivo ? (
                  <button
                    type="button"
                    title="Reativar Indicador"
                    onClick={() => reativarIndic(indicador)}
                    className="size-[24px] cursor-pointer text-[#3c3b3b] hover:text-[#832b62] transition-colors"
                  >
                    <RotateCcw className="size-full" />
                  </button>
                ) : (
                  ''
                )}

                {UsuarioAtual.tipo == 'ADM' ? (
                  <button
                    title="Excluir Indicador"
                    onClick={() => delIndic(indicador)}
                    className="size-[24px] cursor-pointer"
                  >
                    <svg
                      className="block size-full"
                      fill="none"
                      viewBox="0 0 31.6875 36.5625"
                    >
                      <path d={Svg.p38953980} fill="#3C3B3B" />
                    </svg>
                  </button>
                ) : (
                  ''
                )}

                {/* UC038: somente Administradora revisa registros em status Em Análise */}
                {UsuarioAtual.tipo == 'ADM' && ehAtivo && ehEmAnalise ? (
                  <button
                    type="button"
                    title="Revisar Indicador (Aprovar ou Devolver)"
                    onClick={() => aprovIndic(indicador)}
                    className="size-[24px] cursor-pointer text-[#832b62] hover:text-[#3b142f] transition-colors"
                  >
                    <Clock className="size-full" />
                  </button>
                ) : ehAprovado ? (
                  <div
                    title="Aprovado no ciclo (irreversível)"
                    className="size-[24px] text-[#3b142f]"
                  >
                    <CheckCircle2 className="size-full" />
                  </div>
                ) : ehDevolvido ? (
                  <div
                    title={
                      indicador.justificativaDevolucao
                        ? `Devolvido para correção: ${indicador.justificativaDevolucao}`
                        : 'Devolvido para correção'
                    }
                    className="size-[24px] text-[#832b62]"
                  >
                    <XCircle className="size-full" />
                  </div>
                ) : (
                  <div
                    title={
                      ehEmAnalise
                        ? 'Em Análise pela Administração'
                        : 'Aguardando envio para análise'
                    }
                    className="size-[24px] text-[#3c3b3b]/35"
                  >
                    <Circle className="size-full" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TelaIndicadores() {
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [nucleosDoBanco, setNucleosDoBanco] = useState<Nucleo[]>([]);
  const [programasDoBanco, setProgramasDoBanco] = useState<Programa[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<
    'ATIVO' | 'ARQUIVADO' | 'INATIVO'
  >('ATIVO');

  const carregarIndicadores = async (
    statusAlvo: 'ATIVO' | 'ARQUIVADO' | 'INATIVO' = filtroStatus,
  ) => {
    const token = localStorage.getItem('access_token');

    if (!token) return;

    try {
      const resposta = await fetch(
        `${API_BASE_URL}/indicadores?status=${statusAlvo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!resposta.ok) {
        throw new Error(`Erro ao carregar indicadores: ${resposta.status}`);
      }

      const dados = await resposta.json();

      // As metas ficam em GET /metas; uma falha nelas não impede a listagem
      let metas: MetaApi[] = [];
      try {
        metas = await buscarTodasMetas();
      } catch (erroMetas) {
        console.error('Erro ao carregar metas:', erroMetas);
      }

      const indicadoresReais: Indicador[] = dados.map((item: any) => {
        const registro = item.registros?.[0];
        // Meta do período exibido no card; sem valor lançado, a anual do ano corrente
        const meta = metaDoPeriodo(
          metas,
          item.id,
          registro?.ano ?? new Date().getFullYear(),
          registro?.trimestre,
        );

        const unidade = item.unidadeMedida ?? 'Unidade';

        const simbolo =
          unidade === 'Porcentagem'
            ? '%'
            : unidade === 'Toneladas'
              ? 't'
              : unidade === 'Quilos'
                ? 'Kg'
                : unidade === 'Reais'
                  ? '$'
                  : '';

        return {
          id: item.id,
          registroId: registro?.id,
          nome: item.nome,
          unidade,
          simbolUni: simbolo,
          meta: meta ? String(meta.valorMeta) : undefined,
          metaId: meta?.id,
          valAtual:
            registro?.valorRealizado != null
              ? String(registro.valorRealizado)
              : '0',
          ano: registro?.ano ?? undefined,
          trimestre: registro?.trimestre ?? undefined,
          nucleo: item.nucleo ?? undefined,
          programa: item.programa ?? undefined,
          status: item.status,
          statusAprovacao: registro?.statusAprovacao,
          justificativaDevolucao: registro?.justificativaDevolucao ?? null,
          aprovado:
            registro?.statusAprovacao === 'APROVADO' ||
            registro?.statusAprovacao === 'PUBLICADO',
          registros: (item.registros ?? []).map((r: any) => ({
            id: r.id,
            ano: r.ano,
            trimestre: r.trimestre,
            valorRealizado:
              r.valorRealizado != null ? String(r.valorRealizado) : null,
            metaAplicada:
              r.metaAplicada != null ? String(r.metaAplicada) : null,
            statusAprovacao: r.statusAprovacao,
            justificativaDevolucao: r.justificativaDevolucao ?? null,
            status: r.status,
          })),
        };
      });

      setIndicadores(indicadoresReais);
    } catch (erro) {
      console.error('Erro ao carregar indicadores:', erro);
      alert('Não foi possível carregar os indicadores do banco de dados.');
    }
  };

  useEffect(() => {
    carregarIndicadores(filtroStatus);
  }, [filtroStatus]);

  useEffect(() => {
    const carregarNucleos = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) return;

      try {
        const resposta = await fetch(
          `${API_BASE_URL}/nucleos?status=ATIVO&limite=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!resposta.ok) {
          throw new Error(`Erro ao carregar núcleos: ${resposta.status}`);
        }

        // GET /nucleos é paginado: { itens, total, pagina, limite }
        const { itens: dados } = await resposta.json();

        const nucleosReais: Nucleo[] = dados.map((item: any) => ({
          id: item.id,
          nome: item.nome,
          sigla: item.sigla,
          descricao: item.descricao ?? '',
          corBg: 'bg-[#832b62]',
          corIcone: 'text-white',
        }));

        setNucleosDoBanco(nucleosReais);
      } catch (erro) {
        console.error('Erro ao carregar núcleos:', erro);
        alert('Não foi possível carregar os núcleos do banco de dados.');
      }
    };

    carregarNucleos();
  }, []);

  useEffect(() => {
    const carregarProgramas = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) return;

      try {
        const resposta = await fetch(`${API_BASE_URL}/programas`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!resposta.ok) {
          throw new Error(`Erro ao carregar programas: ${resposta.status}`);
        }

        const dados = await resposta.json();

        const programasReais: Programa[] = dados.map((item: any) => ({
          id: item.id,
          nome: item.nome,
          descricao: item.descricao ?? '',
          nucleo: item.nucleo
            ? {
                id: item.nucleo.id,
                nome: item.nucleo.nome,
                sigla: item.nucleo.sigla,
                descricao: '',
                corBg: 'bg-[#832b62]',
                corIcone: 'text-white',
              }
            : undefined,
          dataDeInicio: '',
          status: 'ATIVO',
          acoes: [],
          indicadores: [],
        }));

        setProgramasDoBanco(programasReais);
      } catch (erro) {
        console.error('Erro ao carregar programas:', erro);
        alert('Não foi possível carregar os programas do banco de dados.');
      }
    };

    carregarProgramas();
  }, []);

  const [indicSelecionado, setIndicSelecionado] = useState<Indicador | null>(
    null,
  );

  const [filtroNucleo, setFiltroNucleo] = useState('');
  const [filtroPrograma, setFiltroPrograma] = useState('');
  const [filtroAprovacao, setFiltroAprovacao] = useState('');

  const NucleosDoUser =
    nucleosDoBanco.length > 0 ? nucleosDoBanco : (UsuarioAtual.nucleos ?? []);
  const listaNucleosNome = Array.from(
    new Set(NucleosDoUser.map((i) => i.sigla)),
  ).filter(Boolean);

  const programasDoUsuario = programasDoBanco;

  // 2. Aplica o filtro dinâmico do select de núcleos selecionado na tela
  const programasDoNucleo = programasDoUsuario.filter((n) => {
    const matchNucleo =
      filtroNucleo === ''
        ? true
        : filtroNucleo === 'Nenhum'
          ? !n.nucleo
          : n.nucleo?.sigla === filtroNucleo;

    return matchNucleo;
  });

  const listaProgramas = Array.from(
    new Set(programasDoNucleo.map((i) => i.nome)),
  );

  const listagemAprovacao = [
    'Em Análise',
    'Aprovado',
    'Devolvido para Correção',
    'Em Preenchimento',
    'Pendente',
  ];

  // Filtragem
  const indicDoUser = indicadores.filter((n) => {
    if (UsuarioAtual.tipo === 'ADM') return true;
    if (!n.nucleo) return false;

    // Verifica se algum dos núcleos do usuário possui a mesma sigla ou ID do núcleo do indicador
    return UsuarioAtual.nucleos?.some(
      (nuUser) => nuUser.sigla === n.nucleo?.sigla,
    );
  });

  const [termoPesquisa, setTermoPesquisa] = useState('');
  const indicPorNome = indicDoUser.filter(
    (n) =>
      n.nome.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
      n.unidade.toLowerCase().includes(termoPesquisa.toLowerCase()),
  );

  const getOrdemTrimestre = (trimestre?: string) => {
    if (!trimestre) return 0;

    const valor = trimestre.toUpperCase();
    const mapa: Record<string, number> = {
      Q1: 1,
      T1: 1,
      Q2: 2,
      T2: 2,
      Q3: 3,
      T3: 3,
      Q4: 4,
      T4: 4,
    };
    return mapa[valor] ?? 0;
  };

  const indicadoresFiltrados = [...indicPorNome]
    .filter((n) => {
      const matchNucleo =
        filtroNucleo === ''
          ? true
          : filtroNucleo === 'Nenhum'
            ? !n.nucleo
            : n.nucleo?.sigla === filtroNucleo;

      const matchPrograma =
        filtroPrograma === ''
          ? true
          : filtroPrograma === 'Nenhum'
            ? !n.programa
            : n.programa?.nome === filtroPrograma;

      const matchAprov =
        filtroAprovacao === ''
          ? true
          : filtroAprovacao === 'Em Análise'
            ? n.statusAprovacao === 'ENVIADO_REVISAO'
            : filtroAprovacao === 'Aprovado'
              ? n.statusAprovacao === 'APROVADO' ||
                n.statusAprovacao === 'PUBLICADO'
              : filtroAprovacao === 'Devolvido para Correção'
                ? n.statusAprovacao === 'NECESSITA_CORRECAO'
                : filtroAprovacao === 'Em Preenchimento'
                  ? n.statusAprovacao === 'EM_PREENCHIMENTO'
                  : filtroAprovacao === 'Pendente'
                    ? !n.statusAprovacao || n.statusAprovacao === 'PENDENTE'
                    : true;

      return matchNucleo && matchPrograma && matchAprov;
    })
    .sort((a, b) => {
      const anoA = a.ano ?? -Infinity;
      const anoB = b.ano ?? -Infinity;

      if (anoA !== anoB) return anoB - anoA;
      return getOrdemTrimestre(b.trimestre) - getOrdemTrimestre(a.trimestre);
    });

  const [formNome, setNomeForm] = useState('');
  const [formUnidade, setUnidadeForm] = useState('');
  const [formNucleoId, setFormNucleoId] = useState<string>('');
  const [formProgramId, setProgramId] = useState<string>('');
  const [formMeta, setMetaForm] = useState('');
  const [temMetaForm, setTemMetaForm] = useState(true);
  const [formValor, setValorForm] = useState('');
  const [formAno, setFormAno] = useState(String(new Date().getFullYear()));
  const [formTrimestre, setFormTrimestre] = useState('Q4');
  const [formDesaprovMotivo, setMotivo] = useState('');

  // Janelas popup

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const abrirCriarModal = () => {
    setNomeForm('');
    setUnidadeForm('');
    setFormNucleoId('');
    setProgramId('');
    setValorForm('0');
    setMetaForm('');
    setTemMetaForm(false);
    setFormAno(String(new Date().getFullYear()));
    setFormTrimestre('Q4');
    setModalNovoAberto(true);
  };

  const handleCriarIndic = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('access_token');

    if (!token) {
      alert('Sua sessão expirou. Faça login novamente.');
      return;
    }

    const nome = formNome.trim();

    if (!nome) {
      alert('Informe o nome do indicador.');
      return;
    }

    if (formNucleoId && !NucleosDoUser.some((n) => n.id === formNucleoId)) {
      alert('Selecione um núcleo válido antes de criar o indicador.');
      return;
    }

    if (
      formProgramId &&
      !programasDoBanco.some((n) => n.id === formProgramId)
    ) {
      alert('Selecione um programa válido antes de criar o indicador.');
      return;
    }

    const nucleoSelecionado = formNucleoId
      ? NucleosDoUser.find((n) => n.id === formNucleoId)
      : undefined;

    const programSelecionado = formProgramId
      ? programasDoBanco.find((n) => n.id === formProgramId)
      : undefined;

    const tipoDado =
      formUnidade === 'Porcentagem'
        ? 'PERCENTUAL'
        : formUnidade === 'Reais'
          ? 'MOEDA'
          : 'NUMERICO';

    const dadosIndicador = {
      nome,
      unidadeMedida: formUnidade || 'Unidade',
      escopo: nucleoSelecionado ? 'NUCLEO' : 'INSTITUCIONAL',
      tipoDado,
      nucleoId: nucleoSelecionado?.id || null,
      programaId: programSelecionado?.id || null,
    };

    const valorInicial = Number(formValor ?? '0');
    const anoInicial = Number(formAno);
    const trimestreInicial = formTrimestre;

    try {
      // 1. Verifica se já existe um indicador com este mesmo nome no núcleo ou escopo institucional
      const indicadorExistente = indicadores.find(
        (ind) =>
          ind.nome.trim().toLowerCase() === nome.toLowerCase() &&
          (formNucleoId ? ind.nucleo?.id === formNucleoId : !ind.nucleo),
      );

      let idIndicador = indicadorExistente?.id;

      if (!idIndicador) {
        const resposta = await fetch(`${API_BASE_URL}/indicadores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dadosIndicador),
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            resultado.message || 'Não foi possível cadastrar o indicador.',
          );
        }

        idIndicador = resultado.id;
      }

      const valorParaSalvar = Number.isFinite(valorInicial) ? valorInicial : 0;

      if (
        valorParaSalvar >= 0 &&
        Number.isInteger(anoInicial) &&
        anoInicial >= 2000 &&
        anoInicial <= 2100
      ) {
        await fetch(`${API_BASE_URL}/indicadores/${idIndicador}/registros`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ano: anoInicial,
            trimestre: trimestreInicial,
            valorRealizado: valorParaSalvar,
          }),
        });
      }

      if (temMetaForm && formMeta.trim() !== '') {
        const valMetaNum = Number(formMeta.trim().replace(',', '.'));
        if (Number.isFinite(valMetaNum) && valMetaNum > 0) {
          try {
            await apiFetch('/metas', {
              method: 'POST',
              body: JSON.stringify({
                indicadorId: idIndicador,
                ano: anoInicial,
                trimestre: trimestreInicial,
                valorMeta: valMetaNum,
              }),
            });
          } catch (e) {
            console.warn('Erro ao salvar meta inicial do novo indicador:', e);
          }
        }
      }

      await carregarIndicadores();

      setModalNovoAberto(false);
      setNomeForm('');
      setUnidadeForm('');
      setFormNucleoId('');
      setProgramId('');
      setValorForm('0');
      setMetaForm('');
      setTemMetaForm(false);
      setFormAno(String(new Date().getFullYear()));
      setFormTrimestre('Q4');

      if (indicadorExistente) {
        alert(
          `O indicador "${indicadorExistente.nome}" já existe. A nova medição para ${anoInicial} (${trimestreInicial}) foi adicionada ao histórico com sucesso!`,
        );
      } else {
        alert('Indicador cadastrado com sucesso!');
      }
    } catch (erro) {
      console.error('Erro ao cadastrar indicador:', erro);
      alert(
        erro instanceof Error ? erro.message : 'Erro ao cadastrar indicador.',
      );
    }
  };

  const [modalInserindoValor, inserindoValor] = useState(false);
  const abrirValModal = (indicador: Indicador) => {
    setIndicSelecionado(indicador);
    setValorForm(indicador.valAtual);
    setFormAno(String(indicador.ano ?? new Date().getFullYear()));
    setFormTrimestre(indicador.trimestre ?? 'Q4');
    inserindoValor(true);
  };

  const InserirValor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!indicSelecionado) return;

    const token = localStorage.getItem('access_token');

    if (!token) {
      alert('Sua sessão expirou. Faça login novamente.');
      return;
    }

    try {
      const resposta = await fetch(
        `${API_BASE_URL}/indicadores/${indicSelecionado.id}/registros`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ano: Number(formAno),
            trimestre: formTrimestre,
            valorRealizado: Number(formValor),
          }),
        },
      );

      if (!resposta.ok) {
        const erro = await resposta.json();
        throw new Error(erro.message || 'Não foi possível salvar o valor.');
      }

      await carregarIndicadores();
      inserindoValor(false);
      alert('Medição salva no histórico com sucesso!');
    } catch (erro) {
      console.error('Erro ao salvar valor:', erro);
      alert(erro instanceof Error ? erro.message : 'Erro ao salvar o valor.');
    }
  };

  // Histórico de medições (ver todas e adicionar novos períodos a um indicador existente)
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [historicoAno, setHistoricoAno] = useState(
    String(new Date().getFullYear()),
  );
  const [historicoTrimestre, setHistoricoTrimestre] = useState('Q1');
  const [historicoValor, setHistoricoValor] = useState('');

  const abrirHistoricoModal = (indicador: Indicador) => {
    setIndicSelecionado(indicador);
    setHistoricoAno(String(new Date().getFullYear()));
    setHistoricoTrimestre('Q1');
    setHistoricoValor('');
    setModalHistoricoAberto(true);
  };

  const salvarMedicaoHistorico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indicSelecionado) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Sua sessão expirou. Faça login novamente.');
      return;
    }

    const valor = Number(historicoValor);
    if (!Number.isFinite(valor) || valor < 0) {
      alert('Informe um valor realizado válido.');
      return;
    }

    try {
      const resposta = await fetch(
        `${API_BASE_URL}/indicadores/${indicSelecionado.id}/registros`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ano: Number(historicoAno),
            trimestre: historicoTrimestre,
            valorRealizado: valor,
          }),
        },
      );

      if (!resposta.ok) {
        const erro = await resposta.json().catch(() => ({}));
        throw new Error(erro.message || 'Não foi possível salvar a medição.');
      }

      await carregarIndicadores();

      // Atualiza o indicSelecionado com os dados mais recentes do backend
      const respAtualizada = await fetch(`${API_BASE_URL}/indicadores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (respAtualizada.ok) {
        const dadosNovos = await respAtualizada.json();
        const atual = dadosNovos.find((i: any) => i.id === indicSelecionado.id);
        if (atual) {
          setIndicSelecionado((prev) =>
            prev
              ? {
                  ...prev,
                  valAtual:
                    atual.registros?.[0]?.valorRealizado != null
                      ? String(atual.registros[0].valorRealizado)
                      : prev.valAtual,
                  ano: atual.registros?.[0]?.ano ?? prev.ano,
                  trimestre: atual.registros?.[0]?.trimestre ?? prev.trimestre,
                  registros: (atual.registros ?? []).map((r: any) => ({
                    id: r.id,
                    ano: r.ano,
                    trimestre: r.trimestre,
                    valorRealizado:
                      r.valorRealizado != null
                        ? String(r.valorRealizado)
                        : null,
                    metaAplicada:
                      r.metaAplicada != null ? String(r.metaAplicada) : null,
                    statusAprovacao: r.statusAprovacao,
                    status: r.status,
                  })),
                }
              : null,
          );
        }
      }

      setHistoricoValor('');
      alert(
        `Medição para ${historicoAno} (${historicoTrimestre}) salva no histórico com sucesso!`,
      );
    } catch (erro) {
      console.error('Erro ao salvar medição:', erro);
      alert(erro instanceof Error ? erro.message : 'Erro ao salvar medição.');
    }
  };

  const excluirMedicao = async (
    registroId: string,
    ano: number,
    trimestre: string,
  ) => {
    if (!indicSelecionado) return;

    const confirmou = window.confirm(
      `Tem certeza que deseja excluir a medição de ${ano} (${trimestre}) do indicador "${indicSelecionado.nome}"?`,
    );
    if (!confirmou) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Sua sessão expirou. Faça login novamente.');
      return;
    }

    try {
      const resposta = await fetch(`${API_BASE_URL}/registros/${registroId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resposta.ok) {
        const erro = await resposta.json().catch(() => ({}));
        throw new Error(erro.message || 'Não foi possível excluir a medição.');
      }

      await carregarIndicadores();

      // Atualiza o indicSelecionado com os dados mais recentes do backend
      const respAtualizada = await fetch(`${API_BASE_URL}/indicadores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (respAtualizada.ok) {
        const dadosNovos = await respAtualizada.json();
        const atual = dadosNovos.find((i: any) => i.id === indicSelecionado.id);
        if (atual) {
          setIndicSelecionado((prev) =>
            prev
              ? {
                  ...prev,
                  valAtual:
                    atual.registros?.[0]?.valorRealizado != null
                      ? String(atual.registros[0].valorRealizado)
                      : '0',
                  ano: atual.registros?.[0]?.ano ?? undefined,
                  trimestre: atual.registros?.[0]?.trimestre ?? undefined,
                  registros: (atual.registros ?? []).map((r: any) => ({
                    id: r.id,
                    ano: r.ano,
                    trimestre: r.trimestre,
                    valorRealizado:
                      r.valorRealizado != null
                        ? String(r.valorRealizado)
                        : null,
                    metaAplicada:
                      r.metaAplicada != null ? String(r.metaAplicada) : null,
                    statusAprovacao: r.statusAprovacao,
                    status: r.status,
                  })),
                }
              : null,
          );
        }
      }

      alert(`Medição de ${ano} (${trimestre}) excluída com sucesso!`);
    } catch (erro) {
      console.error('Erro ao excluir medição:', erro);
      alert(erro instanceof Error ? erro.message : 'Erro ao excluir medição.');
    }
  };

  const [modalEditAberto, setEditAberto] = useState(false);
  const abrirEditarModal = (indicador: Indicador) => {
    setIndicSelecionado(indicador);
    setNomeForm(indicador.nome);
    setUnidadeForm(indicador.unidade);
    setFormNucleoId(indicador.nucleo ? indicador.nucleo.id : '');
    setProgramId(indicador.programa ? indicador.programa.id : '');
    const metaValor = indicador.meta != null ? indicador.meta : '';
    setMetaForm(metaValor);
    setTemMetaForm(Boolean(metaValor && parseFloat(metaValor) > 0));
    setEditAberto(true);
  };

  // A meta tem endpoint próprio (/metas): cria, altera ou exclui a meta do período
  // exibido no card. Devolve o id da meta resultante.
  const salvarMeta = async (indicador: Indicador, texto: string) => {
    const valorLimpo = texto.trim().replace(',', '.');
    const valorMeta = Number(valorLimpo);
    const ehSemMeta =
      texto.trim() === '' || (!isNaN(valorMeta) && valorMeta <= 0);

    if (ehSemMeta) {
      if (indicador.metaId) {
        try {
          await apiFetch(`/metas/${indicador.metaId}`, { method: 'DELETE' });
        } catch (e) {
          console.warn('Erro ao deletar meta por id:', e);
        }
      }

      // Garante exclusão de todas as metas ativas deste indicador
      try {
        const respMetas = await apiFetch<{ itens: Array<{ id: string }> }>(
          `/metas?indicadorId=${indicador.id}&limite=100`,
        );
        if (respMetas?.itens?.length) {
          for (const m of respMetas.itens) {
            try {
              await apiFetch(`/metas/${m.id}`, { method: 'DELETE' });
            } catch (err) {
              console.warn(`Erro ao excluir meta ${m.id}:`, err);
            }
          }
        }
      } catch (e) {
        console.warn('Erro ao listar metas do indicador:', e);
      }

      return undefined;
    }

    if (!Number.isFinite(valorMeta) || valorMeta <= 0) {
      throw new Error(
        'Informe uma meta maior que zero ou marque a opção "Não precisa de meta".',
      );
    }

    if (indicador.metaId) {
      await apiFetch(`/metas/${indicador.metaId}`, {
        method: 'PATCH',
        body: JSON.stringify({ valorMeta }),
      });
      return indicador.metaId;
    }

    // Com valor lançado, a meta é do trimestre exibido; sem valor, anual do ano corrente
    const anoMeta = indicador.ano ?? new Date().getFullYear();
    const trimestreMeta = indicador.ano ? (indicador.trimestre ?? null) : null;
    const criada = await apiFetch<{ id: string }>('/metas', {
      method: 'POST',
      body: JSON.stringify({
        indicadorId: indicador.id,
        ano: anoMeta,
        trimestre: trimestreMeta,
        valorMeta,
      }),
    });
    return criada.id;
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indicSelecionado) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Sua sessão expirou. Faça login novamente.');
      return;
    }

    const valorLimpo = formMeta.trim().replace(',', '.');
    const valorNum = Number(valorLimpo);
    const querSemMeta =
      !temMetaForm ||
      formMeta.trim() === '' ||
      (!isNaN(valorNum) && valorNum <= 0);

    try {
      if (querSemMeta) {
        await salvarMeta(indicSelecionado, '');
      } else {
        await salvarMeta(indicSelecionado, formMeta.trim());
      }

      const resposta = await fetch(
        `${API_BASE_URL}/indicadores/${indicSelecionado.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome: formNome.trim(),
            unidadeMedida: formUnidade || undefined,
            nucleoId: formNucleoId || null,
            programaId: formProgramId || null,
            semMeta: querSemMeta,
          }),
        },
      );

      if (!resposta.ok) {
        const erro = await resposta.json().catch(() => ({}));
        throw new Error(
          erro.message || 'Não foi possível salvar a edição do indicador.',
        );
      }

      await carregarIndicadores();
      setEditAberto(false);
      alert('Indicador atualizado com sucesso!');
    } catch (erro) {
      console.error('Erro ao atualizar indicador:', erro);
      alert('Erro ao atualizar indicador: ' + mensagemDeErro(erro));
    }
  };

  const [modalArquivando, setModalArquivando] = useState(false);
  const [acaoArquivamento, setAcaoArquivamento] = useState<
    'ARQUIVADO' | 'INATIVO'
  >('ARQUIVADO');
  const [arquivandoEmAndamento, setArquivandoEmAndamento] = useState(false);

  const abrirArquivarModal = (indicador: Indicador) => {
    setIndicSelecionado(indicador);
    setAcaoArquivamento('ARQUIVADO');
    setModalArquivando(true);
  };

  // UC041: arquiva ou desativa um indicador ativo sem apagar histórico nem metas
  const confirmarArquivarIndic = async () => {
    if (!indicSelecionado || arquivandoEmAndamento) return;

    const rota = acaoArquivamento === 'ARQUIVADO' ? 'arquivar' : 'desativar';
    setArquivandoEmAndamento(true);
    try {
      const resposta = await apiFetch<{ message: string }>(
        `/indicadores/${indicSelecionado.id}/${rota}`,
        { method: 'PATCH' },
      );

      setModalArquivando(false);
      await carregarIndicadores(filtroStatus);
      alert(
        resposta?.message ||
          (acaoArquivamento === 'ARQUIVADO'
            ? 'Indicador arquivado com sucesso!'
            : 'Indicador desativado com sucesso!'),
      );
    } catch (erro) {
      console.error('Erro ao arquivar/desativar indicador:', erro);
      alert(
        'Não foi possível arquivar/desativar o indicador: ' +
          mensagemDeErro(erro),
      );
    } finally {
      setArquivandoEmAndamento(false);
    }
  };

  const reativarIndic = async (indicador: Indicador) => {
    if (
      !window.confirm(
        `Deseja reativar o indicador "${indicador.nome}" para voltar a receber medições e metas?`,
      )
    ) {
      return;
    }

    try {
      const resposta = await apiFetch<{ message: string }>(
        `/indicadores/${indicador.id}/reativar`,
        { method: 'PATCH' },
      );
      await carregarIndicadores(filtroStatus);
      alert(resposta?.message || 'Indicador reativado com sucesso!');
    } catch (erro) {
      console.error('Erro ao reativar indicador:', erro);
      alert('Não foi possível reativar o indicador: ' + mensagemDeErro(erro));
    }
  };

  const [modalDeletando, setDeletando] = useState(false);
  const abrirDeletarModal = (indicador: Indicador) => {
    setIndicSelecionado(indicador);
    setDeletando(true);
  };

  // RF03: exclui um indicador por vez (exclusão lógica no backend, com auditoria)
  const deletarIndic = async () => {
    if (!indicSelecionado) return;

    const token = localStorage.getItem('access_token');

    if (!token) {
      alert('Sua sessão expirou. Faça login novamente.');
      return;
    }

    try {
      const resposta = await fetch(
        `${API_BASE_URL}/indicadores/${indicSelecionado.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const resultado = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(
          resultado.message || 'Não foi possível excluir o indicador.',
        );
      }

      setIndicadores(indicadores.filter((n) => n.id !== indicSelecionado.id));
      setDeletando(false);
    } catch (erro) {
      console.error('Erro ao excluir indicador:', erro);
      alert(
        erro instanceof Error ? erro.message : 'Erro ao excluir indicador.',
      );
    }
  };

  const [modalAprovacao, setModelAprov] = useState(false);
  const [modoRevisao, setModoRevisao] = useState<'ESCOLHA' | 'DEVOLVER'>(
    'ESCOLHA',
  );
  const [erroJustificativa, setErroJustificativa] = useState('');
  const [processandoRevisao, setProcessandoRevisao] = useState(false);
  const [registroEmRevisao, setRegistroEmRevisao] = useState<{
    id: string;
    ano?: number;
    trimestre?: string;
    valorRealizado?: string;
  } | null>(null);

  const abrirAprovacaoModal = (
    indicador: Indicador,
    registroAlvo?: {
      id: string;
      ano?: number;
      trimestre?: string;
      valorRealizado?: string;
      statusAprovacao?: string;
    },
  ) => {
    if (UsuarioAtual.tipo !== 'ADM') {
      alert(
        'Apenas a Administração pode revisar, aprovar ou devolver indicadores.',
      );
      return;
    }

    const statusAlvo =
      registroAlvo?.statusAprovacao ?? indicador.statusAprovacao;
    const idAlvo = registroAlvo?.id ?? indicador.registroId;

    if (!idAlvo) {
      alert(
        'Este indicador ainda não possui registro de medição para análise.',
      );
      return;
    }

    if (statusAlvo !== 'ENVIADO_REVISAO') {
      alert(
        'Somente indicadores em status "Em Análise" podem ser aprovados ou devolvidos.',
      );
      return;
    }

    setIndicSelecionado(indicador);
    setRegistroEmRevisao({
      id: idAlvo,
      ano: registroAlvo?.ano ?? indicador.ano,
      trimestre: registroAlvo?.trimestre ?? indicador.trimestre,
      valorRealizado: registroAlvo?.valorRealizado ?? indicador.valAtual,
    });
    setModoRevisao('ESCOLHA');
    setMotivo('');
    setErroJustificativa('');
    setModelAprov(true);
  };

  // UC038 Caminho A: aprovar indicador em análise (irreversível no ciclo)
  const executarAprovacao = async () => {
    if (!registroEmRevisao || processandoRevisao) return;

    setProcessandoRevisao(true);
    try {
      await apiFetch(`/registros/${registroEmRevisao.id}/aprovar`, {
        method: 'PATCH',
      });

      setModelAprov(false);
      await carregarIndicadores(filtroStatus);
      alert('Indicador aprovado com sucesso!');
    } catch (erro) {
      console.error('Erro ao aprovar indicador:', erro);
      if (erro instanceof ErroApi && erro.status === 409) {
        setModelAprov(false);
        await carregarIndicadores(filtroStatus);
        alert(
          'Este indicador já foi processado por outra operação. A listagem foi atualizada.',
        );
      } else {
        alert('Não foi possível aprovar o indicador: ' + mensagemDeErro(erro));
      }
    } finally {
      setProcessandoRevisao(false);
    }
  };

  // UC038 Caminho B: devolver indicador para correção com justificativa obrigatória
  const executarDevolucao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registroEmRevisao || processandoRevisao) return;

    const justificativa = formDesaprovMotivo.trim();
    if (!justificativa) {
      setErroJustificativa(
        'A mensagem de justificativa é obrigatória para devolver o indicador para correção.',
      );
      return;
    }

    setErroJustificativa('');
    setProcessandoRevisao(true);
    try {
      await apiFetch(`/registros/${registroEmRevisao.id}/devolver`, {
        method: 'PATCH',
        body: JSON.stringify({ justificativa }),
      });

      setModelAprov(false);
      await carregarIndicadores(filtroStatus);
      alert('Indicador devolvido para correção!');
    } catch (erro) {
      console.error('Erro ao devolver indicador:', erro);
      if (erro instanceof ErroApi && erro.status === 409) {
        setModelAprov(false);
        await carregarIndicadores(filtroStatus);
        alert(
          'Este indicador já foi processado por outra operação. A listagem foi atualizada.',
        );
      } else {
        alert('Não foi possível devolver o indicador: ' + mensagemDeErro(erro));
      }
    } finally {
      setProcessandoRevisao(false);
    }
  };

  // UC037 -> UC038: envia medição preenchida ou corrigida para a fila "Em Análise"
  const enviarParaRevisao = async (indicador: Indicador) => {
    if (!indicador.registroId) return;
    if (
      !window.confirm(
        `Enviar a medição (${indicador.trimestre}/${indicador.ano}) de "${indicador.nome}" para análise da Administração?`,
      )
    ) {
      return;
    }

    try {
      await apiFetch(`/registros/${indicador.registroId}/enviar-revisao`, {
        method: 'PATCH',
      });
      await carregarIndicadores(filtroStatus);
      alert('Indicador enviado para análise com sucesso!');
    } catch (erro) {
      console.error('Erro ao enviar para análise:', erro);
      alert(
        'Não foi possível enviar o indicador para análise: ' +
          mensagemDeErro(erro),
      );
    }
  };

  const qtdEmAnalise = indicDoUser.filter(
    (n) => n.statusAprovacao === 'ENVIADO_REVISAO',
  ).length;

  const totalIndicadores = indicadoresFiltrados.length;

  const indicadoresComMeta = indicadoresFiltrados.filter((n) => {
    const metaNum = parseFloat(n.meta || '0');
    return !isNaN(metaNum) && metaNum > 0;
  });

  const progressoGeral = React.useMemo(() => {
    if (indicadoresComMeta.length === 0) return 0;

    const somaPercentuais = indicadoresComMeta.reduce((acc, indicador) => {
      const realizado = Number(indicador.valAtual) || 0;
      const meta = Number(indicador.meta);

      if (!Number.isFinite(meta) || meta <= 0) return acc;

      const pct = Math.min((realizado / meta) * 100, 100);

      return acc + pct;
    }, 0);

    return Math.round(somaPercentuais / indicadoresComMeta.length);
  }, [indicadoresComMeta]);

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    if (!/\.(csv|xlsx|xls)$/i.test(arquivo.name)) {
      alert('Selecione um arquivo CSV, XLSX ou XLS.');
      input.value = '';
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Sua sessão não foi encontrada. Entre novamente no sistema.');
      input.value = '';
      return;
    }

    const dados = new FormData();
    dados.append('arquivo', arquivo);

    try {
      const resposta = await fetch(`${API_BASE_URL}/importacoes/csv`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: dados,
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.message || 'Não foi possível importar o arquivo.',
        );
      }

      await carregarIndicadores();

      const resumo = [
        `Importação finalizada: ${resultado.status}`,
        `Linhas válidas importadas: ${resultado.linhasOk ?? 0}`,
        `Total de linhas: ${resultado.totalLinhas ?? 0}`,
      ];

      if (Array.isArray(resultado.erros) && resultado.erros.length > 0) {
        resumo.push(
          '',
          'Erros encontrados:',
          ...resultado.erros
            .slice(0, 10)
            .map(
              (erro: { linha?: number; mensagem?: string }) =>
                `Linha ${erro.linha ?? '?'}: ${erro.mensagem ?? 'Erro não especificado'}`,
            ),
        );
        if (resultado.erros.length > 10) {
          resumo.push(`... e mais ${resultado.erros.length - 10} erro(s).`);
        }
      }

      alert(resumo.join('\n'));
    } catch (erro) {
      alert(
        erro instanceof Error ? erro.message : 'Erro ao importar o arquivo.',
      );
    } finally {
      input.value = '';
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8fafc] overflow-hidden">
      <NavBar />

      {/*================ CONTEUDO PRINCIPAL =================*/}
      <main className="flex-1 p-4 sm:p-6 md:p-8 w-full h-full overflow-y-auto">
        <div className="flex flex-1 flex-col gap-6 items-center pt-2 sm:pt-4 md:pt-6 w-full">
          {/* Header */}
          <div
            className="flex flex-col gap-6 items-center w-full"
            data-name="Header"
          >
            <div
              className="flex items-center justify-between px-2 sm:px-4 w-full"
              data-name="Titulo"
            >
              <p className="text-2xl sm:text-3xl font-['Google_Sans_Flex:Regular',sans-serif] font-normal relative shrink-0 text-[#a13680] w-full">
                Indicadores
              </p>
            </div>

            {/* Resumos */}
            <div
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch justify-center px-2 sm:px-4 w-full"
              data-name="Resumos"
            >
              <TotalProgresso progresso={progressoGeral} />
              <TotalIndicadores valor={totalIndicadores} />
              <TotalParticipantes />
            </div>
          </div>

          <div className="flex flex-col gap-[20px] items-center py-[10px] w-full">
            {/*Control*/}
            <div className="flex gap-[16px] items-center justify-center flex-wrap w-full">
              <div className="relative w-full sm:w-96">
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={termoPesquisa}
                  onChange={(e) => setTermoPesquisa(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-full border border-slate-300 focus:outline-none focus:border-[#832b62] text-sm text-slate-700 placeholder:text-slate-400 bg-white"
                />
                <Search
                  size={18}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>

              <CustomDropdown
                icon={Svg.UsersMais}
                label="Núcleos"
                valor={filtroNucleo}
                onChange={setFiltroNucleo}
                opcoes={listaNucleosNome}
              />

              <CustomDropdown
                icon={Svg.UsersMais}
                label="Programas"
                valor={filtroPrograma}
                onChange={setFiltroPrograma}
                opcoes={listaProgramas}
              />

              <CustomDropdown
                icon={Svg.UsersMais}
                label="Aprovação"
                valor={filtroAprovacao}
                onChange={setFiltroAprovacao}
                opcoes={listagemAprovacao}
              />

              {/* UC041 Regra 3: filtro de status seguindo a geometria oficial do CustomDropdown */}
              <div className="bg-transparent border-2 border-[#3b142f] flex h-[48px] items-center justify-between px-[16px] rounded-[9px] shrink-0 w-[190px] relative cursor-pointer">
                <div className="size-[20px] relative shrink-0 pointer-events-none text-[#3b142f]">
                  <Archive className="size-full" />
                </div>

                <select
                  id="filtro-status-indicador"
                  aria-label="Filtrar indicadores por status"
                  value={filtroStatus}
                  onChange={(e) =>
                    setFiltroStatus(
                      e.target.value as 'ATIVO' | 'ARQUIVADO' | 'INATIVO',
                    )
                  }
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                >
                  <option value="ATIVO">Ativos</option>
                  <option value="ARQUIVADO">Arquivados</option>
                  <option value="INATIVO">Inativos</option>
                </select>

                <p className="font-normal text-[#3d3d3d] text-[15px] whitespace-nowrap overflow-hidden text-ellipsis pointer-events-none flex-1 ml-2">
                  {filtroStatus === 'ATIVO'
                    ? 'Ativos'
                    : filtroStatus === 'ARQUIVADO'
                      ? 'Arquivados'
                      : 'Inativos'}
                </p>

                <div className="h-[8px] w-[12px] pointer-events-none shrink-0">
                  <svg
                    className="block size-full"
                    fill="none"
                    viewBox="0 0 16.2247 10.0188"
                  >
                    <path d={Svg.SetaBaixo} fill="#191919" />
                  </svg>
                </div>
              </div>

              {UsuarioAtual.tipo === 'ADM' &&
                filtroStatus === 'ATIVO' &&
                qtdEmAnalise > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setFiltroAprovacao(
                        filtroAprovacao === 'Em Análise' ? '' : 'Em Análise',
                      )
                    }
                    className={`flex h-[48px] items-center gap-2.5 px-[16px] rounded-[9px] shrink-0 text-[15px] font-medium transition-colors cursor-pointer ${
                      filtroAprovacao === 'Em Análise'
                        ? 'bg-gradient-to-l from-[#a13680] to-[#3b142f] text-white border-2 border-transparent'
                        : 'bg-transparent border-2 border-[#3b142f] text-[#3d3d3d] hover:bg-[#f2eff4]'
                    }`}
                    title="Filtrar indicadores aguardando aprovação ou devolução (UC038)"
                  >
                    <Clock
                      size={18}
                      className={
                        filtroAprovacao === 'Em Análise'
                          ? 'text-white'
                          : 'text-[#3b142f]'
                      }
                    />
                    <span className="whitespace-nowrap">Em Análise</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        filtroAprovacao === 'Em Análise'
                          ? 'bg-white/20 text-white'
                          : 'bg-[#fbd3ee]/80 text-[#832b62]'
                      }`}
                    >
                      {qtdEmAnalise}
                    </span>
                  </button>
                )}

              {UsuarioAtual.tipo == 'ADM' ? (
                <>
                  <BtnCriar txt="Novo Indicador" acao={abrirCriarModal} />

                  {/* Botão importar */}
                  <div className="bg-transparent border-2 border-[#3b142f] flex h-[48px] items-center justify-between gap-2.5 relative bg-slate-200 cursor-pointer px-[16px] py-[4px] rounded-[9px] shrink-0 w-auto">
                    <BtnImportIco ico="block size-full" id="btnImportar" />
                    <div className="font-normal text-[#3d3d3d] text-[16px] whitespace-nowrap">
                      Importar CSV / Excel
                    </div>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      className="absolute inset-0 opacity-0 cursor-pointer size-full z-10"
                      title="Importar CSV ou Excel (.xlsx, .xls)"
                      onChange={handleCSVImport}
                    />
                  </div>

                  {/* Botão exportar 
                            (deixei comentado, pelo q me lembre n vai precisar exportar CSV e ainda mais diretamente dessa tela)*/}
                  {/*
                            <div className="bg-transparent border-2 border-[#3b142f] flex h-[48px] items-center justify-between px-[16px] py-[4px] rounded-[9px] shrink-0 w-[180px]">
                                <BtnImportIco ico="block size-full rotate-180" id="btnExportar"/>
                                <p className="font-normal text-[#3d3d3d] text-[16px] whitespace-nowrap">
                                    Exportar CSV
                                </p>
                            </div>
                            */}
                </>
              ) : (
                ''
              )}
            </div>

            {/*ListaIndicadores*/}
            <div className="flex flex-col gap-[8px] items-center px-[10px] py-[10px] w-full">
              <Top />
              <Lista
                leList={indicadoresFiltrados}
                editIndic={abrirEditarModal}
                setIndicVal={abrirValModal}
                arquivarIndic={abrirArquivarModal}
                reativarIndic={reativarIndic}
                enviarRevisaoIndic={enviarParaRevisao}
                delIndic={abrirDeletarModal}
                aprovIndic={abrirAprovacaoModal}
                abrirHistorico={abrirHistoricoModal}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ==================== BARRA DO USUÁRIO ========================== */}
      <div
        className="absolute h-[60px] right-0 top-0 w-auto"
        data-name="userbar"
      >
        <div className="flex flex-row justify-end max-w-[inherit] min-w-[inherit] size-full">
          <div className="content-stretch flex items-start justify-end max-w-[inherit] min-w-[inherit] relative size-full">
            <User />
          </div>
        </div>
      </div>

      {/* ==================== TELAS POPUP ======================== */}
      {/* criação */}
      {modalNovoAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Novo Indicador
            </h2>

            <form onSubmit={handleCriarIndic} className="space-y-4">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    placeholder="Insira um nome..."
                    value={formNome}
                    onChange={(e) => setNomeForm(e.target.value)}
                    className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unidade
                  </label>
                  <select
                    value={formUnidade}
                    onChange={(e) => setUnidadeForm(e.target.value)}
                    className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                  >
                    <option value="Unidade">Unidade</option>
                    <option value="Porcentagem">Porcentagem (%)</option>
                    <option value="Toneladas">Toneladas (t)</option>
                    <option value="Quilos">Quilos (Kg)</option>
                    <option value="Reais">Reais ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formValor}
                    onChange={(e) => setValorForm(e.target.value)}
                    className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ano
                  </label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={formAno}
                    onChange={(e) => setFormAno(e.target.value)}
                    className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trimestre
                  </label>
                  <select
                    value={formTrimestre}
                    onChange={(e) => setFormTrimestre(e.target.value)}
                    className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                  >
                    <option value="Q1">1º trimestre (Q1)</option>
                    <option value="Q2">2º trimestre (Q2)</option>
                    <option value="Q3">3º trimestre (Q3)</option>
                    <option value="Q4">4º trimestre (Q4)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Núcleo
                  </label>
                  <select
                    value={formNucleoId}
                    onChange={(e) => setFormNucleoId(e.target.value)}
                    className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                  >
                    <option value="">Sem núcleo</option>
                    {NucleosDoUser.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.sigla}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Programa
                  </label>
                  <select
                    value={formProgramId}
                    onChange={(e) => setProgramId(e.target.value)}
                    className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                  >
                    <option value="">Sem programa</option>
                    {programasDoBanco.length === 0 ? (
                      <option value="">Nenhum programa cadastrado</option>
                    ) : (
                      programasDoBanco.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.nome}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Meta (opcional)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={!temMetaForm}
                        onChange={(e) => {
                          const sem = e.target.checked;
                          setTemMetaForm(!sem);
                          if (sem) setMetaForm('');
                        }}
                        className="rounded text-[#832b62] focus:ring-[#832b62]"
                      />
                      <span className="text-[11px] font-medium text-slate-500">
                        Não precisa de meta
                      </span>
                    </label>
                  </div>
                  {temMetaForm ? (
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Defina uma meta (ex: 100) ou deixe em branco..."
                      value={formMeta}
                      onChange={(e) => setMetaForm(e.target.value)}
                      className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                    />
                  ) : (
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 italic flex items-center justify-between">
                      <span>Indicador cadastrado sem meta</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTemMetaForm(true);
                          setMetaForm('');
                        }}
                        className="text-[11px] text-[#832b62] font-semibold hover:underline cursor-pointer"
                      >
                        Definir meta
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="flex-1 py-2.5 rounded-full border border-slate-800 text-slate-800 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Criar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* edicao por diretor de nucleo (so o realizado) */}
      {modalInserindoValor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Definindo valor
            </h2>

            <form onSubmit={InserirValor} className="space-y-4">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alterando valor{' '}
                    {indicSelecionado?.simbolUni
                      ? '(' + indicSelecionado.simbolUni + ')'
                      : ''}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Insira um valor..."
                    value={formValor}
                    onChange={(e) => setValorForm(e.target.value)}
                    className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ano
                  </label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={formAno}
                    onChange={(e) => setFormAno(e.target.value)}
                    className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trimestre
                  </label>
                  <select
                    value={formTrimestre}
                    onChange={(e) => setFormTrimestre(e.target.value)}
                    className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                    required
                  >
                    <option value="Q1">1º trimestre (Q1)</option>
                    <option value="Q2">2º trimestre (Q2)</option>
                    <option value="Q3">3º trimestre (Q3)</option>
                    <option value="Q4">4º trimestre (Q4)</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Meta (opcional)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={!temMetaForm}
                        onChange={(e) => {
                          const sem = e.target.checked;
                          setTemMetaForm(!sem);
                          if (sem) setMetaForm('');
                        }}
                        className="rounded text-[#832b62] focus:ring-[#832b62]"
                      />
                      <span className="text-[11px] font-medium text-slate-500">
                        Não precisa de meta
                      </span>
                    </label>
                  </div>
                  {temMetaForm ? (
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Defina uma meta (ex: 100) ou deixe em branco..."
                      value={formMeta}
                      onChange={(e) => setMetaForm(e.target.value)}
                      className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                    />
                  ) : (
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 italic flex items-center justify-between">
                      <span>Indicador cadastrado sem meta</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTemMetaForm(true);
                          setMetaForm('');
                        }}
                        className="text-[11px] text-[#832b62] font-semibold hover:underline cursor-pointer"
                      >
                        Definir meta
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => inserindoValor(false)}
                  className="flex-1 py-2.5 rounded-full border border-slate-800 text-slate-800 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Confirmar</span>
                </button>
              </div>

              {UsuarioAtual.tipo === 'ADM' && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!indicSelecionado) return;
                      const regAlvo = indicSelecionado.registros?.find(
                        (r) =>
                          r.ano === Number(formAno) &&
                          r.trimestre === formTrimestre,
                      );
                      const regIdParaExcluir =
                        regAlvo?.id || indicSelecionado.registroId;
                      if (!regIdParaExcluir) {
                        alert(
                          'Nenhuma medição encontrada para este ano e trimestre.',
                        );
                        return;
                      }
                      await excluirMedicao(
                        regIdParaExcluir,
                        Number(formAno),
                        formTrimestre,
                      );
                      inserindoValor(false);
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="size-3" />
                    <span>Excluir medição deste ano e trimestre</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* edicao por admin */}
      {modalEditAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Editando Indicador
            </h2>

            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    placeholder="Insira um nome..."
                    value={formNome}
                    onChange={(e) => setNomeForm(e.target.value)}
                    className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unidade
                  </label>
                  <select
                    value={formUnidade}
                    onChange={(e) => setUnidadeForm(e.target.value)}
                    className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                  >
                    <option value="Unidade">Unidade</option>
                    <option value="Porcentagem">Porcentagem (%)</option>
                    <option value="Toneladas">Toneladas (t)</option>
                    <option value="Quilos">Quilos (Kg)</option>
                    <option value="Reais">Reais ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Núcleo
                  </label>
                  <select
                    value={formNucleoId}
                    onChange={(e) => setFormNucleoId(e.target.value)}
                    className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                  >
                    <option value="">Sem núcleo</option>
                    {NucleosDoUser.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.sigla}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Programa
                  </label>
                  <select
                    value={formProgramId}
                    onChange={(e) => setProgramId(e.target.value)}
                    className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                  >
                    <option value="">Sem programa</option>
                    {programasDoBanco.length === 0 ? (
                      <option value="">Nenhum programa cadastrado</option>
                    ) : (
                      programasDoBanco.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.nome}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 flex items-center justify-between">
                    <span className="font-semibold text-emerald-700">
                      Ativo
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Para arquivar ou desativar, use o botão na listagem
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Meta{' '}
                      {indicSelecionado?.simbolUni
                        ? `(${indicSelecionado.simbolUni})`
                        : ''}
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={!temMetaForm}
                        onChange={(e) => {
                          const sem = e.target.checked;
                          setTemMetaForm(!sem);
                          if (sem) setMetaForm('');
                        }}
                        className="rounded text-[#832b62] focus:ring-[#832b62]"
                      />
                      <span className="text-[11px] font-medium text-slate-500">
                        Não precisa de meta
                      </span>
                    </label>
                  </div>
                  {temMetaForm ? (
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Defina uma meta (ex: 100) ou deixe em branco..."
                      value={formMeta}
                      onChange={(e) => setMetaForm(e.target.value)}
                      className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                    />
                  ) : (
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 italic flex items-center justify-between">
                      <span>Indicador definido sem meta</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTemMetaForm(true);
                          setMetaForm('');
                        }}
                        className="text-[11px] text-[#832b62] font-semibold hover:underline cursor-pointer"
                      >
                        Definir meta
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditAberto(false)}
                  className="flex-1 py-2.5 rounded-full border border-slate-800 text-slate-800 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Confirmar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* arquivamento / desativação (UC041) */}
      {modalArquivando && indicSelecionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="size-11 rounded-full bg-[#fbd3ee]/70 text-[#832b62] flex items-center justify-center shrink-0">
                <Archive className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Arquivar / Desativar Indicador
                </h2>
                <p className="text-xs text-slate-500">
                  Confirmação de encerramento operacional
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Deseja encerrar o monitoramento do indicador{' '}
              <span className="font-bold text-slate-900">
                "{indicSelecionado.nome}"
              </span>
              ?
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <button
                type="button"
                onClick={() => setAcaoArquivamento('ARQUIVADO')}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  acaoArquivamento === 'ARQUIVADO'
                    ? 'bg-[#3a182d] text-white'
                    : 'bg-[#f2eff4] text-[#3b142f] hover:bg-[#fbd3ee]/50'
                }`}
              >
                Arquivar
              </button>
              <button
                type="button"
                onClick={() => setAcaoArquivamento('INATIVO')}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  acaoArquivamento === 'INATIVO'
                    ? 'bg-[#3a182d] text-white'
                    : 'bg-[#f2eff4] text-[#3b142f] hover:bg-[#fbd3ee]/50'
                }`}
              >
                Desativar (Inativo)
              </button>
            </div>

            <div className="bg-[#f2eff4] border border-[#832b62]/20 rounded-2xl p-4 text-xs text-[#3b142f] space-y-1.5 mb-6">
              <p>
                • O indicador{' '}
                <strong>
                  não poderá mais receber novos lançamentos, metas ou edições
                </strong>
                .
              </p>
              <p>
                • Ele sairá da listagem operacional padrão (visível apenas
                filtrando por <strong>Arquivados</strong> ou{' '}
                <strong>Inativos</strong>).
              </p>
              <p>
                •{' '}
                <strong>
                  Todo o histórico de medições e relatórios passados será
                  preservado
                </strong>{' '}
                para consulta.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={arquivandoEmAndamento}
                onClick={() => setModalArquivando(false)}
                className="flex-1 py-2.5 rounded-full border border-slate-800 text-slate-800 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={arquivandoEmAndamento}
                onClick={confirmarArquivarIndic}
                className="flex-1 py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer disabled:opacity-50"
              >
                {arquivandoEmAndamento ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* deletamento */}
      {modalDeletando && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Atenção!</h2>
            <p className="text-sm text-slate-600 mb-1">
              Tem certeza que deseja{' '}
              <span className="font-bold text-slate-800">deletar</span> esse
              Indicador permanentemente?
            </p>
            <p className="text-xs text-slate-500 mb-6">
              Esta ação{' '}
              <span className="font-bold text-slate-800">
                não pode ser desfeita
              </span>
              .
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeletando(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={deletarIndic}
                className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-xs hover:bg-red-50 transition-colors cursor-pointer"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revisão e Aprovação / Devolução de Indicador (UC038) */}
      {modalAprovacao && indicSelecionado && registroEmRevisao && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Revisão do Indicador
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Confira os dados enviados para análise e decida entre aprovar
                  ou devolver para correção.
                </p>
              </div>
              <button
                type="button"
                disabled={processandoRevisao}
                onClick={() => setModelAprov(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {/* Resumo detalhado do indicador em análise */}
            <div className="bg-[#f2eff4] rounded-2xl p-4 mb-5 space-y-2 text-xs text-[#3c3b3b]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#3b142f] text-sm">
                  {indicSelecionado.nome}
                </span>
                <span className="bg-[#fbd3ee]/80 text-[#832b62] text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                  Em Análise
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-500">Núcleo:</span>{' '}
                  <strong className="text-slate-800">
                    {indicSelecionado.nucleo?.sigla ?? 'Institucional'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Período:</span>{' '}
                  <strong className="text-slate-800">
                    {registroEmRevisao.trimestre ?? '-'}/
                    {registroEmRevisao.ano ?? '-'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Valor Realizado:</span>{' '}
                  <strong className="text-[#832b62]">
                    {registroEmRevisao.valorRealizado ?? '-'}
                    {indicSelecionado.simbolUni
                      ? ` ${indicSelecionado.simbolUni}`
                      : ''}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Meta:</span>{' '}
                  <strong className="text-slate-800">
                    {indicSelecionado.meta != null
                      ? `${indicSelecionado.meta}${
                          indicSelecionado.simbolUni
                            ? ` ${indicSelecionado.simbolUni}`
                            : ''
                        }`
                      : 'Sem meta'}
                  </strong>
                </div>
              </div>
            </div>

            {modoRevisao === 'ESCOLHA' ? (
              <div className="space-y-5">
                <div className="bg-[#f2eff4]/70 border border-[#832b62]/20 rounded-2xl p-3.5 text-xs text-[#3b142f]">
                  Ao <strong>Aprovar</strong>, a aprovação é final e
                  irreversível para este ciclo. Ao <strong>Devolver</strong>,
                  será solicitada uma justificativa obrigatória e o indicador
                  voltará a ficar editável para o Diretor de Núcleo.
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    disabled={processandoRevisao}
                    onClick={() => setModelAprov(false)}
                    className="py-2.5 px-5 rounded-full border border-slate-800 text-slate-800 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={processandoRevisao}
                    onClick={() => {
                      setModoRevisao('DEVOLVER');
                      setErroJustificativa('');
                    }}
                    className="flex-1 py-2.5 rounded-full border border-red-200 text-red-600 font-semibold text-xs hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Devolver
                  </button>
                  <button
                    type="button"
                    disabled={processandoRevisao}
                    onClick={executarAprovacao}
                    className="flex-1 py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {processandoRevisao ? 'Processando...' : 'Aprovar'}
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={executarDevolucao}
                className="space-y-4"
                noValidate
              >
                <div>
                  <label
                    htmlFor="justificativa-devolucao"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Mensagem de Justificativa{' '}
                    <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="justificativa-devolucao"
                    rows={4}
                    placeholder="Descreva claramente o motivo da devolução (ex.: Faltou anexar o comprovante da meta X)..."
                    value={formDesaprovMotivo}
                    onChange={(e) => {
                      setMotivo(e.target.value);
                      if (erroJustificativa && e.target.value.trim()) {
                        setErroJustificativa('');
                      }
                    }}
                    className={`w-full bg-slate-200/70 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none ${
                      erroJustificativa ? 'border border-red-500' : 'border-0'
                    }`}
                  />
                  {erroJustificativa && (
                    <p className="text-xs font-semibold text-red-600 mt-1.5">
                      {erroJustificativa}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={processandoRevisao}
                    onClick={() => {
                      setModoRevisao('ESCOLHA');
                      setErroJustificativa('');
                    }}
                    className="flex-1 py-2.5 rounded-full border border-slate-800 text-slate-800 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={processandoRevisao}
                    className="flex-1 py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {processandoRevisao
                      ? 'Devolvendo...'
                      : 'Confirmar Devolução'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Histórico de Medições do Indicador */}
      {modalHistoricoAberto && indicSelecionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between mb-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <History className="size-5 text-[#832b62]" />
                  Histórico de Medições
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Indicador:{' '}
                  <span className="font-semibold text-slate-800">
                    {indicSelecionado.nome}
                  </span>
                  {indicSelecionado.nucleo &&
                    ` • Núcleo: ${indicSelecionado.nucleo.sigla}`}
                  {` • Unidade: ${indicSelecionado.unidade}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalHistoricoAberto(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Listagem do Histórico */}
            {(indicSelecionado.status ?? 'ATIVO').toUpperCase() !== 'ATIVO' && (
              <div className="mb-4 bg-[#f2eff4] border border-[#832b62]/20 text-[#3b142f] rounded-xl px-4 py-2.5 text-xs">
                Este indicador está{' '}
                <strong>
                  {(indicSelecionado.status ?? '').toUpperCase() === 'ARQUIVADO'
                    ? 'arquivado'
                    : 'inativo'}
                </strong>
                . Os dados históricos permanecem preservados apenas para
                consulta (novos lançamentos e edições estão bloqueados).
              </div>
            )}
            <div className="flex-1 overflow-y-auto mb-6 pr-1">
              <h3 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                Medições Registradas ({indicSelecionado.registros?.length ?? 0})
              </h3>

              {!indicSelecionado.registros ||
              indicSelecionado.registros.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                  Nenhuma medição registrada para este indicador ainda.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Ano</th>
                        <th className="py-2.5 px-3">Trimestre</th>
                        <th className="py-2.5 px-3">Realizado</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...indicSelecionado.registros]
                        .sort((a, b) => {
                          if (b.ano !== a.ano) return b.ano - a.ano;
                          return b.trimestre.localeCompare(a.trimestre);
                        })
                        .map((reg) => (
                          <tr
                            key={reg.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-2.5 px-3 font-medium">
                              {reg.ano}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono font-semibold">
                                {reg.trimestre}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-[#832b62]">
                              {reg.valorRealizado != null
                                ? `${reg.valorRealizado}${
                                    indicSelecionado.simbolUni
                                      ? ' ' + indicSelecionado.simbolUni
                                      : ''
                                  }`
                                : '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              {(() => {
                                const info = infoStatusAprovacao(
                                  reg.statusAprovacao,
                                );
                                return (
                                  <div className="flex flex-col gap-1">
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${info.classe}`}
                                    >
                                      {info.rotulo}
                                    </span>
                                    {reg.statusAprovacao ===
                                      'NECESSITA_CORRECAO' &&
                                      reg.justificativaDevolucao && (
                                        <span className="text-[10px] text-[#7a1f2b]">
                                          Motivo: {reg.justificativaDevolucao}
                                        </span>
                                      )}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {(
                                indicSelecionado.status ?? 'ATIVO'
                              ).toUpperCase() === 'ATIVO' ? (
                                <div className="flex items-center justify-end gap-3">
                                  {reg.statusAprovacao === 'APROVADO' ||
                                  reg.statusAprovacao === 'PUBLICADO' ? (
                                    <span className="text-[11px] text-[#24421e] font-semibold">
                                      Aprovado no ciclo
                                    </span>
                                  ) : reg.statusAprovacao ===
                                    'ENVIADO_REVISAO' ? (
                                    UsuarioAtual.tipo === 'ADM' ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setModalHistoricoAberto(false);
                                          abrirAprovacaoModal(
                                            indicSelecionado,
                                            {
                                              id: reg.id,
                                              ano: reg.ano,
                                              trimestre: reg.trimestre,
                                              valorRealizado:
                                                reg.valorRealizado != null
                                                  ? String(reg.valorRealizado)
                                                  : undefined,
                                              statusAprovacao:
                                                reg.statusAprovacao,
                                            },
                                          );
                                        }}
                                        className="text-[11px] text-[#832b62] hover:underline font-bold cursor-pointer"
                                      >
                                        Revisar (Aprovar / Devolver)
                                      </button>
                                    ) : (
                                      <span className="text-[11px] text-[#832b62] italic">
                                        Em análise
                                      </span>
                                    )
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setHistoricoAno(String(reg.ano));
                                        setHistoricoTrimestre(reg.trimestre);
                                        setHistoricoValor(
                                          reg.valorRealizado != null
                                            ? String(reg.valorRealizado)
                                            : '',
                                        );
                                      }}
                                      className="text-[11px] text-[#832b62] hover:underline font-semibold cursor-pointer"
                                    >
                                      Carregar para editar
                                    </button>
                                  )}
                                  {UsuarioAtual.tipo === 'ADM' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        excluirMedicao(
                                          reg.id,
                                          reg.ano,
                                          reg.trimestre,
                                        )
                                      }
                                      title={`Excluir medição de ${reg.ano} (${reg.trimestre})`}
                                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Somente consulta
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Formulário para adicionar nova medição ou atualizar (bloqueado para inativos/arquivados — UC041) */}
            {(indicSelecionado.status ?? 'ATIVO').toUpperCase() === 'ATIVO' &&
              (UsuarioAtual.tipo === 'ADM' || UsuarioAtual.tipo === 'DN') && (
                <form
                  onSubmit={salvarMedicaoHistorico}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4"
                >
                  <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                    <span>
                      + Adicionar ou atualizar medição neste indicador
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Ano
                      </label>
                      <input
                        type="number"
                        min="2000"
                        max="2100"
                        value={historicoAno}
                        onChange={(e) => setHistoricoAno(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Trimestre
                      </label>
                      <select
                        value={historicoTrimestre}
                        onChange={(e) => setHistoricoTrimestre(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                      >
                        <option value="Q1">1º trimestre (Q1)</option>
                        <option value="Q2">2º trimestre (Q2)</option>
                        <option value="Q3">3º trimestre (Q3)</option>
                        <option value="Q4">4º trimestre (Q4)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Valor Realizado{' '}
                        {indicSelecionado.simbolUni
                          ? `(${indicSelecionado.simbolUni})`
                          : ''}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ex: 50"
                        value={historicoValor}
                        onChange={(e) => setHistoricoValor(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      type="submit"
                      className="py-2 px-5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer"
                    >
                      Salvar Medição
                    </button>
                  </div>
                </form>
              )}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setModalHistoricoAberto(false)}
                className="py-2 px-6 rounded-full border border-slate-400 text-slate-700 font-medium text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
