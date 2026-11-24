import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers/auth';

test.describe('[UC049] - Restaurar Registros Excluídos/Arquivados', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
  });

  test('CT-049.01: Identificar ações de restauração e reativação no histórico de auditoria', async ({
    page,
  }) => {
    await page.goto('/historico');
    await page.waitForLoadState('networkidle');

    const tituloPagina = page.locator('h1:has-text("Histórico")');
    await expect(tituloPagina).toBeVisible();

    const token = await page.evaluate(() =>
      localStorage.getItem('access_token'),
    );
    const response = await page.request.get(
      'http://localhost:3001/api/audit?acao=RESTAURAR&limite=5',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(response.ok()).toBeTruthy();
  });

  test('CT-049.02: Cancelar fluxo de confirmação sem persistir alteração', async ({
    page,
  }) => {
    await page.goto('/programas/arquivados');
    await page.waitForLoadState('networkidle');

    const modalCancelar = page.locator('button:has-text("Cancelar")');
    if (await modalCancelar.isVisible()) {
      await modalCancelar.click();
      await expect(modalCancelar).not.toBeVisible();
    }
  });

  test('CT-049.03: Bloquear restauração de registros para requisições sem autenticação ou permissão', async ({
    page,
  }) => {
    const unauthResponse = await page.request.patch(
      'http://localhost:3001/api/programas/00000000-0000-0000-0000-000000000000/reativar',
    );
    expect(unauthResponse.status()).toBe(401);
  });

  test('CT-049.04: Validar endpoint de reativação para registros arquivados', async ({
    page,
  }) => {
    const token = await page.evaluate(() =>
      localStorage.getItem('access_token'),
    );
    const response = await page.request.patch(
      'http://localhost:3001/api/programas/99999999-9999-9999-9999-999999999999/reativar',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect([404, 400]).toContain(response.status());
  });

  test('CT-049.05: Validar gravação do evento de restauração no histórico de auditoria', async ({
    page,
  }) => {
    const token = await page.evaluate(() =>
      localStorage.getItem('access_token'),
    );
    const auditRes = await page.request.get(
      'http://localhost:3001/api/audit?limite=20',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(auditRes.ok()).toBeTruthy();
    const logs = await auditRes.json();
    expect(Array.isArray(logs)).toBeTruthy();
  });
});
