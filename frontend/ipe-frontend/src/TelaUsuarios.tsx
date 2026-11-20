import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  MoreVertical,
  Pencil,
  Search,
  ShieldAlert,
  Trash2,
  Users,
} from 'lucide-react';
import { Imagens, Svg } from './config/assets';
import { NavBar } from './NavBar';
import { User } from './UserBar';

import { type Nucleo } from './dados/nucleos';
import { type Usuario, TipoDeConta, UsuarioAtual } from './dados/usuarios';
import { BtnCriar } from './BtnCriar';
import { TelaUsuarioUserPopup } from './TelaUsuarioUserPopup';
import { apiFetch, mensagemDeErro } from './api/cliente';
import {
  nucleoDaApi,
  perfilDoTipo,
  SENHA_OCULTA,
  usuarioDaApi,
  urlDaImagem,
  type NucleoApi,
  type UsuarioApi,
} from './api/mapeadores';
import { atualizarUsuarioSessao } from './routes/sessao';
import { enviarFotoUsuario, trocarPropriaSenha } from './api/usuarios';

const PERFIS_COM_NUCLEO: TipoDeConta[] = ['DN', 'EG'];

const ROTULO_TIPO: Record<TipoDeConta, string> = {
  ADM: 'Administrador',
  DN: 'Diretor de Núcleo',
  EC: 'Equipe de Comunicação',
  EG: 'Equipe de Gestão',
};

const mesmosNucleos = (a: Nucleo[], b: Nucleo[]) =>
  a.length === b.length && a.every((n) => b.some((m) => m.id === n.id));

type LinhaUsuarioCadastradoEditarBtnProps = {
  usuarioEmSi: Usuario;
  ehProprioUsuario: boolean;
  editFunction: (user: Usuario) => void;
  deleteFunction: (user: Usuario) => void;
};

const LARGURA_MENU = 152;

