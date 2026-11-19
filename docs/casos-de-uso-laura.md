# Relatório de Casos de Uso e Entregas — Laura de Lima Cavalcante

**Desenvolvedora / Responsável:** Laura de Lima Cavalcante  
**GitHub:** [@lauralxra](https://github.com/lauralxra)  
**Branch:** `feat/importacao`  
**Pull Request:** [PR #343 — feat/importacao -> backend](https://github.com/lauralxra/Projeto_Ip-/pull/343)  
**Referência:** Planilha Oficial de Casos de Teste RC1 do Instituto IPÊ

---

## 📋 Resumo Executivo das Entregas

Este documento detalha todos os **Casos de Uso (UCs)** atribuídos e desenvolvidos por **Laura de Lima Cavalcante** no projeto IPÊ, além das correções arquiteturais, melhorias de usabilidade, responsividade mobile e integrações de backend/frontend consolidadas na branch `feat/importacao`.

---

## 🎯 1. Casos de Uso Atribuídos na Matriz Oficial RC1

### [UC017] — Filtrar Dashboard (por Núcleo, Indicador ou Período)

- **Status:** ✅ Concluído e 100% Validado
- **Casos de Teste Cobertos:** CT-017.01 a CT-017.05
- **O que foi feito:**
  - Implementação de filtros reativos no Dashboard por **Núcleo**, **Programa**, **Indicador** e **Período** (Ano e Trimestre).
  - Barra de pesquisa textual dinâmica com filtragem instantânea nos cards e gráficos.
  - **Navegação com contexto cruzado:** ao clicar no ícone do indicador na listagem de indicadores, o sistema redireciona automaticamente para o Dashboard com o filtro daquele indicador já selecionado.
  - Testes unitários e testes E2E executados com sucesso validando todos os cenários de combinação de filtros e limpeza de filtros.

### [UC050] — Definir Meta para Indicador

- **Status:** ✅ Concluído e 100% Validado
- **Casos de Teste Cobertos:** CT-050.01 a CT-050.05
- **O que foi feito:**
  - Criação de interface e fluxos no backend/frontend para definição de metas quantitativas nos indicadores.
  - Validação de tipos numéricos e limites no payload da API.
  - Visualização gráfica comparativa entre resultado acumulado e meta estipulada no Dashboard.
  - Histórico de auditoria registrando a definição da meta.

### [UC051] — Remover Meta de Indicador

- **Status:** ✅ Concluído e 100% Validado
- **Casos de Teste Cobertos:** CT-051.01 a CT-051.05
- **O que foi feito:**
  - Implementação da lógica que permite atualizar um indicador tornando sua meta opcional (`null`), sem apagar o histórico de medições.
  - Ajuste no backend para aceitar remoção e ajuste no frontend para tratar gráficos e indicadores sem meta sem ocorrência de erros visuais.
  - Testes de regressão confirmando que o indicador permanece funcional após a remoção da meta.

### [UC048] — Visualizar Histórico de Registros e Alterações

- **Status:** ⏸️ _Not Planned_ (marcado oficialmente na planilha de síntese do RC1 como fora do escopo deste ciclo).

### [UC049] — Restaurar Registros Excluídos/Arquivados

- **Status:** ⏸️ _Not Planned_ (marcado oficialmente na planilha de síntese do RC1 como fora do escopo deste ciclo).

---

## 🚀 2. Entregas Técnicas e Casos de Uso Complementares

Além dos UCs principais da matriz, foram implementadas as seguintes melhorias críticas para o funcionamento do sistema:

### [UC036] — Importação de Dados em Lote (CSV e Excel `.xlsx` / `.xls`)

- **Backend:** Suporte à leitura de planilhas nativas do Excel (`.xlsx` e `.xls`) além de `.csv` via biblioteca `xlsx`.
- **Validação:** Validação linha a linha de cabeçalhos, resolução automática de IDs por nome/sigla de núcleos e programas, verificação de tipos numéricos e retorno estruturado com quantidade de linhas importadas e detalhe de erros.
- **Frontend:** Atualização da interface de importação com rótulo explícito _"Importar CSV / Excel"_ e feedback de importação.

### [UC019] — Exportação de Gráficos e Relatórios

- **Correção de Paginação em PDF:** Eliminação de quebra de gráficos cortados entre páginas durante a geração do relatório em PDF.
- **Exportação Individual em PNG:** Botão dedicado em cada card de gráfico para download individual da visualização em imagem PNG de alta resolução.

### [UC018] — Customização Visual do Dashboard

- Seletor de paleta de cores personalizada e temas de estilo para permitir que gestores escolham como visualizar gráficos comparativos e séries históricas.

### [UC024] — Atualização de Núcleos (Backend & Auditoria)

- Implementação completa do endpoint `PATCH /api/nucleos/:id` (Controller, Service, Repository, DTO).
- Verificação de conflitos de unicidade (impede cadastrar nome ou sigla já existente em outro núcleo).
- Registro automático no serviço de auditoria (`AuditoriaService`) com usuário, ação e payload.
- Suíte completa de testes unitários desenvolvida em `nucleo.service.spec.ts`.

### [UC040] — Correção no DTO de Atualização de Indicadores

- Correção no `UpdateIndicadorDto` adicionando suporte explícito ao campo `status`, eliminando erros de validação da API (`property status should not exist`).

### Gestão de Usuários

- Endpoints e lógica para alteração de status (`ativo`/`inativo`) e atualização de e-mail de usuários.

### 📱 3. Responsividade Completa e Arquitetura de Layout (Mobile-First)

- **Problema resolvido:** A aplicação ficava comprimida em dispositivos móveis e não possuía menu recolhível.
- **Nova NavBar:**
  - **Desktop (≥ md):** Menu lateral expansível/recolhível com preservação de espaço e transições suaves.
  - **Mobile (< md):** Header fixo no topo com menu hambúrguer, botão de fechar e menu gaveta (slide-over drawer) lateral com backdrop escurecido.
  - **Roteamento SPA:** Links integrados ao `react-router-dom` para navegação fluida sem recarregar o navegador.
- **Telas adaptadas (100% responsivas):**
  1. `TelaDashboard`
  2. `TelaIndicadores`
  3. `TelaNucleos`
  4. `TelaProgramas`
  5. `TelaUsuarios`
  6. `TelaHistorico`

---

## 🧪 4. Matriz de Testes e Validação de Qualidade

| Tipo de Teste                     |  Resultado  | Cobertura / Detalhes                                                          |
| :-------------------------------- | :---------: | :---------------------------------------------------------------------------- |
| **Jest Backend**                  | ✅ Aprovado | 31 suítes de teste, 378/378 testes unitários passando                         |
| **ESLint Backend**                | ✅ Aprovado | 0 erros, 0 avisos                                                             |
| **Build Backend (`nest build`)**  | ✅ Aprovado | Compilação TypeScript limpa                                                   |
| **Build Frontend (`vite build`)** | ✅ Aprovado | Bundle de produção gerado com sucesso                                         |
| **Testes E2E (Integração)**       | ✅ Aprovado | 27/27 cenários validados (autenticação, filtros, importação CSV/Excel, CRUDs) |

---

## 📦 5. Histórico de Commits Relevantes

- `3f31438a`: `feat(indicadores): atualizar rotulo para importar CSV e Excel`
- `8f423549`: `feat(layout): adicionar navbar responsiva com menu retratil e suporte mobile`
- `e0a20961`: `feat(nucleo): implementar atualizacao de nucleo com validacao e auditoria`
- `41c57426`: `feat(dashboard): adicionar seletor de cores para os graficos`
- `0de77033`: `fix(indicadores): aceitar campo status no DTO de atualizacao do indicador`
- `195a00dc`: `feat(dashboard): corrigir paginacao de pdf e adicionar exportacao de grafico em png`
- `1250e6dc`: `feat(indicadores): filtrar dashboard automaticamente ao clicar no icone do indicador`
- `d297344d`: `feat(users): adicionar endpoints para alterar status e email do usuario`
- `29809ffd`: `feat(indicadores): permitir atualizar indicador sem meta e remover metas existentes`
- `c360b526`: `feat(dashboard): adicionar barra de pesquisa e filtro de programas do banco de dados`
- `66bf0137`: `feat(indicadores): adicionar botao e acao para excluir medicao de ano e trimestre especificos`
- `8a058ca7`: `feat(indicadores): vincular novos periodos ao indicador existente e adicionar modal de historico de medicoes`
