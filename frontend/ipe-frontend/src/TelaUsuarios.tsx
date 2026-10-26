import { useState } from 'react';
import { Imagens, Svg } from './config/assets';
import { NavBar } from "./NavBar";
import { User } from './UserBar';

import { type Nucleo } from "./dados/nucleos";
import { type Usuario, TipoDeConta } from "./dados/usuarios";
import { UsuariosCadastrados } from "./dados/usuarios";
import { BtnCriar } from "./BtnCriar";
import { TelaUsuarioUserPopup } from './TelaUsuarioUserPopup';

type LinhaUsuarioCadastradoEditarBtnProps = {
  usuarioEmSi: Usuario
  editFunction: (user: Usuario) => void;
  deleteFunction: (user: Usuario) => void;
  className?: string;
  property1?: "Default" | "Clicado";
};

const svgPaths = Svg;

function LinhaUsuarioCadastradoEditarBtn({ usuarioEmSi, editFunction, deleteFunction, className }: LinhaUsuarioCadastradoEditarBtnProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative" 
        onMouseLeave={() => setIsOpen(false)}>
          
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={className || "cursor-pointer min-h-[40px] min-w-[25px] relative"} 
        data-name="Property 1=Default"
      >
        <div className="flex flex-row items-center justify-center min-h-[inherit] min-w-[inherit] overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex items-center justify-center min-h-[inherit] min-w-[inherit] relative size-full">
            <div className="h-[23px] relative shrink-0 w-[7px]" data-name="Vector">
              <svg className="absolute block inset-0 size-full" fill="none" height="23" preserveAspectRatio="none" viewBox="0 0 7 23" width="7">
                <path d={svgPaths.p2842b500} fill="black" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute bg-white content-stretch flex flex-col gap-[10px] items-center justify-center max-w-[130px] min-w-[130px] overflow-clip px-[10px] py-[8px] right-0 rounded-[10px] shadow-[0px_4px_8px_0px_rgba(0,0,0,0.25)] top-0 z-50" data-name="Menuzinho">
          <button 
            onClick={() => {
              editFunction(usuarioEmSi)
              setIsOpen(false);
            }} 
            className="w-full text-center cursor-pointer hover:bg-slate-100 py-1 rounded"
          >
            <p className="font-semibold text-[12px] text-[black]">Editar</p>
          </button>
          <button 
            onClick={() => {
              deleteFunction(usuarioEmSi)
              setIsOpen(false);
            }} 
            className="w-full text-center cursor-pointer hover:bg-slate-100 py-1 rounded"
          >
            <p className="font-semibold text-[12px] text-[red]">Excluir</p>
          </button>
        </div>
      )}
    </div>
  );
}

function LabelTxt( {txt, widt}: {txt:string, widt?:string}) {
  return (
    <div className={"content-stretch flex flex-[1_0_0] h-full items-center justify-start overflow-clip px-[15px] relative max-w-" + (widt ? "["+widt+"]" : "px")}>
      <div className="[word-break:break-word] flex flex-col font-['Google_Sans_Flex:SemiBold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[15px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0' }}>
        <p className="leading-[normal]">{txt}</p>
      </div>
    </div>
  );
}


