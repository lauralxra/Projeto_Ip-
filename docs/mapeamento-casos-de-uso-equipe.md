# Mapeamento Oficial de Casos de Uso (UCs) — Projeto IPÊ

### Cruzamento entre Planejamento (Planilha RC1) e Execução Real (Histórico de Commits no Git)

> **Repositório:** `Projeto_Ip-` (Fork / Branch `feat/importacao` vinculado à Organização)  
> **Base de Análise:** 279 commits do Git, 38 Pull Requests integrados, planilha de Casos de Testes RC1.  
> **Data de Consolidação:** 18/11/2026

---

## 📊 Visão Geral dos 51 Casos de Uso

- **Total de Casos de Uso:** 51
- **Status "Done" (Concluídos e Testados):** 41 UCs (100% dos UCs planejados para o ciclo RC1)
- **Status "Not Planned" (Fora de Escopo do Ciclo Atual):** 10 UCs (Acessibilidade, Chatbot, Fórum)

---

## 📑 Tabela Consolidada para a Organização do GitHub

| UC          | Funcionalidade                                     | Responsável (Planilha RC1) |     Status Organização     | Quem Desenvolveu / Implementou no Git   | PRs / Commits de Referência                              |
| :---------- | :------------------------------------------------- | :------------------------- | :------------------------: | :-------------------------------------- | :------------------------------------------------------- |
| **[UC01]**  | Realizar Login                                     | Caio                       |          **Done**          | Caio, Gabriel Aguiar, Lucas Costa       | PR #287, PR #296, PR #320                                |
| **[UC02]**  | Recuperar Senha                                    | Caio                       |          **Done**          | Caio, Lucas Costa                       | PR #317, PR #319, PR #325                                |
| **[UC03]**  | Atualizar Foto de Perfil                           | Caio                       |          **Done**          | Lucas Costa, Caio                       | PR #313 (`feat/atualizar-foto-perfil`)                   |
| **[UC04]**  | Atualizar Nome                                     | Caio                       |          **Done**          | João Moraes, Gabriel Aguiar             | PR #298 (`feat/atualizar-nome-usuario`)                  |
| **[UC05]**  | Atualizar E-mail                                   | Caio                       |          **Done**          | Laura Cavalcante, Lucas Costa           | PR #343 (`commit d297344d`)                              |
| **[UC06]**  | Atualizar Senha                                    | Gabriel                    |          **Done**          | Caio, Lucas Costa                       | PR #319 (`feat/alterar-senha`), PR #325                  |
| **[UC07]**  | Gerenciar Acessos e Permissões (RBAC)              | Giovanna                   |          **Done**          | Lucas Costa                             | PR #314 (`feat/rbac-permissions`), PR #337               |
| **[UC08]**  | Cadastrar novo usuário                             | Giovanna                   |          **Done**          | Lucas Costa, Gabriel Aguiar             | PR #289 (`feat/cadastrar-user`), PR #320                 |
| **[UC09]**  | Controle de Acessibilidade (Daltonismo)            | _Não incluso_              |      **Not Planned**       | _Nenhum_                                | Fora do escopo RC1                                       |
| **[UC010]** | Controle de Acessibilidade (Audiodescrição)        | _Não incluso_              |      **Not Planned**       | _Nenhum_                                | Fora do escopo RC1                                       |
| **[UC011]** | Alterar Tamanho da Fonte                           | _Não incluso_              |      **Not Planned**       | _Nenhum_                                | Fora do escopo RC1                                       |
| **[UC012]** | Núcleos Associados ao Usuário                      | _Não incluso_              |      **Done (Extra)**      | João Moraes, Lucas Costa                | PR #307 (`feat/rf12-nucleos-associados`), PR #332        |
| **[UC013]** | Encerrar Sessão (Logout)                           | Gabriel                    |          **Done**          | João Moraes, Lucas Costa                | PR #302 (`codex/rf13-logout`), PR #320                   |
| **[UC014]** | Visualizar notificação                             | Gabriel                    |          **Done**          | Caio, Lucas Costa                       | PR #325, PR #332 (`feat/notificacoes`)                   |
| **[UC015]** | Enviar Notificação (SMTP / Cron)                   | Gabriel                    |          **Done**          | Caio, Lucas Costa                       | PR #317 (`feat/mail-module`), PR #325, PR #332           |
| **[UC016]** | Visualizar Indicadores e Metas Alcançadas          | Gabriel                    |          **Done**          | Lucas Costa, Laura Cavalcante           | PR #297, PR #309, PR #343                                |
| **[UC017]** | Filtrar Dashboard (por Núcleo, Indicador, Período) | **Laura**                  |          **Done**          | **Laura Cavalcante**, João Moraes       | PR #308, PR #343 (`commits 1250e6dc, c360b526`)          |
| **[UC018]** | Alterar Tipo de Gráfico e Estilo/Cores             | João Vitor                 |          **Done**          | João Moraes, **Laura Cavalcante**       | PR #315, PR #343 (`commit 41c57426`)                     |
| **[UC019]** | Exportar Gráficos (PNG / PDF)                      | samêque                    |          **Done**          | **Laura Cavalcante**, Gabriel Aguiar    | PR #303, PR #343 (`commit 195a00dc`)                     |
| **[UC020]** | Suporte Chatbot                                    | _Não incluso_              |      **Not Planned**       | _Nenhum_                                | Fora do escopo RC1                                       |
| **[UC021]** | Cadastrar Núcleo                                   | samêque                    |          **Done**          | Lucas Costa                             | PR #293 (`feat/cadastrar-nucleo`)                        |
| **[UC022]** | Pesquisar Núcleo                                   | João Vitor                 |          **Done**          | Lucas Costa, João Moraes                | PR #295 (`feat/pesquisar-nucleo`)                        |
| **[UC023]** | Visualizar Núcleo                                  | João Vitor                 |          **Done**          | Lucas Costa, João Moraes                | PR #310, PR #312 (`feat/visualizar-nucleo`)              |
| **[UC024]** | Atualizar Núcleo                                   | samêque                    |          **Done**          | **Laura Cavalcante**                    | PR #343 (`commit e0a20961`)                              |
| **[UC025]** | Desativar / Arquivar Núcleo                        | Lucas                      |          **Done**          | Lucas Costa, João Moraes                | PR #306 (`feat/rf25-desativar-nucleo`)                   |
| **[UC026]** | Excluir Núcleo (Soft Delete com Auditoria)         | Lucas                      |          **Done**          | Lucas Costa                             | PR #294 (`feat/excluir-nucleo`)                          |
| **[UC027]** | Cadastrar Programa                                 | Lucas                      |          **Done**          | Caio, Lucas Costa                       | PR #326 (`feat/programas-crud`)                          |
| **[UC028]** | Pesquisar Programa                                 | Lucas                      |          **Done**          | Caio, Lucas Costa                       | PR #326 (`feat/programas-crud`)                          |
| **[UC029]** | Visualizar Programas                               | Lucas                      |          **Done**          | Caio, Lucas Costa                       | PR #326 (`feat/programas-crud`)                          |
| **[UC030]** | Atualizar Programa                                 | samêque                    |          **Done**          | Caio, Lucas Costa                       | PR #326 (`feat/programas-crud`)                          |
| **[UC031]** | Arquivar / Desativar Programa                      | João Vitor                 |          **Done**          | Caio, Lucas Costa                       | PR #326 (`feat/programas-crud`)                          |
| **[UC032]** | Excluir Programa                                   | João Vitor                 |          **Done**          | Caio, Lucas Costa                       | PR #326 (`feat/programas-crud`)                          |
| **[UC033]** | Cadastrar Indicador                                | Phellipe                   |          **Done**          | Lucas Costa, **Laura Cavalcante**       | PR #297, PR #322, PR #343                                |
| **[UC034]** | Pesquisar e Visualizar Indicadores                 | Phellipe                   |          **Done**          | Lucas Costa, **Laura Cavalcante**       | PR #297, PR #322, PR #343                                |
| **[UC035]** | Preencher / Editar Dados de um Indicador           | Phellipe                   |          **Done**          | Caio, Lucas Costa, **Laura Cavalcante** | PR #327, PR #335, PR #343 (`commits 66bf0135, 8a058caf`) |
| **[UC036]** | Importar Dados via Arquivo CSV e Excel             | Wallyson                   |          **Done**          | **Laura Cavalcante**, Lucas Costa       | PR #305, PR #343 (`commits 3f31438a, f7365d1c`)          |
| **[UC037]** | Enviar Dados para Análise ("Em Análise")           | Wallyson                   |          **Done**          | Caio, Lucas Costa                       | PR #331 (`feat/fluxo-aprovacao`), PR #337                |
| **[UC038]** | Revisar e Aprovar / Devolver Indicadores           | Phellipe                   |          **Done**          | Caio, Lucas Costa                       | PR #331 (`feat/fluxo-aprovacao`), PR #337                |
| **[UC039]** | Justificativa na Devolução / Correção              | Phellipe                   |          **Done**          | Caio, Lucas Costa                       | PR #331 (`feat/fluxo-aprovacao`), PR #337                |
| **[UC040]** | Atualizar Estrutura do Indicador                   | Wallyson                   |          **Done**          | **Laura Cavalcante**, Lucas Costa       | PR #322, PR #343 (`commit 0de77033`)                     |
| **[UC041]** | Arquivar / Desativar Indicador                     | Wallyson                   |          **Done**          | Lucas Costa, **Laura Cavalcante**       | PR #322, PR #343                                         |
| **[UC042]** | Exportar Relatório Consolidado de Indicadores      | Wallyson                   |          **Done**          | **Laura Cavalcante**, Gabriel Aguiar    | PR #303, PR #343 (`commit 195a00dc`)                     |
| **[UC043]** | Acessar Fórum                                      | _Não incluso_              |      **Not Planned**       | _Nenhum_                                | Fora do escopo RC1                                       |
| **[UC044]** | Criar Publicação                                   | _Não incluso_              |      **Not Planned**       | _Nenhum_                                | Fora do escopo RC1                                       |
| **[UC045]** | Responder Publicação                               | _Não incluso_              |      **Not Planned**       | _Nenhum_                                | Fora do escopo RC1                                       |
| **[UC046]** | Editar Publicação                                  | _Não incluso_              |      **Not Planned**       | _Nenhum_                                | Fora do escopo RC1                                       |
| **[UC047]** | Excluir Publicação                                 | _Não incluso_              |      **Not Planned**       | _Nenhum_                                | Fora do escopo RC1                                       |
| **[UC048]** | Visualizar Histórico de Registros e Auditoria      | **Laura**                  |  **Done (Implementado)**   | **Laura Cavalcante**                    | PR #343 (`commit 96e02b35`)                              |
| **[UC049]** | Restaurar Registros Excluídos/Arquivados           | **Laura**                  | **Not Planned (Planilha)** | Lucas Costa (reativação no backend)     | PR #335 (`commit b2ada9a0`)                              |
| **[UC050]** | Definir Meta para Indicador                        | **Laura**                  |          **Done**          | Caio, Lucas Costa, **Laura Cavalcante** | PR #330, PR #336, PR #343                                |
| **[UC051]** | Remover Meta de Indicador                          | **Laura**                  |          **Done**          | **Laura Cavalcante**, Lucas Costa       | PR #336, PR #343 (`commit 29809ffd`)                     |

