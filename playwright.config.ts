import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Roda um teste após o outro em ordem (CT01 -> CT10)
  workers: 1, // Evita abrir várias janelas ao mesmo tempo, facilitando a gravação
  timeout: 60000,
  use: {
    baseURL: process.env.BASE_URL || 'https://projetoipe.duckdns.org',
    headless: false, // Abre o navegador na tela para você gravar as ações acontecendo
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'on', // Grava vídeo automaticamente de cada teste
    screenshot: 'on', // Tira screenshot em cada execução
    trace: 'on',
    launchOptions: {
      slowMo: 600, // Pausa entre cliques/digitação para dar clareza no vídeo
    },
  },
  projects: [
    {
      name: 'chromium', // Mantém 1 navegador para rodar exatamente os 10 testes
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
