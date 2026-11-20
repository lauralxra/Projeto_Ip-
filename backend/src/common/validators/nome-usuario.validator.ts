import { BadRequestException } from '@nestjs/common';

export const TAMANHO_MIN_NOME_USUARIO = 2;
export const TAMANHO_MAX_NOME_USUARIO = 150;

// Aceita apenas letras (incluindo acentuação Unicode), espaços simples internos,
// hífen ou apóstrofo entre letras. Rejeita números, símbolos, tags HTML,
// scripts maliciosos e caracteres de controle.
export const REGEX_NOME_USUARIO = /^\p{L}+(?:[ '-]\p{L}+)*$/u;

export const MENSAGEM_NOME_INVALIDO =
  'O nome deve conter apenas letras, espaços, hífen ou apóstrofo (sem números, símbolos ou scripts).';

// Apóstrofos tipográficos (’ ‘ ʼ) que teclados de celular inserem sozinhos
const REGEX_APOSTROFOS_VARIANTES = /[\u2018\u2019\u02BC]/g;

/**
 * Normaliza Unicode (NFC), troca apóstrofos tipográficos pelo simples, remove
 * espaços nas extremidades e colapsa espaços repetidos. Não remove caracteres
 * inválidos/tags silenciosamente para que a validação os rejeite.
 */
export function sanitizarNomeUsuario(valor: unknown): unknown {
  if (typeof valor !== 'string') return valor;
  return valor
    .normalize('NFC')
    .replace(REGEX_APOSTROFOS_VARIANTES, "'")
    .replace(/ {2,}/g, ' ')
    .trim();
}

/**
 * Validação de defesa em profundidade na camada de serviço.
 */
export function validarNomeUsuarioOuFalhar(valor: string): string {
  const sanitizado = sanitizarNomeUsuario(valor) as string;

  if (!sanitizado) {
    throw new BadRequestException('O nome não pode estar vazio.');
  }
  if (sanitizado.length < TAMANHO_MIN_NOME_USUARIO) {
    throw new BadRequestException(
      `O nome deve ter no mínimo ${TAMANHO_MIN_NOME_USUARIO} caracteres.`,
    );
  }
  if (sanitizado.length > TAMANHO_MAX_NOME_USUARIO) {
    throw new BadRequestException(
      `O nome deve ter no máximo ${TAMANHO_MAX_NOME_USUARIO} caracteres.`,
    );
  }
  if (!REGEX_NOME_USUARIO.test(sanitizado)) {
    throw new BadRequestException(MENSAGEM_NOME_INVALIDO);
  }

  return sanitizado;
}
