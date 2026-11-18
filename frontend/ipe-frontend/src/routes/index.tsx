import { Navigate, Outlet } from 'react-router-dom';
import { possuiSessaoValida } from './sessao';

// Envolve as rotas internas: sem token válido, volta para o login
export default function RotaProtegida() {
  return possuiSessaoValida() ? <Outlet /> : <Navigate to="/login" replace />;
}
