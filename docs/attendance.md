# Controle de presença

As rotas exigem JWT (`Authorization: Bearer <token>`) e usam o prefixo configurado em `API_PREFIX` (padrão `/api`). Estão documentadas também na tag `attendance` do Swagger.

## Preparação dos dados

- `Cohort.facilitatorId`: instrutor responsável. Pode consultar suas turmas e editar chamadas quando `status = ACTIVE`.
- `Cohort.coordinatorId`: coordenador responsável, opcional. Pode consultar e editar chamadas dessa turma em qualquer estado. O vínculo explícito concede essa responsabilidade; o papel global `ADMIN`, `COMPANY` ou outro não concede acesso a turmas sem vínculo. Turmas legadas ficam sem coordenador até que esse vínculo seja cadastrado pelo fluxo administrativo autorizado.
- `Cohort.startDate` e `endDate`: obrigatórios para abrir ou registrar chamadas novas; limites inclusivos. Chamadas já salvas permanecem acessíveis e editáveis mesmo se o período for alterado ou limpo depois.
- `Enrollment.enrolledAt`: início efetivo do período de matrícula. Matrículas `PENDING` não entram na chamada.
- `Enrollment.endedAt`: data de saída, exclusiva. Um aluno que saiu em `2026-09-09` participa até `2026-09-08`. Deve ser preenchida ao cancelar a matrícula (`DROPPED`). Não há inferência da data de saída para registros legados.
- `Enrollment.completedAt`: usado apenas como fallback de término para matrículas `COMPLETED` sem `endedAt`, inclusive no último dia. Se `endedAt` estiver preenchido, ele prevalece; matrículas `ACTIVE` não são limitadas por `completedAt`.

Essas APIs pressupõem turmas e matrículas existentes. Não incluem CRUD de turma/matrícula nem atribuição pública de coordenadores. O modelo atual representa um período por aluno/turma; correções de datas mantêm presenças já salvas e geram avisos de incompatibilidade. Reingressos com múltiplos períodos não são inferidos.

Datas da chamada usam `AAAA-MM-DD` e PostgreSQL `DATE`. Nas colunas legadas com horário, considera-se o componente de data UTC. A definição de **hoje** usa `America/Recife`, independentemente do fuso do servidor. Datas futuras são bloqueadas.

## Abrir ou recuperar chamada — GET

```http
GET /api/cohorts/{cohortId}/attendance?date=2026-09-09
```

```json
{
  "id": null,
  "cohortId": "UUID_DA_TURMA",
  "date": "2026-09-09",
  "version": 0,
  "status": "OPEN",
  "cancellationReason": null,
  "updatedAt": null,
  "students": [
    {
      "userId": "UUID_DO_ALUNO",
      "name": "Ana Silva",
      "status": "NOT_RECORDED",
      "enrollmentWarning": null
    }
  ],
  "warnings": [],
  "changes": [],
  "changesMeta": { "total": 0, "page": 1, "limit": 10, "totalPages": 0 }
}
```

Abrir a tela não grava nada. `version = 0` e `id = null` indicam uma chamada ainda não salva. A lista reúne alunos elegíveis na data e todos que já possuem registro nessa chamada. Nomes são descriptografados; e-mail, senha e tokens não são retornados.

Uma turma sem alunos elegíveis retorna `students: []` e não permite criar chamada. Matrículas canceladas sem `endedAt` aparecem em `warnings`; se ainda não houver registro preservado desse aluno, é necessário corrigir a matrícula antes de salvar. Registros preservados podem ser corrigidos mesmo com `enrollmentWarning`, sem apagamento automático.

## Salvar ou corrigir chamada — POST

```http
POST /api/cohorts/{cohortId}/attendance
Content-Type: application/json
```

```json
{
  "date": "2026-09-09",
  "version": 0,
  "action": "SAVE",
  "entries": [{ "userId": "UUID_DO_ALUNO", "status": "PRESENT" }]
}
```

