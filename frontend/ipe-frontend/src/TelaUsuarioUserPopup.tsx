import { useState } from "react";
import { Imagens, Svg } from "./config/assets";
import { NucleosCadastrados, type Nucleo } from "./dados/nucleos";
import type { TipoDeConta, Usuario } from "./dados/usuarios";

interface BtnUserStatusProps {
  value: number;
  onChange: (val: number) => void;
}

function BtnUserStatus({ value, onChange }: BtnUserStatusProps) {
  return (
    <div className="bg-[#d5e4d1] cursor-pointer h-[27px] min-w-[120px] relative rounded-[100px] flex items-center px-1">
      <select 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-transparent cursor-pointer border-none outline-none h-full w-full font-['Google_Sans_Flex:Bold',sans-serif] font-bold text-xs text-center"
      >
        <option value={1}>Ativo</option>
        <option value={0}>Inativo</option>
      </select>
    </div>
  );
}

interface BtnUserNucleoProps {
  selectedNucleos: Nucleo[];
  onChange: (nucleos: Nucleo[]) => void;
}

function BtnUserNucleo({ selectedNucleos, onChange }: BtnUserNucleoProps) {
  // Função para remover um núcleo individualmente ao clicar no "X"
  const removerNucleo = (idParaRemover: string) => {
    onChange(selectedNucleos.filter(n => n.id !== idParaRemover));
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-[300px]">
      {/* Select normal ou múltiplo para escolher */}
      <select 
        onChange={(e) => {
          const idSelecionado = e.target.value;
          if (!idSelecionado) return;
          
          // Verifica se já não está adicionado para evitar duplicadas
          const nucleoEncontrado = NucleosCadastrados.find(n => n.id === idSelecionado);
          if (nucleoEncontrado && !selectedNucleos.some(n => n.id === idSelecionado)) {
            onChange([...selectedNucleos, nucleoEncontrado]);
          }
          e.target.value = ""; // Reseta o select
        }}
        className="bg-[#d8d0d8] h-[40px] px-3 rounded-xl font-bold text-xs outline-none cursor-pointer text-black"
        defaultValue=""
      >
        <option value="" disabled>Selecione um núcleo...</option>
        {NucleosCadastrados.map((opt) => (
          <option key={opt.id} value={opt.id}>{opt.nome + " ("+opt.sigla+")"}</option>
        ))}
      </select>

      {/* Área onde aparecem os núcleos já selecionados em formato de pílulas visíveis */}
      <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-slate-100 rounded-xl border border-slate-200">
        {selectedNucleos.length > 0 ? (
          selectedNucleos.map((nucleo) => (
            <span 
              key={nucleo.id} 
              className="inline-flex items-center gap-1 bg-[#664666] text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-xs"
            >
              {nucleo.sigla}
              <button 
                type="button" 
                onClick={() => removerNucleo(nucleo.id)}
                className="hover:text-red-300 font-bold ml-1 cursor-pointer"
                title="Remover"
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="text-slate-400 text-xs italic self-center">Nenhum núcleo associado</span>
        )}
      </div>
    </div>
  );
}

interface BtnUserTipoProps {
  value: string;
  onChange: (val: string) => void;
}

function BtnUserTipo({ value, onChange }: BtnUserTipoProps) {
  return (
    <div className="bg-[#ffdfbf] cursor-pointer h-[27px] max-h-[27px] min-h-[27px] min-w-[72px] relative rounded-[100px] flex items-center px-1">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent cursor-pointer border-none outline-none h-full w-full font-['Google_Sans_Flex:Bold',sans-serif] font-bold text-xs text-center"
      >
        <option value="ADM">ADM</option>
        <option value="DN">DN</option>
        <option value="EC">EC</option>
        <option value="EG">EG</option>
      </select>
    </div>
  );
}

type userItems = {
    adm?: boolean;
    header: string;
    id: string;
    nome: string;
    email: string;
    senha: string;
    imagem?: string;
    tipo: string;
    nucleos?: Nucleo[];
    status: number;
    onSubmit: (usuario:Usuario) => void;
    onClose: () => void;
}

export function TelaUsuarioUserPopup({ adm, header, id, nome, email, senha, imagem, tipo, nucleos, status, onSubmit, onClose }: userItems) {
    const [formNome, setFormNome] = useState(nome || '');
    const [formMail, setFormMail] = useState(email || '');
    const [formSenha, setFormSenha] = useState(senha || '');
    const [formTipo, setFormTipo] = useState<string>(tipo || 'DN');
    const [formNucleos, setFormNucleos] = useState<Nucleo[]>(nucleos || []);
    const [formStatus, setFormStatus] = useState<number>(status ?? 1);
    
    const [imagemPreview, setImagemPreview] = useState<string | null>(
        imagem ? "/src/assets/" + imagem : null
    );
    const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);

    const handleMudarImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
        const arquivo = e.target.files?.[0];
        if (arquivo) {
            setArquivoImagem(arquivo);
            const urlTemporaria = URL.createObjectURL(arquivo);
            setImagemPreview(urlTemporaria);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        onSubmit({
            id: id || Date.now().toString(),
            nome: formNome,
            email: formMail,
            senha: formSenha,
            tipo: formTipo as TipoDeConta,
            nucleos: formNucleos,
            status: formStatus,
            imagem: arquivoImagem ? arquivoImagem.name : imagem
        });
    };
    
    return (
    <form onSubmit={handleFormSubmit} className="bg-white border border-[#a13680] border-solid content-stretch flex flex-col gap-[82px] items-center overflow-clip px-[40px] py-[20px] relative rounded-[45px]" data-name="JanelaEdicaoUser">
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Up">
            <div className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['Google_Sans_Flex:Bold',sans-serif] font-bold h-full justify-center leading-[0] min-w-px not-italic relative text-[36px] text-black" style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}>
                <p className="leading-[normal]">{header}</p>
            </div>
        </div>

        {/* Opcoes */}
        <div className="content-stretch flex flex-col gap-[40px] items-start relative shrink-0 w-full" data-name="Opcoes">
            <div className="content-stretch flex gap-[30px] items-start relative shrink-0 w-full" data-name="Usuario">
                
                {/* Foto */}
                <div className="bg-tranparent content-stretch flex h-[170px] items-start relative rounded-[20px] shrink-0 w-[173px]" data-name="Foto">
                    <div className="size-full relative shrink-0" data-name="Img">
                        <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full"
                            src={imagemPreview || Imagens.DefaultPFP}
                        />
                        
                        {/* BtnAddImg */}
                        <div className="absolute bottom-[-12px] max-h-[56px] max-w-[56px] min-h-[56px] min-w-[56px] right-[-11px] size-[56px] cursor-pointer" data-name="btnAddImg">
                            <svg className="absolute block inset-0 size-full pointer-events-none" fill="none" height="56" preserveAspectRatio="none" viewBox="0 0 56 56" width="56">
                                <g id="btnAddImg">
                                <rect fill="#3B142F" height="56" rx="28" width="56" />
                                <path d={Svg.p2a30fc00} fill="white" id="Vector" />
                                </g>
                            </svg>
                        </div>
                        
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleMudarImagem}
                            className="absolute inset-0 opacity-0 cursor-pointer size-full z-10"
                            title="Alterar foto"
                        />
                    </div>
                </div>

                {/* Nome, email e senha */}
                <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Usuario">
                    
                    <div className="content-stretch flex flex-col gap-[3px] items-start p-px relative shrink-0 w-[648px]" data-name="CampoNome">
                        <label className="[word-break:break-word] font-['Google_Sans_Flex:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[20px] text-black w-full" style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}>
                            Nome
                        </label>
                        <div className="bg-[#d9d9d9] content-stretch flex h-[49px] items-center max-h-[49px] min-h-[49px] px-[10px] py-[5px] relative rounded-[15px] shrink-0 w-full" data-name="Field">
                            <input
                                type="text"
                                placeholder="Insira um nome..."
                                required
                                value={formNome}
                                onChange={(e) => setFormNome(e.target.value)}
                                className="[word-break:break-word] flex flex-[1_0_0] flex-col border-none outline-none font-['Google_Sans_Flex:Light',sans-serif] font-light h-full justify-center leading-[0] min-w-px not-italic relative text-[#747474] text-[16px]"
                                style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}
                            />
                        </div>
                    </div>

                    <div className="content-stretch flex flex-col gap-[3px] items-start p-px relative shrink-0 w-[648px]" data-name="CampoMail">
                        <label className="[word-break:break-word] font-['Google_Sans_Flex:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[20px] text-black w-full" style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}>
                            E-mail
                        </label>
                        <div className="bg-[#d9d9d9] content-stretch flex h-[49px] items-center max-h-[49px] min-h-[49px] px-[10px] py-[5px] relative rounded-[15px] shrink-0 w-full" data-name="Field">
                            <input
                                type="email"
                                placeholder="Insira um nome..."
                                required
                                value={formMail}
                                onChange={(e) => setFormMail(e.target.value)}
                                className="[word-break:break-word] flex flex-[1_0_0] flex-col border-none outline-none font-['Google_Sans_Flex:Light',sans-serif] font-light h-full justify-center leading-[0] min-w-px not-italic relative text-[#747474] text-[16px]"
                                style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}
                            />
                        </div>
                    </div>

                    <div className="content-stretch flex flex-col gap-[3px] items-start p-px relative shrink-0 w-[648px]" data-name="CampoSenha">
                        <label className="[word-break:break-word] font-['Google_Sans_Flex:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[20px] text-black w-full" style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}>
                            Senha
                        </label>
                        <div className="bg-[#d9d9d9] content-stretch flex h-[49px] items-center max-h-[49px] min-h-[49px] px-[10px] py-[5px] relative rounded-[15px] shrink-0 w-full" data-name="Field">
                            <input
                                type="password"
                                placeholder="Insira um nome..."
                                required
                                value={formSenha}
                                onChange={(e) => setFormSenha(e.target.value)}
                                className="[word-break:break-word] flex flex-[1_0_0] flex-col border-none outline-none font-['Google_Sans_Flex:Light',sans-serif] font-light h-full justify-center leading-[0] min-w-px not-italic relative text-[#747474] text-[16px]"
                                style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {
              adm ?
              <div className="content-stretch flex gap-[15px] items-start relative shrink-0 w-full justify-between">
                  <div className="flex flex-col gap-1">
                      <label className="font-bold text-sm">Tipo de conta</label>
                      <BtnUserTipo value={formTipo} onChange={setFormTipo} />
                  </div>
                  <div className="flex flex-col gap-1">
                      <label className="font-bold text-sm">Núcleos pertencentes</label>
                      <BtnUserNucleo selectedNucleos={formNucleos} onChange={setFormNucleos} />
                  </div>
                  <div className="flex flex-col gap-1">
                      <label className="font-bold text-sm">Status</label>
                      <BtnUserStatus value={formStatus} onChange={setFormStatus} />
                  </div>
              </div> : ""
            }
        </div>

        <div className="content-stretch flex gap-[25px] items-center justify-center px-[4px] relative shrink-0 w-full" data-name="Botoes">
            {/* botao cancelar */}
            <button type="button" onClick={onClose} className="border-2 border-[#3b142f] border-solid content-stretch cursor-pointer flex flex-[1_0_0] items-center justify-center min-h-[55px] min-w-px p-[10px] relative rounded-[100px]" data-name="btnCancel">
            <div className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['Google_Sans_Flex:SemiBold',sans-serif] font-semibold justify-center leading-[0] min-w-px not-italic relative text-[#3b142f] text-[24.413px] text-center" style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}>
                <p className="leading-[normal]">Cancelar</p>
            </div>
            </button>
            {/* botao criar */}
            <button type="submit" className="bg-[#3b142f] content-stretch flex flex-[1_0_0] items-center justify-center min-h-[55px] min-w-px p-[10px] relative rounded-[100px] cursor-pointer" data-name="btnCriar">
                <div className="content-stretch flex flex-[1_0_0] gap-[15px] items-center justify-center min-w-px relative">
                    <p className="[word-break:break-word] font-['Google_Sans_Flex:SemiBold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[24.413px] text-white whitespace-nowrap" style={{ fontVariationSettings: '"GRAD" 0, "ROND" 0, "wdth" 100' }}>
                        Salvar
                    </p>
                </div>
            </button>
        </div>
    </form>
  );
}