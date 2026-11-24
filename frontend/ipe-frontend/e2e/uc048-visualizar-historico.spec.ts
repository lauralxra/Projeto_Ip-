import { test, expect } from '@playwright/test';
import { loginViaUI, USUARIOS } from './helpers/auth';

test.describe('[UC048] - Visualizar Histórico de Registros e Alterações', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
    await page.goto('/historico');
    await page.waitForLoadState('networkidle');
  });

  test('CT-048.01: Visualizar histórico completo de registros e alterações por Administrador (Fluxo Principal)', async ({
    page,
  }) => {
    await expect(page).toHaveURL(/.*historico/);
    await expect(page.locator('h1:has-text("Histórico")')).toBeVisible();

    const contadorRegistros = page.locator('text=Total de registros:');
    await expect(contadorRegistros).toBeVisible();
  });

  test('CT-048.02: Acessar Histórico e verificar os filtros disponíveis', async ({
    page,
  }) => {
    const selectEntidade = page.locator('select').filter({
      hasText: /Todas as Entidades|Indicadores|Programas|Metas/i,
    });
    await expect(selectEntidade).toBeVisible();

    const selectNucleo = page.locator('select').filter({
      hasText: /Todos os Núcleos/i,
    });
    await expect(selectNucleo).toBeVisible();

    const inputsData = page.locator('input[type="date"]');
    await expect(inputsData).toHaveCount(2);
  });

  test('CT-048.03: Bloquear acesso ao Histórico para perfis sem permissão (Diretor de Núcleo / Comunicação)', async ({
    page,
  }) => {
    // 1. Autentica como Diretor de Núcleo (perfil sem acesso administrativo ao Histórico)
    const loginRes = await page.request.post(
      'http://localhost:3001/api/auth/login',
      {
        data: {
          email: USUARIOS.diretor.email,
          password: USUARIOS.diretor.password,
        },
      },
    );
    expect(loginRes.ok()).toBeTruthy();
    const { accessToken } = await loginRes.json();

    // 2. Dispara requisição para a rota /audit com o token do Diretor de Núcleo
    const auditRes = await page.request.get('http://localhost:3001/api/audit', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // 3. Valida que o backend bloqueia com 403 Forbidden
    expect(auditRes.status()).toBe(403);
    const body = await auditRes.json();
    expect(body.message).toMatch(/permissão/i);

    // 4. Valida bloqueio na interface visual: loga com Diretor de Núcleo e tenta acessar /historico
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(USUARIOS.diretor.email);
    await page
      .locator('input[type="password"]')
      .fill(USUARIOS.diretor.password);
    await page.locator('button[type="submit"]:has-text("Entrar")').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Valida que o link "Histórico" não é exibido no menu de navegação para perfil não autorizado
    await expect(page.locator('nav a:has-text("Histórico")')).toHaveCount(0);

    // Acessar a URL direta também deve ser bloqueado pela proteção da rota.
    await page.goto('/historico');
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1:has-text("Histórico")')).toHaveCount(0);
  });

  test('CT-048.04: Filtrar registros históricos por tipo de entidade', async ({
    page,
  }) => {
    const selectEntidade = page.locator('select').filter({
      hasText: /Todas as Entidades/i,
    });
    await expect(selectEntidade).toBeVisible();

    await selectEntidade.selectOption('Indicador');
    await expect(selectEntidade).toHaveValue('Indicador');

    const botaoLimpar = page.locator('button:has-text("Limpar filtros")');
    if (await botaoLimpar.isVisible()) {
      await botaoLimpar.click();
      await expect(selectEntidade).toHaveValue('');
    }
  });

  test('CT-048.05: Validar detalhes mínimos de auditoria no registro de histórico', async ({
    page,
  }) => {
    const token = await page.evaluate(() =>
      localStorage.getItem('access_token'),
    );
    const response = await page.request.get(
      'http://localhost:3001/api/audit?limite=10',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(response.ok()).toBeTruthy();
    const logs = await response.json();
    expect(Array.isArray(logs)).toBeTruthy();

    if (logs.length > 0) {
      const primeiroLog = logs[0];
      expect(primeiroLog).toHaveProperty('id');
      expect(primeiroLog).toHaveProperty('acao');
      expect(primeiroLog).toHaveProperty('entidade');
      expect(primeiroLog).toHaveProperty('createdAt');
    }
  });
});
