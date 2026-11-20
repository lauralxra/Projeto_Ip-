import { createPortal } from 'react-dom';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Imagens, Svg } from './config/assets';
import { TelaUsuarioUserPopup } from './TelaUsuarioUserPopup';
import { UsuarioAtual, type Usuario } from './dados/usuarios';
import { apiFetch, mensagemDeErro } from './api/cliente';
import { SENHA_OCULTA, urlDaImagem } from './api/mapeadores';
import {
  enviarFotoUsuario,
  pedirSenhaAtual,
  trocarPropriaSenha,
} from './api/usuarios';
import { atualizarUsuarioSessao, encerrarSessaoLocal } from './routes/sessao';

const svgPaths = Svg;

/* =========================
   Seta de retorno
========================= */

function Seta() {
  return (
    <div className="flex size-9 items-center justify-center transition-colors hover:bg-[#f5edf5]">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M15 18L9 12L15 6"
          stroke="#A13680"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* =========================
   Foto de perfil
========================= */

function Pic() {
  return (
    <div className="size-[92px] overflow-hidden rounded-full border-[3px] border-white shadow-md ring-1 ring-[#eaddea]">
      <img
        alt="Foto de perfil"
        className="size-full object-cover"
        src={
          UsuarioAtual.imagem
            ? urlDaImagem(UsuarioAtual.imagem)
            : Imagens.DefaultPFP
        }
      />
    </div>
  );
}

export function AddPic() {
  return (
    <div
      className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full bg-[#664666] shadow-md"
      data-name="addPic"
    >
      <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
        <path d={svgPaths.p3b2f3a00} fill="white" />
      </svg>
    </div>
  );
}

function Pfp() {
  return (
    <div className="relative flex items-center justify-center">
      <Pic />
    </div>
  );
}

/* =========================
   Informações do usuário
========================= */

function UserInfo() {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <Pfp />

      <div className="mt-2 max-w-full px-3 text-center">
        <h2 className="break-words text-[22px] font-semibold leading-tight text-[#664666]">
          {UsuarioAtual.nome}
        </h2>

        <span className="mt-2 inline-flex items-center rounded-full bg-[#f5edf5] px-3 py-1 text-xs font-medium tracking-wide text-[#A13680]">
          {UsuarioAtual.tipo}
        </span>
      </div>
    </div>
  );
}

/* =========================
   Ícones do menu
========================= */

function IconUsuarios() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M16 21V19C16 17.3431 14.6569 16 13 16H5C3.34315 16 2 17.3431 2 19V21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M18 8C19.6569 8 21 9.34315 21 11C21 12.6569 19.6569 14 18 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18 16C20.2091 16 22 17.7909 22 20V21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPerfil() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
    >
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 20C5 16.6863 8.13401 14 12 14C15.866 14 19 16.6863 19 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSair() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M10 17L15 12L10 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 12H3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* =========================
   Opções do usuário
========================= */

function OptExtras({
  leUser,
  abrirEditModal,
}: {
  leUser: Usuario;
  abrirEditModal: (user: Usuario) => void;
}) {
  const navigate = useNavigate();

  // Registra o logout na auditoria; a sessão local é encerrada
  // mesmo se a API falhar.
  const sair = async (e: React.MouseEvent) => {
    e.preventDefault();

    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (erro) {
      console.error('Erro ao encerrar a sessão na API:', erro);
    }

    encerrarSessaoLocal();
    navigate('/login', { replace: true });
  };

  const itemMenu =
    'flex w-full items-center gap-3 rounded-xl px-4 py-4 text-left transition-all duration-200 hover:bg-[#f8f2f8] active:scale-[0.98]';

  return (
    <div className="flex w-full flex-1 flex-col justify-between">
      <div className="w-full">
        {/* Menu */}
        <div className="flex flex-col gap-2">
          {/* Gerenciar usuários (exclusivo do Administrador — UC07) */}
          {UsuarioAtual.tipo === 'ADM' && (
            <a href="/usuarios" className={`${itemMenu} text-[#664666]`}>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f3eaf3] text-[#A13680]">
                <IconUsuarios />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold">Gerenciar usuários</p>
                <p className="mt-1 text-xs text-[#99919b]">
                  Cadastrar e definir permissões de usuários
                </p>
              </div>

              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0 text-[#b7a8b8]"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          )}

          {/* Editar perfil */}
          <button
            type="button"
            onClick={() => abrirEditModal(leUser)}
            className={`${itemMenu} text-[#664666]`}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f3eaf3] text-[#A13680]">
              <IconPerfil />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold">Editar perfil</p>
              <p className="mt-1 text-xs text-[#99919b]">
                Atualizar informações pessoais
              </p>
            </div>

            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="shrink-0 text-[#b7a8b8]"
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="mt-auto flex w-full justify-center pt-6">
        <a
          href="/login"
          onClick={sair}
          aria-label="Sair da conta"
          title="Sair da conta"
          className="flex size-11 items-center justify-center rounded-xl text-[#A13680] transition-all duration-200 hover:bg-[#fff1f5] hover:scale-105 active:scale-95"
          data-name="btnDeslogar"
        >
          <IconSair />
        </a>
      </div>
    </div>
  );
}

/* =========================
   Popup de perfil
========================= */

export function UserbarPopupUser({
  onClose,
  isClosing,
  onUsuarioAtualizado,
}: {
  onClose: () => void;
  isClosing: boolean;
  onUsuarioAtualizado?: () => void;
}) {
  const [SeuUsuario, setUsuario] = useState<Usuario>(UsuarioAtual);
  const [usuarioSelecionado, setUserSelecionado] = useState<Usuario>();

  const [modalEdicao, setModalEdicao] = useState(false);

  const abrirEditModal = (user: Usuario) => {
    setUserSelecionado(user);
    setModalEdicao(true);
  };

  // Próprio perfil (qualquer tipo de conta):
  // nome e e-mail em PATCH /users/profile,
  // senha em PATCH /users/profile/password
  // e foto em PATCH /users/profile/photo.
  // E-mail e senha pedem a senha atual.
  const handleSalvarUsuario = async (
    dadosUsuario: Usuario,
    arquivoImagem: File | null,
  ) => {
    try {
      if (arquivoImagem) {
        await enviarFotoUsuario(UsuarioAtual.id, arquivoImagem);
      }

      const alteracoes: Record<string, string> = {};

      if (dadosUsuario.nome !== UsuarioAtual.nome) {
        alteracoes.name = dadosUsuario.nome;
      }

      if (dadosUsuario.email !== UsuarioAtual.email) {
        const senhaAtual = pedirSenhaAtual('trocar o e-mail');

        if (!senhaAtual) {
          alert('E-mail não alterado: a senha atual não foi informada.');
          return;
        }

        alteracoes.email = dadosUsuario.email;
        alteracoes.currentPassword = senhaAtual;
      }

      if (Object.keys(alteracoes).length > 0) {
        await apiFetch('/users/profile', {
          method: 'PATCH',
          body: JSON.stringify(alteracoes),
        });

        if (alteracoes.name) UsuarioAtual.nome = alteracoes.name;
        if (alteracoes.email) UsuarioAtual.email = alteracoes.email;

        atualizarUsuarioSessao({
          ...(alteracoes.name && { nome: alteracoes.name }),
          ...(alteracoes.email && { email: alteracoes.email }),
        });
      }

      if (dadosUsuario.senha !== SENHA_OCULTA) {
        await trocarPropriaSenha(dadosUsuario.senha);
      }

      setUsuario({ ...UsuarioAtual });
      onUsuarioAtualizado?.();

      window.dispatchEvent(new Event('usuario-atualizado'));
      setModalEdicao(false);
    } catch (erro) {
      alert('Não foi possível salvar o perfil: ' + mensagemDeErro(erro));
      setUsuario({ ...UsuarioAtual });
    }
  };

  return (
    <div
      className={`relative size-full max-w-[360px] overflow-hidden border border-[#eee7ef] bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        isClosing ? 'translate-x-full' : 'translate-x-0'
      }`}
    >
      <div className="flex size-full flex-col px-5 py-5">
        {/* Cabeçalho */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Voltar"
          className="flex w-full items-center rounded-lg text-left transition-colors hover:text-[#A13680]"
          data-name="backArrow"
        >
          <Seta />
        </button>

        {/* Perfil */}
        <div className="mt-8 flex flex-col items-center">
          <UserInfo />
        </div>

        {/* Menu */}
        <div className="mt-10 flex flex-1 flex-col">
          <OptExtras leUser={SeuUsuario} abrirEditModal={abrirEditModal} />
        </div>
      </div>

      {/* Modal de edição */}
      {modalEdicao &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-3 sm:p-5 backdrop-blur-sm"
            onClick={() => setModalEdicao(false)}
          >
            <div
              className="flex w-full max-w-[min(92vw,620px)] max-h-[90dvh] min-w-0 items-center justify-center overflow-x-hidden overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <TelaUsuarioUserPopup
                header="Editando perfil"
                id={usuarioSelecionado ? usuarioSelecionado.id : ''}
                nome={usuarioSelecionado?.nome || ''}
                email={usuarioSelecionado?.email || ''}
                senha={usuarioSelecionado?.senha || ''}
                imagem={usuarioSelecionado?.imagem || ''}
                tipo={usuarioSelecionado?.tipo || ''}
                nucleos={usuarioSelecionado?.nucleos || undefined}
                status={usuarioSelecionado?.status || 1}
                onSubmit={handleSalvarUsuario}
                onClose={() => setModalEdicao(false)}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
