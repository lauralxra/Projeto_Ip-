const envApiUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

// Sem VITE_API_BASE_URL: em desenvolvimento usa a API local; em produção usa /api
// no mesmo domínio do site, em vez de apontar para o localhost de quem acessa
const fallbackApiUrl = import.meta.env.DEV
  ? 'http://localhost:3001/api'
  : '/api';

export const API_BASE_URL = (envApiUrl || fallbackApiUrl).replace(/\/+$/, '');
