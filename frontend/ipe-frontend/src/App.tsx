import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
//import Cadastro from './Cadastro';
import Dashboard from './Dashboard';
import Nucleos from './Nucleos';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota inicial redireciona para a tela de Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rotas de Autenticação */}
        <Route path="/login" element={<Login />} />
        {/*<Route path="/cadastro" element={<Cadastro />} />*/}

        {/* Rotas Internas do App */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/nucleos" element={<Nucleos />} />

        {/* Fallback para evitar tela branca caso a URL não exista */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}