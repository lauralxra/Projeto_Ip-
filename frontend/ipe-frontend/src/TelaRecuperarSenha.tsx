import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { apiFetch, ErroApi, mensagemDeErro } from './api/cliente';
import { encerrarSessaoLocal } from './routes/sessao';

// UC02: recuperação de senha em três passos (e-mail → código → nova senha).
// Rotas públicas: POST /auth/recovery/{request,validate,resend,reset}
type Etapa = 'email' | 'codigo' | 'senha' | 'concluido';

// O backend só gera um código novo a cada 60 s por conta
const ESPERA_REENVIO_S = 60;
const REGEX_EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const estiloCampo =
  'w-full px-4 py-3 bg-[#eef1f5] border border-transparent rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-[#9d3878] transition-all';
const estiloCampoErro =
  'bg-[#f8d7da]/25 border-[#7a1f2b] ring-2 ring-[#7a1f2b]/25 focus:border-[#7a1f2b]';
const estiloBotao =
  'w-full py-3.5 px-4 bg-[#9d3878] hover:bg-[#832b62] text-white font-medium rounded-full text-sm shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';

const TEXTOS: Record<Exclude<Etapa, 'concluido'>, string> = {
  email:
    'Não se preocupe! Informe seu e-mail cadastrado na plataforma e enviaremos um código para redefinir sua senha.',
  codigo:
    'Enviamos um código de 6 dígitos válido por 15 minutos para o seu e-mail cadastrado. Confira também a caixa de spam.',
  senha:
    'Crie a nova senha: mínimo de 8 caracteres, sem ser só números nem uma senha comum.',
};

