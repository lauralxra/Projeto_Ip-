import { test, expect } from '@playwright/test';
import { loginViaUI, USUARIOS } from './helpers/auth';

test.describe('Regressão e Validação de Correções da RC2', () => {
  test.describe('[UC01] - Realizar Login e Tratamento de Tentativas (Risco Alto)', () => {
    test('CT-001.01: Autenticação com credenciais válidas redireciona para o Dashboard', async ({
      page,
    }) => {
      await page.goto('/login');
      await page.locator('input[type="email"]').fill(USUARIOS.admin.email);
      await page
        .locator('input[type="password"]')
        .fill(USUARIOS.admin.password);
      await page.locator('button[type="submit"]:has-text("Entrar")').click();

      await page.waitForURL('**/dashboard', { timeout: 15000 });
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('CT-001.02: Login com senha incorreta exibe aviso com regra de bloqueio', async ({
      page,
    }) => {
      await page.goto('/login');
      await page.locator('input[type="email"]').fill(USUARIOS.admin.email);
      await page.locator('input[type="password"]').fill('SenhaIncorreta@999');
      await page.locator('button[type="submit"]:has-text("Entrar")').click();

      // Aguarda a mensagem de erro informativa
      const avisoErro = page.locator('text=Email ou senha inválidos');
      await expect(avisoErro).toBeVisible({ timeout: 5000 });
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('[UC02] - Recuperar Senha e Anti-enumeração (Risco Alto - BUG-009)', () => {
    test('CT-002.01: Link Esqueci minha senha redireciona para a tela de recuperação', async ({
      page,
    }) => {
      await page.goto('/login');
      const linkEsqueci = page.locator(
        'a:has-text("Esqueci minha senha"), button:has-text("Esqueci minha senha")',
      );
      await linkEsqueci.click();

      await page.waitForURL('**/recuperar-senha', { timeout: 10000 });
      await expect(page).toHaveURL(/.*recuperar-senha/);
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test('CT-002.02: Solicitação para e-mail inexistente exibe mensagem de e-mail não cadastrado (BUG-009 / FE01)', async ({
      page,
    }) => {
      await page.goto('/recuperar-senha');
      await page
        .locator('input[type="email"]')
        .fill('usuario.inexistente.qa@ipe.org.br');
      await page.locator('button:has-text("Enviar código")').click();

      // Exibe mensagem de erro na tela e sinaliza campo conforme CT-002.02
      const alerta = page.locator('text=E-mail não cadastrado');
      await expect(alerta).toBeVisible({ timeout: 10000 });
      await expect(page.locator('input#recuperar-email')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
    });
  });

  test.describe('[UC012] - Núcleos Associados no Popup do Usuário (Risco Alto - BUG-010)', () => {
    test('CT-012.01 & CT-012.03: Exibição de Núcleos Associados e navegação para /nucleos', async ({
      page,
    }) => {
      // Login com diretora que possui núcleo associado
      await loginViaUI(page, USUARIOS.diretor.email, USUARIOS.diretor.password);
      await page.waitForLoadState('networkidle');

      // Abre o popup do usuário no botão com aria-label "Abrir perfil"
      const perfilBtn = page.locator('button[aria-label="Abrir perfil"]');
      await expect(perfilBtn).toBeVisible({ timeout: 5000 });
      await perfilBtn.click();

      // Opção "Núcleos Associados" deve estar visível no menu
      const itemNucleos = page.locator('[data-testid="nucleos-associados"]');
      await expect(itemNucleos).toBeVisible({ timeout: 5000 });

      // O accordion de núcleos associados já renderiza a seção na abertura do perfil (UC12 / PR #390)
      const listaNucleos = page.locator('#lista-nucleos-associados');
      await expect(listaNucleos).toBeVisible({ timeout: 5000 });

      // Clicar em um dos núcleos vinculados redireciona para /nucleos
      const linkNucleoItem = listaNucleos.locator('button').first();
      await expect(linkNucleoItem).toBeVisible({ timeout: 5000 });
      await linkNucleoItem.click();

      await page.waitForURL('**/nucleos', { timeout: 10000 });
      await expect(page).toHaveURL(/.*nucleos/);
    });
  });

  test.describe('[UC014] - Visualizar Notificação com Tratamento de Falha (BUG-011)', () => {
    test('CT-014.05: Falha na API de notificações exibe mensagem amigável de erro com retry', async ({
      page,
    }) => {
      await loginViaUI(page);
      await page.waitForLoadState('networkidle');

      // Intercepta rotas de busca de notificações retornando erro 500
      await page.route('**/api/notificacoes*', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erro interno simulado' }),
        });
      });

      // Clica no ícone de notificações (sino)
      const sinoBtn = page.locator('button[aria-label="Abrir notificações"]');
      await expect(sinoBtn).toBeVisible({ timeout: 5000 });
      await sinoBtn.click();

      // Valida que o alerta amigável e o botão de retry são exibidos (TC14.5 / PR #389)
      const alerta = page.locator(
        'div[role="alert"]:has-text("Não foi possível carregar as notificações")',
      );
      await expect(alerta).toBeVisible({ timeout: 5000 });
      const btnRetry = page.locator('button:has-text("Tentar novamente")');
      await expect(btnRetry).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('[UC021 / UC024] - Gestão de Núcleos e Permissões (BUG-015, BUG-018)', () => {
    test('CT-021.01: Administrador visualiza formulário de cadastro de núcleo', async ({
      page,
    }) => {
      await loginViaUI(page);
      await page.goto('/nucleos');
      await page.waitForLoadState('networkidle');

      const btnNovoNucleo = page.locator(
        'button:has-text("+ Novo núcleo"), button:has-text("Novo núcleo")',
      );
      await expect(btnNovoNucleo).toBeVisible();
      await btnNovoNucleo.click();

      // Modal de criação deve abrir com campos Nome e Sigla
      await expect(
        page
          .locator('input[placeholder*="Ex: Núcleo"], input[type="text"]')
          .first(),
      ).toBeVisible();
    });

    test('CT-024.03: Diretor de Núcleo tem edição restrita', async ({
      page,
    }) => {
      // Diretor de Núcleo não possui permissão de edição global de núcleos
      await loginViaUI(page, USUARIOS.diretor.email, USUARIOS.diretor.password);
      await page.goto('/nucleos');
      await page.waitForLoadState('networkidle');

      // Confere que o botão de criação de núcleo não está disponível para perfil não administrador
      const btnNovo = page.locator('button:has-text("+ Novo núcleo")');
      await expect(btnNovo).toHaveCount(0);
    });
  });

  test.describe('[UC028 / UC029] - Visualizar Programas e Indicadores Vinculados (BUG-020, BUG-021)', () => {
    test('CT-029.01: Cards de programa exibem contagem de indicadores vinculados', async ({
      page,
    }) => {
      await loginViaUI(page);
      await page.goto('/programas');
      await page.waitForLoadState('networkidle');

      // Verifica se a listagem exibe o badge de contagem de indicadores
      const badgesIndicadores = page.locator('text=Indicador(es) vinculado(s)');
      await expect(badgesIndicadores.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('[UC048] - Histórico: Proteção RBAC no Frontend (Risco Alto - BUG-025)', () => {
    test('CT-048.03: Diretor de Núcleo não vê Histórico no menu e é redirecionado ao tentar acessar URL direta', async ({
      page,
    }) => {
      await loginViaUI(page, USUARIOS.diretor.email, USUARIOS.diretor.password);
      await page.waitForLoadState('networkidle');

      // Menu Histórico não deve existir para Diretor
      const linkHistorico = page.locator(
        'aside a[href="/historico"], nav a[href="/historico"]',
      );
      await expect(linkHistorico).toHaveCount(0);

      // Acesso direto à URL /historico redireciona para /dashboard
      await page.goto('/historico');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await expect(page).toHaveURL(/.*dashboard/);
    });
  });

  test.describe('[UC050 / UC051] - Metas e Indicadores no Dashboard (BUG-026)', () => {
    test('CT-050.01: Dashboard exibe indicadores com valores e gráficos sem crash', async ({
      page,
    }) => {
      await loginViaUI(page);
      await page.waitForLoadState('networkidle');

      // Dashboard deve conter os cards de indicadores
      const cards = page
        .locator('[data-testid="indicador-card"], .rounded-xl, .bg-white')
        .filter({
          has: page.locator('text=Realizado'),
        });
      await expect(cards.first()).toBeVisible({ timeout: 10000 });

      // Gráficos de SVG e valores renderizados
      const svgGrafico = page.locator('svg.recharts-surface');
      await expect(svgGrafico.first()).toBeVisible({ timeout: 10000 });
    });
  });
});
