import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers/auth';

test.describe('[UC050] - Definir Meta para Indicador', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
    await page.goto('/indicadores');
    await page.waitForLoadState('networkidle');
  });

  test('CT-050.01: Definir meta para indicador utilizando dados válidos (Fluxo Principal)', async ({
    page,
  }) => {
    const token = await page.evaluate(() =>
      localStorage.getItem('access_token'),
    );

    // Busca indicadores cadastrados
    const indRes = await page.request.get(
      'http://localhost:3001/api/indicadores',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(indRes.ok()).toBeTruthy();
    const indData = await indRes.json();
    const indicadores = Array.isArray(indData) ? indData : indData.itens || [];

    if (indicadores.length > 0) {
      const indicador = indicadores[0];
      // Cadastra ou atualiza uma meta válida para o ano 2026
      const metaRes = await page.request.post(
        'http://localhost:3001/api/metas',
        {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            indicadorId: indicador.id,
            ano: 2026,
            valorMeta: 150,
            trimestre: 'Q1',
            descricao: 'Meta de teste automatizado Playwright',
          },
        },
      );

      // Pode ser 201 (criada) ou 409 (se já existir meta para esse período)
      expect([201, 409]).toContain(metaRes.status());
      if (metaRes.status() === 201) {
        const metaCriada = await metaRes.json();
        expect(metaCriada).toHaveProperty('id');
        expect(Number(metaCriada.valorMeta)).toBe(150);
      }
    }
  });

  test('CT-050.02: Rejeitar criação de meta para indicador inexistente', async ({
    page,
  }) => {
    const token = await page.evaluate(() =>
      localStorage.getItem('access_token'),
    );

    const metaRes = await page.request.post('http://localhost:3001/api/metas', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        indicadorId: '00000000-0000-0000-0000-000000000000',
        ano: 2026,
        valorMeta: 100,
      },
    });

    expect([400, 404]).toContain(metaRes.status());
  });

  test('CT-050.03: Cancelar definição de meta no modal da UI', async ({
    page,
  }) => {
    const botaoNovo = page
      .locator(
        'button:has-text("Novo Indicador"), button:has-text("Adicionar Indicador")',
      )
      .first();
    if (await botaoNovo.isVisible()) {
      await botaoNovo.click();

      const inputMeta = page.locator('input[placeholder*="Defina uma meta"]');
      if (await inputMeta.isVisible()) {
        await inputMeta.fill('250');
      }

      const botaoCancelar = page.locator('button:has-text("Cancelar")').first();
      await botaoCancelar.click();

      await expect(
        page.locator('h2:has-text("Novo Indicador")'),
      ).not.toBeVisible();
    }
  });

  test('CT-050.04: Validar tratamento de valor inválido ou negativo na meta', async ({
    page,
  }) => {
    const token = await page.evaluate(() =>
      localStorage.getItem('access_token'),
    );

    const metaRes = await page.request.post('http://localhost:3001/api/metas', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        indicadorId: '00000000-0000-0000-0000-000000000000',
        ano: 2026,
        valorMeta: -50,
      },
    });

    expect(metaRes.status()).toBe(400);
  });

  test('CT-050.05: Verificar exibição do campo de meta na interface de indicadores', async ({
    page,
  }) => {
    const cabecalhoMeta = page.locator('text=Meta');
    await expect(cabecalhoMeta.first()).toBeVisible();
  });
});