---

## 🔍 Principais Discrepâncias entre o Planejado e o Executado

1. **Casos onde Laura de Lima Cavalcante assumiu tarefas de outros membros:**
   - **UC024 (Atualizar Núcleo):** Atribuído na planilha a _Samêque_, mas implementado e testado por **Laura** (`commit e0a20961`).
   - **UC036 (Importar CSV e Excel):** Atribuído a _Wallyson_, mas desenvolvido e homologado com suporte completo a Excel (.xlsx/.xls) por **Laura** (`commits 3f31438a e f7365d1c`).
   - **UC019 (Exportação de Gráficos PNG e PDF):** Atribuído a _Samêque_, mas a paginação de PDF e exportação individual em PNG foram entregues por **Laura** (`commit 195a00dc`).
   - **UC040 (Atualizar Estrutura do Indicador):** Atribuído a _Wallyson_, mas a validação do `status` no DTO e integração foram corrigidas por **Laura** (`commit 0de77033`).
   - **UC018 (Customização de Gráficos):** Atribuído a _João Vitor_, mas o seletor de paleta de cores e temas visuais foi adicionado por **Laura** (`commit 41c57426`).

2. **Membros que não possuem commits registrados no Git:**
   - **Samêque:** 0 commits registrados. Suas tarefas de Núcleos e Exportações foram absorvidas por **Lucas Costa** e **Laura Cavalcante**.
   - **Wallyson:** 0 commits registrados. Suas tarefas de Importação de Arquivos, Status de Indicadores e Relatórios foram absorvidas por **Laura Cavalcante** e **Lucas Costa**.

3. **Status das UCs de Laura:**
   - **UC017 (Filtros do Dashboard):** **Done** (100% implementado e testado).
   - **UC050 (Definir Metas):** **Done** (100% implementado e testado).
   - **UC051 (Remover Metas):** **Done** (100% implementado e testado).
   - **UC048 (Histórico e Auditoria):** Embora marcado como _Not planned_ na planilha inicial, Laura **já implementou** o consumo da API real de auditoria (`commit 96e02b35`).
