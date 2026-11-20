export const TAMANHO_MIN_NOME_USUARIO = 2;
export const TAMANHO_MAX_NOME_USUARIO = 150;

// Aceita apenas letras (incluindo acentuação Unicode), espaços internos simples,
// hífen ou apóstrofo entre letras. Rejeita números, símbolos, tags HTML,
// scripts maliciosos e caracteres de controle.
export const REGEX_NOME_USUARIO = /^\p{L}+(?:[ '-]\p{L}+)*$/u;

// Qualquer caractere fora do conjunto permitido (letras, espaço, hífen, apóstrofo)
const REGEX_CARACTERES_PROIBIDOS = /[^\p{L} '-]/gu;

// Apóstrofos tipográficos (’ ‘ ʼ) que teclados de celular inserem sozinhos
const REGEX_APOSTROFOS_VARIANTES = /[\u2018\u2019\u02BC]/g;

export const MENSAGEM_NOME_INVALIDO =
  'O nome deve conter apenas letras, espaços, hífen ou apóstrofo (sem números, símbolos ou scripts).';

/**
 * Normaliza Unicode (NFC), troca apóstrofos tipográficos pelo simples, remove
 * espaços nas extremidades e colapsa espaços repetidos.
 */
export function sanitizarNomeUsuario(valor: string): string {
  return valor
    .normalize('NFC')
    .replace(REGEX_APOSTROFOS_VARIANTES, "'")
    .replace(/ {2,}/g, ' ')
    .trim();
}

/**
 * Aplicado a cada tecla/colagem: descarta números e símbolos para que eles nem
 * cheguem ao campo. Não faz trim no fim, para não engolir o espaço entre
 * palavras enquanto a pessoa digita.
 */
export function filtrarDigitacaoNome(valor: string): string {
  return valor
    .normalize('NFC')
    .replace(REGEX_APOSTROFOS_VARIANTES, "'")
    .replace(/\s/g, ' ')
    .replace(REGEX_CARACTERES_PROIBIDOS, '')
    .replace(/ {2,}/g, ' ')
    .replace(/^ +/, '');
}

// Só valida quando o nome mudou: nomes antigos fora da regra não podem travar
// a edição de e-mail, senha, foto, perfil ou núcleos do usuário
export function nomeFoiAlterado(valor: string, original: string): boolean {
  return sanitizarNomeUsuario(valor) !== sanitizarNomeUsuario(original);
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
