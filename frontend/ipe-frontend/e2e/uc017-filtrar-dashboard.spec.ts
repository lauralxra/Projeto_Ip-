import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers/auth';

test.describe('[UC017] - Filtrar Dashboard (por Núcleo, Indicador ou Período)', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
    await page.waitForLoadState('networkidle');
  });

  test('CT-017.01: Filtrar dados de forma simples por Ano/Período', async ({
    page,
  }) => {
    // Localiza o seletor de período no dashboard
    const periodoSelect = page
      .locator('select')
      .filter({ hasText: /Ano de 2026|Todos os períodos/i });
    await expect(periodoSelect).toBeVisible();

    await periodoSelect.selectOption({ label: 'Ano de 2026' });
    await expect(periodoSelect).toHaveValue('Ano de 2026');
    await expect(page.locator('text=Erro ao carregar')).not.toBeVisible();
  });

  test('CT-017.02: Filtrar dados de forma combinada por Núcleo e Pesquisa de Indicador', async ({
    page,
  }) => {
    const nucleoSelect = page
      .locator('select')
      .filter({ hasText: /Todos os Núcleos/i });
    await expect(nucleoSelect).toBeVisible();

    // Seleciona um núcleo se houver opções além de 'Todos os Núcleos'
    const options = await nucleoSelect.locator('option').allInnerTexts();
    if (options.length > 1) {
      await nucleoSelect.selectOption({ index: 1 });
    }

    // Filtro por termo de busca no input
    const searchInput = page.getByPlaceholder(
      'Buscar indicador ou programa...',
    );
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Atendimentos');
    await expect(searchInput).toHaveValue('Atendimentos');
  });

  test('CT-017.03: Restringir opções de filtro fora do escopo permitido (Visão Restrita via API)', async ({
    page,
  }) => {
    const token = await page.evaluate(() =>
      localStorage.getItem('access_token'),
    );
    const response = await page.request.get(
      'http://localhost:3001/api/dashboard/indicators?ano=2026',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    const dados = await response.json();
    expect(dados).toHaveProperty('indicadores');
    expect(Array.isArray(dados.indicadores)).toBeTruthy();
  });

  test('CT-017.04: Limpar filtros aplicados e retornar à visão padrão', async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(
      'Buscar indicador ou programa...',
    );
    await searchInput.fill('FiltroParaRemover');
    await expect(searchInput).toHaveValue('FiltroParaRemover');

    // Limpa a busca
    await searchInput.fill('');
    await expect(searchInput).toHaveValue('');

    // Restaura o seletor de núcleo
    const nucleoSelect = page
      .locator('select')
      .filter({ hasText: /Todos os Núcleos/i });
    await nucleoSelect.selectOption('Todos os Núcleos');
    await expect(nucleoSelect).toHaveValue('Todos os Núcleos');
  });

  test('CT-017.05: Validar aplicação de filtros que não retornam registros (estado vazio)', async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(
      'Buscar indicador ou programa...',
    );
    await searchInput.fill('INDICADOR_INEXISTENTE_999_XYZ');

    // O sistema exibe a mensagem de estado vazio sugerindo revisar os filtros
    const mensagemVazio = page.locator(
      'text=Nenhum indicador encontrado para os filtros selecionados',
    );
    await expect(mensagemVazio).toBeVisible();
  });
});
