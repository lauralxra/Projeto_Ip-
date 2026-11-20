import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';

export default function TelaRedefinirSenha() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState<'erro' | 'sucesso' | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Verifica o tamanho mínimo da senha
    if (novaSenha.length < 6) {
      setMensagem('A senha precisa ter pelo menos 6 caracteres.');
      setTipoMensagem('erro');
      return;
    }

    // Verifica se as senhas coincidem
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

  // Limpa a mensagem quando os campos são alterados
  const limparMensagem = () => {
    setMensagem('');
    setTipoMensagem('');
  };

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
            Crie uma nova senha para sua conta e confirme-a para concluir a
            redefinição.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nova senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nova senha
            </label>

            <input
              type="password"
              value={novaSenha}
              onChange={(e) => {
                setNovaSenha(e.target.value);
                limparMensagem();
              }}
              placeholder="Digite sua nova senha..."
              minLength={6}
              required
              className="w-full px-4 py-3 bg-[#eef1f5] border border-transparent rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-[#9d3878] transition-all"
            />

            <p className="text-xs text-slate-500 mt-2">
              A senha precisa ter pelo menos 6 caracteres.
            </p>
          </div>

          {/* Confirmar senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Confirmar senha
            </label>

            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => {
                setConfirmarSenha(e.target.value);
                limparMensagem();
              }}
              placeholder="Confirme sua nova senha..."
              minLength={6}
              required
              className="w-full px-4 py-3 bg-[#eef1f5] border border-transparent rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-[#9d3878] transition-all"
            />
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
            className="w-full py-3.5 px-4 bg-[#9d3878] hover:bg-[#832b62] text-white font-medium rounded-full text-sm shadow-md transition-all cursor-pointer"
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
