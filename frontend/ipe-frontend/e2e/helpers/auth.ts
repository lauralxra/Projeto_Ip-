import { Page, expect } from '@playwright/test';

export const USUARIOS = {
  admin: {
    email: 'admin@instituto-ipe.org.br',
    password: 'Admin@123456',
    nome: 'Administrador do Sistema',
    perfil: 'ADMINISTRADOR',
  },
  diretor: {
    email: 'marata@ufrpe.br',
    password: 'Admin@123456',
    nome: 'Laura',
    perfil: 'DIRETORES_NUCLEOS',
  },
  comunicacao: {
    email: 'luma@ufrpe.br',
    password: 'Admin@123456',
    nome: 'Luma',
    perfil: 'EQUIPE_COMUNICACAO',
  },
};

/**
 * Realiza o login completo através da interface visual do sistema (TelaLogin)
 */
export async function loginViaUI(
  page: Page,
  email = USUARIOS.admin.email,
  password = USUARIOS.admin.password,
) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.fill(email);
  await passwordInput.fill(password);

  const submitButton = page.locator('button[type="submit"]:has-text("Entrar")');
  await submitButton.click();

  // Aguarda o redirecionamento pós-login para a tela de dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await expect(page).toHaveURL(/.*dashboard/);
}

/**
 * Autentica o usuário diretamente no contexto do navegador via token da API,
 * carregando também os núcleos institucionais no localStorage.
 */
export async function autenticarViaStorage(
  page: Page,
  email = USUARIOS.admin.email,
  password = USUARIOS.admin.password,
) {
  // Faz o login diretamente na API backend
  const response = await page.request.post(
    'http://localhost:3001/api/auth/login',
    {
      data: {
        email,
        password,
      },
    },
  );

  if (!response.ok()) {
    throw new Error(
      `Falha na autenticação da API: ${response.status()} ${await response.text()}`,
    );
  }

  const { accessToken, user } = await response.json();

  // Busca núcleos para alimentar seletores de filtro da interface
  let nucleos = [];
  try {
    const nucleosRes = await page.request.get(
      'http://localhost:3001/api/nucleos',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (nucleosRes.ok()) {
      nucleos = await nucleosRes.json();
    }
  } catch (e) {
    console.warn('Não foi possível obter núcleos para sessão de teste:', e);
  }

  // Injeta a sessão no localStorage do domínio do frontend
  await page.goto('/login');
  await page.evaluate(
    ({ token, usuario, nucleosLista }) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_role', usuario.perfil);
      localStorage.setItem('user_data', JSON.stringify(usuario));
      localStorage.setItem('user_nucleos', JSON.stringify(nucleosLista));
    },
    { token: accessToken, usuario: user, nucleosLista: nucleos },
  );
}
