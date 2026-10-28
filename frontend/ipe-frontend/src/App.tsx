//import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TelaLogin from './TelaLogin';
//import TelaCadastro from './TelaCadastro';
import TelaDashboard from './TelaDashboard';
import TelaNucleos from './TelaNucleos';
import TelaIndicadores from './TelaIndicadores';
import TelaUsuarios from './TelaUsuarios';
import TelaProgramas from './TelaProgramas';
import TelaHistorico from './TelaHistorico';
import { UsuarioAtual } from './dados/usuarios';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* rota inicial */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<TelaLogin />} />
        {/*<Route path="/cadastro" element={<TelaCadastro />} />*/}

        {UsuarioAtual ? "" : <Navigate to="/login" replace/>}

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