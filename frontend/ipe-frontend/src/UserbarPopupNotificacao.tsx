import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, CloudOff, RotateCw, Trash2, X } from 'lucide-react';
import { apiFetch, mensagemDeErro } from './api/cliente';
import { UsuarioAtual } from './dados/usuarios';
import type { PerfilApi } from './api/mapeadores';

interface UserbarPopupNotificacaoProps {
  onClose: () => void;
  isClosing: boolean;
  onNotificacoesMudaram?: () => void;
}

export type TipoNotificacaoApi =
  'AVISO_GERAL' | 'PRAZO_PREENCHIMENTO' | 'SISTEMA' | 'DEVOLUCAO_INDICADOR';

export interface NotificacaoRecebida {
  isRead: boolean;
  readAt: string | null;
  notificacao: {
    id: string;
    titulo: string;
    mensagem: string;
    tipo: TipoNotificacaoApi;
    linkDestino: string | null;
    nucleoId: string | null;
    createdAt: string;
  };
}

export interface NotificacaoAdmin {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacaoApi;
  linkDestino: string | null;
  nucleoId: string | null;
  createdAt: string;
  criadorId: string | null;
  _count?: {
    destinatarios: number;
  };
}

interface NucleoItem {
  id: string;
  nome: string;
  sigla: string;
}

