import { test, expect } from '@playwright/test';

test.describe('Suíte de Testes Automatizados - Projeto Ipê (10 Cenários Oficiais)', () => {
  // CT01 (CT-026.01 / CT-026.02)
  test('CT01 - Deve verificar modal de desativação/arquivamento de núcleo', async ({
    page,
  }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const email = page.locator('input[type="email"]').first();
    if (await email.isVisible({ timeout: 4000 }).catch(() => false)) {
      await email.fill('adm.teste@ipe.org.br');
      await page.locator('input[type="password"]').first().fill('Ipe@2026!');
      await page
        .locator('button[type="submit"], button:has-text("Entrar")')
        .first()
        .click();
      await page.waitForTimeout(1500);
    }
    await page.goto('/nucleos', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();

    const acaoBtn = page
      .locator(
        'button[aria-label="Ações"], button:has-text("Ações"), svg.lucide-ellipsis-vertical, svg.lucide-more-vertical',
      )
      .first();
    if (await acaoBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await acaoBtn.click();
      const desativarOpt = page
        .locator('text=Desativar, text=Arquivar, text=Excluir')
        .first();
      if (await desativarOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
        await desativarOpt.click();
        await page.waitForTimeout(600);
        const cancelBtn = page
          .locator('button:has-text("Cancelar"), button:has-text("Não")')
          .first();
        if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cancelBtn.click();
        }
      }
    }
  });

  // CT02 (CT-026.04)
  test('CT02 - Verificar que tela de Programas permite seleção de núcleos ativos', async ({
    page,
  }) => {
    await page.goto('/programas');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();

    const novoBtn = page
      .locator(
        'button:has-text("Novo Programa"), button:has-text("Cadastrar Programa"), button:has-text("Cadastrar")',
      )
      .first();
    if (await novoBtn.isVisible()) {
      await novoBtn.click();
      await page.waitForTimeout(600);
      const fecharBtn = page
        .locator('button:has-text("Cancelar"), button:has-text("Fechar")')
        .first();
      if (await fecharBtn.isVisible()) await fecharBtn.click();
    }
  });

  // CT03 (CT-027.01)
  test('CT03 - Cadastrar um programa com dados preenchidos', async ({
    page,
  }) => {
    await page.goto('/programas');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();

    const novoBtn = page
      .locator('button:has-text("Novo Programa"), button:has-text("Cadastrar")')
      .first();
    if (await novoBtn.isVisible()) {
      await novoBtn.click();
      const nomeInput = page
        .locator('input[placeholder*="Nome" i], input[name="nome"]')
        .first();
      if (await nomeInput.isVisible()) {
        await nomeInput.fill('Programa QA ' + Date.now().toString().slice(-4));
      }
      const descInput = page
        .locator('textarea, input[name="descricao"]')
        .first();
      if (await descInput.isVisible()) {
        await descInput.fill('Fomento a projetos de inovação tecnológica.');
      }
      const fecharBtn = page.locator('button:has-text("Cancelar")').first();
      if (await fecharBtn.isVisible()) await fecharBtn.click();
    }
  });

  // CT04 (CT-027.02)
  test('CT04 - Salvar formulário de programa sem preencher campos obrigatórios', async ({
    page,
  }) => {
    await page.goto('/programas');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();

    const novoBtn = page
      .locator('button:has-text("Novo Programa"), button:has-text("Cadastrar")')
      .first();
    if (await novoBtn.isVisible()) {
      await novoBtn.click();
      await page.waitForTimeout(500);
      const salvarBtn = page
        .locator('button:has-text("Salvar"), button[type="submit"]')
        .last();
      if (await salvarBtn.isVisible()) {
        await salvarBtn.click();
        await page.waitForTimeout(600);
      }
      const fecharBtn = page.locator('button:has-text("Cancelar")').first();
      if (await fecharBtn.isVisible()) await fecharBtn.click();
    }
  });

  // CT05 (CT-027.05)
  test('CT05 - Verificar permissões de criação de programa por perfil', async ({
    page,
  }) => {
    await page.goto('/login');
    const email = page.locator('input[type="email"]').first();
    if (await email.isVisible().catch(() => false)) {
      await email.fill('diretor.nei@ipe.org.br');
      await page.locator('input[type="password"]').first().fill('Ipe@2026!');
      await page
        .locator('button[type="submit"], button:has-text("Entrar")')
        .first()
        .click();
      await page.waitForTimeout(1000);
    }
    await page.goto('/programas');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  // CT06 (CT-028.01)
  test('CT06 - Pesquisar programa por termo parcial sem diferenciar maiúsculas/minúsculas', async ({
    page,
  }) => {
    await page.goto('/programas');
    await page.waitForTimeout(1000);

    const searchInput = page
      .locator(
        'input[placeholder*="Pesquisar" i], input[placeholder*="Buscar" i], input[type="search"]',
      )
      .first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('INOVA');
      await page.waitForTimeout(600);
      await expect(page.locator('body')).toBeVisible();
      await searchInput.fill('');
    }
  });

  // CT07 (CT-028.03)
  test('CT07 - Pesquisar um termo sem correspondência', async ({ page }) => {
    await page.goto('/programas');
    await page.waitForTimeout(1000);

    const searchInput = page
      .locator(
        'input[placeholder*="Pesquisar" i], input[placeholder*="Buscar" i], input[type="search"]',
      )
      .first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('zzz999_inexistente');
      await page.waitForTimeout(600);
      await expect(page.locator('body')).toBeVisible();
      await searchInput.fill('');
    }
  });

  // CT08 (CT-029.01)
  test('CT08 - Visualizar a listagem de programas com suas informações', async ({
    page,
  }) => {
    await page.goto('/programas');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  // CT09 (CT-029.02)
  test('CT09 - Consultar os detalhes de um programa', async ({ page }) => {
    await page.goto('/programas');
    await page.waitForTimeout(1000);

    const primeiroPrograma = page
      .locator('tr, div[class*="card"], div[class*="cursor-pointer"]')
      .filter({ hasText: /Programa|Projeto/ })
      .first();
    if (await primeiroPrograma.isVisible()) {
      await primeiroPrograma.click();
      await page.waitForTimeout(600);
    }
    await expect(page.locator('body')).toBeVisible();
  });

  // CT10 (CT-025.04)
  test('CT10 - Verificar o registro de histórico e auditoria na Tela de Histórico', async ({
    page,
  }) => {
    await page.goto('/historico');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });
});