function LinhaUsuarioCadastradoEditarBtn({
  usuarioEmSi,
  ehProprioUsuario,
  editFunction,
  deleteFunction,
}: LinhaUsuarioCadastradoEditarBtnProps) {
  // Posição do menu na tela; null = fechado. O menu vai para o <body> com
  // position: fixed para não ser cortado pelo overflow da lista.
  const [posicao, setPosicao] = useState<{ top: number; left: number } | null>(
    null,
  );
  const botaoRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const alternarMenu = () => {
    if (posicao) {
      setPosicao(null);
      return;
    }
    const caixa = botaoRef.current?.getBoundingClientRect();
    if (!caixa) return;
    const alturaMenu = ehProprioUsuario ? 52 : 96;
    const abreParaCima = caixa.bottom + alturaMenu + 8 > window.innerHeight;
    setPosicao({
      top: abreParaCima ? caixa.top - alturaMenu - 4 : caixa.bottom + 4,
      left: Math.max(8, caixa.right - LARGURA_MENU),
    });
  };

  useEffect(() => {
    if (!posicao) return;
    const fecharSeFora = (evento: MouseEvent) => {
      const alvo = evento.target as Node;
      if (
        !menuRef.current?.contains(alvo) &&
        !botaoRef.current?.contains(alvo)
      ) {
        setPosicao(null);
      }
    };
    const fechar = () => setPosicao(null);
    document.addEventListener('mousedown', fecharSeFora);
    window.addEventListener('scroll', fechar, true);
    window.addEventListener('resize', fechar);
    return () => {
      document.removeEventListener('mousedown', fecharSeFora);
      window.removeEventListener('scroll', fechar, true);
      window.removeEventListener('resize', fechar);
    };
  }, [posicao]);

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        onClick={alternarMenu}
        className="p-1.5 rounded-lg text-[#3c3b3b] hover:text-[#832b62] hover:bg-slate-200/60 transition-colors cursor-pointer"
        title="Ações do usuário"
        aria-label={`Ações do usuário ${usuarioEmSi.nome}`}
        aria-haspopup="menu"
        aria-expanded={posicao !== null}
      >
        <MoreVertical size={18} />
      </button>

      {posicao &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              top: posicao.top,
              left: posicao.left,
              width: LARGURA_MENU,
            }}
            className="fixed z-[100] bg-white rounded-xl shadow-xl border border-slate-100 py-1.5"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setPosicao(null);
                editFunction(usuarioEmSi);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-[#fcf2f7] hover:text-[#832b62] transition-colors cursor-pointer text-left"
            >
              <Pencil size={14} className="text-[#832b62]" />
              <span>Editar</span>
            </button>
            {!ehProprioUsuario && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setPosicao(null);
                  deleteFunction(usuarioEmSi);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
              >
                <Trash2 size={14} />
                <span>Excluir</span>
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

// Mesma grade no cabeçalho e nas linhas para as colunas ficarem alinhadas
const GRADE_COLUNAS =
  'grid grid-cols-[minmax(230px,2fr)_minmax(150px,1.15fr)_minmax(150px,1.15fr)_minmax(96px,0.7fr)_48px] items-center gap-4';

function Labels() {
  return (
    <div
      className={`${GRADE_COLUNAS} bg-[#3b142f] drop-shadow-[0px_4px_2px_rgba(0,0,0,0.1)] min-h-[48px] px-[20px] py-2 rounded-t-[24px] w-full`}
      data-name="Labels"
    >
      <p className="font-sans font-semibold text-[14px] text-left text-white whitespace-nowrap">
        Usuário
      </p>
      {['Tipo de Conta', 'Núcleo associado', 'Status'].map((titulo) => (
        <p
          key={titulo}
          className="font-sans font-semibold text-[14px] text-center text-white whitespace-nowrap"
        >
          {titulo}
        </p>
      ))}
      <span aria-hidden="true" />
    </div>
  );
}

interface LinhaProps {
  usuario: Usuario;
  editFunction: (user: Usuario) => void;
  deleteFunction: (user: Usuario) => void;
}

function BadgeNucleosUsuario({ usuario }: { usuario: Usuario }) {
  const usaNucleo = PERFIS_COM_NUCLEO.includes(usuario.tipo);

  if (!usaNucleo) {
    return (
      <span className="bg-[rgba(102,70,102,0.16)] rounded-full px-3 py-1 font-semibold text-[11px] text-[#3b142f] text-center leading-tight whitespace-nowrap">
        Acesso global
      </span>
    );
  }

  if (usuario.nucleos.length === 0) {
    return (
      <span className="bg-[#f8d7da] rounded-full px-3 py-1 font-semibold text-[11px] text-[#7a1f2b] text-center leading-tight whitespace-nowrap">
        Sem núcleo
      </span>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {usuario.nucleos.map((n) => (
        <span
          key={n.id}
          className="bg-[rgba(102,70,102,0.22)] rounded-full px-2.5 py-1 font-semibold text-[11px] text-[#3b142f] text-center leading-none whitespace-nowrap"
        >
          {n.sigla}
        </span>
      ))}
    </div>
  );
}

function LinhaUsuarioCadastrado({
  usuario,
  editFunction,
  deleteFunction,
}: LinhaProps) {
  const ehProprioUsuario = usuario.id === UsuarioAtual.id;

  return (
    <div
      className={`${GRADE_COLUNAS} bg-[#f2eff4] rounded-xl px-[20px] py-[12px] shadow-xs hover:shadow-md transition-shadow w-full`}
      data-name="linhaUsuarioCadastrado"
    >
      {/* Usuário */}
      <div className="flex items-center justify-start gap-3 min-w-0">
        <img
          alt=""
          className="size-[38px] shrink-0 object-cover rounded-full border border-white shadow-xs"
          src={
            usuario.imagem ? urlDaImagem(usuario.imagem) : Imagens.DefaultPFP
          }
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className="font-sans font-semibold leading-tight text-[14px] text-[#3b142f] truncate">
              {usuario.nome}
            </p>
            {ehProprioUsuario && (
              <span className="shrink-0 bg-[#fbd3ee]/70 text-[#832b62] text-[10px] font-bold px-2 py-0.5 rounded-full">
                Você
              </span>
            )}
          </div>
          <p className="text-[12px] text-slate-500 truncate">{usuario.email}</p>
        </div>
      </div>

      {/* Tipo */}
      <div className="flex justify-center">
        <span className="bg-[#ffdfbf] rounded-full px-3 py-1 font-semibold text-[11px] text-[#5c3310] text-center leading-tight whitespace-nowrap">
          {ROTULO_TIPO[usuario.tipo] ?? usuario.tipo}
        </span>
      </div>

      {/* Núcleo */}
      <div className="flex justify-center">
        <BadgeNucleosUsuario usuario={usuario} />
      </div>

      {/* Status */}
      <div className="flex justify-center">
        <span
          className={`${
            usuario.status == 1
              ? 'bg-[#d5e4d1] text-[#24421e]'
              : 'bg-slate-200 text-slate-700'
          } rounded-full px-3 py-1 font-semibold text-[11px] text-center leading-none whitespace-nowrap`}
        >
          {usuario.status == 1 ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {/* Ações */}
      <div className="flex justify-center">
        {UsuarioAtual.tipo == 'ADM' && (
          <LinhaUsuarioCadastradoEditarBtn
            usuarioEmSi={usuario}
            ehProprioUsuario={ehProprioUsuario}
            editFunction={editFunction}
            deleteFunction={deleteFunction}
          />
        )}
      </div>
    </div>
  );
}

function CardUsuarioMobile({
  usuario,
  editFunction,
  deleteFunction,
}: LinhaProps) {
  const ehProprioUsuario = usuario.id === UsuarioAtual.id;

  return (
    <div className="bg-[#f2eff4] rounded-2xl p-4 shadow-xs border border-slate-200/60 flex flex-col gap-3 w-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            alt=""
            className="size-10 shrink-0 object-cover rounded-full border border-white shadow-xs"
            src={
              usuario.imagem ? urlDaImagem(usuario.imagem) : Imagens.DefaultPFP
            }
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm text-[#3b142f] break-words">
                {usuario.nome}
              </p>
              {ehProprioUsuario && (
                <span className="bg-[#fbd3ee]/70 text-[#832b62] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Você
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 break-all">{usuario.email}</p>
          </div>
        </div>

        <LinhaUsuarioCadastradoEditarBtn
          usuarioEmSi={usuario}
          ehProprioUsuario={ehProprioUsuario}
          editFunction={editFunction}
          deleteFunction={deleteFunction}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#3b142f]/10">
        <span className="bg-[#ffdfbf] rounded-full px-3 py-1 font-semibold text-[11px] text-[#5c3310]">
          {ROTULO_TIPO[usuario.tipo] ?? usuario.tipo}
        </span>
        <BadgeNucleosUsuario usuario={usuario} />
        <span
          className={`${
            usuario.status == 1
              ? 'bg-[#d5e4d1] text-[#24421e]'
              : 'bg-slate-200 text-slate-700'
          } rounded-full px-3 py-1 font-semibold text-[11px]`}
        >
          {usuario.status == 1 ? 'Ativo' : 'Inativo'}
        </span>
      </div>
    </div>
  );
}

export default function TelaUsuarios() {
  const navigate = useNavigate();
  const ehAdm = UsuarioAtual.tipo === 'ADM';

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nucleosAtivos, setNucleosAtivos] = useState<Nucleo[]>(() =>
    UsuarioAtual.nucleos.filter((n) => (n.status ?? 'ATIVO') === 'ATIVO'),
  );
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [usuarioSelecionado, setUserSelecionado] = useState<Usuario>();

  // GET /users é exclusivo do administrador (UC07)
  const carregarUsuarios = async () => {
    if (!ehAdm) return;
    try {
      const dados = await apiFetch<UsuarioApi[]>('/users');
      setUsuarios(dados.map(usuarioDaApi));
    } catch (erro) {
      console.error('Erro ao carregar usuários:', erro);
      alert('Não foi possível carregar os usuários: ' + mensagemDeErro(erro));
    }
  };

  useEffect(() => {
    if (!ehAdm) return;

    carregarUsuarios();

    // Carrega núcleos ATIVOS do banco para o cadastro/edição de permissões (UC08/UC012)
    apiFetch<{ itens: NucleoApi[] }>('/nucleos?status=ATIVO&limite=100')
      .then(({ itens }) => setNucleosAtivos(itens.map(nucleoDaApi)))
      .catch((erro) => console.error('Erro ao carregar núcleos ativos:', erro));

    const aoAtualizarUsuario = () => {
      void carregarUsuarios();
    };
    window.addEventListener('usuario-atualizado', aoAtualizarUsuario);
    return () => {
      window.removeEventListener('usuario-atualizado', aoAtualizarUsuario);
    };
  }, [ehAdm]);

  const [formNome, setFormNome] = useState('');
  const [formMail, setFormMail] = useState('');
  const [formSenha, setFormSenha] = useState('');
  const [formImagem, setformImagem] = useState('');
  const [formTipo, setFormTipo] = useState('');
  const [formNucleos, setFormNucleos] = useState<Nucleo[]>();
  const [formStatus, setFormStatus] = useState(1);

  const [modalCriacao, setModalCriacao] = useState(false);
  const AbrirTelaCriacao = () => {
    setFormNome('');
    setFormMail('');
    setFormSenha('');
    setformImagem('');
    setFormTipo('DN');
    setFormNucleos([]);
    setFormStatus(1);
    setModalCriacao(true);
  };

  const [modalEdicao, setModalEdicao] = useState(false);
  const abrirEditModal = (user: Usuario) => {
    setUserSelecionado(user);
    setFormNome(user.nome);
    setFormMail(user.email);
    setFormSenha(user.senha);
    setformImagem(user.imagem || '');
    setFormTipo(user.tipo);
    setFormNucleos(user.nucleos);
    setFormStatus(user.status);
    setModalEdicao(true);
  };

  // Status da tela (1 = Ativo, 0 = Inativo) -> PATCH /users/:id/status
  const aplicarStatus = (id: string, status: number) =>
    apiFetch(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ ativo: status === 1 }),
    });

  const criarUsuario = async (dados: Usuario, arquivoImagem: File | null) => {
    const exigeNucleo = PERFIS_COM_NUCLEO.includes(dados.tipo);
    const nucleoIds = exigeNucleo ? dados.nucleos.map((n) => n.id) : [];

    if (exigeNucleo && nucleoIds.length === 0) {
      throw new Error(
        'Selecione ao menos um núcleo para contas de Diretor de Núcleo ou Equipe de Gestão.',
      );
    }

    const criado = await apiFetch<{ id: string }>('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: dados.nome,
        email: dados.email,
        password: dados.senha,
        confirmPassword: dados.senha,
        role: perfilDoTipo(dados.tipo),
        ...(nucleoIds.length > 0 && { nucleoIds }),
      }),
    });

    // Usuários cadastrados pela Administração já nascem ativos
    if (dados.status !== 1) await aplicarStatus(criado.id, dados.status);
    if (arquivoImagem) await enviarFotoUsuario(criado.id, arquivoImagem);
  };

  // Envia só o que mudou; cada campo tem seu endpoint
  const editarUsuario = async (
    dados: Usuario,
    original: Usuario,
    arquivoImagem: File | null,
  ) => {
    const proprio = dados.id === UsuarioAtual.id;

    // Nome e e-mail: a Administração edita qualquer usuário
    const alteracoes: Record<string, string> = {};
    if (dados.nome !== original.nome) alteracoes.name = dados.nome;
    if (dados.email !== original.email) alteracoes.email = dados.email;
    if (Object.keys(alteracoes).length > 0) {
      const atualizado = await apiFetch<{ nome?: string; email?: string }>(
        `/users/${dados.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(alteracoes),
        },
      );
      if (proprio) {
        const nomePersistido = atualizado?.nome ?? alteracoes.name;
        const emailPersistido = atualizado?.email ?? alteracoes.email;
        if (nomePersistido) UsuarioAtual.nome = nomePersistido;
        if (emailPersistido) UsuarioAtual.email = emailPersistido;
        atualizarUsuarioSessao({
          ...(nomePersistido && { nome: nomePersistido }),
          ...(emailPersistido && { email: emailPersistido }),
        });
        window.dispatchEvent(new Event('usuario-atualizado'));
      }
    }

    // UC07/UC08: o administrador não altera o próprio tipo de conta, permissões ou status
    if (!proprio) {
      const exigeNucleo = PERFIS_COM_NUCLEO.includes(dados.tipo);
      const nucleosEfetivos = exigeNucleo ? dados.nucleos : [];

      if (exigeNucleo && nucleosEfetivos.length === 0) {
        throw new Error(
          'Selecione ao menos um núcleo para contas de Diretor de Núcleo ou Equipe de Gestão.',
        );
      }

      const tipoMudou = dados.tipo !== original.tipo;
      const nucleosMudaram = !mesmosNucleos(nucleosEfetivos, original.nucleos);
      if (tipoMudou || nucleosMudaram) {
        await apiFetch(`/users/${dados.id}/permissions`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...(tipoMudou && { role: perfilDoTipo(dados.tipo) }),
            ...(nucleosMudaram && {
              nucleoIds: nucleosEfetivos.map((n) => n.id),
            }),
          }),
        });
      }

      if (dados.status !== original.status) {
        await aplicarStatus(dados.id, dados.status);
      }
    }

    // Senha: a Administração redefine a de outro usuário; a própria exige a senha atual
    if (dados.senha !== SENHA_OCULTA) {
      if (proprio) {
        await trocarPropriaSenha(dados.senha);
      } else {
        await apiFetch(`/users/${dados.id}/password`, {
          method: 'PATCH',
          body: JSON.stringify({
            newPassword: dados.senha,
            confirmNewPassword: dados.senha,
          }),
        });
      }
    }

    if (arquivoImagem) {
      await enviarFotoUsuario(dados.id, arquivoImagem);
      if (proprio) {
        window.dispatchEvent(new Event('usuario-atualizado'));
      }
    }
  };

  const handleSalvarUsuario = async (
    dadosUsuario: Usuario,
    arquivoImagem: File | null,
  ) => {
    const original = usuarios.find((u) => u.id === dadosUsuario.id);

    try {
      if (original) {
        await editarUsuario(dadosUsuario, original, arquivoImagem);
        setModalEdicao(false);
      } else {
        await criarUsuario(dadosUsuario, arquivoImagem);
        setModalCriacao(false);
      }
      setUserSelecionado(undefined);
    } catch (erro) {
      alert('Não foi possível salvar o usuário: ' + mensagemDeErro(erro));
    } finally {
      await carregarUsuarios();
    }
  };

  const [modalDeletando, setModalDelete] = useState(false);
  const abrirDeletarModal = (usuario: Usuario) => {
    if (usuario.id === UsuarioAtual.id) return;
    setUserSelecionado(usuario);
    setModalDelete(true);
  };

  const deletarUsuario = async () => {
    if (!usuarioSelecionado) return;
    try {
      await apiFetch(`/users/${usuarioSelecionado.id}`, { method: 'DELETE' });
      setModalDelete(false);
      await carregarUsuarios();
    } catch (erro) {
      alert('Não foi possível excluir o usuário: ' + mensagemDeErro(erro));
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const termo = termoPesquisa.trim().toLowerCase();
    const matchBusca =
      !termo ||
      u.nome.toLowerCase().includes(termo) ||
      u.email.toLowerCase().includes(termo);
    const matchTipo = !filtroTipo || u.tipo === filtroTipo;
    return matchBusca && matchTipo;
  });

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8fafc] overflow-hidden">
      <NavBar />

      {/*================ CONTEUDO PRINCIPAL =================*/}
      <main className="flex-1 px-4 sm:px-6 md:px-8 w-full h-full overflow-y-auto pt-4 sm:pt-6 md:pt-16 pb-16">
        {!ehAdm ? (
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
                O gerenciamento de{' '}
                <span className="font-semibold text-[#3b142f]">
                  Usuários e Permissões
                </span>{' '}
                é restrito ao perfil Administrador.
              </p>
              <button
                type="button"
                onClick={() => void navigate('/dashboard')}
                className="w-full py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer"
              >
                Voltar para o Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col gap-5 w-full max-w-6xl mx-auto"
            data-name="Conteudo"
          >
            {/* Cabeçalho */}
            <div className="flex flex-col gap-1" data-name="Up">
              <h1 className="text-2xl sm:text-3xl font-normal text-[#a13680]">
                Usuários Cadastrados
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Gerencie contas, perfis de acesso e núcleos vinculados dos
                usuários da plataforma.
              </p>
            </div>

            {/* Barra de busca, filtro e criação */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 w-full">
              <div className="relative w-full lg:w-96">
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou e-mail..."
                  value={termoPesquisa}
                  onChange={(e) => setTermoPesquisa(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-full border border-slate-300 focus:outline-none focus:border-[#832b62] text-sm text-slate-700 placeholder:text-slate-400 bg-white shadow-xs"
                />
                <Search
                  size={18}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro por Tipo de Conta no padrão IPÊ h-[48px] rounded-[9px] border-2 border-[#3b142f] */}
                <div className="border-2 border-[#3b142f] border-solid flex h-[48px] items-center justify-between px-[14px] relative rounded-[9px] w-full sm:w-[220px] bg-transparent hover:bg-[#f2eff4] transition-colors">
                  <div className="size-[18px] relative shrink-0 pointer-events-none text-[#3b142f]">
                    <Users className="size-full" />
                  </div>

                  <select
                    aria-label="Filtrar usuários por tipo de conta"
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  >
                    <option value="">Todos os perfis</option>
                    <option value="ADM">Administrador</option>
                    <option value="DN">Diretor de Núcleo</option>
                    <option value="EG">Equipe de Gestão</option>
                    <option value="EC">Equipe de Comunicação</option>
                  </select>

                  <p className="font-normal text-[#3d3d3d] text-[14px] whitespace-nowrap overflow-hidden text-ellipsis pointer-events-none flex-1 ml-2">
                    {filtroTipo
                      ? ROTULO_TIPO[filtroTipo as TipoDeConta]
                      : 'Todos os perfis'}
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

                <BtnCriar txt="Cadastrar usuário" acao={AbrirTelaCriacao} />
              </div>
            </div>

            {/* Lista Desktop (tabela alinhada) */}
            <div
              className="hidden md:block w-full overflow-x-auto pb-4"
              data-name="ListaContainer"
            >
              <div
                className="min-w-[760px] flex flex-col gap-[10px] w-full"
                data-name="Lista"
              >
                <Labels />

                <div
                  className="flex flex-col gap-[10px] w-full"
                  data-name="Usuarios"
                >
                  {usuariosFiltrados.length === 0 ? (
                    <div className="bg-[#f2eff4] rounded-xl px-6 py-8 text-center text-sm text-[#3b142f]">
                      Nenhum usuário encontrado com os filtros aplicados.
                    </div>
                  ) : (
                    usuariosFiltrados.map((usuario) => (
                      <LinhaUsuarioCadastrado
                        key={usuario.id}
                        usuario={usuario}
                        editFunction={abrirEditModal}
                        deleteFunction={abrirDeletarModal}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Lista Mobile (cards responsivos) */}
            <div className="flex md:hidden flex-col gap-3 w-full pb-4">
              {usuariosFiltrados.length === 0 ? (
                <div className="bg-[#f2eff4] rounded-2xl px-6 py-8 text-center text-sm text-[#3b142f]">
                  Nenhum usuário encontrado com os filtros aplicados.
                </div>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <CardUsuarioMobile
                    key={usuario.id}
                    usuario={usuario}
                    editFunction={abrirEditModal}
                    deleteFunction={abrirDeletarModal}
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
      {/* cadastro */}
      {modalCriacao && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setModalCriacao(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90dvh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <TelaUsuarioUserPopup
              header="Criando usuário"
              id={''}
              adm
              nucleosDisponiveis={nucleosAtivos}
              nome={''}
              email={''}
              senha={''}
              imagem={''}
              tipo={'DN'}
              nucleos={[]}
              status={1}
              onSubmit={handleSalvarUsuario}
              onClose={() => setModalCriacao(false)}
            />
          </div>
        </div>
      )}

      {/* edicao */}
      {modalEdicao && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setModalEdicao(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90dvh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <TelaUsuarioUserPopup
              header="Editando usuário"
              id={usuarioSelecionado ? usuarioSelecionado.id : ''}
              adm
              editandoProprioUsuario={
                usuarioSelecionado?.id === UsuarioAtual.id
              }
              nucleosDisponiveis={nucleosAtivos}
              nome={formNome}
              email={formMail}
              senha={formSenha}
              imagem={formImagem}
              tipo={formTipo}
              nucleos={formNucleos ? formNucleos : undefined}
              status={formStatus}
              onSubmit={handleSalvarUsuario}
              onClose={() => setModalEdicao(false)}
            />
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
              <span className="font-bold text-slate-800">
                {'remover ' + usuarioSelecionado?.nome}
              </span>{' '}
              permanentemente do sistema?
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
                type="button"
                onClick={() => setModalDelete(false)}
                className="flex-1 py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={deletarUsuario}
                className="flex-1 py-2.5 rounded-full border border-red-200 text-red-600 font-semibold text-xs hover:bg-red-50 transition-colors cursor-pointer"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
