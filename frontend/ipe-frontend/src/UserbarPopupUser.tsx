import { useState } from 'react';
import { Imagens, Svg } from "./config/assets";
import { TelaUsuarioUserPopup } from './TelaUsuarioUserPopup';
import { UsuarioAtual, type Usuario } from './dados/usuarios';
const svgPaths = Svg;

function Seta() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center max-h-[29px] max-w-[30px] min-h-[29px] min-w-[30px] overflow-clip relative shrink-0 w-full" data-name="Arrow forward ios">
      <div className="absolute bottom-[8.33%] left-[25.96%] right-1/4 top-[8.33%]" data-name="Group">
        <svg className="absolute block inset-0 size-full" fill="none" height="24.1667" preserveAspectRatio="none" viewBox="0 0 14.7125 24.1667" width="14.7125">
          <g id="Group">
            <path d={svgPaths.p28880070} fill="#A13680" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Pic() {
  return (
    <div className="col-1 max-h-[80px] max-w-[80px] min-h-[80px] min-w-[80px] ml-0 mt-0 relative row-1 size-[80px]" data-name="pic">
      <div className="relative rounded-[100px] size-full">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[100px] size-full"
          src={UsuarioAtual.imagem ? ("/src/assets/"+UsuarioAtual.imagem) : Imagens.DefaultPFP} />
      </div>
    </div>
  );
}

export function AddPic() {
  return (
    <div className="col-1 max-h-[22px] max-w-[22px] min-h-[22px] min-w-[22px] ml-[54px] mt-[61.62px] relative row-1 size-[22px]" data-name="addPic">
      <svg className="absolute block inset-0 size-full" fill="none" height="22" preserveAspectRatio="none" viewBox="0 0 22 22" width="22">
        <g id="addPic">
          <rect fill="#664666" height="22" rx="11" width="22" />
          <path d={svgPaths.p3b2f3a00} fill="white" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Pfp() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid max-h-[83.615234375px] max-w-[80px] min-h-[83.615234375px] min-w-[80px] place-items-start relative shrink-0" data-name="pfp">
      <Pic />
      {/*<AddPic />*/}
    </div>
  );
}

function UserInfo() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-center leading-[0] relative shrink-0 w-[244px]" data-name="userInfo">
      <Pfp />
      <div className="[word-break:break-word] flex flex-col font-['Google_Sans_Flex:Regular',sans-serif] font-normal justify-center min-w-full not-italic relative shrink-0 text-[#a13680] text-[24px] text-center w-[min-content]" style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}>
        <p className="leading-[normal]">{UsuarioAtual.nome}</p>
      </div>
      <div className="[word-break:break-word] flex flex-col font-['Google_Sans_Flex:Regular',sans-serif] font-normal justify-center min-w-full not-italic relative shrink-0 text-[#aeaeb2] text-[15px] text-center w-[min-content]" style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}>
        <p className="leading-[normal]">{UsuarioAtual.tipo}</p>
      </div>
    </div>
  );
}

function BtnEdit() {
  return (
    <div className="bg-[#664666] content-stretch flex items-center justify-center min-h-[27px] min-w-[27px] overflow-clip py-[5px] relative rounded-[34px] shrink-0" data-name="btnEdit">
      <svg className="absolute block inset-x-1 inset-y-1 size-full" fill="none" height="9.2" preserveAspectRatio="none" viewBox="0 0 25 25" width="9.2">
        <g id="Group">
          <path d={svgPaths.pcfb69f0} fill="white" id="Vector" style={{transformOrigin: 'center'}}/>
        </g>
      </svg>
    </div>
  );
}

export function Fields() {
  const [formMail, setNomeMail] = useState("TeuEmail@ufrpe.br");
  const [formSenha, setNomeSenha] = useState('senhapa@12345');

  return (
    <div className="content-stretch flex flex-col gap-[20px] items-start overflow-clip relative shrink-0 w-full" data-name="Fields">
      
      {/* Mail */}
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Mail">
        <label className="[word-break:break-word] font-['Google_Sans_Flex:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[#664666] text-[20px] w-full" style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}>
          Email
        </label>
        
        <div className="bg-[#f2f2f7] content-stretch flex items-center justify-between overflow-clip px-[9px] py-[5px] relative rounded-[10px] shrink-0 w-full">
          <input className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['Google_Sans_Flex:Regular',sans-serif] font-normal justify-center leading-[0] min-w-px not-italic relative text-[#8e8e93] text-[14px]" style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}
            type="text"
            placeholder="Insira um Email..."
            value={formMail}
            onChange={(e) => setNomeMail(e.target.value)}
            readOnly
          />
          <BtnEdit />
        </div>
      </div>

      {/* Senha */}
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Senha">
        <label className="[word-break:break-word] font-['Google_Sans_Flex:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[#664666] text-[20px] w-full" style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}>
          Senha
        </label>
        
        <div className="bg-[#f2f2f7] content-stretch flex items-center justify-between overflow-clip px-[9px] py-[5px] relative rounded-[10px] shrink-0 w-full">
          <input className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['Google_Sans_Flex:Regular',sans-serif] font-normal justify-center leading-[0] min-w-px not-italic relative text-[#8e8e93] text-[14px]" style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}
            type="password"
            placeholder="Insira uma senha..."
            value={formSenha}
            onChange={(e) => setNomeSenha(e.target.value)}
            readOnly
          />
          <BtnEdit />
        </div>
      </div>

    </div>
  );
}