Substitua os identificadores dos exemplos por UUIDs reais. A resposta é HTTP 200, no mesmo formato do GET, com `id` preenchido e a nova `version`.

- `action` é opcional e assume `SAVE`.
- Situações graváveis: `PRESENT` (presente), `ABSENT` (ausente) e `NOT_RECORDED` (não registrado). É possível desfazer uma marcação enviando `NOT_RECORDED`.
- `entries` é obrigatório em `SAVE`; aceita `[]`. Na primeira gravação, todos os alunos elegíveis são persistidos, inclusive os não marcados. Em correções, omitir um aluno mantém sua situação anterior.
- Cada aluno aparece no máximo uma vez na requisição. Alunos fora da matrícula válida e sem registro anterior na chamada são rejeitados; a operação inteira é revertida.
- Use sempre a versão recebida do último GET/POST. Ela aumenta em toda gravação aceita, inclusive se as marcações forem iguais.
- Chamada, marcações e auditoria são salvas na mesma transação. Conflitos retornam HTTP 409; a interface deve recarregar e permitir que o instrutor confira as diferenças antes de reenviar. Não repetir automaticamente com uma versão nova.

## Cancelar e reabrir — mesmo POST

```json
{
  "date": "2026-09-09",
  "version": 1,
  "action": "CANCEL",
  "reason": "A aula foi cancelada por falta de energia."
}
```

```json
{
  "date": "2026-09-09",
  "version": 2,
  "action": "REOPEN"
}
```

Essas ações seguem as mesmas permissões de edição e exigem uma chamada existente. `CANCEL` exige motivo não vazio, de até 1000 caracteres. Não envie `entries` nessas ações nem `reason` fora de `CANCEL`.

O cancelamento preserva as marcações e muda `status` para `CANCELLED`. A reabertura recupera a mesma chamada; o motivo continua disponível na auditoria, embora `cancellationReason` volte a `null` no estado aberto. Uma chamada cancelada precisa ser reaberta antes de receber novas marcações.

## Histórico do aluno — GET

```http
GET /api/students/{userId}/attendance?from=2026-09-01&to=2026-09-30&cohortId={cohortId}&page=1&limit=20
```

Todos os filtros são opcionais. `from` e `to` são inclusivos; `from` não pode ser posterior a `to`. `page` começa em 1; `limit` aceita 1–100, com padrão 20.

```json
{
  "data": [
    {
      "id": "UUID_DO_REGISTRO",
      "userId": "UUID_DO_ALUNO",
      "date": "2026-09-09",
      "cohortId": "UUID_DA_TURMA",
      "cohortName": "Turma A",
      "status": "PRESENT",
      "sessionStatus": "CANCELLED",
      "version": 2,
      "cancellationReason": "A aula foi cancelada por falta de energia.",
      "recordedById": "UUID_DO_AUTOR_DA_MARCACAO",
      "enrollmentWarning": null,
      "changes": [],
      "changesMeta": { "total": 0, "page": 1, "limit": 10, "totalPages": 0 }
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
}
```

A consulta retorna apenas registros persistidos em turmas às quais o solicitante está vinculado, em ordem decrescente de data. Inclui `NOT_RECORDED` e chamadas canceladas, sem criar faltas ou dias sem chamada. Um aluno visível sem registros no período retorna `data: []`; um aluno inexistente ou fora do escopo retorna 404. Filtrar explicitamente uma turma sem vínculo retorna 403.

O histórico corresponde à lista efetivamente salva: uma matrícula retroativa passa a aparecer na abertura da chamada, mas só terá registro no histórico após novo `SAVE`. Remover ou corrigir uma matrícula não remove os registros de presença anteriores.

## Auditoria

`changes` contém as mudanças reais; os arrays vazios acima simplificam os exemplos. Cada evento guarda `id`, `sessionId`, `version`, `userId`, `recordedById`, `action`, `previousStatus`, `status`, `reason` e `createdAt`.

