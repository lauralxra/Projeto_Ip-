import { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { CHAVE_TOKEN, possuiSessaoValida } from './sessao';

// Envolve as rotas internas: sem token válido, volta para o login.
// BUG-UC13.4: o logout feito em uma aba também derruba as outras abas abertas.
export default function RotaProtegida() {
  const navigate = useNavigate();

  useEffect(() => {
    const voltarAoLoginSemSessao = () => {
      if (!possuiSessaoValida()) void navigate('/login', { replace: true });
    };

    // Outra aba removeu o token (logout) ou limpou o armazenamento
    const aoMudarArmazenamento = (e: StorageEvent) => {
      if (e.key === CHAVE_TOKEN || e.key === null) voltarAoLoginSemSessao();
    };

    // Ao voltar para a aba, confere se a sessão ainda existe e não expirou
    const aoVoltarParaAba = () => {
      if (document.visibilityState === 'visible') voltarAoLoginSemSessao();
    };

    window.addEventListener('storage', aoMudarArmazenamento);
    window.addEventListener('focus', voltarAoLoginSemSessao);
    document.addEventListener('visibilitychange', aoVoltarParaAba);
    return () => {
      window.removeEventListener('storage', aoMudarArmazenamento);
      window.removeEventListener('focus', voltarAoLoginSemSessao);
      document.removeEventListener('visibilitychange', aoVoltarParaAba);
    };
  }, [navigate]);

  return possuiSessaoValida() ? <Outlet /> : <Navigate to="/login" replace />;
}