export function UserbarPopupNotificacao({
  onClose,
  isClosing,
  onNotificacoesMudaram,
}: UserbarPopupNotificacaoProps) {
  const isAdm = UsuarioAtual.tipo === 'ADM';

  // Abas para administrador: 'recebidas' (minhas notificações) ou 'enviadas' (todas disparadas)
  const [abaAtiva, setAbaAtiva] = useState<'recebidas' | 'enviadas'>(
    'recebidas',
  );

  const [notificacoes, setNotificacoes] = useState<NotificacaoRecebida[]>([]);
  const [notificacoesEnviadas, setNotificacoesEnviadas] = useState<
    NotificacaoAdmin[]
  >([]);
  const [carregando, setCarregando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  // Falha só no histórico do ADM (aba "Enviadas"), sem afetar a aba "Recebidas"
  const [erroEnviadas, setErroEnviadas] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState<{
    tipo: 'sucesso' | 'erro';
    texto: string;
  } | null>(null);

  const [criandoNotificacao, setCriandoNotificacao] = useState(false);

  // UC014 — Exclusão de notificações (própria caixa ou global para ADM)
  const [notificacaoParaExcluir, setNotificacaoParaExcluir] = useState<{
    id: string;
    titulo: string;
    escopo: 'recebida' | 'enviada';
  } | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [feedbackLista, setFeedbackLista] = useState<{
    tipo: 'sucesso' | 'erro';
    texto: string;
  } | null>(null);

  useEffect(() => {
    if (!feedbackLista) return;
    const timer = setTimeout(() => setFeedbackLista(null), 4000);
    return () => clearTimeout(timer);
  }, [feedbackLista]);

  // Campos do formulário de criação
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tipo, setTipo] = useState<TipoNotificacaoApi>('AVISO_GERAL');
  const [destino, setDestino] = useState<'TODOS' | 'NUCLEO' | 'PERFIL'>(
    'TODOS',
  );
  const [nucleoIdSelecionado, setNucleoIdSelecionado] = useState('');
  const [perfilAlvoSelecionado, setPerfilAlvoSelecionado] =
    useState<PerfilApi>('DIRETORES_NUCLEOS');

  // Lista de núcleos ativos para destino por núcleo
  const [nucleosDisponiveis, setNucleosDisponiveis] = useState<NucleoItem[]>(
    [],
  );

  // Carrega notificações da API
  const carregarNotificacoes = async () => {
    setCarregando(true);
    setErroCarregamento(false);
    setErroEnviadas(false);
    try {
      // 1. Minhas notificações recebidas (GET /notificacoes)
      const resRecebidas = await apiFetch<{ itens: NotificacaoRecebida[] }>(
        '/notificacoes?limite=50',
      );
      setNotificacoes(resRecebidas.itens || []);

      // 2. Se for ADM, carrega também histórico geral (GET /notificacoes/admin) e núcleos
      if (isAdm) {
        try {
          const resAdmin = await apiFetch<{ itens: NotificacaoAdmin[] }>(
            '/notificacoes/admin?limite=50',
          );
          setNotificacoesEnviadas(resAdmin.itens || []);
        } catch (erro) {
          // TC14.5: falha não pode parecer "nenhuma notificação enviada"
          console.error('Erro ao carregar notificações enviadas:', erro);
          setErroEnviadas(true);
        }

        try {
          const resNucleos = await apiFetch<{ itens: NucleoItem[] }>(
            '/nucleos?status=ATIVO&limite=100',
          );
          if (resNucleos.itens && resNucleos.itens.length > 0) {
            setNucleosDisponiveis(resNucleos.itens);
            if (!nucleoIdSelecionado) {
              setNucleoIdSelecionado(resNucleos.itens[0].id);
            }
          }
        } catch {
          // ignora se falhar
        }
      }
    } catch (erro) {
      console.error('Erro ao carregar notificações:', erro);
      setErroCarregamento(true);
      // Sem a lista principal, o histórico do ADM também não foi buscado
      if (isAdm) setErroEnviadas(true);
    } finally {
      setCarregando(false);
    }
  };

  // TC14.5: mensagem amigável de falha de carregamento com nova tentativa
  const avisoFalhaCarregamento = (
    <div
      role="alert"
      className="flex flex-col items-center justify-center flex-1 py-12 px-4 text-center"
    >
      <div className="size-[52px] rounded-full bg-[#f8d7da]/60 text-[#7a1f2b] flex items-center justify-center mb-3">
        <CloudOff size={24} />
      </div>
      <p className="text-[#3b142f] text-[14px] font-semibold">
        Não foi possível carregar as notificações
      </p>
      <p className="text-[#888888] text-[12px] mt-1 max-w-[280px]">
        O servidor está instável no momento ou sua conexão caiu. Aguarde alguns
        instantes e tente novamente.
      </p>
      <button
        type="button"
        onClick={() => void carregarNotificacoes()}
        disabled={carregando}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#A13680] hover:bg-[#832b62] text-white text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <RotateCw size={14} className={carregando ? 'animate-spin' : ''} />
        {carregando ? 'Tentando reconectar...' : 'Tentar novamente'}
      </button>
    </div>
  );

  useEffect(() => {
    carregarNotificacoes();
  }, [isAdm]);

  // Formata a data ISO para exibição amigável
  const formatarDataHora = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const dataObj = new Date(isoString);
      if (isNaN(dataObj.getTime())) return '';
      return dataObj.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Limpa os campos do formulário
  const limparFormulario = () => {
    setTitulo('');
    setMensagem('');
    setTipo('AVISO_GERAL');
    setDestino('TODOS');
    if (nucleosDisponiveis.length > 0) {
      setNucleoIdSelecionado(nucleosDisponiveis[0].id);
    }
    setPerfilAlvoSelecionado('DIRETORES_NUCLEOS');
    setMensagemStatus(null);
  };

  // Cancelar criação
  const cancelarCriacao = () => {
    limparFormulario();
    setCriandoNotificacao(false);
  };

  // Criar notificação no backend (POST /notificacoes)
  const criarNotificacao = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (titulo.trim().length < 3) {
      setMensagemStatus({
        tipo: 'erro',
        texto: 'O título deve ter no mínimo 3 caracteres.',
      });
      return;
    }

    if (mensagem.trim().length < 10) {
      setMensagemStatus({
        tipo: 'erro',
        texto: 'A mensagem deve ter no mínimo 10 caracteres.',
      });
      return;
    }

    setSalvando(true);
    setMensagemStatus(null);

    try {
      const payload: {
        titulo: string;
        mensagem: string;
        tipo: TipoNotificacaoApi;
        todos?: boolean;
        nucleoId?: string;
        perfilAlvo?: PerfilApi;
      } = {
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        tipo,
      };

      if (destino === 'TODOS') {
        payload.todos = true;
      } else if (destino === 'NUCLEO') {
        if (!nucleoIdSelecionado) {
          setMensagemStatus({
            tipo: 'erro',
            texto: 'Por favor, selecione um núcleo.',
          });
          setSalvando(false);
          return;
        }
        payload.nucleoId = nucleoIdSelecionado;
      } else if (destino === 'PERFIL') {
        payload.perfilAlvo = perfilAlvoSelecionado;
      }

      const resposta = await apiFetch<{
        message: string;
        id: string;
        totalDestinatarios: number;
      }>('/notificacoes', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      limparFormulario();
      setCriandoNotificacao(false);
      await carregarNotificacoes();

      // Notifica componentes ouvintes (ex: UserBar para atualizar o sininho)
      window.dispatchEvent(new CustomEvent('notificacoes-atualizadas'));
      onNotificacoesMudaram?.();

      alert(
        `Notificação enviada com sucesso para ${resposta.totalDestinatarios} usuário(s)!`,
      );
    } catch (erro) {
      setMensagemStatus({
        tipo: 'erro',
        texto: mensagemDeErro(erro),
      });
    } finally {
      setSalvando(false);
    }
  };

  // Marcar uma notificação individual como lida
  const marcarComoLida = async (notificacaoId: string) => {
    try {
      await apiFetch(`/notificacoes/${notificacaoId}/read`, {
        method: 'PATCH',
      });

      setNotificacoes((prev) =>
        prev.map((item) =>
          item.notificacao.id === notificacaoId
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item,
        ),
      );

      window.dispatchEvent(new CustomEvent('notificacoes-atualizadas'));
      onNotificacoesMudaram?.();
    } catch (erro) {
      console.error('Erro ao marcar notificação como lida:', erro);
    }
  };

  // Marcar todas as notificações como lidas
  const marcarTodasComoLidas = async () => {
    try {
      await apiFetch('/notificacoes/read-all', {
        method: 'PATCH',
      });

      setNotificacoes((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
      );

      window.dispatchEvent(new CustomEvent('notificacoes-atualizadas'));
      onNotificacoesMudaram?.();
    } catch (erro) {
      console.error('Erro ao marcar todas como lidas:', erro);
    }
  };

  // UC014: excluir notificação (própria caixa para todos os perfis; global na aba Enviadas do ADM)
  const confirmarExclusao = async () => {
    if (!notificacaoParaExcluir) return;

    const { id, escopo } = notificacaoParaExcluir;
    setExcluindo(true);
    setFeedbackLista(null);

    try {
      const endpoint =
        escopo === 'enviada'
          ? `/notificacoes/admin/${id}`
          : `/notificacoes/${id}`;

      await apiFetch(endpoint, { method: 'DELETE' });

      if (escopo === 'enviada') {
        setNotificacoesEnviadas((prev) => prev.filter((n) => n.id !== id));
        setNotificacoes((prev) => prev.filter((n) => n.notificacao.id !== id));
      } else {
        setNotificacoes((prev) => prev.filter((n) => n.notificacao.id !== id));
        if (isAdm) {
          apiFetch<{ itens: NotificacaoAdmin[] }>(
            '/notificacoes/admin?limite=50',
          )
            .then((resAdmin) => setNotificacoesEnviadas(resAdmin.itens || []))
            .catch(() => undefined);
        }
      }

      setNotificacaoParaExcluir(null);
      setFeedbackLista({
        tipo: 'sucesso',
        texto: 'Notificação excluída com sucesso.',
      });

      window.dispatchEvent(new CustomEvent('notificacoes-atualizadas'));
      onNotificacoesMudaram?.();
    } catch (erro) {
      setNotificacaoParaExcluir(null);
      setFeedbackLista({
        tipo: 'erro',
        texto: mensagemDeErro(erro),
      });
    } finally {
      setExcluindo(false);
    }
  };

  const qtdNaoLidas = notificacoes.filter((n) => !n.isRead).length;

  // Rótulo e cor do tipo da notificação
  const badgeTipo = (tipoNotif: TipoNotificacaoApi) => {
    switch (tipoNotif) {
      case 'PRAZO_PREENCHIMENTO':
        return {
          texto: 'Lembrete de Prazo',
          classe: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'DEVOLUCAO_INDICADOR':
        return {
          texto: 'Devolução',
          classe: 'bg-rose-100 text-rose-800 border-rose-300',
        };
      case 'SISTEMA':
        return {
          texto: 'Sistema',
          classe: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      case 'AVISO_GERAL':
      default:
        return {
          texto: 'Aviso Geral',
          classe: 'bg-purple-100 text-[#A13680] border-purple-200',
        };
    }
  };

  return (
    <div
      className={`bg-white relative w-full max-w-[380px] min-h-full transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${
        isClosing ? 'translate-x-full' : 'translate-x-0'
      }`}
    >
      <div className="flex flex-col items-center w-full min-h-screen px-[16px] py-[24px]">
        {/* Seta de voltar */}
        <button
          onClick={criandoNotificacao ? cancelarCriacao : onClose}
          className="flex items-center justify-start w-full cursor-pointer text-[#A13680] hover:opacity-80 transition-opacity"
          aria-label="Voltar"
        >
          <svg width="30" height="29" viewBox="0 0 30 29" fill="none">
            <path
              d="M17 5L9 13.5L17 22"
              stroke="#A13680"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Título principal */}
        <div className="w-full flex items-center justify-between mt-[15px] mb-[15px]">
          <h1 className="text-[#A13680] text-[22px] font-semibold">
            {criandoNotificacao ? 'Nova Notificação' : 'Notificações'}
          </h1>

          {!criandoNotificacao &&
            qtdNaoLidas > 0 &&
            abaAtiva === 'recebidas' && (
              <button
                onClick={marcarTodasComoLidas}
                className="text-[12px] text-[#A13680] hover:underline cursor-pointer"
                title="Marcar todas as notificações como lidas"
              >
                Marcar lidas
              </button>
            )}
        </div>

        {/* Abas para Administrador */}
        {!criandoNotificacao && isAdm && (
          <div className="flex w-full mb-[16px] p-[3px] bg-[#F4ECF2] rounded-[10px]">
            <button
              onClick={() => setAbaAtiva('recebidas')}
              className={`flex-1 py-[6px] text-[13px] font-medium rounded-[8px] transition-all cursor-pointer ${
                abaAtiva === 'recebidas'
                  ? 'bg-white text-[#A13680] shadow-xs'
                  : 'text-[#777777] hover:text-[#A13680]'
              }`}
            >
              Recebidas {qtdNaoLidas > 0 && `(${qtdNaoLidas})`}
            </button>
            <button
              onClick={() => setAbaAtiva('enviadas')}
              className={`flex-1 py-[6px] text-[13px] font-medium rounded-[8px] transition-all cursor-pointer ${
                abaAtiva === 'enviadas'
                  ? 'bg-white text-[#A13680] shadow-xs'
                  : 'text-[#777777] hover:text-[#A13680]'
              }`}
            >
              Enviadas ({notificacoesEnviadas.length})
            </button>
          </div>
        )}

        {/* Formulário de criação (Apenas Administrador) */}
        {criandoNotificacao ? (
          <form
            onSubmit={criarNotificacao}
            className="flex flex-col w-full gap-[14px] flex-1 overflow-y-auto pb-4"
          >
            {mensagemStatus && (
              <div
                className={`p-[10px] rounded-[8px] text-[13px] ${
                  mensagemStatus.tipo === 'erro'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}
              >
                {mensagemStatus.texto}
              </div>
            )}

            {/* Título */}
            <div className="flex flex-col gap-[4px]">
              <label
                htmlFor="tituloNotificacao"
                className="text-[#664466] text-[13px] font-medium"
              >
                Título *
              </label>
              <input
                id="tituloNotificacao"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Prazo de preenchimento dos indicadores"
                minLength={3}
                maxLength={150}
                required
                className="w-full border border-[#D0D0D0] rounded-[8px] px-[12px] py-[8px] text-[14px] text-[#444444] outline-none focus:border-[#A13680]"
              />
            </div>

            {/* Tipo */}
            <div className="flex flex-col gap-[4px]">
              <label
                htmlFor="tipoNotificacao"
                className="text-[#664466] text-[13px] font-medium"
              >
                Tipo da notificação
              </label>
              <select
                id="tipoNotificacao"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoNotificacaoApi)}
                className="w-full border border-[#D0D0D0] rounded-[8px] px-[10px] py-[8px] text-[14px] text-[#444444] bg-white outline-none focus:border-[#A13680]"
              >
                <option value="AVISO_GERAL">Aviso Geral</option>
                <option value="PRAZO_PREENCHIMENTO">Lembrete de Prazo</option>
                <option value="SISTEMA">Alerta do Sistema</option>
                <option value="DEVOLUCAO_INDICADOR">
                  Devolução de Indicador
                </option>
              </select>
            </div>

            {/* Público-alvo (Destino) */}
            <div className="flex flex-col gap-[4px]">
              <label
                htmlFor="destinoNotificacao"
                className="text-[#664466] text-[13px] font-medium"
              >
                Público-alvo (Destinatários)
              </label>
              <select
                id="destinoNotificacao"
                value={destino}
                onChange={(e) =>
                  setDestino(e.target.value as 'TODOS' | 'NUCLEO' | 'PERFIL')
                }
                className="w-full border border-[#D0D0D0] rounded-[8px] px-[10px] py-[8px] text-[14px] text-[#444444] bg-white outline-none focus:border-[#A13680]"
              >
                <option value="TODOS">Todos os usuários ativos</option>
                <option value="NUCLEO">Usuários de um Núcleo específico</option>
                <option value="PERFIL">Por Perfil de Acesso</option>
              </select>
            </div>

            {/* Seleção do Núcleo se destino for 'NUCLEO' */}
            {destino === 'NUCLEO' && (
              <div className="flex flex-col gap-[4px] pl-2 border-l-2 border-[#A13680]">
                <label
                  htmlFor="nucleoDestino"
                  className="text-[#664466] text-[13px] font-medium"
                >
                  Selecione o Núcleo *
                </label>
                <select
                  id="nucleoDestino"
                  value={nucleoIdSelecionado}
                  onChange={(e) => setNucleoIdSelecionado(e.target.value)}
                  className="w-full border border-[#D0D0D0] rounded-[8px] px-[10px] py-[8px] text-[14px] text-[#444444] bg-white outline-none focus:border-[#A13680]"
                  required
                >
                  {nucleosDisponiveis.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.sigla} - {n.nome}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[#888888]">
                  A notificação será direcionada aos diretores do núcleo
                  selecionado.
                </span>
              </div>
            )}

            {/* Seleção do Perfil se destino for 'PERFIL' */}
            {destino === 'PERFIL' && (
              <div className="flex flex-col gap-[4px] pl-2 border-l-2 border-[#A13680]">
                <label
                  htmlFor="perfilDestino"
                  className="text-[#664466] text-[13px] font-medium"
                >
                  Selecione o Perfil *
                </label>
                <select
                  id="perfilDestino"
                  value={perfilAlvoSelecionado}
                  onChange={(e) =>
                    setPerfilAlvoSelecionado(e.target.value as PerfilApi)
                  }
                  className="w-full border border-[#D0D0D0] rounded-[8px] px-[10px] py-[8px] text-[14px] text-[#444444] bg-white outline-none focus:border-[#A13680]"
                >
                  <option value="DIRETORES_NUCLEOS">
                    Diretores de Núcleos
                  </option>
                  <option value="EQUIPE_GESTAO">Equipe de Gestão</option>
                  <option value="EQUIPE_COMUNICACAO">
                    Equipe de Comunicação
                  </option>
                  <option value="ADMINISTRADOR">Administradores</option>
                </select>
              </div>
            )}

            {/* Mensagem / Descrição */}
            <div className="flex flex-col gap-[4px]">
              <label
                htmlFor="mensagemNotificacao"
                className="text-[#664466] text-[13px] font-medium"
              >
                Mensagem *
              </label>
              <textarea
                id="mensagemNotificacao"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite o texto detalhado da notificação..."
                rows={4}
                minLength={10}
                maxLength={5000}
                required
                className="w-full resize-none border border-[#D0D0D0] rounded-[8px] px-[12px] py-[8px] text-[14px] text-[#444444] outline-none focus:border-[#A13680]"
              />
              <span className="text-[11px] text-[#888888]">
                Mínimo de 10 caracteres. O envio é imediato via sistema e
                e-mail.
              </span>
            </div>

            {/* Botões do formulário */}
            <div className="flex w-full gap-[10px] mt-2">
              <button
                type="button"
                onClick={cancelarCriacao}
                disabled={salvando}
                className="flex-1 py-[9px] rounded-[8px] border border-[#664466] text-[#664466] hover:bg-[#F7F2F7] transition-colors cursor-pointer text-[14px]"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={salvando}
                className="flex-1 py-[9px] rounded-[8px] bg-[#664466] hover:bg-[#795779] text-white transition-colors cursor-pointer text-[14px] font-medium disabled:opacity-50"
              >
                {salvando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        ) : (
          <>
            {feedbackLista && (
              <div
                role="status"
                className={`w-full mb-3 px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border ${
                  feedbackLista.tipo === 'sucesso'
                    ? 'bg-[#f2eff4] border-[#832b62]/25 text-[#3b142f]'
                    : 'bg-[#f8d7da] border-[#7a1f2b]/25 text-[#7a1f2b]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {feedbackLista.tipo === 'sucesso' && (
                    <CheckCircle2
                      size={15}
                      className="text-[#832b62] shrink-0"
                    />
                  )}
                  <span className="break-words">{feedbackLista.texto}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackLista(null)}
                  className="shrink-0 p-0.5 rounded hover:bg-black/5 cursor-pointer"
                  aria-label="Fechar aviso"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Lista de Notificações Recebidas */}
            {abaAtiva === 'recebidas' && (
              <div className="flex flex-col w-full gap-[12px] overflow-y-auto flex-1 pr-1">
                {erroCarregamento ? (
                  avisoFalhaCarregamento
                ) : carregando && notificacoes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-10">
                    <p className="text-[#888888] text-[13px]">
                      Carregando notificações...
                    </p>
                  </div>
                ) : notificacoes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-[#D0C0CE] mb-2"
                    >
                      <path
                        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="text-[#888888] text-[14px] font-medium">
                      Nenhuma notificação no momento.
                    </p>
                    <p className="text-[#AAAAAA] text-[12px] mt-1">
                      Você será avisado quando houver atualizações importantes.
                    </p>
                  </div>
                ) : (
                  notificacoes.map((item) => {
                    const badge = badgeTipo(item.notificacao.tipo);
                    return (
                      <div
                        key={item.notificacao.id}
                        onClick={() => {
                          if (!item.isRead) {
                            marcarComoLida(item.notificacao.id);
                          }
                        }}
                        className={`relative flex items-start gap-[12px] w-full p-[14px] rounded-[14px] transition-all cursor-pointer border ${
                          item.isRead
                            ? 'bg-white border-[#EEEEEE] opacity-80'
                            : 'bg-[#FFF9FC] border-[#E8D4E3] shadow-xs'
                        }`}
                      >
                        {/* Ícone */}
                        <div
                          className={`flex items-center justify-center size-[38px] shrink-0 rounded-full ${
                            item.isRead ? 'bg-[#998899]' : 'bg-[#664666]'
                          }`}
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"
                              stroke="white"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>

                        {/* Conteúdo */}
                        <div className="flex flex-col flex-1 min-w-0 gap-[4px]">
                          <div className="flex items-center justify-between gap-[6px]">
                            <div className="flex items-center gap-[6px] flex-wrap">
                              <span
                                className={`text-[10px] px-[6px] py-[1px] rounded-md border font-medium ${badge.classe}`}
                              >
                                {badge.texto}
                              </span>
                              {!item.isRead && (
                                <span
                                  className="size-[8px] rounded-full bg-[#A13680] shrink-0"
                                  title="Não lida"
                                />
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNotificacaoParaExcluir({
                                  id: item.notificacao.id,
                                  titulo: item.notificacao.titulo,
                                  escopo: 'recebida',
                                });
                              }}
                              className="p-1.5 rounded-lg text-[#3c3b3b] hover:text-[#7a1f2b] hover:bg-[#f8d7da]/60 transition-colors cursor-pointer shrink-0"
                              title="Excluir notificação"
                              aria-label={`Excluir notificação ${item.notificacao.titulo}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <h2
                            className={`text-[14px] break-words ${
                              item.isRead
                                ? 'text-[#665566] font-normal'
                                : 'text-[#A13680] font-semibold'
                            }`}
                          >
                            {item.notificacao.titulo}
                          </h2>

                          <p className="text-[#666666] text-[13px] leading-[18px] break-words whitespace-pre-wrap">
                            {item.notificacao.mensagem}
                          </p>

                          {/* Data de criação / envio */}
                          <div className="flex items-center gap-[4px] mt-[4px]">
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M8 3v3M16 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
                                stroke="#A13680"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span className="text-[#888888] text-[11px]">
                              {formatarDataHora(item.notificacao.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Lista de Notificações Enviadas (Apenas ADM) */}
            {abaAtiva === 'enviadas' && isAdm && (
              <div className="flex flex-col w-full gap-[12px] overflow-y-auto flex-1 pr-1">
                {erroEnviadas ? (
                  avisoFalhaCarregamento
                ) : carregando && notificacoesEnviadas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-10">
                    <p className="text-[#888888] text-[13px]">
                      Carregando histórico...
                    </p>
                  </div>
                ) : notificacoesEnviadas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
                    <p className="text-[#888888] text-[14px]">
                      Nenhuma notificação enviada pelo sistema até agora.
                    </p>
                  </div>
                ) : (
                  notificacoesEnviadas.map((item) => {
                    const badge = badgeTipo(item.tipo);
                    const totalDest = item._count?.destinatarios ?? 0;
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-[12px] w-full p-[14px] rounded-[14px] bg-white border border-[#EEEEEE] shadow-xs"
                      >
                        <div className="flex items-center justify-center size-[36px] shrink-0 rounded-full bg-[#664666]">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
                              stroke="white"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>

                        <div className="flex flex-col flex-1 min-w-0 gap-[4px]">
                          <div className="flex items-center gap-[6px] justify-between">
                            <span
                              className={`text-[10px] px-[6px] py-[1px] rounded-md border font-medium ${badge.classe}`}
                            >
                              {badge.texto}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[11px] font-medium text-[#664466] bg-[#F7F2F7] px-2 py-0.5 rounded-full">
                                {totalDest} destinatário(s)
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setNotificacaoParaExcluir({
                                    id: item.id,
                                    titulo: item.titulo,
                                    escopo: 'enviada',
                                  })
                                }
                                className="p-1.5 rounded-lg text-[#3c3b3b] hover:text-[#7a1f2b] hover:bg-[#f8d7da]/60 transition-colors cursor-pointer"
                                title="Excluir notificação para todos os destinatários"
                                aria-label={`Excluir notificação enviada ${item.titulo}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          <h2 className="text-[#A13680] text-[14px] font-medium break-words">
                            {item.titulo}
                          </h2>

                          <p className="text-[#666666] text-[13px] leading-[18px] break-words whitespace-pre-wrap">
                            {item.mensagem}
                          </p>

                          <div className="flex items-center gap-[4px] mt-[4px]">
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M8 3v3M16 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
                                stroke="#888888"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span className="text-[#888888] text-[11px]">
                              Enviada em {formatarDataHora(item.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Botão adicionar (+) exclusivo para Administrador */}
            {isAdm && (
              <button
                onClick={() => setCriandoNotificacao(true)}
                className="flex items-center justify-center size-[42px] rounded-full bg-[#664466] hover:bg-[#795779] transition-colors cursor-pointer mt-[16px] mb-[10px] shrink-0 shadow-md"
                aria-label="Nova notificação"
                title="Criar e disparar nova notificação"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* Borda lateral direita */}
      <div
        aria-hidden="true"
        className="absolute inset-0 border-l border-[#D0D0D0] pointer-events-none"
      />

      {/* Modal de confirmação de exclusão (UC014) */}
      {notificacaoParaExcluir &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => !excluindo && setNotificacaoParaExcluir(null)}
          >
            <div
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative animate-in fade-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                disabled={excluindo}
                onClick={() => setNotificacaoParaExcluir(null)}
                aria-label="Fechar modal"
                className="absolute top-5 right-5 text-slate-400 hover:text-[#3b142f] p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>

              <div className="mx-auto mb-3 size-12 rounded-full bg-[#f2eff4] flex items-center justify-center text-[#832b62]">
                <Trash2 size={22} />
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Excluir notificação?
              </h2>
              <p className="text-xs font-semibold text-[#832b62] mb-2 break-words">
                {notificacaoParaExcluir.titulo}
              </p>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                {notificacaoParaExcluir.escopo === 'enviada'
                  ? 'Esta notificação será removida definitivamente para todos os destinatários.'
                  : 'Esta notificação será removida da sua caixa de entrada.'}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={excluindo}
                  onClick={() => setNotificacaoParaExcluir(null)}
                  className="flex-1 py-2.5 rounded-full border border-slate-800 text-slate-800 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={excluindo}
                  onClick={() => void confirmarExclusao()}
                  className="flex-1 py-2.5 rounded-full border border-red-200 text-red-600 font-semibold text-xs hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {excluindo ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
