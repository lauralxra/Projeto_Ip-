import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Archive,
  CheckCircle2,
  MoreVertical,
  Pencil,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { Svg } from './config/assets';
import { type Programa } from './dados/programas';
import { apiFetch, mensagemDeErro } from './api/cliente';
import { carregarNucleosDoUsuario } from './api/usuarioAtual';
import {
  nucleoDaApi,
  usuarioDaApi,
  type NucleoApi,
  type UsuarioApi,
} from './api/mapeadores';
import { NavBar } from './NavBar';
import { User } from './UserBar';
import { CustomDropdown } from './CustomDropdown';
import { NucleosCadastrados, type Nucleo } from './dados/nucleos';
import { BtnCriar } from './BtnCriar';
import {
  UsuarioAtual,
  UsuariosCadastrados,
  type Usuario,
} from './dados/usuarios';
import 'react-datepicker/dist/react-datepicker.css';

type StatusApi = 'ATIVO' | 'INATIVO' | 'ARQUIVADO';

interface ProgramaApi {
  id: string;
  nome: string;
  descricao?: string | null;
  status: StatusApi;
  createdAt: string;
  nucleo?: NucleoApi | null;
  // AAAA-MM-DD (devolvido como ISO à meia-noite UTC)
  dataInicio?: string | null;
  responsavelId?: string | null;
  responsavel?: { id: string; nome: string; email?: string } | null;
  participantes?: { user: { id: string; nome: string; email?: string } }[];
}

const STATUS_DA_TELA: Record<StatusApi, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  ARQUIVADO: 'Arquivado',
};

// Programas sem núcleo são institucionais: o card usa a identidade do IPÊ
const NUCLEO_INSTITUCIONAL: Nucleo =
  NucleosCadastrados.find((n) => n.sigla === 'IPÊ') ?? NucleosCadastrados[0];

