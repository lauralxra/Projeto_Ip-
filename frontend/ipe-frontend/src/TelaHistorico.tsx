import { useEffect, useState } from 'react';
import { NavBar } from './NavBar';
import { User } from './UserBar';
import { Imagens } from './config/assets';
import {
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  RotateCcw,
  FileUp,
  Activity,
  Layers,
} from 'lucide-react';
import { apiFetch } from './api/cliente';
import { carregarNucleosDoUsuario } from './api/usuarioAtual';

interface AuditLogUser {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  fotoUrl: string | null;
  nucleos?: {
    nucleo: {
      id: string;
      nome: string;
      sigla: string;
    };
  }[];
}

interface AuditLogItem {
  id: string;
  userId: string | null;
  acao: string;
  entidade: string;
  entidadeId: string;
  dadosAntigos: Record<string, unknown> | null;
  dadosNovos: Record<string, unknown> | null;
  ipOrigem: string | null;
  createdAt: string;
  user: AuditLogUser | null;
}

interface NucleoItem {
  id: string;
  nome: string;
  sigla: string;
}

// Retorna o ícone dinâmico conforme a ação gravada
function IconeAcao({ acao }: { acao: string }) {
  let IconComponent = Activity;
  let bgCor = 'bg-[#fbd3ee]/80';
  let textCor = 'text-[#a13680]';

  switch (acao) {
    case 'CRIAR':
      IconComponent = Plus;
      bgCor = 'bg-emerald-100';
      textCor = 'text-emerald-700';
      break;
    case 'ATUALIZAR':
      IconComponent = Edit3;
      bgCor = 'bg-sky-100';
      textCor = 'text-sky-700';
      break;
    case 'EXCLUIR_LOGICO':
    case 'EXCLUIR':
    case 'DESATIVAR':
      IconComponent = Trash2;
      bgCor = 'bg-rose-100';
      textCor = 'text-rose-700';
      break;
    case 'APROVAR':
    case 'PUBLICAR':
      IconComponent = CheckCircle;
      bgCor = 'bg-emerald-100';
      textCor = 'text-emerald-700';
      break;
    case 'DEVOLVER':
      IconComponent = RotateCcw;
      bgCor = 'bg-amber-100';
      textCor = 'text-amber-700';
      break;
    case 'IMPORTAR':
      IconComponent = FileUp;
      bgCor = 'bg-purple-100';
      textCor = 'text-purple-700';
      break;
    default:
      IconComponent = Activity;
      break;
  }

  return (
    <div
      className={`size-[42px] ${bgCor} rounded-full flex items-center justify-center shrink-0`}
    >
      <IconComponent size={20} className={textCor} />
    </div>
  );
}

function formatarTituloAcao(acao: string, entidade: string) {
  const nomesEntidades: Record<string, string> = {
    Indicador: 'Indicador',
    Programa: 'Programa',
    Meta: 'Meta',
    IndicadorRegistro: 'Medição',
    Registro: 'Medição',
    Nucleo: 'Núcleo',
    User: 'Usuário',
  };
  const nomeEntidade = nomesEntidades[entidade] || entidade;

  switch (acao) {
    case 'CRIAR':
      return `Cadastro de ${nomeEntidade}`;
    case 'ATUALIZAR':
      return `Edição de ${nomeEntidade}`;
    case 'EXCLUIR_LOGICO':
    case 'EXCLUIR':
      return `Exclusão de ${nomeEntidade}`;
    case 'APROVAR':
      return `Aprovação de ${nomeEntidade}`;
    case 'DEVOLVER':
      return `Devolução de ${nomeEntidade} para Revisão`;
    case 'PUBLICAR':
      return `Publicação de ${nomeEntidade}`;
    case 'IMPORTAR':
      return `Importação de ${nomeEntidade}`;
    default:
      return `${acao} em ${nomeEntidade}`;
  }
}

