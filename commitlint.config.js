/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  // Commits já publicados que não podem ser reescritos (88db937, em origin/backend)
  ignores: [
    (message) =>
      message.startsWith(
        'fix: Teste e Correção da API para Login, Cadastro e Atualização do Usuário',
      ),
  ],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'build',
        'revert',
      ],
    ],
    'body-max-line-length': [2, 'always', 500],
    'header-max-length': [2, 'always', 150],
  },
};
