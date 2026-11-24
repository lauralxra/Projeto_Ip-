import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LockKeyhole, Eye, EyeOff, Check, X } from 'lucide-react';

export default function TelaRedefinirSenha() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState<'erro' | 'sucesso' | ''>('');

  // Requisitos da senha
  const requisitos = {
    tamanho: novaSenha.length >= 8,
    numero: /\d/.test(novaSenha),
    maiuscula: /[A-Z]/.test(novaSenha),
    minuscula: /[a-z]/.test(novaSenha),
    especial: /[^A-Za-z0-9]/.test(novaSenha),
  };

  const senhaValida = Object.values(requisitos).every(Boolean);

  const senhasCoincidem =
    confirmarSenha.length > 0 && novaSenha === confirmarSenha;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!senhaValida) {
      setMensagem('Sua senha não atende a todos os requisitos de segurança.');
      setTipoMensagem('erro');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMensagem('As senhas não coincidem. Verifique os campos.');
      setTipoMensagem('erro');
      return;
    }

    // Integração com o backend será feita posteriormente
    console.log('Token recebido:', token);

    setMensagem('Senha atualizada com sucesso!');
    setTipoMensagem('sucesso');

    setNovaSenha('');
    setConfirmarSenha('');
  };

  // Limpa mensagens quando os campos são alterados
  const limparMensagem = () => {
    setMensagem('');
    setTipoMensagem('');
  };

  // Componente visual dos requisitos da senha
  const Requisito = ({
    atendido,
    texto,
  }: {
    atendido: boolean;
    texto: string;
  }) => (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
        atendido ? 'bg-[#f4e5ef] text-[#9d3878]' : 'bg-[#f1f2f5] text-slate-500'
      }`}
    >
      <span
        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
          atendido ? 'bg-[#9d3878]' : 'bg-slate-400'
        }`}
      >
        {atendido ? (
          <Check size={9} strokeWidth={3} className="text-white" />
        ) : (
          <X size={9} strokeWidth={3} className="text-white" />
        )}
      </span>

      {texto}
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#d38caf] via-[#b66692] to-[#8d3d6e] flex items-center justify-center p-6">
      <div className="bg-white rounded-[32px] p-8 sm:p-10 md:p-12 shadow-2xl w-full max-w-md border border-white/20">
        {/* Ícone de cadeado */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#fce8f3] flex items-center justify-center">
            <LockKeyhole
              size={30}
              className="text-[#9d3878]"
              strokeWidth={1.8}
            />
          </div>
        </div>

        {/* Título e descrição */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 tracking-tight">
            Redefinir senha
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-7 leading-relaxed">
            Crie uma nova senha segura para sua conta e confirme-a para concluir
            a redefinição.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nova senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nova senha
            </label>

            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => {
                  setNovaSenha(e.target.value);
                  limparMensagem();
                }}
                placeholder="Digite sua nova senha..."
                required
                className="w-full px-4 py-3 pr-12 bg-[#eef1f5] border border-transparent rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-[#9d3878] transition-all"
              />

              {/* Mostrar / ocultar senha */}
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#9d3878] transition-colors"
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Requisitos da senha */}
            <div className="mt-3">
              <p className="text-[11px] text-slate-500 mb-2">
                Sua senha deve conter:
              </p>

              <div className="flex flex-wrap gap-2">
                <Requisito
                  atendido={requisitos.tamanho}
                  texto="8+ caracteres"
                />

                <Requisito atendido={requisitos.numero} texto="Número" />

                <Requisito
                  atendido={requisitos.maiuscula}
                  texto="Letra maiúscula"
                />

                <Requisito
                  atendido={requisitos.minuscula}
                  texto="Letra minúscula"
                />
                <Requisito
                  atendido={requisitos.especial}
                  texto="Caractere especial"
                />
              </div>
            </div>
          </div>

          {/* Confirmar senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Confirmar senha
            </label>

            <div className="relative">
              <input
                type={mostrarConfirmacao ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => {
                  setConfirmarSenha(e.target.value);
                  limparMensagem();
                }}
                placeholder="Confirme sua nova senha..."
                required
                className={`w-full px-4 py-3 pr-12 bg-[#eef1f5] border rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white transition-all ${
                  confirmarSenha.length > 0
                    ? senhasCoincidem
                      ? 'border-green-400 focus:border-green-400'
                      : 'border-red-300 focus:border-red-400'
                    : 'border-transparent focus:border-[#9d3878]'
                }`}
              />

              {/* Mostrar / ocultar confirmação */}
              <button
                type="button"
                onClick={() => setMostrarConfirmacao(!mostrarConfirmacao)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#9d3878] transition-colors"
                aria-label={
                  mostrarConfirmacao
                    ? 'Ocultar confirmação da senha'
                    : 'Mostrar confirmação da senha'
                }
              >
                {mostrarConfirmacao ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Feedback de confirmação */}
            {confirmarSenha.length > 0 && (
              <p
                className={`text-[11px] mt-2 ${
                  senhasCoincidem ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {senhasCoincidem
                  ? 'As senhas coincidem!'
                  : 'As senhas ainda não coincidem.'}
              </p>
            )}
          </div>

          {/* Mensagem de erro ou sucesso */}
          {mensagem && (
            <p
              role="status"
              className={`text-xs text-center font-medium ${
                tipoMensagem === 'sucesso' ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {mensagem}
            </p>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={!senhaValida || novaSenha !== confirmarSenha}
            className={`w-full py-3.5 px-4 text-white font-medium rounded-full text-sm shadow-md transition-all ${
              senhaValida && novaSenha === confirmarSenha
                ? 'bg-[#9d3878] hover:bg-[#832b62] cursor-pointer'
                : 'bg-[#c9a5ba] cursor-not-allowed opacity-70'
            }`}
          >
            Redefinir senha
          </button>
        </form>

        {/* Voltar para o login */}
        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-xs text-slate-500 hover:text-[#9d3878] font-medium transition-colors"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
