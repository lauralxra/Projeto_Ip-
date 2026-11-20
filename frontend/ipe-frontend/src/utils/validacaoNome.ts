export const TAMANHO_MIN_NOME_USUARIO = 2;
export const TAMANHO_MAX_NOME_USUARIO = 150;

// Aceita apenas letras (incluindo acentuação Unicode), espaços internos simples,
// hífen ou apóstrofo entre letras. Rejeita números, símbolos, tags HTML,
// scripts maliciosos e caracteres de controle.
export const REGEX_NOME_USUARIO = /^\p{L}+(?:[ '-]\p{L}+)*$/u;

// Detecta de imediato qualquer caractere fora do conjunto permitido enquanto o usuário digita
const REGEX_CARACTERE_PROIBIDO = /[^\p{L} '-]/u;

export const MENSAGEM_NOME_INVALIDO =
  'O nome deve conter apenas letras, espaços, hífen ou apóstrofo (sem números, símbolos ou scripts).';

/**
 * Normaliza Unicode (NFC), remove espaços nas extremidades e colapsa espaços
 * horizontais repetidos. Não remove tags/símbolos silenciosamente para que
 * entradas maliciosas sejam bloqueadas e informadas ao usuário.
 */
export function sanitizarNomeUsuario(valor: string): string {
  return valor.normalize('NFC').replace(/ {2,}/g, ' ').trim();
}

export function contemCaracteresProibidosNome(valor: string): boolean {
  return REGEX_CARACTERE_PROIBIDO.test(valor.normalize('NFC'));
}

export function validarNomeUsuario(valor: string): string | null {
  const sanitizado = sanitizarNomeUsuario(valor);

  if (!sanitizado) {
    return 'O nome não pode estar vazio.';
  }
  if (sanitizado.length < TAMANHO_MIN_NOME_USUARIO) {
    return `O nome deve ter no mínimo ${TAMANHO_MIN_NOME_USUARIO} caracteres.`;
  }
  if (sanitizado.length > TAMANHO_MAX_NOME_USUARIO) {
    return `O nome deve ter no máximo ${TAMANHO_MAX_NOME_USUARIO} caracteres.`;
  }
  if (!REGEX_NOME_USUARIO.test(sanitizado)) {
    return MENSAGEM_NOME_INVALIDO;
  }

  return null;
}
