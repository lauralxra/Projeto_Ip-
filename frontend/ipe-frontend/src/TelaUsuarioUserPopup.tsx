import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Imagens, Svg } from './config/assets';
import { type Nucleo } from './dados/nucleos';
import { UsuarioAtual, type TipoDeConta, type Usuario } from './dados/usuarios';
import { urlDaImagem } from './api/mapeadores';

// Núcleos que o usuário logado enxerga
const nucleosDisponiveis = () => UsuarioAtual.nucleos;

/* =========================
   Status do usuário
========================= */

interface BtnUserStatusProps {
  value: number;
  onChange: (val: number) => void;
}

function BtnUserStatus({ value, onChange }: BtnUserStatusProps) {
  return (
    <div className="flex h-9 w-full items-center rounded-full bg-[#d5e4d1] px-3">
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-full w-full cursor-pointer border-none bg-transparent text-center text-sm font-semibold outline-none"
      >
        <option value={1}>Ativo</option>
        <option value={0}>Inativo</option>
      </select>
    </div>
  );
}

/* =========================
   Núcleos
========================= */

interface BtnUserNucleoProps {
  selectedNucleos: Nucleo[];
  onChange: (nucleos: Nucleo[]) => void;
}

function BtnUserNucleo({ selectedNucleos, onChange }: BtnUserNucleoProps) {
  const removerNucleo = (idParaRemover: string) => {
    onChange(selectedNucleos.filter((n) => n.id !== idParaRemover));
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <select
        onChange={(e) => {
          const idSelecionado = e.target.value;
          if (!idSelecionado) return;

          const nucleoEncontrado = nucleosDisponiveis().find(
            (n) => n.id === idSelecionado,
          );

          if (
            nucleoEncontrado &&
            !selectedNucleos.some((n) => n.id === idSelecionado)
          ) {
            onChange([...selectedNucleos, nucleoEncontrado]);
          }

          e.target.value = '';
        }}
        className="h-10 w-full cursor-pointer rounded-xl bg-[#f3edf3] px-3 text-sm outline-none focus:ring-2 focus:ring-[#a13680]/30"
        defaultValue=""
      >
        <option value="" disabled>
          Selecione um núcleo...
        </option>

        {nucleosDisponiveis().map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.nome + ' (' + opt.sigla + ')'}
          </option>
        ))}
      </select>

      <div className="flex min-h-10 w-full flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2">
        {selectedNucleos.length > 0 ? (
          selectedNucleos.map((nucleo) => (
            <span
              key={nucleo.id}
              className="inline-flex items-center gap-1 rounded-full bg-[#664666] px-2.5 py-1 text-xs font-semibold text-white"
            >
              {nucleo.sigla}

              <button
                type="button"
                onClick={() => removerNucleo(nucleo.id)}
                className="ml-1 cursor-pointer font-bold transition-colors hover:text-red-300"
                title="Remover núcleo"
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="self-center text-xs italic text-slate-400">
            Nenhum núcleo associado
          </span>
        )}
      </div>
    </div>
  );
}

/* =========================
   Tipo de conta
========================= */

interface BtnUserTipoProps {
  value: string;
  onChange: (val: string) => void;
}

function BtnUserTipo({ value, onChange }: BtnUserTipoProps) {
  return (
    <div className="flex h-9 w-full items-center rounded-full bg-[#ffdfbf] px-3">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full w-full cursor-pointer border-none bg-transparent text-center text-sm font-semibold outline-none"
      >
        <option value="ADM">Administrador</option>
        <option value="DN">Diretor de Núcleo</option>
        <option value="EC">Equipe de Comunicação</option>
        <option value="EG">Equipe de Gestão</option>
      </select>
    </div>
  );
}

/* =========================
   Propriedades do formulário
========================= */

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
  onSubmit: (
    usuario: Usuario,
    arquivoImagem: File | null,
  ) => void | Promise<void>;
  onClose: () => void;
};

/* =========================
   Formulário do usuário
========================= */

