import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { aplicarSessaoAoUsuarioAtual } from './api/usuarioAtual';

// Ao recarregar a página, restaura o usuário logado a partir da sessão
aplicarSessaoAoUsuarioAtual();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
