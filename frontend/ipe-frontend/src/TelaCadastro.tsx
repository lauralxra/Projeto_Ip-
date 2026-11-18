import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from './config/api';

export default function TelaCadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);

    if (senha !== confirmarSenha) {
      setMensagemErro('As senhas não coincidem.');
      return;
    }

    setCarregando(true);
    try {
      // RF17: a conta nasce inativa e sem perfil; a administração libera o acesso
      // e associa os núcleos depois (RF18)
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome, email, password: senha }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const mensagem = Array.isArray(data.message)
          ? data.message.join(' ')
          : data.message;
        throw new Error(mensagem || 'Não foi possível concluir o cadastro.');
      }

      setMensagemSucesso(
        data.message ||
          'Cadastro realizado. Aguarde a liberação de acesso pela administração.',
      );
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: unknown) {
      setMensagemErro(
        err instanceof Error
          ? err.message
          : 'Erro ao conectar ao servidor de cadastro.',
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#d38caf] via-[#b66692] to-[#8d3d6e] flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[580px]">
        {/* Apresentação */}
        <div className="lg:col-span-6 text-white space-y-6 px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight font-semibold tracking-tight">
            Crie sua conta na plataforma
          </h1>
          <p className="text-white/90 text-sm md:text-base leading-relaxed max-w-lg font-light">
            Cadastre-se para gerenciar e acompanhar metas, resultados e séries
            históricas do seu núcleo no Instituto IPÊ.
          </p>
          <div className="pt-8 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-white/80 font-medium">
            <span>Instituto IPÊ</span> • <span>UFRPE</span> •{' '}
            <span>Termos</span> • <span>Contate-nos</span>
          </div>
        </div>

        {/* Card de Cadastro */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="bg-white rounded-[32px] p-8 sm:p-10 shadow-2xl w-full max-w-md border border-white/20">
            <div className="flex justify-start mb-3">
              <div className="w-12 h-12 rounded-full bg-[#fce8f3] flex items-center justify-center text-xl">
                🌸
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 tracking-tight">
              Criar Conta
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
              Preencha os campos abaixo para solicitar seu acesso
            </p>

            {mensagemErro && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3.5 mb-4 leading-relaxed font-medium"
              >
                {mensagemErro}
              </div>
            )}
            {mensagemSucesso && (
              <div
                role="status"
                className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl p-3.5 mb-4 leading-relaxed font-medium"
              >
                {mensagemSucesso}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Digite seu nome..."
                  required
                  className="w-full px-4 py-2.5 bg-[#eef1f5] border border-transparent rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-[#9d3878] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Institucional
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@ufrpe.br"
                  required
                  className="w-full px-4 py-2.5 bg-[#eef1f5] border border-transparent rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-[#9d3878] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha..."
                    required
                    className="w-full px-4 py-2.5 bg-[#eef1f5] border border-transparent rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-[#9d3878] transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmar Senha
                </label>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Confirme sua senha..."
                  required
                  className="w-full px-4 py-2.5 bg-[#eef1f5] border border-transparent rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-[#9d3878] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full py-3 px-4 bg-[#9d3878] hover:bg-[#832b62] text-white font-medium rounded-full text-sm shadow-md transition-all cursor-pointer mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {carregando ? 'Cadastrando...' : 'Cadastrar'}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">
                  Já tem uma conta?{' '}
                  <Link
                    to="/login"
                    className="text-[#9d3878] font-semibold hover:underline"
                  >
                    Faça login
                  </Link>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