export function TelaUsuarioUserPopup({
  adm,
  header,
  id,
  nome,
  email,
  senha,
  imagem,
  tipo,
  nucleos,
  status,
  onSubmit,
  onClose,
}: userItems) {
  const [formNome, setFormNome] = useState(nome || '');
  const [formMail, setFormMail] = useState(email || '');
  const [formSenha, setFormSenha] = useState(senha || '');
  const [formTipo, setFormTipo] = useState<string>(tipo || 'DN');
  const [formNucleos, setFormNucleos] = useState<Nucleo[]>(nucleos || []);
  const [formStatus, setFormStatus] = useState<number>(status ?? 1);

  const [imagemPreview, setImagemPreview] = useState<string | null>(
    urlDaImagem(imagem) ?? null,
  );

  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);

  const handleMudarImagem = (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];

    if (arquivo) {
      setArquivoImagem(arquivo);

      const urlTemporaria = URL.createObjectURL(arquivo);
      setImagemPreview(urlTemporaria);
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();

    onSubmit(
      {
        id: id || Date.now().toString(),
        nome: formNome,
        email: formMail,
        senha: formSenha,
        tipo: formTipo as TipoDeConta,
        nucleos: formNucleos,
        status: formStatus,
        imagem: arquivoImagem ? arquivoImagem.name : imagem,
      },
      arquivoImagem,
    );
  };

  const estiloCampo =
    'h-11 w-full min-w-0 rounded-xl bg-[#f1f0f1] px-3 text-sm text-[#664666] outline-none transition-all placeholder:text-[#a49aa4] focus:ring-2 focus:ring-[#a13680]/30';

  const estiloLabel = 'text-sm font-semibold text-[#3b142f]';

  return (
    <form
      onSubmit={handleFormSubmit}
      data-name="JanelaEdicaoUser"
      className="flex max-h-[calc(100dvh-32px)] w-full min-w-0 flex-col gap-5 overflow-x-hidden overflow-y-auto rounded-2xl border border-[#a13680]/50 bg-white p-5 shadow-2xl sm:p-7"
    >
      {/* Cabeçalho */}
      <div className="flex w-full items-center justify-between">
        <h2 className="break-words text-2xl font-bold leading-tight text-[#3b142f] sm:text-[26px]">
          {header}
        </h2>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-xl text-[#664666] transition-colors hover:bg-[#f5edf5]"
        >
          ×
        </button>
      </div>

      {/* Informações */}
      <div className="flex w-full min-w-0 flex-col gap-5">
        <div className="flex w-full min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
          {/* Foto */}
          <div className="flex w-full shrink-0 justify-center sm:w-[120px] sm:pt-1">
            <label
              className="relative block size-[120px] cursor-pointer overflow-visible sm:size-[112px]"
              title="Alterar foto"
            >
              <img
                alt="Foto de perfil"
                className="size-full rounded-xl border border-[#eee] object-cover"
                src={imagemPreview || Imagens.DefaultPFP}
              />

              {/* Botão para alterar imagem */}
              <div className="absolute -bottom-2 -right-2 z-10 flex size-10 items-center justify-center rounded-full bg-[#3b142f] shadow-md transition-transform hover:scale-105">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="block shrink-0"
                >
                  <path d={Svg.p2a30fc00} fill="white" />
                </svg>
              </div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleMudarImagem}
                className="hidden"
              />
            </label>
          </div>

          {/* Campos */}
          <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
            {/* Nome */}
            <div className="flex w-full min-w-0 flex-col gap-1.5">
              <label className={estiloLabel}>Nome</label>

              <input
                type="text"
                placeholder="Insira um nome..."
                required
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                className={estiloCampo}
              />
            </div>

            {/* E-mail */}
            <div className="flex w-full min-w-0 flex-col gap-1.5">
              <label className={estiloLabel}>E-mail</label>

              <input
                type="email"
                placeholder="Insira um e-mail..."
                required
                value={formMail}
                onChange={(e) => setFormMail(e.target.value)}
                className={estiloCampo}
              />
            </div>

            {/* Senha */}
            <div className="flex w-full min-w-0 flex-col gap-1.5">
              <label className={estiloLabel}>Senha</label>

              <input
                type="password"
                placeholder="Insira uma senha..."
                required
                value={formSenha}
                onChange={(e) => setFormSenha(e.target.value)}
                className={estiloCampo}
              />
            </div>
          </div>
        </div>

        {/* Opções administrativas */}
        {adm && (
          <div className="grid w-full min-w-0 grid-cols-1 gap-4 border-t border-[#eee5ee] pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Tipo de conta */}
            <div className="flex min-w-0 flex-col gap-1.5">
              <label className={estiloLabel}>Tipo de conta</label>

              <BtnUserTipo value={formTipo} onChange={setFormTipo} />
            </div>

            {/* Núcleos */}
            <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
              <label className={estiloLabel}>Núcleos pertencentes</label>

              <BtnUserNucleo
                selectedNucleos={formNucleos}
                onChange={setFormNucleos}
              />
            </div>

            {/* Status */}
            <div className="flex min-w-0 flex-col gap-1.5">
              <label className={estiloLabel}>Status</label>

              <BtnUserStatus value={formStatus} onChange={setFormStatus} />
            </div>
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex w-full flex-col-reverse gap-3 border-t border-[#eee5ee] pt-4 sm:flex-row sm:gap-4">
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 flex-1 items-center justify-center rounded-full border-2 border-[#3b142f] px-4 py-2 text-base font-semibold text-[#3b142f] transition-colors hover:bg-[#f8f2f8]"
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#3b142f] px-4 py-2 text-base font-semibold text-white transition-colors hover:bg-[#5a2549]"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
