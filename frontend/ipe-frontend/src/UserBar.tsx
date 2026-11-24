import { useEffect, useState } from 'react';
import { Imagens, Svg } from './config/assets';
import { UserbarPopupUser } from './UserbarPopupUser';
import { UserbarPopupNotificacao } from './UserbarPopupNotificacao';
import { UsuarioAtual } from './dados/usuarios';
import { urlDaImagem } from './api/mapeadores';
import { apiFetch } from './api/cliente';

export function User() {
  const [popupUser, setPopupUser] = useState(false);
  const [popUserIsClosing, setUserClosing] = useState(false);
  const [, setVersaoUsuario] = useState(0);
  const [popupNotif, setPopupNotif] = useState(false);
  const [popupNotifIsClosing, setPopupNotifIsClosing] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    const atualizar = () => setVersaoUsuario((v) => v + 1);
    window.addEventListener('usuario-atualizado', atualizar);
    return () => window.removeEventListener('usuario-atualizado', atualizar);
  }, []);

  useEffect(() => {
    let ativo = true;

    const checarNotificacoes = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const res = await apiFetch<{ itens: { isRead: boolean }[] }>(
          '/notificacoes?limite=50',
        );
        if (ativo && res?.itens) {
          const totalNaoLidas = res.itens.filter((i) => !i.isRead).length;
          setNaoLidas(totalNaoLidas);
        }
      } catch {
        // Ignora caso deslogado ou erro temporário
      }
    };

    checarNotificacoes();
    window.addEventListener('notificacoes-atualizadas', checarNotificacoes);
    return () => {
      ativo = false;
      window.removeEventListener(
        'notificacoes-atualizadas',
        checarNotificacoes,
      );
    };
  }, []);

  // Fechar popup do perfil
  const fecharUserPopup = () => {
    setUserClosing(true);

    setTimeout(() => {
      setPopupUser(false);
      setUserClosing(false);
    }, 200);
  };

  // Fechar popup de notificações
  const fecharNotifPopup = () => {
    setPopupNotifIsClosing(true);

    setTimeout(() => {
      setPopupNotif(false);
      setPopupNotifIsClosing(false);
    }, 200);
  };

  return (
    <div
      className="bg-white content-stretch flex gap-[15px] items-center justify-end pr-[30px] pl-[15px] py-[10px] relative size-auto min-h-[20px] max-w-[600px] rounded-bl-[20px]"
      data-name="User"
    >
      {/* Sininho */}
      <button
        onClick={() => {
          setPopupUser(false);
          setPopupNotif(true);
        }}
        className="h-[35px] min-h-[35px] min-w-[30px] relative shrink-0 w-[30px] cursor-pointer"
        data-name="Frame - notification/search"
        aria-label="Abrir notificações"
      >
        <svg
          className="absolute block inset-0 size-full"
          fill="none"
          height="35"
          preserveAspectRatio="none"
          viewBox="0 0 30 35"
          width="30"
        >
          <g clipPath="url(#clip0_0_6)" id="Frame - notification/search">
            <path d={Svg.SinoNotificacao} fill="#A13680" id="Vector" />
          </g>

          <defs>
            <clipPath id="clip0_0_6">
              <rect fill="white" height="35" width="30" />
            </clipPath>
          </defs>
        </svg>

        {naoLidas > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#A13680] rounded-full shadow-sm pointer-events-none"
            title={`${naoLidas} notificação(ões) não lida(s)`}
          >
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {/* FramePerfil */}
      <button
        onClick={() => {
          setPopupNotif(false);
          setPopupUser(true);
        }}
        className="content-stretch flex gap-[7px] items-center min-h-[40px] min-w-[125px] overflow-clip relative shrink-0 cursor-pointer"
        data-name="Frame - Perfil"
        aria-label="Abrir perfil"
      >
        {/* Pfp */}
        <div className="relative shrink-0 size-[40px]" data-name="Icon">
          <div className="relative rounded-[100px] size-full">
            <img
              alt=""
              className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[100px] size-full"
              src={
                UsuarioAtual.imagem
                  ? urlDaImagem(UsuarioAtual.imagem)
                  : Imagens.DefaultPFP
              }
            />
          </div>
        </div>

        {/* Nome */}
        <p
          className="truncate max-w-[150px] font-sans font-normal leading-[normal] not-italic relative text-[#a13680] text-[14px]"
          style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}
          title={UsuarioAtual.nome}
        >
          {UsuarioAtual.nome}
        </p>
      </button>

      {/* Popup do perfil */}
      {popupUser && (
        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50 transition-opacity duration-300 ${
            popUserIsClosing ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <UserbarPopupUser
            onClose={fecharUserPopup}
            isClosing={popUserIsClosing}
            onUsuarioAtualizado={() => setVersaoUsuario((v) => v + 1)}
          />
        </div>
      )}

      {/* Popup de notificações */}
      {popupNotif && (
        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50 transition-opacity duration-300 ${
            popupNotifIsClosing ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <UserbarPopupNotificacao
            onClose={fecharNotifPopup}
            isClosing={popupNotifIsClosing}
          />
        </div>
      )}
    </div>
  );
}