`changes` agora é paginado em GET/POST: clientes que consumiam o array como auditoria completa precisam navegar por `changesMeta`. Os GETs de chamada e histórico de aluno aceitam `changesPage` (inteiro de 1 a 1000000, padrão 1) e `changesLimit` (inteiro de 1 a 100, padrão 10). Exemplo: `GET /api/cohorts/:cohortId/attendance?date=2026-09-09&changesPage=2&changesLimit=10`. Cada array acompanha `changesMeta: { total, page, limit, totalPages }`. Página além do fim retorna `changes: []`; sem eventos, `totalPages` é 0.

POST retorna a primeira página com limite 10; navegue nas seguintes pelo GET da chamada. No histórico de aluno, a paginação de eventos se aplica separadamente a cada registro e inclui somente eventos daquele aluno e ações da sessão (`userId: null`); cada registro tem seu próprio `changesMeta`. `page`/`limit` continuam paginando os registros de presença, com padrão de 20 registros.

Eventos seguem ordem crescente por `version`, `createdAt` e `id`, preservando a posição das páginas anteriores quando novas versões são salvas. Uma página pode dividir os eventos de uma versão. Cada resposta consulta eventos e contagem na mesma transação; entre requisições, novas versões podem aumentar o total. A validação de salvamento não carrega eventos. O limite reduz dados carregados e transferidos; contagens exatas e offsets altos ainda têm custo proporcional ao histórico consultado.

Uma ação `SAVE` gera um evento da chamada (`userId = null`) e um evento por situação criada/alterada. `CANCEL` e `REOPEN` geram eventos da chamada. `version` ordena e agrupa as ações mesmo quando ocorrem no mesmo milissegundo. O GET da chamada permite navegar por toda sua auditoria; o histórico do aluno retorna apenas eventos desse aluno e eventos da chamada, sem marcações de outros alunos.

O autor vem da autenticação, nunca do corpo da requisição. Não há endpoint para apagar a auditoria. Chaves estrangeiras impedem excluir turmas ou usuários referenciados por presença/auditoria.

## Erros

```json
{
  "statusCode": 409,
  "timestamp": "2026-09-09T15:00:00.000Z",
  "path": "/api/cohorts/UUID_DA_TURMA/attendance",
  "code": "ATTENDANCE_VERSION_CONFLICT",
  "message": "A chamada ou seus dados foram alterados por outra operação. Recarregue a chamada, confira as marcações e envie a versão atual antes de salvar novamente."
}
```

| HTTP | Código/situação                                                                                                                             | Correção                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 400  | Campos inválidos, `ATTENDANCE_INVALID_ID`, `ATTENDANCE_INVALID_DATE`, `ATTENDANCE_INVALID_PERIOD`                                           | Corrigir UUID, formato/data real, filtros ou campos indicados em `message`.                      |
| 400  | `ATTENDANCE_ENTRIES_REQUIRED`, `ATTENDANCE_ENTRIES_NOT_ALLOWED`, `ATTENDANCE_REASON_NOT_ALLOWED`, `ATTENDANCE_CANCELLATION_REASON_REQUIRED` | Ajustar os campos à ação solicitada.                                                             |
| 401  | JWT ausente, inválido ou expirado                                                                                                           | Autenticar novamente.                                                                            |
| 403  | `ATTENDANCE_ACCESS_DENIED`, `ATTENDANCE_COHORT_NOT_ACTIVE`                                                                                  | Verificar vínculo; turmas não ativas exigem o coordenador responsável.                           |
| 404  | `COHORT_NOT_FOUND`, `ATTENDANCE_SESSION_NOT_FOUND`, `ATTENDANCE_STUDENT_NOT_FOUND`                                                          | Verificar os identificadores e a existência da chamada/aluno no escopo autorizado.               |
| 409  | `ATTENDANCE_VERSION_CONFLICT`, `ATTENDANCE_REFERENCE_CONFLICT`                                                                              | Recarregar e conferir os dados antes de reenviar. Nenhuma alteração parcial é aplicada.          |
| 422  | `COHORT_PERIOD_UNDEFINED`, `ATTENDANCE_FUTURE_DATE`, `ATTENDANCE_OUTSIDE_COHORT_PERIOD`                                                     | Corrigir período da turma ou selecionar uma data permitida.                                      |
| 422  | `ATTENDANCE_EMPTY_ROSTER`, `ATTENDANCE_STUDENT_NOT_ENROLLED`, `ENROLLMENT_PERIOD_UNKNOWN`                                                   | Conferir alunos e período das matrículas.                                                        |
| 422  | `ATTENDANCE_INVALID_TRANSITION`                                                                                                             | Cancelar apenas chamadas abertas; reabrir apenas chamadas canceladas.                            |
| 503  | `ATTENDANCE_DATABASE_UNAVAILABLE`                                                                                                           | Aguardar disponibilidade e recarregar antes de tentar salvar.                                    |
| 500  | `ATTENDANCE_INTERNAL_ERROR`                                                                                                                 | Informar código, turma/aluno e horário ao suporte; detalhes técnicos ficam nos logs do servidor. |

