import { API_BASE_URL } from '../config/api';
import { encerrarSessaoLocal } from '../routes/sessao';

// Respostas 401 do JwtAuthGuard: o token deixou de valer (expirou, ou as sessões
// foram encerradas, ex.: senha recuperada em outro aparelho). Outros 401, como
// "Senha atual incorreta", não derrubam a sessão.
const MENSAGENS_SESSAO_INVALIDA = [
  'Token de acesso não informado.',
  'Sessão encerrada. Faça login novamente.',
  'Token de acesso inválido ou expirado.',
];

export class ErroApi extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// fetch com o token da sessão, JSON automático e a mensagem de erro do backend
export async function apiFetch<T>(
  caminho: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = localStorage.getItem('access_token');

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    ...init,
    headers,
  });

  const texto = await resposta.text();
  let dados: unknown = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    dados = texto;
  }

  if (!resposta.ok) {
    const mensagem = (dados as { message?: string | string[] } | null)?.message;

    // BUG-UC13.4: também cobre a requisição feita sem token (logout em outra aba)
    if (
      resposta.status === 401 &&
      typeof mensagem === 'string' &&
      MENSAGENS_SESSAO_INVALIDA.includes(mensagem)
    ) {
      encerrarSessaoLocal();
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
        // A página vai ser trocada: não propaga o erro, para a tela não
        // exibir um alerta antes do redirecionamento
        return new Promise<T>(() => {});
      }
    }

    throw new ErroApi(
      Array.isArray(mensagem)
        ? mensagem.join(' ')
        : mensagem || `Erro ${resposta.status} ao acessar a API.`,
      resposta.status,
    );
  }

  return dados as T;
}

// Endereço público de um arquivo enviado (ex.: /uploads/nucleos/x.png)
export function urlDoArquivo(caminho: string): string {
  return `${API_BASE_URL}${caminho}`;
}

export function mensagemDeErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Erro inesperado.';
}
