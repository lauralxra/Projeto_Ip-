//import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TelaLogin from './TelaLogin';
import TelaRecuperarSenha from './TelaRecuperarSenha';
import TelaRedefinirSenha from './TelaRedefinirSenha';
//import TelaCadastro from './TelaCadastro';
import TelaCadastro from './TelaCadastro';
import TelaDashboard from './TelaDashboard';
import TelaNucleos from './TelaNucleos';
import TelaIndicadores from './TelaIndicadores';
import TelaUsuarios from './TelaUsuarios';
import TelaProgramas from './TelaProgramas';
import TelaHistorico from './TelaHistorico';
import RotaProtegida from './routes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* rota inicial */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<TelaLogin />} />
        <Route path="/cadastro" element={<TelaCadastro />} />

        <Route path="/recuperar-senha" element={<TelaRecuperarSenha />} />
        <Route path="/redefinir-senha" element={<TelaRedefinirSenha />} />

        <Route path="/dashboard" element={<TelaDashboard />} />
        <Route path="/nucleos" element={<TelaNucleos />} />
        <Route path="/programas" element={<TelaProgramas />} />
        <Route path="/indicadores" element={<TelaIndicadores />} />
        <Route path="/historico" element={<TelaHistorico />} />
        <Route path="/usuarios" element={<TelaUsuarios />} />

        {/* caso a URL não exista */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