Erros do `ValidationPipe` seguem o envelope existente: `message` pode ser uma lista de mensagens e `code` pode estar ausente. Campos extras são rejeitados.

## Migração e verificação

```sh
npm ci
npm run prisma:generate
npx prisma migrate deploy
npm run build
npm run test:unit -- --runInBand
```

A migração `20260909120000_attendance_control` cria uma chamada por turma/dia para registros antigos e um evento `IMPORT` por presença, preservando autor, situação e horário conhecidos. `LATE` e `JUSTIFIED` antigos continuam legíveis, mas não são aceitos em novas marcações. Não são inventados registros de alunos não marcados nem correções anteriores desconhecidas.

Essa migração mantém `ACCESS EXCLUSIVE` em `Attendance` desde a pré-checagem até o commit, bloqueando leituras e escritas durante o backfill e a conversão para `DATE`. Execute em janela de manutenção; antes de produção, meça a duração em uma cópia com volume e índices representativos e verifique transações longas que possam atrasar a aquisição do lock. Uma pré-checagem externa ajuda a detectar colisões antes da janela, mas não substitui a checagem protegida contra escritas concorrentes. Reduzir o lock inicial ainda exigiria exclusividade na conversão de coluna e deve ser ensaiado separadamente; não altere uma migração já aplicada.

Antes da janela, execute a pré-checagem somente de leitura (requer `psql` e `DATABASE_URL`):

```sh
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f test/attendance/preflight.sql
```

O comando falha em colisões de dia UTC e limita o scan a 60 segundos. Não reduz o lock da migração nem garante ausência de novas colisões após sua execução. Uma migração posterior não encurta o lock de uma anterior; Q10 permanece como limitação operacional até uma estratégia de instalação futura ser ensaiada e aprovada. Mover apenas o lock para depois do backfill permitiria alterações concorrentes sem correspondente sessão/auditoria.

Se dois registros legados do mesmo aluno/turma caírem no mesmo dia UTC, a migração falha atomicamente com os identificadores conflitantes. É necessário reconciliar esses dados antes de reaplicar; nenhum registro é deduplicado ou apagado automaticamente.

Os testes HTTP de presença usam PostgreSQL real, autenticação real e dados únicos por cenário, em banco **exclusivo de testes**, já migrado. O fluxo e2e do projeto (`npm run test:e2e`, com docker) provisiona esse banco automaticamente — com `migrate deploy` — e executa a suíte de presença e a regressão da migração (`test/attendance/migration.test.cjs`) após o e2e principal. Para rodar só a presença manualmente:

```sh
ATTENDANCE_TEST_DATABASE_URL=postgresql://usuario:senha@localhost:5432/attendance_test npm run test:attendance
```

O comando não migra nem limpa o banco; os dados de teste permanecem nele. Não depende do fluxo E2E antigo de reset do projeto. Percentual de frequência, calendário e múltiplas chamadas por dia ficam fora desta entrega.
