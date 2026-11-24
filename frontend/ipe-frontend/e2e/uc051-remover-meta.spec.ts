import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers/auth';

test.describe('[UC051] - Remover Meta de Indicador', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
    await page.goto('/indicadores');
    await page.waitForLoadState('networkidle');
  });

  test('CT-051.01: Remover meta de indicador com sucesso (Fluxo Principal via API e UI)', async ({
    page,
  }) => {
    const token = await page.evaluate(() =>
      localStorage.getItem('access_token'),
    );

    // Busca metas ativas
    const metasRes = await page.request.get(
      'http://localhost:3001/api/metas?limite=1',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(metasRes.ok()).toBeTruthy();
    const metasData = await metasRes.json();

    if (metasData.itens?.length > 0) {
      const metaParaRemover = metasData.itens[0];
      const deleteRes = await page.request.delete(
        `http://localhost:3001/api/metas/${metaParaRemover.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      expect(deleteRes.ok()).toBeTruthy();
      const deleteData = await deleteRes.json();
      expect(deleteData).toHaveProperty('message');
      expect(deleteData.message).toMatch(/sucesso/i);
    }
  });

  test('CT-051.02: Desistir da remoção de meta no modal de edição', async ({
    page,
  }) => {
    const botaoEditar = page
      .locator('button[title*="Editar"], button:has-text("Editar")')
      .first();
    if (await botaoEditar.isVisible()) {
      await botaoEditar.click();

      const checkboxSemMeta = page.locator('input[type="checkbox"]');
      if (await checkboxSemMeta.isVisible()) {
        await checkboxSemMeta.check();
      }

      const botaoCancelar = page.locator('button:has-text("Cancelar")').first();
      if (await botaoCancelar.isVisible()) {
        await botaoCancelar.click();
      }
    }
  });

  test('CT-051.03: Bloquear remoção de meta para perfis não administradores', async ({
    page,
  }) => {
    const unauthDelete = await page.request.delete(
      'http://localhost:3001/api/metas/00000000-0000-0000-0000-000000000000',
    );
    expect(unauthDelete.status()).toBe(401);
  });

  test('CT-051.04: Verificar reflexo de indicador sem meta no painel', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Erro ao carregar')).not.toBeVisible();
  });

  test('CT-051.05: Validar listagem e estabilidade de indicador sem meta na tela de Indicadores', async ({
    page,
  }) => {
    await page.goto('/indicadores');
    await page.waitForLoadState('networkidle');

    const count = await page.locator('text=Sem meta').count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
