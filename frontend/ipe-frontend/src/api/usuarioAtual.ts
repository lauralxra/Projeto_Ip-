import { UsuarioAtual } from '../dados/usuarios';
import {
  lerNucleosSessao,
  lerUsuarioSessao,
  salvarNucleosSessao,
} from '../routes/sessao';
import { apiFetch } from './cliente';
import {
  fotoDaApi,
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
    imagem: fotoDaApi(usuario.fotoUrl),
    tipo: tipoDoPerfil(usuario.perfil),
    nucleos: lerNucleosSessao<NucleoApi>().map(nucleoDaApi),
    status: usuario.ativo === false ? 0 : 1,
  });
}

export function definirNucleosDoUsuario(nucleos: NucleoApi[]) {
  salvarNucleosSessao(nucleos);
  UsuarioAtual.nucleos = nucleos.map(nucleoDaApi);
}

// GET /nucleos?status=ATIVO devolve apenas núcleos ativos para seletores e cadastros (RN02 / UC026)
export async function carregarNucleosDoUsuario() {
  const { itens } = await apiFetch<{ itens: NucleoApi[] }>(
    '/nucleos?status=ATIVO&limite=100',
  );
  definirNucleosDoUsuario(itens);
  return itens;
}
