
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';

export default function TelaRecuperarSenha() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Integraremos o envio do e-mail posteriormente.
    console.log('E-mail informado:', email);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#d38caf] via-[#b66692] to-[#8d3d6e] flex items-center justify-center p-6">

      <div className="bg-white rounded-[32px] p-8 sm:p-10 md:p-12 shadow-2xl w-full max-w-md border border-white/20">

        {/* Ícone de cadeado */}
        <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-[#fce8f3] flex items-center justify-center">
            <LockKeyhole size={30} className="text-[#9d3878]" strokeWidth={1.8} />
        </div>
        </div>

        {/* Título e descrição */}
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 tracking-tight">
          Recuperar senha
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
          Não se preocupe! Informe seu e-mail cadastrado na plataforma
          e enviaremos as instruções para redefinir sua senha.
        </p>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              E-mail
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail..."
              required
              className="w-full px-4 py-3 bg-[#eef1f5] border border-transparent rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-[#9d3878] transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-[#9d3878] hover:bg-[#832b62] text-white font-medium rounded-full text-sm shadow-md transition-all cursor-pointer"
          >
            Enviar e-mail
          </button>

        </form>

        {/* Voltar ao login */}
        <div className="text-center mt-4">
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
