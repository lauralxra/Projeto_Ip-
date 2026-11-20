import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Imagens, Svg } from './config/assets';
import { type Nucleo } from './dados/nucleos';
import { UsuarioAtual, type TipoDeConta, type Usuario } from './dados/usuarios';
import { urlDaImagem } from './api/mapeadores';

const PERFIS_COM_NUCLEO: string[] = ['DN', 'EG'];

/* =========================
   Status do usuário
========================= */

interface BtnUserStatusProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

function BtnUserStatus({ value, onChange, disabled }: BtnUserStatusProps) {
  return (
    <div
      className={`flex h-10 w-full items-center rounded-xl bg-[#d5e4d1] px-3 ${
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      }`}
    >
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-full w-full border-none bg-transparent text-center text-sm font-semibold text-[#24421e] outline-none ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
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
  nucleosOpcoes: Nucleo[];
  onChange: (nucleos: Nucleo[]) => void;
  disabled?: boolean;
  hasError?: boolean;
}

function BtnUserNucleo({
  selectedNucleos,
  nucleosOpcoes,
  onChange,
  disabled,
  hasError,
}: BtnUserNucleoProps) {
  const removerNucleo = (idParaRemover: string) => {
    if (disabled) return;
    onChange(selectedNucleos.filter((n) => n.id !== idParaRemover));
  };

  if (disabled) {
    return (
      <div className="flex min-h-11 w-full items-center rounded-xl border border-[#832b62]/20 bg-[#f2eff4] px-3.5 py-2.5 text-xs font-medium text-[#3b142f]">
        Acesso global — este tipo de conta não possui vínculo com núcleos
        específicos.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <select
        onChange={(e) => {
          const idSelecionado = e.target.value;
          if (!idSelecionado) return;

          const nucleoEncontrado = nucleosOpcoes.find(
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
        className={`h-10 w-full cursor-pointer rounded-xl bg-[#f3edf3] px-3 text-sm text-[#3b142f] outline-none focus:ring-2 focus:ring-[#a13680]/30 ${
          hasError ? 'ring-2 ring-[#7a1f2b] bg-[#f8d7da]/25' : ''
        }`}
        defaultValue=""
      >
        <option value="" disabled>
          Selecione um núcleo ativo...
        </option>

        {nucleosOpcoes.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.nome + ' (' + opt.sigla + ')'}
          </option>
        ))}
      </select>

      <div
        className={`flex min-h-11 w-full flex-wrap gap-1.5 rounded-xl border p-2 ${
          hasError
            ? 'border-[#7a1f2b]/50 bg-[#f8d7da]/15'
            : 'border-slate-200 bg-slate-50'
        }`}
      >
        {selectedNucleos.length > 0 ? (
          selectedNucleos.map((nucleo) => (
            <span
              key={nucleo.id}
              className="inline-flex items-center gap-1 rounded-full bg-[#3b142f] px-3 py-1 text-xs font-semibold text-white"
            >
              {nucleo.sigla}

              <button
                type="button"
                onClick={() => removerNucleo(nucleo.id)}
                className="ml-1 cursor-pointer font-bold transition-colors hover:text-red-300"
                title="Remover núcleo"
                aria-label={`Remover núcleo ${nucleo.sigla}`}
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="self-center text-xs italic text-slate-400">
            Nenhum núcleo associado (obrigatório ao menos 1 núcleo)
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
  disabled?: boolean;
}

function BtnUserTipo({ value, onChange, disabled }: BtnUserTipoProps) {
  return (
    <div
      className={`flex h-10 w-full items-center rounded-xl bg-[#ffdfbf] px-3 ${
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      }`}
    >
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`h-full w-full border-none bg-transparent text-center text-sm font-semibold text-[#5c3310] outline-none ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
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
  editandoProprioUsuario?: boolean;
  nucleosDisponiveis?: Nucleo[];
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
  editandoProprioUsuario,
  nucleosDisponiveis,
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
  const opcoesNucleos = (
    nucleosDisponiveis && nucleosDisponiveis.length > 0
      ? nucleosDisponiveis
      : UsuarioAtual.nucleos
  ).filter((n) => (n.status ?? 'ATIVO') === 'ATIVO');

  const ehProprioUsuario =
    editandoProprioUsuario ?? (Boolean(id) && id === UsuarioAtual.id);

  const [formNome, setFormNome] = useState(nome || '');
  const [formMail, setFormMail] = useState(email || '');
  const [formSenha, setFormSenha] = useState(senha || '');
  const [formTipo, setFormTipo] = useState<string>(tipo || 'DN');
  const [formNucleos, setFormNucleos] = useState<Nucleo[]>(nucleos || []);
  const [formStatus, setFormStatus] = useState<number>(status ?? 1);
  const [erroNucleos, setErroNucleos] = useState<string | null>(null);

  const [imagemPreview, setImagemPreview] = useState<string | null>(
    urlDaImagem(imagem) ?? null,
  );

  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);

  const perfilExigeNucleo = PERFIS_COM_NUCLEO.includes(formTipo);

  const handleMudarTipo = (novoTipo: string) => {
    if (ehProprioUsuario) return;
    setFormTipo(novoTipo);
    if (!PERFIS_COM_NUCLEO.includes(novoTipo)) {
      setFormNucleos([]);
      setErroNucleos(null);
    }
  };

  const handleMudarNucleos = (novosNucleos: Nucleo[]) => {
    setFormNucleos(novosNucleos);
    if (novosNucleos.length > 0 && erroNucleos) {
      setErroNucleos(null);
    }
  };

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

    const tipoFinal = ehProprioUsuario ? tipo : formTipo;
    const statusFinal = ehProprioUsuario ? status : formStatus;
    const exigeNucleoFinal = PERFIS_COM_NUCLEO.includes(tipoFinal);
    const nucleosFinais = exigeNucleoFinal ? formNucleos : [];

    // UC08 / UC012: exigir núcleo obrigatório para Diretor de Núcleo e Equipe de Gestão
    if (adm && !ehProprioUsuario && exigeNucleoFinal && nucleosFinais.length === 0) {
      setErroNucleos(
        'Selecione ao menos um núcleo para contas de Diretor de Núcleo ou Equipe de Gestão.',
      );
      return;
    }

    setErroNucleos(null);

    onSubmit(
      {
        id: id || Date.now().toString(),
        nome: formNome,
        email: formMail,
        senha: formSenha,
        tipo: tipoFinal as TipoDeConta,
        nucleos: nucleosFinais,
        status: statusFinal,
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
      className="flex max-h-[calc(100dvh-32px)] w-full max-w-2xl min-w-0 flex-col gap-5 overflow-x-hidden overflow-y-auto rounded-3xl border border-[#a13680]/40 bg-white p-5 shadow-2xl sm:p-7"
    >
      {/* Cabeçalho */}
      <div className="flex w-full items-center justify-between gap-3">
        <h2 className="break-words text-2xl font-bold leading-tight text-[#3b142f] sm:text-[26px]">
          {header}
        </h2>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-xl text-[#664666] transition-colors hover:bg-[#f5edf5] cursor-pointer"
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
          <div className="flex w-full min-w-0 flex-col gap-4 border-t border-[#eee5ee] pt-4">
            <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Tipo de conta */}
              <div className="flex min-w-0 flex-col gap-1.5">
                <label className={estiloLabel}>Tipo de conta</label>

                <BtnUserTipo
                  value={formTipo}
                  onChange={handleMudarTipo}
                  disabled={ehProprioUsuario}
                />

                {ehProprioUsuario && (
                  <p className="text-[11px] text-[#832b62]">
                    Você não pode alterar o seu próprio tipo de conta.
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="flex min-w-0 flex-col gap-1.5">
                <label className={estiloLabel}>Status</label>

                <BtnUserStatus
                  value={formStatus}
                  onChange={setFormStatus}
                  disabled={ehProprioUsuario}
                />

                {ehProprioUsuario && (
                  <p className="text-[11px] text-[#832b62]">
                    Você não pode alterar o status da sua própria conta.
                  </p>
                )}
              </div>
            </div>

            {/* Núcleos pertencentes */}
            <div className="flex w-full min-w-0 flex-col gap-1.5">
              <label className={estiloLabel}>
                Núcleos pertencentes{perfilExigeNucleo ? ' *' : ''}
              </label>

              <BtnUserNucleo
                selectedNucleos={formNucleos}
                nucleosOpcoes={opcoesNucleos}
                onChange={handleMudarNucleos}
                disabled={ehProprioUsuario || !perfilExigeNucleo}
                hasError={Boolean(erroNucleos)}
              />

              {erroNucleos && (
                <p
                  role="alert"
                  className="text-xs font-medium text-[#7a1f2b]"
                >
                  {erroNucleos}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex w-full flex-col-reverse gap-3 border-t border-[#eee5ee] pt-4 sm:flex-row sm:gap-4">
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 flex-1 items-center justify-center rounded-full border-2 border-[#3b142f] px-4 py-2 text-base font-semibold text-[#3b142f] transition-colors hover:bg-[#f8f2f8] cursor-pointer"
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#3b142f] px-4 py-2 text-base font-semibold text-white transition-colors hover:bg-[#5a2549] cursor-pointer"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