export default function TelaRecuperarSenha() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState<Etapa>('email');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [esperaReenvio, setEsperaReenvio] = useState(0);

  // Contagem regressiva do botão "Reenviar código"
  useEffect(() => {
    if (esperaReenvio <= 0) return;
    const timer = setTimeout(() => setEsperaReenvio((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [esperaReenvio]);

  const executar = async (acao: () => Promise<void>) => {
    setEnviando(true);
    setErro(null);
    setAviso(null);
    try {
      await acao();
    } catch (e) {
      setErro(mensagemDeErro(e));
      // Código gastou as 5 tentativas: só um código novo resolve. O outro 429
      // (limite por IP) só pede para esperar, sem apagar o que foi digitado.
      if (
        e instanceof ErroApi &&
        e.status === 429 &&
        e.message.includes('Solicite um novo código') &&
        etapa !== 'email'
      ) {
        setCodigo('');
        setEtapa('codigo');
      }
    } finally {
      setEnviando(false);
    }
  };

  const enviarEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const emailNormalizado = email.trim().toLowerCase();

    if (!REGEX_EMAIL_VALIDO.test(emailNormalizado)) {
      setErro('O e-mail informado não é válido.');
      return;
    }

    setEmail(emailNormalizado);
    void executar(async () => {
      await apiFetch('/auth/recovery/request', {
        method: 'POST',
        body: JSON.stringify({ email: emailNormalizado }),
      });
      setEtapa('codigo');
      setEsperaReenvio(ESPERA_REENVIO_S);
    });
  };

  const reenviarCodigo = () => {
    void executar(async () => {
      await apiFetch('/auth/recovery/resend', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setCodigo('');
      setEsperaReenvio(ESPERA_REENVIO_S);
      setAviso('Um novo código foi enviado para o seu e-mail.');
    });
  };

  const validarCodigo = (e: React.FormEvent) => {
    e.preventDefault();
    void executar(async () => {
      await apiFetch('/auth/recovery/validate', {
        method: 'POST',
        body: JSON.stringify({ email, codigo }),
      });
      setEtapa('senha');
    });
  };

  const redefinirSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmacaoSenha) {
      setErro('A nova senha e a confirmação devem ser iguais.');
      return;
    }
    void executar(async () => {
      await apiFetch('/auth/recovery/reset', {
        method: 'POST',
        body: JSON.stringify({ email, codigo, novaSenha, confirmacaoSenha }),
      });
      // As sessões antigas foram encerradas no backend: descarta a sessão local
      encerrarSessaoLocal();
      setEtapa('concluido');
    });
  };

  const campoSenha = (
    rotulo: string,
    valor: string,
    aoMudar: (v: string) => void,
    id: string,
  ) => (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-slate-700 mb-1.5"
      >
        {rotulo}
      </label>
      <div className="relative">
        <input
          id={id}
          type={mostrarSenha ? 'text' : 'password'}
          value={valor}
          onChange={(e) => {
            if (erro) setErro(null);
            aoMudar(e.target.value);
          }}
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          aria-invalid={Boolean(erro)}
          className={`${estiloCampo} pr-11 ${erro ? estiloCampoErro : ''}`}
        />
        <button
          type="button"
          onClick={() => setMostrarSenha((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#9d3878] cursor-pointer"
          aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#d38caf] via-[#b66692] to-[#8d3d6e] flex items-center justify-center p-6">
      <div className="bg-white rounded-[32px] p-8 sm:p-10 md:p-12 shadow-2xl w-full max-w-md border border-white/20">
        {/* Ícone */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#fce8f3] flex items-center justify-center">
            {etapa === 'concluido' ? (
              <CheckCircle2
                size={30}
                className="text-[#9d3878]"
                strokeWidth={1.8}
              />
            ) : (
              <LockKeyhole
                size={30}
                className="text-[#9d3878]"
                strokeWidth={1.8}
              />
            )}
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 tracking-tight">
          {etapa === 'concluido' ? 'Senha redefinida' : 'Recuperar senha'}
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
          {etapa === 'concluido'
            ? 'Sua senha foi alterada e as sessões abertas foram encerradas. Entre novamente com a nova senha.'
            : TEXTOS[etapa]}
        </p>

        {erro && (
          <p
            role="alert"
            className="mb-4 px-3 py-2.5 rounded-xl text-xs font-medium bg-[#f8d7da] text-[#7a1f2b]"
          >
            {erro}
          </p>
        )}
        {aviso && (
          <p
            role="status"
            className="mb-4 px-3 py-2.5 rounded-xl text-xs font-medium bg-[#f2eff4] text-[#3b142f]"
          >
            {aviso}
          </p>
        )}

        {etapa === 'email' && (
          <form onSubmit={enviarEmail} className="space-y-5">
            <div>
              <label
                htmlFor="recuperar-email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                E-mail
              </label>
              <input
                id="recuperar-email"
                type="email"
                value={email}
                onChange={(e) => {
                  if (erro) setErro(null);
                  setEmail(e.target.value);
                }}
                placeholder="Digite seu e-mail..."
                required
                maxLength={150}
                autoComplete="email"
                aria-invalid={Boolean(erro)}
                className={`${estiloCampo} ${erro ? estiloCampoErro : ''}`}
              />
            </div>
            <button type="submit" disabled={enviando} className={estiloBotao}>
              {enviando ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        )}

        {etapa === 'codigo' && (
          <form onSubmit={validarCodigo} className="space-y-5">
            <div>
              <label
                htmlFor="recuperar-codigo"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Código enviado para {email}
              </label>
              <input
                id="recuperar-codigo"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={codigo}
                onChange={(e) => {
                  if (erro) setErro(null);
                  setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6));
                }}
                placeholder="000000"
                required
                pattern="\d{6}"
                aria-invalid={Boolean(erro)}
                className={`${estiloCampo} tracking-[0.5em] text-center font-semibold ${
                  erro ? estiloCampoErro : ''
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={enviando || codigo.length !== 6}
              className={estiloBotao}
            >
              {enviando ? 'Verificando...' : 'Validar código'}
            </button>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setEtapa('email');
                  setCodigo('');
                  setErro(null);
                  setAviso(null);
                }}
                className="text-slate-500 hover:text-[#9d3878] font-medium cursor-pointer"
              >
                Trocar e-mail
              </button>
              <button
                type="button"
                onClick={reenviarCodigo}
                disabled={enviando || esperaReenvio > 0}
                className="text-[#9d3878] hover:text-[#832b62] font-semibold cursor-pointer disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {esperaReenvio > 0
                  ? `Reenviar código em ${esperaReenvio}s`
                  : 'Reenviar código'}
              </button>
            </div>
          </form>
        )}

        {etapa === 'senha' && (
          <form onSubmit={redefinirSenha} className="space-y-5">
            {campoSenha('Nova senha', novaSenha, setNovaSenha, 'nova-senha')}
            {campoSenha(
              'Confirme a nova senha',
              confirmacaoSenha,
              setConfirmacaoSenha,
              'confirmacao-senha',
            )}
            <button type="submit" disabled={enviando} className={estiloBotao}>
              {enviando ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </form>
        )}

        {etapa === 'concluido' && (
          <button
            type="button"
            onClick={() => void navigate('/login')}
            className={estiloBotao}
          >
            Ir para o login
          </button>
        )}

        {etapa !== 'concluido' && (
          <div className="text-center mt-4">
            <Link
              to="/login"
              className="text-xs text-slate-500 hover:text-[#9d3878] font-medium transition-colors"
            >
              Voltar para o login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
