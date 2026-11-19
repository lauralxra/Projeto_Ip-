import { useState } from 'react';
import { Imagens, Svg } from './config/assets';
import { UserbarPopupUser } from './UserbarPopupUser';
import { UserbarPopupNotificacao } from './UserbarPopupNotificacao';
import { UsuarioAtual } from './dados/usuarios';
import { urlDaImagem } from './api/mapeadores';

export function User() {
  const [popupUser, setPopupUser] = useState(false);
  const [popUserIsClosing, setUserClosing] = useState(false);

  const [popupNotif, setPopupNotif] = useState(false);
  const [popupNotifIsClosing, setPopupNotifIsClosing] = useState(false);

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
          className="[word-break:break-word] flex-[1_0_0] font-['Google_Sans_Flex:Regular',sans-serif] font-normal leading-[normal] min-w-px not-italic relative text-[#a13680] text-[14px]"
          style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdTH" 100' }}
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
