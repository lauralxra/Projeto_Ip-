//import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TelaLogin from './TelaLogin';
//import TelaCadastro from './TelaCadastro';
import TelaDashboard from './TelaDashboard';
import TelaNucleos from './TelaNucleos';
import TelaIndicadores from './TelaIndicadores';
import TelaUsuarios from './TelaUsuarios';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota inicial redireciona para a tela de Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rotas de Autenticação */}
        <Route path="/login" element={<TelaLogin />} />
        {/*<Route path="/cadastro" element={<TelaCadastro />} />*/}

        {/* Rotas Internas do App */}
        <Route path="/dashboard" element={<TelaDashboard />} />
        <Route path="/nucleos" element={<TelaNucleos />} />
        <Route path="/indicadores" element={<TelaIndicadores />} />
        <Route path="/usuarios" element={<TelaUsuarios />} />

        {/* Fallback para evitar tela branca caso a URL não exista */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}