// A data de início é só um dia: monta no horário local para não "voltar"
// um dia no fuso do Brasil, e envia no formato AAAA-MM-DD
const dataLocal = (iso: string) => {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  return new Date(ano, mes - 1, dia);
};
const paraAAAAMMDD = (data: Date) =>
  `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;

// Responsável e participantes vêm só com id e nome; o formulário usa o id
const usuarioResumido = (u: { id: string; nome: string }): Usuario => ({
  id: u.id,
  nome: u.nome,
  email: '',
  senha: '',
  tipo: 'EC',
  nucleos: [],
  status: 1,
});

const programaDaApi = (item: ProgramaApi): Programa => ({
  id: item.id,
  nome: item.nome,
  descricao: item.descricao ?? '',
  nucleo: item.nucleo ? nucleoDaApi(item.nucleo) : undefined,
  // Sem data de início cadastrada, mostra a data de cadastro
  dataDeInicio: item.dataInicio
    ? dataLocal(item.dataInicio)
    : new Date(item.createdAt),
  status: STATUS_DA_TELA[item.status] ?? 'Ativo',
  responsavel: item.responsavel ? usuarioResumido(item.responsavel) : undefined,
  participantes: (item.participantes ?? []).map((p) => usuarioResumido(p.user)),
});

const idsDosParticipantes = (programa: Programa) =>
  programa.participantes.map((u) => u.id);
const mesmosIds = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();
function MenuAcoesPrograma({
  ehAtivo,
  onEditar,
  onArquivar,
  onReativar,
  onExcluir,
}: {
  ehAtivo: boolean;
  onEditar: () => void;
  onArquivar: () => void;
  onReativar: () => void;
  onExcluir: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }
    if (aberto) {
      document.addEventListener('mousedown', handleClickFora);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
    };
  }, [aberto]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="p-1 text-[#3c3b3b] hover:text-[#832b62] hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
        title="Opções do programa"
        aria-label="Opções do programa"
      >
        <MoreVertical size={18} />
      </button>

      {aberto && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              setAberto(false);
              onEditar();
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-[#fcf2f7] hover:text-[#832b62] transition-colors cursor-pointer text-left"
          >
            <Pencil size={14} className="text-slate-600" />
            <span>Editar Programa</span>
          </button>

          {ehAtivo ? (
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                onArquivar();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#5c3310] hover:bg-[#ffdfbf]/40 transition-colors cursor-pointer text-left"
            >
              <Archive size={14} className="text-[#832b62]" />
              <span>Arquivar Programa</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                onReativar();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#24421e] hover:bg-[#d5e4d1]/50 transition-colors cursor-pointer text-left"
            >
              <RotateCcw size={14} className="text-[#24421e]" />
              <span>Reativar Programa</span>
            </button>
          )}

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            onClick={() => {
              setAberto(false);
              onExcluir();
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
          >
            <Trash2 size={14} className="text-rose-600" />
            <span>Excluir Programa</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ProgramaObj({
  programaEmSi,
  editFunc,
  arquivarFunc,
  reativarFunc,
  delFunc,
}: {
  programaEmSi: Programa;
  editFunc: (obj: Programa) => void;
  arquivarFunc: (obj: Programa) => void;
  reativarFunc: (obj: Programa) => void;
  delFunc: (obj: Programa) => void;
}) {
  const nucleo = programaEmSi.nucleo ?? NUCLEO_INSTITUCIONAL;
  const ehAtivo = programaEmSi.status === 'Ativo';
  const classeBadgeStatus =
    programaEmSi.status === 'Ativo'
      ? 'bg-[#d5e4d1] text-[#24421e]'
      : programaEmSi.status === 'Arquivado'
        ? 'bg-[#ffdfbf] text-[#5c3310]'
        : 'bg-[rgba(102,70,102,0.16)] text-[#3b142f]';

  return (
    <div
      className={`border-2 border-solid content-stretch flex gap-3.5 sm:gap-4 items-start min-h-[110px] px-3.5 sm:px-[18px] py-3 sm:py-[14px] relative rounded-[12px] shadow-xs hover:shadow-md transition-shadow shrink-0 w-full ${
        ehAtivo
          ? 'bg-white border-[#3b142f]'
          : 'bg-[#f2eff4] border-[#832b62]/40'
      }`}
      data-name="Programa"
    >
      {/* Logo do Programa */}
      <div
        className={`size-[55px] sm:size-[70px] relative ${nucleo.corBg} ${nucleo.corIcone} flex items-center justify-center rounded-full overflow-clip shrink-0 border border-slate-200 ${
          ehAtivo ? '' : 'opacity-75'
        }`}
        data-name="Img"
      >
        {nucleo.icone ? (
          <div>
            <img
              alt=""
              className="absolute inset-0 object-cover pointer-events-none size-full"
              src={nucleo.icone}
            />
          </div>
        ) : (
          <span className="font-bold text-[11px] sm:text-[12px] tracking-wider">
            {nucleo.logoTexto}
          </span>
        )}
      </div>

      <div className="content-stretch flex flex-1 flex-col gap-[6px] relative pr-8 sm:pr-10 min-w-0">
        {UsuarioAtual.tipo == 'ADM' ? (
          <div className="absolute right-0 top-0 z-10">
            <MenuAcoesPrograma
              ehAtivo={ehAtivo}
              onEditar={() => editFunc(programaEmSi)}
              onArquivar={() => arquivarFunc(programaEmSi)}
              onReativar={() => reativarFunc(programaEmSi)}
              onExcluir={() => delFunc(programaEmSi)}
            />
          </div>
        ) : (
          ''
        )}

        {/* nome + status */}
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-sans font-semibold text-[#040404] text-[15px] sm:text-[16px] leading-tight break-words">
            {programaEmSi.nome}
          </p>
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${classeBadgeStatus}`}
          >
            {programaEmSi.status}
          </span>
        </div>

        {/* sigla */}
        <p className="font-sans font-bold text-[#664666] text-[12px]">
          {nucleo.sigla}
        </p>

        {/* desceição */}
        <p className="font-sans font-normal text-[#4a4a4a] text-[12px] sm:text-[13px] leading-snug line-clamp-2 break-words">
          {programaEmSi.descricao}
        </p>

        <div className="flex flex-wrap gap-x-4 sm:gap-x-5 gap-y-1.5 items-center pt-1 text-[12px] text-[#555]">
          {/* data de criação */}
          <div className="flex gap-[6px] items-center">
            <div className="size-[16px] shrink-0">
              <svg
                className="block size-full"
                fill="none"
                viewBox="0 0 32.4495 32.4495"
              >
                <path
                  d={Svg.pe78f480}
                  stroke="#0632E3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
                <path
                  d={Svg.p133ca7f0}
                  stroke="#0632E3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <span>
              Início:{' '}
              {new Date(programaEmSi.dataDeInicio).toLocaleDateString('pt-BR')}
            </span>
          </div>

          {/* participantes */}
          <div className="flex gap-[6px] items-center">
            <div className="size-[18px] shrink-0">
              <svg className="block size-full" fill="none" viewBox="0 0 39 39">
                <path d={Svg.p444d880} fill="#08831A" />
              </svg>
            </div>
            <span>{programaEmSi.participantes.length} Participantes</span>
          </div>

          {/* responsável */}
          {programaEmSi.responsavel && (
            <div className="flex gap-[6px] items-center text-slate-700">
              <span className="font-semibold text-slate-700">
                Resp:{' '}
                <span className="font-normal text-slate-600">
                  {programaEmSi.responsavel.nome}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TelaProgramas({
  modoInicial = 'ATIVO',
}: {
  modoInicial?: StatusApi;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const ehAdm = UsuarioAtual.tipo === 'ADM';
  const rotaArquivados =
    location.pathname === '/programas/arquivados' ||
    modoInicial === 'ARQUIVADO';
  // CT-031.04: Programas Arquivados é estritamente restrito ao perfil Administrador
  const acessoNegadoArquivados = rotaArquivados && !ehAdm;
  const statusAtual: StatusApi = rotaArquivados ? 'ARQUIVADO' : 'ATIVO';

  const [programas, setProgramas] = useState<Programa[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<Usuario[]>([]);
  const [nucleosAtivos, setNucleosAtivos] = useState<Nucleo[]>(() =>
    UsuarioAtual.nucleos.filter((n) => (n.status ?? 'ATIVO') === 'ATIVO'),
  );
  const [mensagemFeedback, setMensagemFeedback] = useState<string | null>(null);

  const exibirFeedback = (texto: string) => {
    setMensagemFeedback(texto);
  };

  useEffect(() => {
    if (!mensagemFeedback) return;
    const timer = setTimeout(() => setMensagemFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [mensagemFeedback]);

  // UC031: listagem principal (/programas) exibe apenas programas ATIVOS;
  // /programas/arquivados (ADM) exibe os programas ARQUIVADOS
  const carregarProgramas = async (statusAlvo: StatusApi = statusAtual) => {
    if (statusAlvo !== 'ATIVO' && !ehAdm) {
      setProgramas([]);
      return;
    }

    // O ADM também vê os INATIVOS na listagem principal: eles não são arquivados
    // e, sem isso, um programa desativado sumiria das duas abas sem como reativar
    const statusBuscados: StatusApi[] =
      statusAlvo === 'ATIVO' && ehAdm ? ['ATIVO', 'INATIVO'] : [statusAlvo];

    setCarregando(true);
    try {
      const listas = await Promise.all(
        statusBuscados.map((s) =>
          apiFetch<ProgramaApi[]>(`/programas?status=${s}`),
        ),
      );
      setProgramas(
        listas
          .flat()
          .map(programaDaApi)
          .sort((a, b) => a.nome.localeCompare(b.nome)),
      );
    } catch (erro) {
      console.error('Erro ao carregar programas:', erro);
      alert('Não foi possível carregar os programas: ' + mensagemDeErro(erro));
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (acessoNegadoArquivados) {
      setProgramas([]);
      return;
    }

    carregarProgramas(statusAtual);

    // UC026 (RN02): sempre recarrega núcleos ATIVOS do banco para novos cadastros
    carregarNucleosDoUsuario()
      .then((itens) =>
        setNucleosAtivos(
          itens
            .map(nucleoDaApi)
            .filter((n) => (n.status ?? 'ATIVO') === 'ATIVO'),
        ),
      )
      .catch((erro) => console.error('Erro ao carregar núcleos ativos:', erro));

    if (ehAdm) {
      apiFetch<UsuarioApi[]>('/users')
        .then((dados) => setUsuariosDisponiveis(dados.map(usuarioDaApi)))
        .catch((erro) => console.error('Erro ao carregar usuários:', erro));
    }
  }, [statusAtual, acessoNegadoArquivados]);
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [programaSelecionado, setProgramaSelecionado] = useState<Programa>();

  const [filtroNucleo, setFiltroNucleo] = useState('');
  const NucleosDoUser = Array.from(new Set(UsuarioAtual.nucleos));
  const listaNucleosNome = Array.from(
    new Set(NucleosDoUser.map((i) => i.sigla)),
  );

  const programsDoUser = programas.filter((n) => {
    if (ehAdm) return true;
    if (!n.nucleo) return false;

    // Verifica se algum dos núcleos do usuário possui a mesma sigla ou ID do núcleo do programa
    return UsuarioAtual.nucleos?.some(
      (nuUser) => nuUser.sigla === n.nucleo?.sigla,
    );
  });

  const programPorNome = programsDoUser.filter(
    (n) =>
      n.nome.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
      n.descricao.toLowerCase().includes(termoPesquisa.toLowerCase()),
  );

  const programsFiltrados = programPorNome.filter((n) => {
    // Se filtroNucleo for vazio, aceita todos. Se for "Nenhum", filtra os que não têm núcleo. Senão filtra pelo nome.
    const matchNucleo =
      filtroNucleo === ''
        ? true
        : filtroNucleo === 'Nenhum'
          ? !n.nucleo
          : n.nucleo?.sigla === filtroNucleo;
    return matchNucleo;
  });

  const [modalCriacao, setModalCriacao] = useState(false);
  const abrirCriarModal = () => {
    setModalCriacao(true);
  };

  const [modalEdicao, setModalEdicao] = useState(false);
  const abrirEdicaoModal = (program: Programa) => {
    setProgramaSelecionado(program);
    setModalEdicao(true);
  };

  // UC031 — Arquivar programa (CT-031.01, CT-031.02, CT-031.05)
  const [modalArquivarAberto, setModalArquivarAberto] = useState(false);
  const [programaParaArquivar, setProgramaParaArquivar] =
    useState<Programa | null>(null);
  const [arquivando, setArquivando] = useState(false);

  const abrirArquivarModal = (program: Programa) => {
    setProgramaParaArquivar(program);
    setModalArquivarAberto(true);
  };

  const fecharArquivarModal = () => {
    if (arquivando) return;
    setModalArquivarAberto(false);
    setProgramaParaArquivar(null);
  };

  const handleConfirmarArquivar = async () => {
    if (!programaParaArquivar) return;
    setArquivando(true);
    try {
      await apiFetch(`/programas/${programaParaArquivar.id}/arquivar`, {
        method: 'PATCH',
      });
      setModalArquivarAberto(false);
      setProgramaParaArquivar(null);
      exibirFeedback('Programa arquivado');
      await carregarProgramas(statusAtual);
    } catch (erro) {
      alert('Não foi possível arquivar o programa: ' + mensagemDeErro(erro));
    } finally {
      setArquivando(false);
    }
  };

  const handleReativarPrograma = async (program: Programa) => {
    try {
      await apiFetch(`/programas/${program.id}/reativar`, {
        method: 'PATCH',
      });
      exibirFeedback('Programa reativado com sucesso.');
      await carregarProgramas(statusAtual);
    } catch (erro) {
      alert('Não foi possível reativar o programa: ' + mensagemDeErro(erro));
    }
  };

  // Status escolhido no formulário -> rota da API (Arquivado só muda pela API)
  const aplicarStatus = async (id: string, de: string, para: string) => {
    if (de === para || para === 'Arquivado') return;
    await apiFetch(
      `/programas/${id}/${para === 'Inativo' ? 'desativar' : 'reativar'}`,
      { method: 'PATCH' },
    );
  };

  const handleSalvarPrograma = async (dadosProgram: Programa) => {
    const original = programas.find((u) => u.id === dadosProgram.id);
    const descricao = dadosProgram.descricao.trim();

    try {
      if (original) {
        // Envia só o que mudou: a API recusa uma edição sem alterações
        const alteracoes: Record<string, unknown> = {};
        if (dadosProgram.nome !== original.nome)
          alteracoes.nome = dadosProgram.nome;
        if (descricao !== original.descricao) alteracoes.descricao = descricao;
        if (dadosProgram.nucleo?.id !== original.nucleo?.id)
          alteracoes.nucleoId = dadosProgram.nucleo?.id ?? null;
        if (dadosProgram.responsavel?.id !== original.responsavel?.id)
          alteracoes.responsavelId = dadosProgram.responsavel?.id ?? null;
        if (
          paraAAAAMMDD(dadosProgram.dataDeInicio) !==
          paraAAAAMMDD(original.dataDeInicio)
        )
          alteracoes.dataInicio = paraAAAAMMDD(dadosProgram.dataDeInicio);
        if (
          !mesmosIds(
            idsDosParticipantes(dadosProgram),
            idsDosParticipantes(original),
          )
        )
          alteracoes.participanteIds = idsDosParticipantes(dadosProgram);

        if (Object.keys(alteracoes).length > 0) {
          await apiFetch(`/programas/${original.id}`, {
            method: 'PATCH',
            body: JSON.stringify(alteracoes),
          });
        }
        await aplicarStatus(original.id, original.status, dadosProgram.status);
        setModalEdicao(false);
      } else {
        const criado = await apiFetch<{ id: string }>('/programas', {
          method: 'POST',
          body: JSON.stringify({
            nome: dadosProgram.nome,
            descricao: descricao || undefined,
            nucleoId: dadosProgram.nucleo?.id,
            responsavelId: dadosProgram.responsavel?.id,
            dataInicio: paraAAAAMMDD(dadosProgram.dataDeInicio),
            participanteIds: idsDosParticipantes(dadosProgram),
          }),
        });
        await aplicarStatus(criado.id, 'Ativo', dadosProgram.status);
        setModalCriacao(false);
      }

      setProgramaSelecionado(undefined);
    } catch (erro) {
      alert('Não foi possível salvar o programa: ' + mensagemDeErro(erro));
    } finally {
      await carregarProgramas(statusAtual);
    }
  };

  // Deletamento handling
  const [modalDeletarAberto, setModalDeletarAberto] = useState(false);
  const abrirDeletarModal = (program: Programa) => {
    setProgramaSelecionado(program);
    setModalDeletarAberto(true);
  };

  const handleDeletarProgram = async () => {
    if (!programaSelecionado) return;
    try {
      await apiFetch(`/programas/${programaSelecionado.id}`, {
        method: 'DELETE',
      });
      setModalDeletarAberto(false);
      await carregarProgramas(statusAtual);
    } catch (erro) {
      // Ex.: 409 quando o programa tem indicadores ou ações vinculados
      alert('Não foi possível excluir o programa: ' + mensagemDeErro(erro));
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8fafc] overflow-hidden">
      <NavBar />
      {/*================ CONTEÚDO PRINCIPAL =================*/}
      <main className="flex-1 p-4 sm:p-6 md:p-8 w-full h-full overflow-y-auto pt-4 sm:pt-6 md:pt-10">
        {acessoNegadoArquivados ? (
          <div className="flex flex-1 flex-col items-center justify-center min-h-[70vh] px-4">
            <div className="bg-white border border-[#832b62]/20 rounded-3xl p-8 max-w-md w-full text-center shadow-lg">
              <div className="mx-auto mb-4 size-14 rounded-full bg-[#f2eff4] flex items-center justify-center text-[#832b62]">
                <ShieldAlert size={28} />
              </div>
              <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-[#f8d7da] text-[#7a1f2b] mb-3">
                403 — Acesso Negado
              </span>
              <h1 className="text-2xl font-bold text-[#3b142f] mb-2">
                Permissão insuficiente
              </h1>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Você não tem permissão para visualizar{' '}
                <span className="font-semibold text-[#3b142f]">
                  Programas Arquivados
                </span>
                . Esta área é restrita ao perfil Administrador.
              </p>
              <button
                type="button"
                onClick={() => navigate('/programas')}
                className="w-full py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer"
              >
                Voltar para Programas
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-5 items-center pt-2 sm:pt-4 pb-20 w-full h-full">
            <div className="flex items-center justify-between px-[10px] w-full shrink-0">
              <p className="text-3xl font-sans font-normal relative shrink-0 text-[#a13680] w-full">
                {rotaArquivados ? 'Programas Arquivados' : 'Programas'}
              </p>
            </div>

            {mensagemFeedback && (
              <div
                role="status"
                className="mx-[10px] w-[calc(100%-20px)] bg-[#f2eff4] border border-[#832b62]/30 text-[#3b142f] rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shrink-0 shadow-xs"
              >
                <div className="flex items-center gap-2.5 text-sm font-semibold">
                  <CheckCircle2 size={18} className="text-[#832b62] shrink-0" />
                  <span>{mensagemFeedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMensagemFeedback(null)}
                  className="text-[#3b142f]/70 hover:text-[#3b142f] p-1 rounded-lg cursor-pointer"
                  aria-label="Fechar notificação"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-2 sm:px-[10px] py-[5px] shrink-0 w-full gap-3 sm:gap-4">
              <div className="relative w-full sm:w-80 md:w-96">
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={termoPesquisa}
                  onChange={(e) => setTermoPesquisa(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-full border border-slate-300 focus:outline-none focus:border-[#832b62] text-sm text-slate-700 placeholder:text-slate-400 bg-white shadow-xs"
                />
                <Search
                  size={18}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>

              {/* Botoes */}
              <div className="flex flex-wrap items-center gap-3">
                <CustomDropdown
                  icon={Svg.UsersMais}
                  label="Núcleos"
                  valor={filtroNucleo}
                  onChange={setFiltroNucleo}
                  opcoes={listaNucleosNome}
                />

                {ehAdm && (
                  <div
                    role="tablist"
                    aria-label="Visualização de programas"
                    className="h-[48px] rounded-[9px] border-2 border-[#3b142f] overflow-hidden flex items-stretch shrink-0 bg-transparent"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={!rotaArquivados}
                      onClick={() => navigate('/programas')}
                      className={`px-4 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        !rotaArquivados
                          ? 'bg-[#3b142f] text-white'
                          : 'bg-transparent text-[#3d3d3d] hover:bg-[#f2eff4]'
                      }`}
                    >
                      Ativos
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={rotaArquivados}
                      onClick={() => navigate('/programas/arquivados')}
                      className={`px-4 text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap border-l-2 border-[#3b142f] ${
                        rotaArquivados
                          ? 'bg-[#3b142f] text-white'
                          : 'bg-transparent text-[#3d3d3d] hover:bg-[#f2eff4]'
                      }`}
                    >
                      <Archive size={16} />
                      <span>Programas Arquivados</span>
                    </button>
                  </div>
                )}

                {ehAdm && !rotaArquivados ? (
                  <BtnCriar txt="Criar Programa" acao={abrirCriarModal} />
                ) : (
                  ''
                )}
              </div>
            </div>

            {/* Lista de Programas Ajustada */}
            <div
              className="gap-[12px] flex flex-col items-center h-full overflow-y-auto px-[10px] pt-[10px] pb-28 w-full shrink-0"
              data-name="ListaProgramas"
            >
              {!carregando && programsFiltrados.length === 0 ? (
                <div className="w-full bg-[#f2eff4] border border-[#832b62]/20 rounded-2xl p-8 text-center text-sm text-[#3b142f]">
                  {rotaArquivados
                    ? 'Nenhum programa arquivado encontrado.'
                    : 'Nenhum programa ativo encontrado.'}
                </div>
              ) : (
                programsFiltrados.map((programa) => (
                  <ProgramaObj
                    key={programa.id}
                    programaEmSi={programa}
                    editFunc={abrirEdicaoModal}
                    arquivarFunc={abrirArquivarModal}
                    reativarFunc={handleReativarPrograma}
                    delFunc={abrirDeletarModal}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </main>
      {/* ==================== BARRA DO USUÁRIO ========================== */}
      <div
        className="hidden md:block absolute h-[60px] right-0 top-0 w-auto z-20"
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
      {modalCriacao && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <EditProgramaPopup
            header="Criando programa"
            id={''}
            nome={''}
            nucleo={undefined}
            descricao={''}
            status={'Ativo'}
            dataDeInicio={new Date()}
            responsavel={undefined}
            participantes={[]}
            usuarios={usuariosDisponiveis}
            nucleosDisponiveis={nucleosAtivos}
            onSubmit={handleSalvarPrograma}
            onClose={() => setModalCriacao(false)}
          />
        </div>
      )}
      {/* edição */}
      {modalEdicao && programaSelecionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <EditProgramaPopup
            header="Editando programa"
            id={programaSelecionado.id}
            nome={programaSelecionado.nome}
            nucleo={programaSelecionado.nucleo}
            descricao={programaSelecionado.descricao}
            status={programaSelecionado.status}
            dataDeInicio={programaSelecionado.dataDeInicio}
            responsavel={programaSelecionado.responsavel}
            participantes={programaSelecionado.participantes}
            usuarios={usuariosDisponiveis}
            nucleosDisponiveis={nucleosAtivos}
            onSubmit={handleSalvarPrograma}
            onClose={() => setModalEdicao(false)}
          />
        </div>
      )}
      {/* arquivamento (UC031 — CT-031.01, CT-031.02, CT-031.05) */}
      {modalArquivarAberto && programaParaArquivar && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={fecharArquivarModal}
              disabled={arquivando}
              aria-label="Fechar modal"
              className="absolute top-5 right-5 text-slate-400 hover:text-[#3b142f] p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="size-12 rounded-full bg-[#f2eff4] flex items-center justify-center text-[#832b62] mb-4">
                <Archive size={22} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Arquivar Programa
              </h2>
              <p className="text-sm text-slate-700 font-medium mb-1">
                Tem certeza que deseja arquivar esse programa?
              </p>
              <p className="text-xs font-semibold text-[#832b62] mb-4">
                {programaParaArquivar.nome}
              </p>
            </div>

            <div className="bg-[#f2eff4] border border-[#832b62]/20 rounded-2xl p-4 text-xs text-[#3b142f] leading-relaxed mb-6">
              O programa sairá da listagem de programas ativos e passará a
              constar em <strong>Programas Arquivados</strong>. Os indicadores
              vinculados permanecerão cadastrados no sistema, porém sem vínculo
              ativo com este programa.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fecharArquivarModal}
                disabled={arquivando}
                className="flex-1 py-2.5 rounded-full border border-slate-800 text-slate-800 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarArquivar}
                disabled={arquivando}
                className="flex-1 py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer disabled:opacity-50"
              >
                {arquivando ? 'Arquivando...' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* deletamento */}
      {modalDeletarAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Atenção!</h2>
            <p className="text-sm text-slate-600 mb-1">
              Tem certeza que deseja{' '}
              <span className="font-bold text-slate-800">deletar</span> esse
              Programa permanentemente?
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
                onClick={() => setModalDeletarAberto(false)}
                className="flex-1 py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletarProgram}
                className="flex-1 py-2.5 rounded-full border border-red-200 text-red-600 font-semibold text-xs hover:bg-red-50 transition-colors cursor-pointer"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type programItems = {
  header: string;
  id: string;
  nome: string;
  nucleo?: Nucleo;
  descricao: string;
  dataDeInicio: Date;
  status: string;
  responsavel?: Usuario;
  participantes: Usuario[];
  // Usuários reais (GET /users) para responsável e participantes
  usuarios: Usuario[];
  // Apenas núcleos ativos (RN02 / UC026) para vinculação em novos programas
  nucleosDisponiveis: Nucleo[];
  onSubmit: (programa: Programa) => void;
  onClose: () => void;
};

function EditProgramaPopup({
  header,
  id,
  nome,
  nucleo,
  descricao,
  dataDeInicio,
  status,
  responsavel,
  participantes,
  usuarios,
  nucleosDisponiveis,
  onSubmit,
  onClose,
}: programItems) {
  const listaUsuarios =
    usuarios && usuarios.length > 0 ? usuarios : UsuariosCadastrados;
  // Em edição, preserva o núcleo já vinculado mesmo se foi desativado depois;
  // em novos cadastros, exibe estritamente núcleos ativos (CT-026.04)
  const opcoesNucleo =
    id && nucleo && !nucleosDisponiveis.some((n) => n.id === nucleo.id)
      ? [...nucleosDisponiveis, nucleo]
      : nucleosDisponiveis;
  const [formNome, setFormNome] = useState(nome || '');
  const [formNucleo, setFormNucleo] = useState<Nucleo | undefined>(nucleo);
  const [formDescricao, setFormDescricao] = useState(descricao || '');
  const [formData, setFormData] = useState<Date>(
    dataDeInicio ? new Date(dataDeInicio) : new Date(),
  );
  const [formStatus, setFormStatus] = useState(status || 'Ativo');
  const [formResponsavel, setFormResponsavel] = useState<Usuario | undefined>(
    responsavel,
  );
  const [formParticipantes, setFormParticipantes] = useState<Usuario[]>(
    participantes || [],
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNucleo) {
      alert('Por favor, selecione um núcleo responsável.');
      return;
    }

    if (!formResponsavel) {
      alert('Por favor, selecione um responsável.');
      return;
    }

    onSubmit({
      id:
        id ||
        (typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`),
      nome: formNome,
      nucleo: formNucleo,
      descricao: formDescricao,
      dataDeInicio: formData,
      status: formStatus,
      responsavel: formResponsavel,
      participantes: formParticipantes,
    });
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="bg-white border border-[#a13680] border-solid flex flex-col gap-6 items-center overflow-y-auto max-h-[90vh] px-6 sm:px-[50px] py-[25px] sm:py-[30px] relative rounded-[32px] sm:rounded-[45px] w-full max-w-2xl shadow-2xl"
    >
      <div className="flex items-center justify-between w-full">
        <h2 className="font-sans font-bold text-[28px] text-black">{header}</h2>
      </div>

      {/* Opcoes do Formulário */}
      <div className="flex flex-col gap-5 w-full">
        {/* Nome */}
        <div className="flex flex-col gap-1 w-full">
          <label className="font-bold text-sm text-black">
            Nome do Programa
          </label>
          <input
            type="text"
            placeholder="Insira o nome do programa..."
            required
            value={formNome}
            onChange={(e) => setFormNome(e.target.value)}
            className="bg-[#d9d9d9] h-[45px] px-3 rounded-[15px] border-none outline-none text-[15px] text-slate-700"
          />
        </div>

        {/* Descrição */}
        <div className="flex flex-col gap-1 w-full">
          <label className="font-bold text-sm text-black">
            Descrição curta
          </label>
          <textarea
            placeholder="Insira uma descrição..."
            required
            value={formDescricao}
            onChange={(e) => setFormDescricao(e.target.value)}
            className="bg-[#d9d9d9] min-h-[80px] p-3 rounded-[15px] border-none outline-none text-[15px] text-slate-700 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Data de Início */}
          <div className="flex flex-col gap-1 w-full">
            <label className="font-bold text-sm text-black">
              Data de Início
            </label>
            <input
              type="date"
              value={formData ? formData.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const novaData = e.target.value
                  ? new Date(e.target.value + 'T00:00:00')
                  : new Date();
                setFormData(novaData);
              }}
              className="bg-[#d9d9d9] h-[45px] px-3 rounded-[15px] border-none outline-none text-[15px] text-slate-700"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1 w-full">
            <label className="font-bold text-sm text-black">Status</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              className="bg-[#d5e4d1] h-[45px] px-3 rounded-[15px] border-none outline-none font-bold text-xs cursor-pointer text-black"
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              {status === 'Arquivado' && (
                <option value="Arquivado">Arquivado</option>
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Núcleo */}
          <div className="flex flex-col gap-1 w-full">
            <label className="font-bold text-sm text-black">
              Núcleo Responsável
            </label>
            <select
              value={formNucleo?.id || ''}
              onChange={(e) => {
                const n = opcoesNucleo.find(
                  (item) => item.id === e.target.value,
                );
                setFormNucleo(n);
              }}
              required
              className="bg-[#d8d0d8] h-[45px] px-3 rounded-[15px] border-none outline-none font-bold text-xs cursor-pointer text-black"
            >
              <option value="" disabled>
                Selecione um núcleo...
              </option>
              {opcoesNucleo.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nome} ({n.sigla})
                </option>
              ))}
            </select>
          </div>

          {/* Responsável */}
          <div className="flex flex-col gap-1 w-full">
            <label className="font-bold text-sm text-black">
              Responsável pelo Programa
            </label>
            <select
              value={formResponsavel?.id || ''}
              onChange={(e) => {
                const u = listaUsuarios.find(
                  (item: Usuario) => item.id === e.target.value,
                );
                setFormResponsavel(u);
              }}
              required
              className="bg-[#ffdfbf] h-[45px] px-3 rounded-[15px] border-none outline-none font-bold text-xs cursor-pointer text-black"
            >
              <option value="" disabled>
                Selecione um responsável...
              </option>
              {listaUsuarios.map((u: Usuario) => (
                <option key={u.id} value={u.id}>
                  {u.nome} {u.email ? `(${u.email})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Participantes */}
        <div className="flex flex-col gap-2 w-full">
          <label className="font-bold text-sm text-black">
            Participantes do Programa
          </label>
          <select
            onChange={(e) => {
              const id = e.target.value;
              if (!id) return;
              const usuario = listaUsuarios.find((u: Usuario) => u.id === id);
              if (
                usuario &&
                !formParticipantes.some((u: Usuario) => u.id === id)
              ) {
                setFormParticipantes([...formParticipantes, usuario]);
              }
              e.target.value = '';
            }}
            className="bg-[#d8d0d8] h-[40px] px-3 rounded-xl font-bold text-xs outline-none cursor-pointer text-black"
            defaultValue=""
          >
            <option value="" disabled>
              Adicionar participante...
            </option>
            {listaUsuarios.map((u: Usuario) => (
              <option key={u.id} value={u.id}>
                {u.nome} {u.email ? `(${u.email})` : ''}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-1.5 min-h-[45px] p-2 bg-slate-100 rounded-xl border border-slate-200">
            {formParticipantes.length > 0 ? (
              formParticipantes.map((u) => (
                <span
                  key={u.id}
                  className="inline-flex items-center gap-1 bg-[#3b142f] text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-xs"
                >
                  {u.nome}
                  <button
                    type="button"
                    onClick={() =>
                      setFormParticipantes(
                        formParticipantes.filter((item) => item.id !== u.id),
                      )
                    }
                    className="hover:text-red-300 font-bold ml-1 cursor-pointer"
                    title="Remover"
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span className="text-slate-400 text-xs italic self-center">
                Nenhum participante adicionado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-[25px] items-center justify-center w-full pt-2">
        <button
          type="button"
          onClick={onClose}
          className="border-2 border-[#3b142f] border-solid cursor-pointer flex-1 py-3 rounded-[100px] text-[#3b142f] font-semibold text-center"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-[#3b142f] cursor-pointer flex-1 py-3 rounded-[100px] text-white font-semibold text-center"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