function OptExtras( {leUser, abrirEditModal}: {leUser:Usuario, abrirEditModal: (user:Usuario) => void} ) {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-center justify-center relative shrink-0 w-auto" data-name="optExtras">
      <a onClick={() => {abrirEditModal(leUser)}} className="[text-underline-position:from-font] decoration-from-font decoration-solid font-['Google_Sans_Flex:Bold',sans-serif] cursor-pointer font-bold leading-[normal] align-center min-w-full not-italic relative shrink-0 text-[#664666] text-[20px] underline w-[min-content] whitespace-nowrap items-center justify-center" style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}>
        {`Editar perfil`}
      </a>
      <a href="/usuarios" className="[text-underline-position:from-font] decoration-from-font decoration-solid font-['Google_Sans_Flex:Bold',sans-serif] font-bold leading-[normal] align-center min-w-full not-italic relative shrink-0 text-[#664666] text-[20px] underline w-[min-content] whitespace-nowrap items-center justify-center" style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}>
        {UsuarioAtual.tipo == "ADM" ? `Gerenciar Usuários` : `Usuários Cadastrados`}
      </a>
      {/*<p className="[word-break:break-word] font-['Google_Sans_Flex:Bold',sans-serif] font-bold leading-[normal] min-w-full not-italic relative shrink-0 text-[#664666] text-[20px] w-[min-content]" style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}>
        Acessibilidade
      </p>*/}
      <a href="login" className="h-[34px] relative shrink-0 w-[35px]" data-name="btnDeslogar">
        <div className="absolute inset-[9.38%_6.25%_9.38%_9.38%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" height="27.625" preserveAspectRatio="none" viewBox="0 0 29.5298 27.625" width="29.5298">
            <path d={svgPaths.p23a46200} fill="#A13680" id="Vector" />
          </svg>
        </div>
      </a>
    </div>
  );
}

export function UserbarPopupUser( {onClose, isClosing}: {onClose:() => void, isClosing:boolean}) {
  const [SeuUsuario, setUsuario] = useState<Usuario>(UsuarioAtual);
  const [usuarioSelecionado, setUserSelecionado] = useState<Usuario>();
  
  const [modalEdicao, setModalEdicao] = useState(false);
  const abrirEditModal = (user: Usuario) => {
    setUserSelecionado(user);
    setModalEdicao(true);
  };

  const handleSalvarUsuario = (dadosUsuario: Usuario) => {
      setUsuario(dadosUsuario);
      Object.assign(UsuarioAtual, dadosUsuario);
      setModalEdicao(false);
  };

  return (
    <div className={`bg-white relative size-full max-w-[360px] transform transition-transform duration-300 ease-in-out ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}>
    
      <div className="flex flex-col items-center min-h-[inherit] min-w-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[69px] items-center min-h-[inherit] min-w-[inherit] px-[14px] py-[27px] relative size-full">
          {/* BackArrow */}
          <button onClick={onClose} className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full cursor-pointer" data-name="backArrow">
            <Seta />
          </button>

          <UserInfo />
          {/*<Fields />*/}
          <OptExtras leUser={SeuUsuario} abrirEditModal={abrirEditModal}/>
        </div>
      </div>
      <div aria-hidden className="absolute border border-[#d0d0d0] border-solid inset-0 pointer-events-none" />

      { /* cadastro */}
      {modalEdicao && (
        <div className="fixed top-0 right-0 w-screen h-screen z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <TelaUsuarioUserPopup header='Editando perfil'
                                id={usuarioSelecionado? usuarioSelecionado.id : ''}
                                nome={usuarioSelecionado?.nome || ''}
                                email={usuarioSelecionado?.email || ''}
                                senha={usuarioSelecionado?.senha || ''}
                                imagem={usuarioSelecionado?.imagem || ''}
                                tipo={usuarioSelecionado?.tipo || ''}
                                nucleos={usuarioSelecionado?.nucleos || undefined}
                                status={usuarioSelecionado?.status || 1}
                                onSubmit={handleSalvarUsuario}
                                onClose={() => setModalEdicao(false)}/>
        </div>
      )}

    </div>
  );
}