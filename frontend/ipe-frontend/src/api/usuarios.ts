import { UsuarioAtual } from '../dados/usuarios';
import { atualizarUsuarioSessao } from '../routes/sessao';
import { apiFetch } from './cliente';
import { fotoDaApi } from './mapeadores';

// Envia a foto: a do próprio usuário vai para /users/profile/photo; a de outro
// usuário (só a Administração) para /users/:id/photo
export async function enviarFotoUsuario(userId: string, arquivo: File) {
  const formulario = new FormData();
  formulario.append('photo', arquivo);

  const proprio = userId === UsuarioAtual.id;
  const { fotoUrl } = await apiFetch<{ fotoUrl: string }>(
    proprio ? '/users/profile/photo' : `/users/${userId}/photo`,
    { method: 'PATCH', body: formulario },
  );

  if (proprio) {
    UsuarioAtual.imagem = fotoDaApi(fotoUrl);
    atualizarUsuarioSessao({ fotoUrl });
  }
}

// A API exige a senha atual para o próprio usuário trocar a senha ou o e-mail.
// O formulário tem um campo de senha só, então a senha atual é pedida à parte.
// Devolve null se o usuário cancelar.
export function pedirSenhaAtual(motivo: string): string | null {
  const senha = window.prompt(`Para ${motivo}, digite a sua senha atual:`);
  return senha ? senha : null;
}

export async function trocarPropriaSenha(novaSenha: string) {
  const senhaAtual = pedirSenhaAtual('trocar a senha');
  if (!senhaAtual) {
    throw new Error(
      'Troca de senha cancelada: a senha atual não foi informada.',
    );
  }

  await apiFetch('/users/profile/password', {
    method: 'PATCH',
    body: JSON.stringify({
      currentPassword: senhaAtual,
      newPassword: novaSenha,
      confirmNewPassword: novaSenha,
    }),
  });
}
