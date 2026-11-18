const CHAVE_TOKEN = 'access_token';
const CHAVE_PERFIL = 'user_role';

// Lê o "exp" do JWT só para decidir a navegação; quem valida o token de verdade é o backend
function tokenExpirado(token: string): boolean {
  try {
    const payloadBase64 = token
      .split('.')[1]
      ?.replace(/-/g, '+')
      .replace(/_/g, '/');
    if (!payloadBase64) return true;

    const payload = JSON.parse(atob(payloadBase64)) as { exp?: number };
    return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function encerrarSessaoLocal() {
  localStorage.removeItem(CHAVE_TOKEN);
  localStorage.removeItem(CHAVE_PERFIL);
}

export function possuiSessaoValida(): boolean {
  const token = localStorage.getItem(CHAVE_TOKEN);

  if (!token || tokenExpirado(token)) {
    encerrarSessaoLocal();
    return false;
  }

  return true;
}
