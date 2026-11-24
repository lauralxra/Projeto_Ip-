import { NucleosCadastrados, type Nucleo } from '../dados/nucleos';
import type { TipoDeConta, Usuario } from '../dados/usuarios';
import { urlDoArquivo } from './cliente';

// Perfis do backend (enum Role) <-> siglas usadas nas telas
export type PerfilApi =
  | 'ADMINISTRADOR'
  | 'DIRETORES_NUCLEOS'
  | 'EQUIPE_GESTAO'
  | 'EQUIPE_COMUNICACAO';

const PERFIL_PARA_TIPO: Record<PerfilApi, TipoDeConta> = {
  ADMINISTRADOR: 'ADM',
  DIRETORES_NUCLEOS: 'DN',
  EQUIPE_GESTAO: 'EG',
  EQUIPE_COMUNICACAO: 'EC',
};

const TIPO_PARA_PERFIL: Record<TipoDeConta, PerfilApi> = {
  ADM: 'ADMINISTRADOR',
  DN: 'DIRETORES_NUCLEOS',
  EG: 'EQUIPE_GESTAO',
  EC: 'EQUIPE_COMUNICACAO',
};

export function tipoDoPerfil(perfil?: string | null): TipoDeConta {
  return PERFIL_PARA_TIPO[perfil as PerfilApi] ?? 'EC';
}

export function perfilDoTipo(tipo: string): PerfilApi {
  return TIPO_PARA_PERFIL[tipo as TipoDeConta] ?? 'EQUIPE_COMUNICACAO';
}

// A API não devolve senha; o campo de senha dos formulários é obrigatório, então
// usamos um marcador e só consideramos a senha alterada se ele for trocado
export const SENHA_OCULTA = '********';

export interface NucleoApi {
  id: string;
  nome: string;
  sigla: string;
  descricao?: string | null;
  imagemUrl?: string | null;
  status?: 'ATIVO' | 'INATIVO' | 'ARQUIVADO';
}

// Mantém a identidade visual dos núcleos conhecidos (cor e logo) pela sigla.
// A imagem enviada pelo administrador tem prioridade sobre o logo padrão.
export function nucleoDaApi(item: NucleoApi): Nucleo {
  const visual = NucleosCadastrados.find(
    (n) => n.sigla.toLowerCase() === item.sigla.toLowerCase(),
  );
  const icone = item.imagemUrl ? urlDoArquivo(item.imagemUrl) : visual?.icone;

  return {
    id: item.id,
    nome: item.nome,
    sigla: item.sigla,
    descricao: item.descricao ?? '',
    status: item.status ?? 'ATIVO',
    corBg: visual?.corBg ?? 'bg-[#832b62]',
    corIcone: visual?.corIcone ?? 'text-white',
    icone,
    logoTexto: icone ? undefined : item.sigla,
  };
}

export interface UsuarioApi {
  id: string;
  nome: string;
  email: string;
  fotoUrl?: string | null;
  perfil?: string | null;
  ativo?: boolean;
  nucleos?: { nucleo: NucleoApi }[];
}

// Foto do usuário: caminho da API (/uploads/...) vira o endereço público
export function fotoDaApi(fotoUrl?: string | null): string | undefined {
  return fotoUrl ? urlDoArquivo(fotoUrl) : undefined;
}

// Endereço para exibir `Usuario.imagem`: fotos da API já vêm com o endereço
// completo; nomes de arquivo (dados de exemplo) ficam em /src/assets
export function urlDaImagem(imagem?: string): string | undefined {
  if (!imagem) return undefined;
  return imagem.includes('/') ? imagem : '/src/assets/' + imagem;
}

export function usuarioDaApi(item: UsuarioApi): Usuario {
  return {
    id: item.id,
    nome: item.nome,
    email: item.email,
    senha: SENHA_OCULTA,
    imagem: fotoDaApi(item.fotoUrl),
    tipo: tipoDoPerfil(item.perfil),
    nucleos: (item.nucleos ?? []).map((v) => nucleoDaApi(v.nucleo)),
    status: item.ativo === false ? 0 : 1,
  };
}
