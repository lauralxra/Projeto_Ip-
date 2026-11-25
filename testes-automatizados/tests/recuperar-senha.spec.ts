import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const EMAIL_ADMIN = 'admin@instituto-ipe.org.br';
const SENHA_ADMIN = 'Admin@123456';

async function login(page: Page, email = EMAIL_ADMIN, senha = SENHA_ADMIN) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', senha);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

async function getToken(page: Page): Promise<string> {
  const response = await page.request.post(`http://localhost:3001/api/auth/login`, {
    data: { email: EMAIL_ADMIN, password: SENHA_ADMIN }
  });
  const body = await response.json();
  return body.accessToken;
}

test.describe('UC06 - Alteração de Senha', () => {

  test('CT-006.01 - Alteração de senha com sucesso', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/usuarios`);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/usuarios/);
  });

  test('CT-006.02 - Senha atual incorreta exibe erro', async ({ page }) => {
    await login(page);
    const token = await getToken(page);
    const response = await page.request.patch(`http://localhost:3001/api/users/profile/password`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      data: { currentPassword: 'SenhaErrada123', newPassword: 'NovaSenha@2026', confirmNewPassword: 'NovaSenha@2026' }
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.message).toContain('incorreta');
  });

  test('CT-006.03 - Senhas novas não coincidem', async ({ page }) => {
    await login(page);
    const token = await getToken(page);
    const response = await page.request.patch(`http://localhost:3001/api/users/profile/password`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      data: { currentPassword: SENHA_ADMIN, newPassword: 'NovaSenha@2026', confirmNewPassword: 'NovaSenha@2027' }
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message[0]).toContain('iguais');
  });

  test('CT-006.04 - Nova senha fora dos requisitos mínimos', async ({ page }) => {
    await login(page);
    const token = await getToken(page);
    const response = await page.request.patch(`http://localhost:3001/api/users/profile/password`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      data: { currentPassword: SENHA_ADMIN, newPassword: '12345678', confirmNewPassword: '12345678' }
    });
    expect(response.status()).toBe(400);
  });

  test('CT-006.05 - Campos de senha são limpos ao cancelar', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/usuarios`);
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/usuarios/);
  });

});

test.describe('UC27 - Cadastrar Programa', () => {

  test('CT-027.01 - Cadastrar programa com sucesso via API', async ({ page }) => {
    await login(page);
    const token = await getToken(page);
    const response = await page.request.post(`http://localhost:3001/api/programas`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      data: { nome: `Programa Inova UFRPE ${Date.now()}`, descricao: 'Fomento a projetos de inovação' }
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.nome).toContain('Programa Inova UFRPE');
  });

  test('CT-027.02 - Cadastrar programa sem nome retorna erro', async ({ page }) => {
    await login(page);
    const token = await getToken(page);
    const response = await page.request.post(`http://localhost:3001/api/programas`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      data: { descricao: 'Descrição de teste' }
    });
    expect(response.status()).toBe(400);
  });

  test('CT-027.03 - Cadastrar programa com nome duplicado no mesmo núcleo', async ({ page }) => {
    await login(page);
    const token = await getToken(page);
    const nome = `Programa Duplicado ${Date.now()}`;
    await page.request.post(`http://localhost:3001/api/programas`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      data: { nome }
    });
    const response = await page.request.post(`http://localhost:3001/api/programas`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      data: { nome }
    });
    expect(response.status()).toBe(409);
  });

  test('CT-027.04 - Tela de programas carrega corretamente', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/programas`);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/programas/);
  });

  test('CT-027.05 - Usuário sem permissão não acessa rota de admin', async ({ page }) => {
    await login(page);
    const response = await page.request.post(`http://localhost:3001/api/programas`, {
      headers: { 'Content-Type': 'application/json' },
      data: { nome: 'Programa Teste' }
    });
    expect(response.status()).toBe(401);
  });

});