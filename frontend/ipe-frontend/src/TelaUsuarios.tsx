import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Imagens } from './config/assets';
import { NavBar } from './NavBar';
import { User } from './UserBar';

import { type Nucleo } from './dados/nucleos';
import { type Usuario, TipoDeConta, UsuarioAtual } from './dados/usuarios';
import { BtnCriar } from './BtnCriar';
import { TelaUsuarioUserPopup } from './TelaUsuarioUserPopup';
import { apiFetch, mensagemDeErro } from './api/cliente';
import {
  perfilDoTipo,
  SENHA_OCULTA,
  usuarioDaApi,
  urlDaImagem,
  type UsuarioApi,
} from './api/mapeadores';
import { atualizarUsuarioSessao } from './routes/sessao';
import {
  nomeFoiAlterado,
  sanitizarNomeUsuario,
  validarNomeUsuario,
} from './utils/validacaoNome';
import { enviarFotoUsuario, trocarPropriaSenha } from './api/usuarios';

const mesmosNucleos = (a: Nucleo[], b: Nucleo[]) =>
  a.length === b.length && a.every((n) => b.some((m) => m.id === n.id));

type LinhaUsuarioCadastradoEditarBtnProps = {
  usuarioEmSi: Usuario;
  editFunction: (user: Usuario) => void;
  deleteFunction: (user: Usuario) => void;
};

const LARGURA_MENU = 140;

function LinhaUsuarioCadastradoEditarBtn({
  usuarioEmSi,
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
    const alturaMenu = 96;
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
        className="p-1.5 rounded-lg text-slate-600 hover:text-[#832b62] hover:bg-slate-200/60 transition-colors cursor-pointer"
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
          </div>,
          document.body,
        )}
    </>
  );
}

// Mesma grade no cabeçalho e nas linhas para as colunas ficarem alinhadas
const GRADE_COLUNAS =
  'grid grid-cols-[minmax(220px,1.6fr)_1fr_1fr_1fr_48px] items-center gap-[15px]';

function Labels() {
  return (
    <div
      className={`${GRADE_COLUNAS} bg-[#3b142f] drop-shadow-[0px_4px_2px_rgba(0,0,0,0.1)] h-[48px] px-[20px] rounded-t-[24px] w-full`}
      data-name="Labels"
    >
      {['Usuário', 'Tipo de Conta', 'Núcleo associado', 'Status'].map(
        (titulo) => (
          <p
            key={titulo}
            className="font-sans font-semibold text-[15px] text-center text-white whitespace-nowrap"
          >
            {titulo}
          </p>
        ),
      )}
      <span aria-hidden="true" />
    </div>
  );
}

interface LinhaProps {
  usuario: Usuario;
  onUpdateTipo: (id: string, novoTipo: TipoDeConta) => void;
  onUpdateStatus: (id: string, novoStatus: number) => void;
  editFunction: (user: Usuario) => void;
  deleteFunction: (user: Usuario) => void;
}

