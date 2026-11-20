const CHAVE_TOKEN = 'access_token';
const CHAVE_PERFIL = 'user_role';
const CHAVE_USUARIO = 'user_data';
const CHAVE_NUCLEOS = 'user_nucleos';

// Dados do usuário logado devolvidos pelo POST /auth/login
export interface UsuarioSessao {
  id: string;
  nome: string;
  email: string;
  fotoUrl?: string | null;
  perfil: string;
  ativo?: boolean;
}

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

function lerJson<T>(chave: string): T | null {
  try {
    const valor = localStorage.getItem(chave);
    return valor ? (JSON.parse(valor) as T) : null;
  } catch {
    return null;
  }
}

export function salvarSessao(token: string, usuario: UsuarioSessao) {
  localStorage.setItem(CHAVE_TOKEN, token);
  localStorage.setItem(CHAVE_PERFIL, usuario.perfil);
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

export function lerUsuarioSessao(): UsuarioSessao | null {
  return lerJson<UsuarioSessao>(CHAVE_USUARIO);
}

export function atualizarUsuarioSessao(dados: Partial<UsuarioSessao>) {
  const atual = lerUsuarioSessao();
  if (atual) {
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify({ ...atual, ...dados }));
  }
}

// Núcleos do usuário logado, como vieram da API (GET /nucleos já filtra pelo perfil)
export function salvarNucleosSessao(nucleos: unknown[]) {
  localStorage.setItem(CHAVE_NUCLEOS, JSON.stringify(nucleos));
}

export function lerNucleosSessao<T>(): T[] {
  return lerJson<T[]>(CHAVE_NUCLEOS) ?? [];
}

export function encerrarSessaoLocal() {
  localStorage.removeItem(CHAVE_TOKEN);
  localStorage.removeItem(CHAVE_PERFIL);
  localStorage.removeItem(CHAVE_USUARIO);
  localStorage.removeItem(CHAVE_NUCLEOS);
}

export function possuiSessaoValida(): boolean {
  const token = localStorage.getItem(CHAVE_TOKEN);

  // Sem os dados do usuário (sessão antiga) também pede um novo login
  if (!token || tokenExpirado(token) || !lerUsuarioSessao()) {
    encerrarSessaoLocal();
    return false;
  }

  return true;
}
