import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Domínios liberados para acessar o servidor do Vite (separados por vírgula).
// Definido no ambiente do servidor (ex.: EC2), nunca no repositório.
const parseAllowedHosts = (valor?: string) => {
  const hosts = (valor ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
  return hosts.length > 0 ? hosts : undefined;
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Prefixo '' lê também variáveis sem VITE_, vindas do ambiente ou dos arquivos .env
  const env = loadEnv(mode, process.cwd(), '');
  const allowedHosts = parseAllowedHosts(env.ALLOWED_HOSTS);

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: 5173,
      allowedHosts,
    },
    preview: {
      host: true,
      port: 5173,
      allowedHosts,
    },
  };
});
