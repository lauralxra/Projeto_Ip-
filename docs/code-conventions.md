# Code Conventions

## Comandos

Rode na raiz do repositório (após `npm install` na raiz e em `backend/`):

| Comando                | Descrição                |
| ---------------------- | ------------------------ |
| `npm run lint`         | Verifica erros           |
| `npm run lint:fix`     | Auto-corrige             |
| `npm run format`       | Formata código           |
| `npm run format:check` | Verifica formatação (CI) |

## ESLint

- Config única: `eslint.config.mjs` na raiz (flat config); `backend/eslint.config.mjs` apenas a reexporta
- Plugins: `@eslint/js`, `typescript-eslint`, `eslint-plugin-prettier`

## Regras Customizadas

| Regra                  | Código                | Testes |
| ---------------------- | --------------------- | ------ |
| `no-floating-promises` | error                 | error  |
| `no-unsafe-*`          | error                 | warn   |
| `no-explicit-any`      | error                 | warn   |
| `no-unused-vars`       | error (`^_` ignorado) | error  |

## Prettier

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "endOfLine": "lf"
}
```

O `.gitattributes` força `eol=lf`, então o checkout no Windows também usa LF.
