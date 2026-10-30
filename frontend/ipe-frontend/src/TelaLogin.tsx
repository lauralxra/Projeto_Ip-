import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

import {Imagens} from './config/assets';

export default function TelaLogin() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Estados para tratamento da autenticaÃ§Ã£o
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);
    setCarregando(true);

    try {
      // 1. Faz a requisiÃ§Ã£o de login para a API em NestJS
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: senha, // Envia 'password' de acordo com o DTO do backend
        }),
      });

      const data = await response.json();

      // 2. Se o backend retornar erro (400, 401 ou 404 - UsuÃ¡rio nÃ£o encontrado)
      if (!response.ok) {
        throw new Error(
          data.message ||
            'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.',
        );
      }

      // 3. Salva o token JWT e dados do usuÃ¡rio retornado pelo banco
      if (!data.accessToken) {
        throw new Error('O servidor não retornou o token de autenticação.');
      }

      localStorage.setItem('access_token', data.accessToken);

      if (data.user?.perfil) {
        localStorage.setItem('user_role', data.user.perfil);
      }

      // Redireciona somente após receber o token
      navigate('/dashboard');
    } catch (err: any) {
      // Exibe a mensagem de erro no card e impede o acesso
      setMensagemErro(
        err.message || 'Erro ao conectar ao servidor de autenticaÃ§Ã£o.',
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#d38caf] via-[#b66692] to-[#8d3d6e] flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[580px]">
        {/* ApresentaÃ§Ã£o */}
        <div className="lg:col-span-6 text-white space-y-6 px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight font-semibold tracking-tight">
            Indicadores Institucionais <br className="hidden sm:inline" />
            em um sÃ³ lugar
          </h1>
          <p className="text-white/90 text-sm md:text-base leading-relaxed max-w-lg font-light">
            Centralize metas, resultados e sÃ©ries histÃ³ricas dos nÃºcleos de
            InovaÃ§Ã£o, Parcerias, Empreendedorismo e InternacionalizaÃ§Ã£o, com
            dashboards, filtros cruzados e rastreabilidade.
          </p>
          <div className="pt-12 sm:pt-24 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-white/80 font-medium">
            <span>Instituto IPÃŠ</span> â€¢ <span>UFRPE</span> â€¢{' '}
            <span>Termos</span> â€¢ <span>Contate-nos</span>
          </div>
        </div>

        {/* Card de Login */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="bg-white rounded-[32px] p-8 sm:p-10 md:p-12 shadow-2xl w-full max-w-md border border-white/20">
            <div className="flex justify-start mb-4">
              <div className="w-12 h-12 rounded-full bg-[#fce8f3] flex items-center justify-center text-xl">
                <img alt="" className="relative h-[135.8%] left-0 max-w-none top-[-0.07%] w-[135.8%]" src={Imagens.LogoIPE}/>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 tracking-tight">
              Bem-vindo(a) de Volta!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
              Insira suas informaÃ§Ãµes para logar na plataforma IPÃŠ - Indicadores
            </p>

            {/* Alerta de erro de autenticaÃ§Ã£o */}
            {mensagemErro && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3.5 mb-4 leading-relaxed font-medium">
                {mensagemErro}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite seu email..."
                  required
                  disabled={carregando}
                  className="w-full px-4 py-3 bg-[#eef1f5] border border-transparent rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-[#9d3878] transition-all disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha..."
                    required
                    disabled={carregando}
                    className="w-full px-4 py-3 bg-[#eef1f5] border border-transparent rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-[#9d3878] transition-all pr-10 disabled:opacity-60"
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

              <div className="flex justify-between items-center text-xs pt-1">
                <a
                  href="#esqueci-senha"
                  className="text-slate-500 hover:text-[#9d3878] font-medium transition-colors"
                >
                  Esqueci minha senha
                </a>
                <Link
                  to="/cadastro"
                  className="text-[#9d3878] font-semibold hover:underline"
                >
                  Criar conta
                </Link>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full py-3.5 px-4 bg-[#9d3878] hover:bg-[#832b62] text-white font-medium rounded-full text-sm shadow-md transition-all cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {carregando ? 'Autenticando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

