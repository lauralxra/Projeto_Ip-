import { UsuarioAtual } from '../dados/usuarios';
import {
  lerNucleosSessao,
  lerUsuarioSessao,
  salvarNucleosSessao,
} from '../routes/sessao';
import { apiFetch, urlDoArquivo } from './cliente';
import {
  nucleoDaApi,
  SENHA_OCULTA,
  tipoDoPerfil,
  type NucleoApi,
} from './mapeadores';

// As telas leem UsuarioAtual de forma síncrona; aqui ele é preenchido com o
// usuário logado (localStorage) em vez dos dados de exemplo
export function aplicarSessaoAoUsuarioAtual() {
  const usuario = lerUsuarioSessao();
  if (!usuario) return;

  Object.assign(UsuarioAtual, {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    senha: SENHA_OCULTA,
    imagem: usuario.fotoUrl ? urlDoArquivo(usuario.fotoUrl) : undefined,
    tipo: tipoDoPerfil(usuario.perfil),
    nucleos: lerNucleosSessao<NucleoApi>().map(nucleoDaApi),
    status: usuario.ativo === false ? 0 : 1,
  });
}

export function definirNucleosDoUsuario(nucleos: NucleoApi[]) {
  salvarNucleosSessao(nucleos);
  UsuarioAtual.nucleos = nucleos.map(nucleoDaApi);
}

// GET /nucleos devolve todos para ADM/EC e só os vinculados para DN/EG (RN02)
export async function carregarNucleosDoUsuario() {
  const { itens } = await apiFetch<{ itens: NucleoApi[] }>(
    '/nucleos?limite=100',
  );
  definirNucleosDoUsuario(itens);
  return itens;
}
