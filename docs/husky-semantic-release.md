# Husky & Semantic Release

## Hooks

- **pre-commit**: Lint-staged (ESLint + Prettier nos arquivos staged)
- **commit-msg**: Valida Conventional Commits

## Commits

Formato: `<tipo>(<escopo>): <descrição>`

**Tipos:**

| Tipo       | Descrição           | Version |
| ---------- | ------------------- | ------- |
| `feat`     | Nova funcionalidade | minor   |
| `fix`      | Bug fix             | patch   |
| `docs`     | Documentação        | -       |
| `refactor` | Refatoração         | -       |
| `test`     | Testes              | -       |
| `chore`    | Manutenção          | -       |

**Exemplo:** `feat(auth): add password reset`

## Lint-Staged

```json
{
  "backend/**/*.ts": ["eslint --fix", "prettier --write"],
  "*.{js,mjs,cjs,json,md,yml,yaml}": ["prettier --write"]
}
```

## Scripts (raiz)

- `npm install` - Instala as ferramentas e ativa os hooks (`prepare: husky`)
- `npm run release` - Executa release
- `npm run release:dry` - Simula release (exige `GITHUB_TOKEN`)

## CI (`.github/workflows/ci.yml`)

1. **quality** (push e PR em `main`/`dev`): commitlint, `format:check` e `lint`
2. **release** (push em `main`/`dev`): `semantic-release` gera versão, `CHANGELOG.md`, tag e GitHub Release (`dev` = prerelease)

## Troubleshooting

```bash
# Reinstalar hooks
npm run prepare

# Testar mensagem
echo "feat: test" | npx commitlint
```
