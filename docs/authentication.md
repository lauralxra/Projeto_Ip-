# Autenticação

## Configuração e deploy

O boot valida a configuração com Joi. Configure três segredos independentes, com
pelo menos 32 caracteres: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` e
`JWT_CSRF_SECRET`. Gere cada um com `openssl rand -hex 32`; não use os placeholders
de `.env.example` em produção. Preserve também `ENCRYPTION_KEY` e `BLIND_INDEX_KEY`
do ambiente LGPD.

Em desenvolvimento/testes, access expira em `15m` e refresh em `7d` por padrão.
Produção exige `JWT_ACCESS_EXPIRES_IN` e `JWT_REFRESH_EXPIRES_IN` explícitos.
As durações devem ser positivas,
de pelo menos um segundo. `JWT_REFRESH_ROTATION_LEEWAY_SECONDS` aceita de 0 a 60
segundos, com padrão 30. Segredos JWT não podem ser iguais entre si.

Com `CORS_CREDENTIALS=true`, `CORS_ORIGIN` deve conter origens completas separadas
por vírgulas, sem wildcard, caminhos ou barra final. Produção sempre exige origens.
`TRUST_PROXY` deve refletir os CIDRs reais do proxy ou um número de hops constante
em todos os caminhos. Sem configuração, nenhum proxy é confiado. Nunca use `true`.
O load balancer deve substituir os headers de encaminhamento recebidos do cliente.

Este deploy pressupõe frontend e API no mesmo site registrável e HTTPS em produção.
Cookies são host-only (sem `Domain`), `SameSite=Lax` e `Secure` em produção.
Cross-site entre sites registráveis diferentes exige revisão dessa política antes
do deploy. Não há rotação automática de segredos: mantenha-os estáveis entre réplicas.

## Contrato HTTP

JWTs de access e refresh contêm `sub`, `role`, `type` e timestamps; refresh também
contém `jti`. Não há email nem nome no JWT. O login consulta o blind index pelo
client estendido e mantém compatibilidade com registros legados.

| Cookie          | HttpOnly | Path        |
| --------------- | -------- | ----------- |
| `access_token`  | sim      | `/`         |
| `refresh_token` | sim      | `/api/auth` |
| `csrf_token`    | não      | `/`         |

O path de refresh acompanha `API_PREFIX`. Os JWTs chegam somente em `Set-Cookie`,
nunca no corpo nem em localStorage.

- `POST /api/auth/register`: 201, retorna `{ message, user }`.
- `POST /api/auth/login`: 200, retorna `{ user, csrfToken }`.
- `POST /api/auth/refresh`: 200, retorna `{ message, csrfToken }`.
- `POST /api/auth/logout`: 200, retorna `{ message }` e limpa os cookies.

Frontend e API em hosts diferentes do mesmo site devem usar `credentials: 'include'`
e guardar o `csrfToken` retornado pelo login/refresh, pois JavaScript
do frontend não lê o cookie host-only da API. Envie esse valor em `X-CSRF-Token`.
Somente esse valor CSRF pode ficar em `sessionStorage` para sobreviver ao reload;
os JWTs continuam exclusivamente em cookies HttpOnly. Sem o valor CSRF, faça novo login.

Refresh e logout exigem igualdade entre cookie/header CSRF e HMAC válido, ligado
ao refresh token apresentado. Cookies CSRF inventados ou copiados de outra sessão
retornam 403, mesmo quando o header coincide. A assinatura usa segredo dedicado,
nonce aleatório e comparação em tempo constante. Referência:
[OWASP signed double-submit](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#signed-double-submit-cookie-recommended).

O logout dispensa access token válido, mas exige refresh cookie e CSRF válido;
sem eles retorna 403. Repetir o mesmo logout com os cookies originais é idempotente.
O access token já emitido continua válido até expirar.

Bearer é desabilitado por padrão. `AUTH_ALLOW_BEARER=true` permite extração em
desenvolvimento/testes; produção sempre ignora Bearer. Isso não dispensa o CSRF
nem os cookies exigidos nas rotas de refresh/logout.

Senhas aceitam 8–72 caracteres, limitadas também a 72 bytes UTF-8 para evitar
truncamento do bcrypt. Emails têm limite de 254 caracteres.

## Rotação e limite de sessões

Cada login cria uma sessão independente. No máximo dez sessões não expiradas
permanecem ativas; logins adicionais revogam as mais antigas com `SESSION_LIMIT`.
Login e rotação usam lock por usuário em transação. A rotação preserva a data de
criação da sessão para não alterar a ordem de expulsão.

O refresh é persistido apenas como hash SHA-256. Cada rotação marca a linha antiga
como `ROTATED` e cria outra com novo `jti`. A assinatura ocorre antes da transação;
uma transação abortada nunca entrega o token pré-calculado.

Retry de `ROTATED` dentro do leeway retorna 409 sem novos cookies. Fora da janela,
o replay revoga as sessões ativas com `REUSE_DETECTED`. Replay de `LOGOUT` ou
`SESSION_LIMIT` retorna 401 sem revogar sessões irmãs.

## Throttling

Login e register: 10/min por IP. Refresh: 30/min por IP. Logout: 10/min por IP.
Login também limita a identidade normalizada, independentemente do IP; refresh
e logout também limitam o hash do refresh token. Os buckets são separados por rota.
Os limites por identidade podem temporariamente bloquear a conta atacada.

Não há Redis nem scheduler declarados no repositório. O storage atual é em memória:
este artefato suporta **uma instância**. Antes de escalar horizontalmente, conectar
storage compartilhado é requisito de produção. Referência:
[NestJS rate limiting](https://docs.nestjs.com/security/rate-limiting).

## Cleanup periódico

Agende no cron externo existente, a cada hora, com diretório de trabalho do projeto
e `DATABASE_URL` provido pelo ambiente do job:

```cron
0 * * * * psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/cleanup-refresh-tokens.sql
```

A tarefa idempotente remove tokens expirados, inclusive revogados. Linhas revogadas
ainda não expiradas são preservadas: são evidência necessária para detectar replay.
Os índices cobrem expiração e seleção das sessões por usuário/revogação/criação.
O cron não foi instalado em nenhuma infraestrutura externa.

## Migration e rollback

`20260910120000_refresh_token_sessions` é aditiva sobre `origin/dev`; preserva
usuários, hashes e linhas existentes. `jti` fica nullable para registros anteriores
e compatibilidade de escrita durante rollback; tokens novos sempre o recebem.
Tokens legados sem as claims exigidas precisam de novo login.

As três migrations `20260831*` da branch foram substituídas; não altere históricos
de bancos onde elas já foram aplicadas sem reconciliá-los antes do deploy.
A validação cobre banco limpo e upgrade com dados legados. Reverter a aplicação
não exige remover as colunas, mas não garante preservação das sessões: a versão
antiga possui outra política de rotação e logout. Evite deploy misto de ambas.