function formatarDescricao(log: AuditLogItem) {
  const dados = (log.dadosNovos || log.dadosAntigos || {}) as Record<
    string,
    unknown
  >;
  const nome = dados.nome || dados.titulo || dados.sigla;

  if (nome && typeof nome === 'string') {
    return `${log.entidade}: "${nome}"`;
  }
  if (dados.justificativa && typeof dados.justificativa === 'string') {
    return `Justificativa: "${dados.justificativa}"`;
  }
  if (dados.valorRealizado !== undefined) {
    return `Valor Realizado: ${dados.valorRealizado}${
      dados.ano ? ` (${dados.ano})` : ''
    }`;
  }
  return `Identificador: ${log.entidadeId.slice(0, 8)}...`;
}

function LinhaLog({ log }: { log: AuditLogItem }) {
  const nomeUsuario = log.user?.nome ?? 'Sistema / Ação Automática';
  const perfilUsuario = log.user?.perfil ?? 'SISTEMA';
  const siglaNucleo = log.user?.nucleos?.[0]?.nucleo?.sigla;

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:shadow-md transition-shadow w-full">
      {/* Detalhes da Ação */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <IconeAcao acao={log.acao} />

        <div className="flex flex-col min-w-0">
          <p className="font-semibold text-[14px] text-[#a13680] truncate">
            {formatarTituloAcao(log.acao, log.entidade)}
          </p>
          <p className="text-[12px] text-slate-600 truncate">
            {formatarDescricao(log)}
          </p>
        </div>
      </div>

      {/* Indivíduo / Autor */}
      <div className="flex items-center gap-3 flex-1 min-w-0 md:max-w-[340px]">
        <div className="size-[36px] relative rounded-full overflow-hidden border border-slate-200 shrink-0">
          <img
            alt={nomeUsuario}
            className="size-full object-cover"
            src={log.user?.fotoUrl ? log.user.fotoUrl : Imagens.DefaultPFP}
          />
        </div>

        <div className="flex flex-col min-w-0">
          <p className="font-semibold text-[13px] text-slate-800 truncate">
            {nomeUsuario}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {perfilUsuario}
            </span>
            {siglaNucleo && (
              <span className="inline-block bg-[#fbd3ee]/60 text-[#a13680] text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                {siglaNucleo}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Data e Hora */}
      <div className="flex flex-col md:items-end text-[12px] text-[#a13680] font-medium shrink-0 min-w-[90px]">
        <span>{new Date(log.createdAt).toLocaleDateString('pt-BR')}</span>
        <span className="text-slate-400 text-[11px]">
          {new Date(log.createdAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}

export default function TelaHistorico() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [nucleoSelecionado, setNucleoSelecionado] = useState('');
  const [entidadeSelecionada, setEntidadeSelecionada] = useState('');
  const [nucleos, setNucleos] = useState<NucleoItem[]>([]);

  useEffect(() => {
    let cancelado = false;

    const carregarDados = async () => {
      setCarregando(true);
      try {
        const [listaLogs, listaNucleos] = await Promise.all([
          apiFetch<AuditLogItem[]>('/audit'),
          carregarNucleosDoUsuario().catch(() => []),
        ]);

        if (!cancelado) {
          setLogs(listaLogs);
          setNucleos(listaNucleos);
          setErro(null);
        }
      } catch (err) {
        if (!cancelado) {
          console.error('Erro ao carregar auditoria:', err);
          setErro(
            err instanceof Error
              ? err.message
              : 'Não foi possível carregar o histórico de auditoria.',
          );
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    };

    carregarDados();

    return () => {
      cancelado = true;
    };
  }, []);

  // Filtragem dos logs
  const logsFiltrados = logs.filter((log) => {
    const dataLog = new Date(log.createdAt);

    if (dataInicio) {
      const inicio = new Date(dataInicio + 'T00:00:00');
      if (dataLog < inicio) return false;
    }

    if (dataFim) {
      const fim = new Date(dataFim + 'T23:59:59');
      if (dataLog > fim) return false;
    }

    if (entidadeSelecionada && log.entidade !== entidadeSelecionada) {
      return false;
    }

    if (nucleoSelecionado) {
      const siglaUsuario = log.user?.nucleos?.[0]?.nucleo?.sigla?.toLowerCase();
      const dados = (log.dadosNovos || log.dadosAntigos || {}) as Record<
        string,
        unknown
      >;
      const matchSigla = siglaUsuario === nucleoSelecionado.toLowerCase();
      const matchDesc =
        JSON.stringify(dados)
          .toLowerCase()
          .includes(nucleoSelecionado.toLowerCase()) ||
        log.entidade.toLowerCase().includes(nucleoSelecionado.toLowerCase());

      if (!matchSigla && !matchDesc) return false;
    }

    return true;
  });

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <NavBar />

      {/*================ CONTEÚDO PRINCIPAL =================*/}
      <main className="flex-1 p-6 h-full overflow-y-auto pt-[70px]">
        <div className="flex flex-col gap-6 items-center pt-[10px] pb-[10px] w-full h-full mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full gap-4 px-2">
            {/* Top */}
            <div>
              <h1 className="text-3xl font-['Google_Sans_Flex:Regular',sans-serif] font-normal relative shrink-0 text-[#a13680] w-full">
                Histórico
              </h1>
              <p className="font-['Google_Sans_Flex:Light',sans-serif] font-light relative shrink-0 text-[#8e8e93] w-full text-sm text-slate-500 mt-1">
                Acompanhe o registro oficial e imutável de todas as ações,
                edições e movimentações do sistema.
              </p>
            </div>

            {/* Controles de Filtro */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* Entidade */}
              <div className="relative">
                <select
                  value={entidadeSelecionada}
                  onChange={(e) => setEntidadeSelecionada(e.target.value)}
                  className="bg-white border border-[#a13680] px-3 py-1.5 rounded-xl h-[40px] text-xs font-bold text-slate-700 outline-none cursor-pointer shadow-xs"
                >
                  <option value="">Todas as Entidades</option>
                  <option value="Indicador">Indicadores</option>
                  <option value="Programa">Programas</option>
                  <option value="Meta">Metas</option>
                  <option value="IndicadorRegistro">Medições</option>
                  <option value="Nucleo">Núcleos</option>
                  <option value="User">Usuários</option>
                </select>
              </div>

              {/* Núcleos */}
              <select
                value={nucleoSelecionado}
                onChange={(e) => setNucleoSelecionado(e.target.value)}
                className="bg-white border border-[#a13680] px-3 py-1.5 rounded-xl h-[40px] text-xs font-bold text-slate-700 outline-none cursor-pointer shadow-xs"
              >
                <option value="">Todos os Núcleos</option>
                {nucleos.map((n) => (
                  <option key={n.id} value={n.sigla}>
                    {n.nome} ({n.sigla})
                  </option>
                ))}
              </select>

              {/* Datas */}
              <div className="flex items-center gap-2 bg-white border border-[#a13680] px-3 py-1.5 rounded-xl h-[40px] text-xs text-slate-700 shadow-xs">
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="outline-none bg-transparent cursor-pointer"
                />
                <span>até</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="outline-none bg-transparent cursor-pointer"
                />
              </div>

              {/* Limpar filtros */}
              {(dataInicio ||
                dataFim ||
                nucleoSelecionado ||
                entidadeSelecionada) && (
                <button
                  onClick={() => {
                    setDataInicio('');
                    setDataFim('');
                    setNucleoSelecionado('');
                    setEntidadeSelecionada('');
                  }}
                  className="text-xs text-[#a13680] underline cursor-pointer font-semibold"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Feedback de Carregamento e Erro */}
          {carregando && (
            <div className="w-full text-center py-8 text-slate-500 text-sm">
              Carregando histórico de auditoria...
            </div>
          )}

          {erro && (
            <div className="w-full bg-rose-50 text-rose-700 border border-rose-200 rounded-xl p-4 text-sm">
              {erro}
            </div>
          )}

          {/* Lista de Registros Reais */}
          {!carregando && !erro && (
            <div className="bg-white border border-[#a13680]/30 rounded-2xl p-4 sm:p-6 flex flex-col gap-3 w-full shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Layers size={14} className="text-[#a13680]" />
                  Total de registros:{' '}
                  <strong className="text-slate-800">
                    {logsFiltrados.length}
                  </strong>
                </span>
                <span>Mais recentes primeiro</span>
              </div>

              {logsFiltrados.length > 0 ? (
                logsFiltrados.map((log) => <LinhaLog key={log.id} log={log} />)
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm italic">
                  Nenhum registro de auditoria encontrado para os filtros
                  selecionados.
                </div>
              )}
            </div>
          )}
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
    </div>
  );
}
