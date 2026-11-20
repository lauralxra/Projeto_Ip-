# Relatório de Status: Implementações Concluídas e Pendências Reais

> **Projeto:** IPÊ — Sistema de Gestão de Indicadores  
> **Data de Atualização:** 20/11/2026  
> **Branch de Trabalho:** `fix/correcao-erros` (baseada na `origin/dev` — versão `1.1.0-dev.21`)  
> **Referência:** Casos de Teste do Ciclo RC1 (Planilha de QA e Mapeamento da Equipe)

---

## 1. Visão Geral Executiva

Este documento consolida a auditoria completa realizada na branch `fix/correcao-erros` em comparação com o levantamento de Casos de Teste (CTs) mapeado pela equipe de QA.

- **Total de Itens Auditados:** 13 blocos funcionais (CT-003 a CT-051)
- **Status "Concluído / Validado" no Código:** 12 itens (**92%**)
- **Pendências Reais de Frontend:** 0 itens (UC026 e UC031 concluídos)
- **Melhoria de Usabilidade / Refinamento de UX:** 1 item (**8%**)

---

## 2. Matriz Comparativa Consolidada

| Caso de Teste (CT)        | Funcionalidade                           | Status Apontado pela Equipe | Status Real no Código (`fix/correcao-erros`) | O que fazer / Situação                                                                                                                                            |
| :------------------------ | :--------------------------------------- | :-------------------------: | :------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CT-003.01 a CT-003.05** | Atualizar Foto de Perfil                 |            `ok`             |                **Concluído**                 | Funcional no backend e frontend (`PATCH /api/users/profile/photo`).                                                                                               |
| **CT-005.01 a CT-005.05** | Atualizar E-mail do Usuário              |       `*` (Pendente)        |                **Concluído**                 | Funcional no backend (`PATCH /api/users/profile`) e frontend (`UserbarPopupUser.tsx`) com confirmação de senha atual.                                             |
| **CT-006.01 a CT-006.05** | Atualizar Senha do Próprio Usuário       |   _Caio Atualizar senha_    |                **Concluído**                 | Funcional no backend (`PATCH /api/users/profile/password`) com padrão forte, checagem de senhas comuns, hash bcrypt e e-mail SMTP. Frontend solicita senha atual. |
| **CT-013.01 a CT-013.05** | Encerrar Sessão (Logout)                 |            `ok`             |                **Concluído**                 | Funcional no backend (`POST /api/auth/logout`) e frontend (limpeza de JWT/cookies e redirecionamento para `/login`).                                              |
| **CT-014 e CT-015**       | Visualizar e Enviar Notificações         |      `* (sendo feita)`      |           **Concluído (PR #350)**            | Totalmente integrado. `UserbarPopupNotificacao.tsx` consome `GET`, `POST` e `PATCH` de leitura, e `UserBar.tsx` exibe badge contador em tempo real.               |
| **CT-017.01 a CT-017.05** | Filtrar Dashboard                        |            `ok`             |                **Concluído**                 | Filtros de Ano, Trimestre, Núcleo e Programa funcionais; suporte a visualização focada por indicador específico (`indicadorId`).                                  |
| **CT-025.01 a CT-025.05** | Desativar / Arquivar Núcleo              |    `* (só apaga de vez)`    |                **Concluído**                 | Menu de ações na `TelaNucleos.tsx` com desativar (confirmação + alerta de pendências), reativar, filtro de status e badge (UC026).                                |
| **CT-031.01 a CT-031.05** | Arquivar / Desativar Programa            |       `* (só exclui)`       |                **Concluído**                 | Menu de ações na `TelaProgramas.tsx` com arquivar/reativar e aba `/programas/arquivados` restrita ao ADM (UC031).                                                 |
| **CT-038.1 a CT-038.5**   | Revisar e Aprovar / Devolver Indicadores |    `* (está dando erro)`    |                **Concluído**                 | Endpoints `PATCH /api/registros/:id/aprovar` e `/devolver` funcionam. O erro reportado ocorria ao testar sem perfil Administrador (CT-038.5).                     |
| **CT-039.1 a CT-039.4**   | Justificativa na Devolução               |    `* (arrumar no back)`    |                **Concluído**                 | O backend já exige justificativa via `DevolverRegistroDto` (`@IsNotEmpty`), grava no banco (`justificativaDevolucao`) e audita a ação.                            |
| **CT-041.01 a CT-041.05** | Arquivar / Desativar Indicador           |       `* (só exclui)`       |                **Concluído**                 | Implementado no frontend (`TelaIndicadores.tsx`) com modais de confirmação chamando `PATCH /indicadores/:id/arquivar` e `/desativar`.                             |
| **CT-042.01 a CT-042.05** | Exportar Relatório Consolidado           |     `ok (implementar)`      |                **Concluído**                 | Atendido na `TelaDashboard.tsx` através da exportação consolidada completa em PDF, Excel, CSV e PNG com filtros de período e núcleo.                              |
| **CT-051.01 a CT-051.05** | Remover Meta de Indicador                |    `ok (tá com um erro)`    |         **Concluído / Refinamento**          | A remoção via formulário de edição funciona (`DELETE /metas/:id`). Falta apenas atalho de clique direto na tag de meta do card para atender à risca o CT-051.01.  |

---

## 3. Detalhamento do que JÁ ESTÁ IMPLEMENTADO

### 3.1. Notificações em Tempo Real ([UC014] e [UC015])

- **Arquivos:** `UserbarPopupNotificacao.tsx` e `UserBar.tsx`.
- **Rotas de Backend:**
  - `GET /api/notificacoes`: listagem das notificações do usuário ou gerais.
  - `PATCH /api/notificacoes/:id/read`: marcação individual como lida.
  - `PATCH /api/notificacoes/read-all`: botão "Marcar todas como lidas".
  - `POST /api/notificacoes`: disparo de notificações pelo Administrador.
- **Destaque:** O badge vermelho no sininho da barra superior agora calcula dinamicamente as notificações não lidas e sincroniza ao ler.

### 3.2. Fluxo de Revisão, Aprovação e Devolução ([UC038] e [UC039])

- **Arquivos:** `TelaIndicadores.tsx`, `registro.controller.ts`, `registro.service.ts`.
- **Rotas de Backend:**
  - `PATCH /api/registros/:id/aprovar`: homologação irreversível no ciclo por Administrador.
  - `PATCH /api/registros/:id/devolver`: devolução para correção com justificativa obrigatória.
- **Validações Ativas:**
  - Restrito estritamente a usuários com perfil `ADMINISTRADOR` (CT-038.5).
  - Trava de concorrência com erro `409 Conflict` caso outro gestor já tenha revisado o indicador (CT-038.3).
  - Bloqueio de submissão com justificativa vazia tanto no frontend quanto no backend (`DevolverRegistroDto`).

### 3.3. Arquivamento e Desativação de Indicadores ([UC041])

- **Arquivos:** `TelaIndicadores.tsx`, `indicador.controller.ts`, `indicador.service.ts`.
- **Rotas de Backend:**
  - `PATCH /api/indicadores/:id/arquivar`
  - `PATCH /api/indicadores/:id/desativar`
  - `PATCH /api/indicadores/:id/reativar`
- **Comportamento:** O indicador deixa de receber novos lançamentos de medições, porém seus dados históricos continuam preservados para visualização retroativa no Dashboard.

### 3.4. Gestão de Perfil: Foto, Senha e E-mail ([UC03], [UC05] e [UC06])

- **Arquivos:** `UserbarPopupUser.tsx`, `user.controller.ts`, `user.service.ts`.
- **Rotas de Backend:**
  - `PATCH /api/users/profile/photo` (upload com Multer, pasta segura `/uploads/`).
  - `PATCH /api/users/profile` (atualização de e-mail e nome com checagem de senha atual e unicidade).
  - `PATCH /api/users/profile/password` (alteração de senha com validação de complexidade e aviso por e-mail).

### 3.5. Exportação de Relatórios Consolidados ([UC042])

- **Arquivos:** `TelaDashboard.tsx`.
- **Recursos:**
  - Exportação de PDF executivo completo com resumo de metas, indicadores e gráficos.
  - Exportação para planilha Excel (`.xlsx`) e CSV.
  - Exportação de imagem PNG do painel ou de cards específicos.

---

## 4. Detalhamento das PENDÊNCIAS REAIS a Implementar

> Atualização 20/11/2026: as antigas pendências 1 (Desativar/Arquivar Núcleo — UC026) e 2 (Arquivar/Desativar Programa — UC031) foram implementadas na branch `fix/correcao-erros`. Resta apenas o refinamento abaixo.

### Pendência 3 (Refinamento de UX): Atalho de Remoção de Meta no Card ([UC051] / CT-051)

- **Situação Atual:**
  - Remover meta já funciona abrindo o modal de edição do indicador e desmarcando "Tem meta" (o front executa `DELETE /metas/:id`).
  - O caso de teste CT-051.01 descreve clicar diretamente na tag da meta no card para abrir o popup _"Deseja remover a meta?"_.
- **Ação Recomendada:**
  1. Adicionar evento `onClick` na tag de meta do card para abrir confirmação rápida direta de remoção.

---

## 5. Próximos Passos na Branch `fix/correcao-erros`

1. [x] Implementar ação de **Desativar Núcleo** na interface de `TelaNucleos.tsx`.
2. [x] Implementar ações de **Arquivar e Desativar Programa** na interface de `TelaProgramas.tsx`.
3. [ ] (Opcional) Adicionar clique direto na tag de meta para remoção rápida em `TelaIndicadores.tsx`.
4. [x] Executar bateria de validação de build (`npm run build`) e testes unitários (`npm test`).
5. [ ] Submeter Pull Request para a branch `dev` com as correções de QA consolidadas.