function LinhaUsuarioCadastrado({
  usuario,
  editFunction,
  deleteFunction,
}: LinhaProps) {
  return (
    <div
      className={`${GRADE_COLUNAS} bg-[#f2eff4] rounded-xl px-[20px] py-[10px] shadow-xs hover:shadow-md transition-shadow w-full`}
      data-name="linhaUsuarioCadastrado"
    >
      {/* Usuário */}
      <div className="flex items-center justify-center gap-[12px] min-w-0">
        <img
          alt=""
          className="size-[35px] shrink-0 object-cover rounded-full"
          src={
            usuario.imagem ? urlDaImagem(usuario.imagem) : Imagens.DefaultPFP
          }
        />
        <p className="font-sans font-normal leading-tight text-[14px] text-black break-words min-w-0">
          {usuario.nome}
        </p>
      </div>

      {/* Tipo */}
      <div className="flex justify-center">
        <span className="bg-[#ffdfbf] rounded-full px-[12px] py-[6px] font-semibold text-[12px] text-black text-center leading-none">
          {usuario.tipo}
        </span>
      </div>

      {/* Núcleo */}
      <div className="flex justify-center">
        <span className="bg-[rgba(102,70,102,0.25)] rounded-full px-[12px] py-[6px] font-semibold text-[12px] text-black text-center leading-tight">
          {usuario.nucleos.length > 0
            ? usuario.nucleos.map((n) => n.sigla).join(', ')
            : 'Não aplicável'}
        </span>
      </div>

      {/* Status */}
      <div className="flex justify-center">
        <span
          className={`${usuario.status == 1 ? 'bg-[#d5e4d1]' : 'bg-slate-200'} rounded-full px-[12px] py-[6px] font-semibold text-[12px] text-black text-center leading-none`}
        >
          {usuario.status == 1 ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {/* Ações */}
      <div className="flex justify-center">
        {UsuarioAtual.tipo == 'ADM' && (
          <LinhaUsuarioCadastradoEditarBtn
            usuarioEmSi={usuario}
            editFunction={editFunction}
            deleteFunction={deleteFunction}
          />
        )}
      </div>
    </div>
  );
}

export default function TelaUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSelecionado, setUserSelecionado] = useState<Usuario>();

  // GET /users é exclusivo do administrador
  const carregarUsuarios = async () => {
    if (UsuarioAtual.tipo !== 'ADM') return;
    try {
      const dados = await apiFetch<UsuarioApi[]>('/users');
      setUsuarios(dados.map(usuarioDaApi));
    } catch (erro) {
      console.error('Erro ao carregar usuários:', erro);
      alert('Não foi possível carregar os usuários: ' + mensagemDeErro(erro));
    }
  };

  useEffect(() => {
    carregarUsuarios();
    const aoAtualizarUsuario = () => {
      carregarUsuarios();
    };
    window.addEventListener('usuario-atualizado', aoAtualizarUsuario);
    return () => {
      window.removeEventListener('usuario-atualizado', aoAtualizarUsuario);
    };
  }, []);

  const [formNome, setFormNome] = useState('');
  const [formMail, setFormMail] = useState('');
  const [formSenha, setFormSenha] = useState('');
  const [formImagem, setformImagem] = useState('');
  const [formTipo, setFormTipo] = useState('');
  const [formNucleos, setFormNucleos] = useState<Nucleo[]>();
  const [formStatus, setFormStatus] = useState(1);

  const handleUpdateTipo = (id: string, novoTipo: TipoDeConta) => {
    setUsuarios(
      usuarios.map((u) => (u.id === id ? { ...u, tipo: novoTipo } : u)),
    );
  };

  const handleUpdateStatus = (id: string, novoStatus: number) => {
    setUsuarios(
      usuarios.map((u) => (u.id === id ? { ...u, status: novoStatus } : u)),
    );
  };

  const [modalCriacao, setModalCriacao] = useState(false);
  const AbrirTelaCriacao = () => {
    setFormNome('');
    setFormMail('');
    setFormSenha('');
    setformImagem('');
    setFormTipo('');
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
    const erroNome = validarNomeUsuario(dados.nome);
    if (erroNome) throw new Error(erroNome);
    const nomeSanitizado = sanitizarNomeUsuario(dados.nome);

    const criado = await apiFetch<{ id: string }>('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: nomeSanitizado,
        email: dados.email,
        password: dados.senha,
        confirmPassword: dados.senha,
        role: perfilDoTipo(dados.tipo),
      }),
    });

    if (dados.nucleos.length > 0) {
      await apiFetch(`/users/${criado.id}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({ nucleoIds: dados.nucleos.map((n) => n.id) }),
      });
    }
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

    // Só valida o nome quando ele muda: nome antigo fora da regra não
    // impede editar e-mail, perfil, núcleos ou senha
    const nomeMudou = nomeFoiAlterado(dados.nome, original.nome);
    if (nomeMudou) {
      const erroNome = validarNomeUsuario(dados.nome);
      if (erroNome) throw new Error(erroNome);
    }

    // Nome e e-mail: a Administração edita qualquer usuário
    const alteracoes: Record<string, string> = {};
    if (nomeMudou) alteracoes.name = sanitizarNomeUsuario(dados.nome);
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

    // Tipo de conta e núcleos antes do status: ativar exige tipo de conta
    const tipoMudou = dados.tipo !== original.tipo;
    const nucleosMudaram = !mesmosNucleos(dados.nucleos, original.nucleos);
    if (tipoMudou || nucleosMudaram) {
      await apiFetch(`/users/${dados.id}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...(tipoMudou && { role: perfilDoTipo(dados.tipo) }),
          ...(nucleosMudaram && { nucleoIds: dados.nucleos.map((n) => n.id) }),
        }),
      });
    }

    if (dados.status !== original.status) {
      await aplicarStatus(dados.id, dados.status);
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

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8fafc] overflow-hidden">
      <NavBar />

      {/*================ CONTEUDO PRINCIPAL =================*/}
      <main className="flex-1 px-4 sm:px-6 w-full h-full overflow-y-auto pt-4 sm:pt-6 md:pt-10 pb-16">
        <div
          className="content-stretch flex flex-col gap-6 h-full items-center w-full pt-2 sm:pt-4 px-2 sm:px-4"
          data-name="Conteudo"
        >
          {/* Up */}
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2 sm:px-4 w-full"
            data-name="Up"
          >
            <div>
              <h1 className="font-semibold text-[#3b142f] text-2xl sm:text-3xl">
                Usuários Cadastrados
              </h1>
            </div>

            {UsuarioAtual.tipo == 'ADM' ? (
              <BtnCriar txt="Cadastrar usuário" acao={AbrirTelaCriacao} />
            ) : (
              ''
            )}
          </div>

          {/* Lista */}
          <div
            className="w-full overflow-x-auto pb-4"
            data-name="ListaContainer"
          >
            <div
              className="min-w-[760px] flex flex-col gap-[8px] items-center justify-center px-1 py-2 w-full"
              data-name="Lista"
            >
              <Labels />

              {/* Usuarios */}
              <div
                className="content-stretch flex flex-col gap-[12px] isolate items-center relative shrink-0 w-full"
                data-name="Usuarios"
              >
                {usuarios.map((usuario) => {
                  return (
                    <LinhaUsuarioCadastrado
                      key={usuario.id}
                      usuario={usuario}
                      onUpdateTipo={handleUpdateTipo}
                      onUpdateStatus={handleUpdateStatus}
                      editFunction={abrirEditModal}
                      deleteFunction={abrirDeletarModal}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <TelaUsuarioUserPopup
            header="Criando usuário"
            id={''}
            adm
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
      )}

      {/* edicao */}
      {modalEdicao && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <TelaUsuarioUserPopup
            header="Editando usuário"
            id={usuarioSelecionado ? usuarioSelecionado.id : ''}
            adm
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
                onClick={() => setModalDelete(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={deletarUsuario}
                className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-xs hover:bg-red-50 transition-colors cursor-pointer"
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