function Labels() {
  return (
    <div className="bg-[#3b142f] drop-shadow-[0px_4px_2px_rgba(0,0,0,0.1)] flex h-[48px] items-center justify-between px-[20px] py-[8px] relative rounded-t-[24px] w-full" data-name="Labels">
      <LabelTxt txt="Id" widt='70px'/>
      <LabelTxt txt="Usuário" />
      <LabelTxt txt="Tipo de Conta" />
      <LabelTxt txt="Núcleo associado" />
      <LabelTxt txt="Status" />

      <div className="content-stretch flex h-full items-start max-w-[20px] min-w-[20px] px-[5px] relative shrink-0 w-[20px]" data-name="Extras" />
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

function LinhaUsuarioCadastrado({ usuario, editFunction, deleteFunction }: LinhaProps) {
    return (
        <div className="bg-[#f2eff4] rounded-xl px-[20px] py-[10px] flex items-center justify-between gap-[15px] shadow-xs hover:shadow-md transition-shadow w-full" data-name="linhaUsuarioCadastrado">
            {/* id */}
            <div className="flex flex-row items-center w-auto">
                <div className="content-stretch flex h-full items-center max-w-[80px] overflow-clip px-[15px] relative shrink-0 w-[100px]">
                    <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[14px] text-black whitespace-nowrap">
                        {usuario.id}
                    </p>
                </div>
            </div>

            {/* Username */}
            <div className="flex flex-[1_0_0] flex-row items-center self-stretch min-w-[230px] max-w-[230px]">
                <div className="content-stretch flex flex-[1_0_0] gap-[15px] h-full items-center min-w-px px-[15px] relative">
                    <div className="content-stretch flex h-[35px] items-center min-h-[35px] min-w-[35px] relative shrink-0 w-[35px]" data-name="pfp">
                        <div className="flex flex-[1_0_0] h-full items-center justify-center min-w-px relative">
                            <div className="relative rounded-[100px] size-full">
                                <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[100px] size-full"
                                src={usuario.imagem ? ("/src/assets/"+usuario.imagem) : Imagens.DefaultPFP} />
                            </div>
                        </div>
                    </div>

                    <div className="content-stretch flex flex-col items-start justify-start w-full relative shrink-0 py-1">
                        <p className="font-['Inter:Regular',sans-serif] font-normal leading-tight text-[14px] text-black whitespace-normal break-words w-full">
                            {usuario.nome}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tipo */}
            <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
                <div className="content-stretch flex flex-[1_0_0] h-full items-center min-w-px px-[15px] relative">
                    <div className="bg-[#ffdfbf] content-stretch flex h-[27px] items-center max-h-[27px] min-h-[27px] px-[12px] py-[6px] relative rounded-[100px] shrink-0">
                        <div className="bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-transparent font-semibold text-[12px] text-black text-center">
                            {usuario.tipo}
                        </div>
                    </div>
                </div>
            </div>

            {/* Nucleo */}
            <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
                <div className="content-stretch flex flex-[1_0_0] h-full items-center min-w-px px-[15px] relative">
                    <div className="bg-[rgba(102,70,102,0.25)] content-stretch flex h-[27px] items-center px-[12px] py-[6px] relative rounded-[100px] shrink-0">
                        <div className="bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-transparent font-semibold text-[12px] text-black text-center">
                            {
                              usuario.nucleos.length > 0 ?
                                " "+
                                usuario.nucleos.map((opt) => (
                                    opt.sigla + ""
                                )) 
                                :
                                "Não aplicavel"
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Status */}
            <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
                <div className="content-stretch flex flex-[1_0_0] h-full items-center min-w-px px-[15px] relative">
                    <div className="bg-[#d5e4d1] content-stretch flex h-[27px] items-center px-[12px] py-[6px] relative rounded-[100px] shrink-0">
                        <div className="bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-transparent font-semibold text-[12px] text-black text-center">
                          {usuario.status == 1 ? 'Ativo' : 'Inativo'}
                        </div>
                    </div>
                </div>
            </div>

            <LinhaUsuarioCadastradoEditarBtn usuarioEmSi={usuario} editFunction={editFunction} deleteFunction={deleteFunction} className="cursor-pointer min-h-[30px] min-w-[20px] relative shrink-0" />
        </div>
    );
}

export default function TelaUsuarios() {
    const [usuarios, setUsuarios] = useState<Usuario[]>(UsuariosCadastrados);
    const [usuarioSelecionado, setUserSelecionado] = useState<Usuario>();

    const [formNome, setFormNome] = useState('');
    const [formMail, setFormMail] = useState('');
    const [formSenha, setFormSenha] = useState('');
    const [formImagem, setformImagem] = useState('');
    const [formTipo, setFormTipo] = useState('');
    const [formNucleos, setFormNucleos] = useState<Nucleo[]>();
    const [formStatus, setFormStatus] = useState(1);

    const handleUpdateTipo = (id: string, novoTipo: TipoDeConta) => {
        setUsuarios(usuarios.map(u => u.id === id ? { ...u, tipo: novoTipo } : u));
    };

    const handleUpdateStatus = (id: string, novoStatus: number) => {
        setUsuarios(usuarios.map(u => u.id === id ? { ...u, status: novoStatus } : u));
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
    
    const handleSalvarUsuario = (dadosUsuario: Usuario) => {
        const existe = usuarios.some(u => u.id === dadosUsuario.id);

        if (existe) {
            setUsuarios(usuarios.map(u => u.id === dadosUsuario.id ? dadosUsuario : u));
            setModalEdicao(false);
        } else {
            setUsuarios([...usuarios, dadosUsuario]);
            setModalCriacao(false);
        }
        setUserSelecionado(undefined);
    };

    const [modalDeletando, setModalDelete] = useState(false);
    const abrirDeletarModal = (usuario: Usuario) => {
        setUserSelecionado(usuario);
        setModalDelete(true);
    }

    const deletarUsuario = () => {
        if (!usuarioSelecionado) return;
        setUsuarios(usuarios.filter(n => n.id !== usuarioSelecionado.id));
        setModalDelete(false);
    };

    return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
        <NavBar />
    
        {/*================ CONTEUDO PRINCIPAL =================*/}
        <main className="flex-1 px-6 h-full overflow-y-auto pt-[60px]">
            <div className="content-stretch flex flex-col gap-[30px] h-full items-center w-full pt-[30px] px-4" data-name="Conteudo">
                
                {/* Up */}
                <div className="content-stretch flex items-center justify-between px-[20px] relative shrink-0 w-full" data-name="Up">
                    <div className="flex items-center justify-center px-[20px] w-full" data-name="Titulo">
                        <p className="flex-1 font-semibold text-[#3b142f] text-[32px]">
                            Usuários Cadastrados
                        </p>
                    </div>

                    <BtnCriar txt="Cadastrar usuário" acao={AbrirTelaCriacao}/>
                </div>

                {/* Lista */}
                <div className="content-stretch flex flex-col gap-[8px] items-center justify-center px-[10px] py-[10px] relative shrink-0 w-full" data-name="Lista">
                    <Labels />

                    {/* Usuarios */}
                    <div className="content-stretch flex flex-col gap-[12px] isolate items-center relative shrink-0 w-full" data-name="Usuarios">
                        
                        {usuarios.map((usuario) => {
                            return(
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
        </main>

        {/* ==================== BARRA DO USUÁRIO ========================== */}
        <div className="absolute h-[60px] right-0 top-0 w-auto" data-name="userbar">
            <div className="flex flex-row justify-end max-w-[inherit] min-w-[inherit] size-full">
                <div className="content-stretch flex items-start justify-end max-w-[inherit] min-w-[inherit] relative size-full">
                <User />
                </div>
            </div>
        </div>

        { /* ==================== TELAS POPUP ======================== */}
        { /* cadastro */}
        {modalCriacao && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <TelaUsuarioUserPopup header='Criando usuário'
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
                                  onClose={() => setModalCriacao(false)}/>
          </div>
        )}

        {/* edicao */}
        {modalEdicao && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <TelaUsuarioUserPopup header='Editando usuário'
                                    id={usuarioSelecionado? usuarioSelecionado.id : ''}
                                    adm
                                    nome={formNome}
                                    email={formMail}
                                    senha={formSenha}
                                    imagem={formImagem}
                                    tipo={formTipo}
                                    nucleos={formNucleos ? formNucleos : undefined}
                                    status={formStatus}
                                    onSubmit={handleSalvarUsuario}
                                    onClose={() => setModalEdicao(false)}/>
            </div>
        )}

        {/* deletamento */}
        {modalDeletando && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Atenção!</h2>
                <p className="text-sm text-slate-600 mb-1">
                Tem certeza que deseja <span className="font-bold text-slate-800">{"remover " + usuarioSelecionado?.nome}</span> permanentemente do sistema?
                </p>
                <p className="text-xs text-slate-500 mb-6">
                Esta ação <span className="font-bold text-slate-800">não pode ser desfeita</span>.
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