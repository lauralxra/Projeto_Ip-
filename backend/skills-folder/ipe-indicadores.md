---
name: ipe-indicadores
description: Base de conhecimento e guia de execução do projeto "Plataforma Web de Gestão de Indicadores do IPÊ" (Instituto de Inovação, Pesquisa, Empreendedorismo, Internacionalização e Relações Institucionais da UFRPE), desenvolvido pela equipe Nautilus. Contém Documento de Visão completo (problema, Ishikawa, benchmarking, personas, escopo, capacidades, premissas, dependências), os 28 requisitos funcionais (RF01–RF28), fluxo de status/aprovação, perfis e permissões, e o guia de Histórias de Usuário (formato, Gherkin, INVEST). Use SEMPRE que a tarefa mencionar IPÊ, Instituto IPÊ, NEI, NINTER, NURI, indicadores institucionais, PDI, Nautilus, Projeto_Ip-, fluxo de revisão/aprovação de indicadores, dashboards de núcleos, ou pedir para implementar, modelar, testar, documentar ou escrever histórias de usuário/casos de uso/critérios de aceite para esse sistema — mesmo que o usuário não cite o nome da skill.
---

# IPÊ — Plataforma Web de Gestão de Indicadores

Skill-base para que agentes (Claude, Antigravity e similares) entendam e executem o projeto **sem inventar requisitos**. Fonte: Documento de Visão (22 pp.) e guia "Descrição de Requisitos – História de Usuários" da equipe **Nautilus** (disciplina de Engenharia de Software).

- **Repositório:** https://github.com/lauralxra/Projeto_Ip-
- **Equipe (autores):** Caio Vinícios, Gabriel Vitor, Giovanna Costa, João Vitor, Laura de Lima, Lucas Silveira, Luiz Phelipe, Sameque Kadmiel, Wallyson Lenilson.
- **Cliente:** Instituto IPÊ da UFRPE. Há uma **Product Owner** (PO) que valida requisitos.

## Mapa de referências (leia conforme a tarefa)

| Arquivo | Quando ler |
|---|---|
| `references/01-visao-problema-benchmark.md` | Contexto, Ishikawa, benchmarking, oportunidade, glossário |
| `references/02-personas-perfis.md` | Personas, objetivos, necessidades, cenários, matriz de permissões |
| `references/03-escopo-capacidades-premissas.md` | Escopo +/−, mapa da solução, capacidades, premissas, dependências |
| `references/04-requisitos-funcionais.md` | RF01–RF28 literais + agrupamentos + rastreabilidade |
| `references/05-workflow-status-regras.md` | Ciclo de vida do dado, regras de negócio, modelagem sugerida |
| `references/06-guia-historias-usuario.md` | Como escrever histórias, critérios de aceite, INVEST, backlog inicial |
| `references/07-ambiguidades-lacunas.md` | Inconsistências do documento e decisões já tomadas |

## Resumo em 30 segundos

Sistema **web** que substitui planilhas descentralizadas e e-mails na coleta **trimestral** de indicadores dos núcleos **NEI, NINTER e NURI**. Fluxo: núcleo preenche → envia para revisão → Administradora do IPÊ confere (aprova ou devolve com comentário) → dado **aprovado/publicado** fica visível à Comunicação e em dashboards públicos → Gestão acompanha metas do **PDI** e compara períodos. Objetivo central: centralização, rastreabilidade, histórico, redução de erro manual e cumprimento do **decreto de publicação trimestral**.

## Perfis (resumo)

1. **Administradora do IPÊ** — edita/cadastra, valida globalmente, devolve para ajuste, dá aprovação final, publica, gere usuários/permissões.
2. **Equipe/Direção de Núcleo (NEI, NINTER, NURI)** — preenche valores trimestrais do **próprio** núcleo, corrige o que foi devolvido, consulta histórico setorial.
3. **Equipe de Comunicação** — **somente leitura** de dados aprovados/publicados; filtros por período, núcleo, indicador.
4. **Equipe da Gestão (Gestão Executiva)** — dashboards geral e por núcleo, metas, comparações trimestre/ano, histórico.

## Regras inegociáveis (invariantes)

1. Dado **não aprovado nunca** chega à Comunicação nem a dashboards públicos (trava de segurança).
2. Cada perfil enxerga/age **apenas** no que lhe cabe (RBAC). Núcleo só acessa o próprio núcleo.
3. Comunicação **não edita nem revisa** indicadores.
4. Preservar **histórico** e **rastreabilidade** (origem, período, estado, situação de aprovação, quem alterou).
5. Estrutura **flexível**: novos indicadores, programas, ações e núcleos podem surgir sem mudar código.
6. Periodicidade principal **trimestral**.
7. **MVP independente** de integrações externas (Instagram/redes, site institucional, coleta automática de métricas externas ficam fora).
8. Aplicação **web** (sem app mobile).
9. Decisões técnicas já tomadas (modelo de dados DBML, 18 entidades em 6 submódulos): **todos os IDs são `uuid`**; autenticação **apenas com JWT de acesso, sem refresh token**.

## Escopo MVP (positivo) em uma linha por item

Gestão de indicadores institucionais e por núcleo · cadastro de programas, ações e indicadores · registro trimestral de valores · histórico · painéis de visualização/consolidação · fluxo de revisão e aprovação · usuários e permissões · consulta de dados aprovados pela Comunicação · importação de dados históricos (preferencialmente a partir de **2025**).

**Fora do escopo:** app mobile; integração obrigatória com Instagram/redes; coleta automática em tempo real de seguidores/posts/métricas externas (talvez versão futura); integração confirmada com outras plataformas (apenas possível uso futuro no site institucional).

## Como trabalhar neste projeto

1. **Identifique a tarefa** (código, modelagem, testes, documentação, histórias, diagramas) e leia só as referências necessárias.
2. **Rastreie sempre ao RF**: todo artefato (história, endpoint, tela, teste) cita o(s) ID(s) RFxx e a persona.
3. **Não invente regra de negócio.** Se algo não está nas referências, consulte `07-ambiguidades-lacunas.md`; se ainda faltar, registre como **pergunta aberta para a PO** e adote uma suposição explícita e reversível.
4. **Histórias de usuário:** formato "Como [ator], eu quero [ação] para que [razão]" + critérios de aceite (Gherkin: Dado/Quando/Então) + checagem INVEST. Atores = mesmos das personas/casos de uso.
5. **Código/entrega:** priorize MVP; respeite invariantes; IDs uuid; JWT de acesso; RBAC aplicado no backend (não só na UI); trilha de auditoria de mudanças de status e valores; comentários de revisão persistidos.
6. **Idioma:** documentação e UI em português (pt-BR), termos do domínio como no documento (indicador, núcleo, programa, ação, trimestre, meta, dado, status).
7. **Ao entregar**, liste quais RFs foram cobertos, quais invariantes foram verificados e quais suposições foram feitas.

## Glossário rápido

IPÊ (Instituto de Inovação, Pesquisa, Empreendedorismo, Internacionalização e Relações Institucionais) · PDI (Plano de Desenvolvimento Institucional — referência de metas/indicadores) · NEI (Núcleo de Empreendedorismo e Inovação) · NINTER (Núcleo de Internacionalização) · NURI (Núcleo de Relações Interinstitucionais) · MVP · Dashboard · Stakeholder · PO (Product Owner). Detalhes em `references/01-visao-problema-benchmark.md`.


---

# 01 — Visão, Problema, Benchmarking e Oportunidade

## Sumário do Documento de Visão original (22 pp.)
1 Introdução (1.1 Propósito, 1.2 Definições, 1.3 Estrutura) · 2 Descrição do Problema (2.1 Ishikawa, 2.2 Soluções relacionadas e benchmarking, 2.3 Análise, 2.4 Oportunidade) · 3 Personas (3.1 Administradora do IPÊ, 3.2 Equipe do núcleo, 3.3 Comunicação, 3.4 Gestão) · 4 Escopo positivo/negativo, mapa mental, capacidades, premissas e dependências · 5 Requisitos funcionais.

## 1.1 Propósito
Apresentar visão clara e estruturada da solução para o **Instituto IPÊ da UFRPE**: visão comum sobre o problema, impactos, usuários e stakeholders, objetivos e características de alto nível. Serve para orientar decisões de desenvolvimento, delimitar escopo e alinhar expectativas.

## 1.2 Definições
| Termo | Definição |
|---|---|
| IPÊ | Instituto de Inovação, Pesquisa, Empreendedorismo, Internacionalização e Relações Institucionais |
| PDI | Plano de Desenvolvimento Institucional, referência para acompanhamento de metas e indicadores institucionais |
| NEI | Núcleo de Empreendedorismo e Inovação |
| NINTER | Núcleo de Internacionalização |
| NURI | Núcleo de Relações Interinstitucionais |
| MVP | Minimum Viable Product — versão inicial com funcionalidades essenciais para as principais necessidades |
| Dashboard | Painel visual que apresenta dados e indicadores de forma consolidada |
| Stakeholder | Pessoa ou grupo com interesse, influência ou impactado pelo projeto/sistema |

## 2. Descrição do Problema
O IPÊ usa extensivamente **planilhas descentralizadas e procedimentos manuais**: coleta diária e periódica, digitação individualizada, consolidação e análise manual de dados gerados isoladamente por diferentes núcleos/áreas. Consequências: alto esforço operacional; risco elevado de inconsistências e erros de digitação; dificuldade de padronização; comprometimento da manutenção histórica. A ausência de ambiente integrado de **Business Intelligence** inviabiliza dashboards dinâmicos e visuais em tempo real, prejudicando a gestão em antecipar problemas, identificar tendências e decidir com base em evidências.

## 2.1 Diagrama de Ishikawa (5 dimensões)
Efeito (cabeça do peixe): **"Processo manual e descentralizado de indicadores, causando erros e lentidão na gestão."**

| Dimensão | Causas |
|---|---|
| Pessoas | Dependência de cobrança via e-mail; gargalo no fluxo da equipe de comunicação; múltiplos intermediários de validação; sobrecarga operacional; falhas de digitação; tempo em conferências repetitivas |
| Processos | Atrasos na rotina de publicação; coleta de dados muito próxima aos prazos finais; preenchimento e conferência manuais; gargalos na validação manual; atraso no envio de informações à comunicação |
| Tecnologia | Uso descentralizado de múltiplas planilhas (uma por núcleo); ausência de sistema web centralizado; falta de rastreabilidade e histórico automatizado |
| Ambiente | Cultura de armazenamento fragmentado/local; **obrigação regulatória de publicação (decreto) trimestral** — riscos regulatórios e fiscalização em caso de atraso |
| Gestão | Ausência de status claro de aprovação; falta de painéis/dashboards consolidados em tempo real; sem acompanhamento das metas do PDI; dificulta tomada de decisão |

## 2.2 Soluções relacionadas (pesquisa de mercado)
Cinco plataformas de gestão de indicadores/desempenho/estratégia:
- **Milan Strategic Intelligence** — gestão estratégica e desempenho organizacional (instituições, universidades, governo). Dashboards, relatórios, acompanhamento por equipes, integração de fontes. Destaque: conexão indicadores ↔ objetivos estratégicos; abordagem mais ampla que o escopo do cliente.
- **ClearPoint Strategy** — relaciona objetivos, indicadores, metas, projetos, iniciativas. Dashboards, relatórios, equipes, integrações. Mesmo destaque; mais ampla que o necessário.
- **Corporater** — gestão de desempenho empresarial; indicadores, metas, objetivos de várias áreas; dashboards, relatórios, alertas, integração. Mais abrangente, pode ser complexa para necessidades específicas.
- **OpenGov Performance Management** — voltada ao setor público; objetivos, indicadores, metas por departamento; dashboards, relatórios, integração com planejamento e orçamento. Relevante para organizações institucionais, mas alguns recursos são específicos do setor público.
- **Spider Impact** — indicadores, metas, Balanced Scorecard, dashboards, acompanhamento de objetivos; evolução de indicadores, relatórios, alertas, integração. Abrangência estratégica pode ultrapassar a necessidade.

## 2.3 Análise e Benchmarking
Funcionalidades comuns: gestão de indicadores, definição de metas, acompanhamento de resultados, histórico, dashboards. Algumas trazem objetivos estratégicos, responsáveis, planos de ação, governança. Diferenças: público-alvo, complexidade, abrangência. Servem como **referência**, sem definir previamente as funcionalidades.

Matriz (✓ presente, — ausente):

| Critério | Milan | ClearPoint | Corporater | OpenGov PM | Spider Impact |
|---|---|---|---|---|---|
| Gestão de indicadores | ✓ | ✓ | ✓ | ✓ | ✓ |
| Organização por núcleo/instituição | ✓ | ✓ | ✓ | ✓ | ✓ |
| Vinculação a programas e ações | — | ✓ | ✓ | ✓ | ✓ |
| Gestão de dados por período | ✓ | ✓ | ✓ | ✓ | ✓ |
| Comparação de dados | ✓ | ✓ | ✓ | ✓ | ✓ |
| Histórico de dados | ✓ | ✓ | ✓ | ✓ | ✓ |
| Definição de metas | ✓ | ✓ | ✓ | ✓ | ✓ |
| Acompanhamento de metas | ✓ | ✓ | ✓ | ✓ | ✓ |
| Dashboards e visualização | ✓ | ✓ | ✓ | ✓ | ✓ |
| Aprovação e publicação de dados | — | — | ✓ | ✓ | — |
| Usuários e permissões | ✓ | ✓ | ✓ | ✓ | ✓ |
| Importação de dados | — | ✓ | ✓ | ✓ | ✓ |

Conclusão do documento: requisitos comuns em gestão de indicadores, metas, histórico, dashboards; diferenças em organização das informações, integração de dados, controle de acesso e **aprovação/publicação** — essas diferenças **nortearão a priorização** dos requisitos.

## 2.4 Oportunidade de negócio
- A solução parte das necessidades **específicas** do cliente, orientada pelas demandas e dificuldades ao longo do projeto.
- Relevante pelas lacunas do Ishikawa e do benchmarking: gestão descentralizada, dependência de processos manuais, dificuldades no repasse e acompanhamento. Núcleos distintos e fluxo entre pessoas/setores geram **erros, atrasos e perda de dados**.
- Centraliza e organiza informação, reduz procedimentos manuais, acompanhamento mais ágil e confiável; maior integração entre envolvidos.
- Ganhos operacionais e sociais: menos documentos descentralizados e tarefas repetitivas (reduz custos, otimiza tempo); melhor organização e compartilhamento → serviço mais eficiente; melhora gestão, decisões e qualidade dos resultados.


---

# 02 — Personas, Perfis e Permissões

## 3.1 Administradora do IPÊ
**Frase:** "Sou uma pessoa focada no que faço e gosto que meu time também seja, por isso preciso de um sistema mais centralizado e eficiente."
**Perfil:** responsável pelo acompanhamento e gerenciamento dos indicadores institucionais; confere todos os dados recebidos dos núcleos e, se necessário, manda revisar; valoriza organização, validação e **rastreabilidade da origem** da informação.
**Objetivos:** centralização organizada dos indicadores de cada instituto; identificar inconsistências de registros; comandar a revisão pelos núcleos; reduzir erros manuais; acompanhar dashboards gerais ou por núcleo; disponibilizar dados para publicação com mais eficiência.
**Necessidades:** acesso aos indicadores de todos os núcleos; cadastrar indicadores, ações e programas; ver dashboards de todos os núcleos; ver histórico dos indicadores.
**Cenário:** perto do fim do trimestre acessa a plataforma e solicita o preenchimento dos indicadores dos **3 núcleos**; verifica registros, identifica pequenos erros, envia indicadores selecionados para revisão; após o ajuste, revisa novamente, confirma que está tudo certo e deixa disponível para consulta e publicação.

## 3.2 Equipe responsável pelo núcleo (gestor/diretor do núcleo)
**Frase:** "Quero registrar os indicadores do meu núcleo de forma simples e gostaria de acompanhar se eles foram aprovados ou necessitam de revisão."
**Perfil:** acompanha os indicadores do **seu** núcleo; modifica valores sinalizados para revisão; consulta histórico do núcleo.
**Objetivos:** manter indicadores atualizados; identificar registros marcados como necessitando correção; reduzir erros manuais; acompanhar dados históricos.
**Necessidades:** acesso aos indicadores do próprio núcleo; **formulário de preenchimento trimestral**; identificação clara dos status; ver histórico; interface simples e fácil; acesso às solicitações de revisão.
**Cenário:** durante todo o período de coleta trimestral alimenta o sistema com os dados do período selecionado; envia para revisão e acompanha o status; se a administradora solicitar correção, ajusta e devolve para análise.

## 3.3 Equipe de comunicação
**Frase:** "Planejo coletar os dados aprovados para produzir comunicação para a comunidade da UFRPE com a menor chance de erro sobre divulgação de dados incorretos."
**Perfil:** consulta dados aprovados pela administradora; produz comunicação a partir de indicadores aprovados; **não revisa nem edita** indicadores; valoriza informação correta, confiável e pronta para uso.
**Objetivos:** acessar rapidamente **apenas** indicadores aprovados para publicação; produzir materiais com menor risco de erro; facilitar a publicação.
**Necessidades:** acesso aos dados aprovados; **filtros por período, núcleo e indicador**; interface simples; garantia de que os dados passaram por revisão; informações organizadas por período e núcleo.
**Cenário:** após a revisão da administração, verifica indicadores validados e organiza por período, núcleo e indicadores específicos para produzir artes e conteúdos institucionais, sem recorrer a planilhas.

## 3.4 Equipe da Gestão
**Frase:** "Quero visualizar os dados sobre os núcleos para tomar decisões baseadas nesses dados, de uma forma mais intuitiva e simples."
**Perfil:** foco estratégico; acompanha metas e progresso atual; usa indicadores para decidir; valoriza informação correta, organizada e atualizada. (No PDF o subtítulo desta persona diz "Perfil da equipe de comunicação" — erro de digitação.)
**Objetivos:** acompanhar andamento dos indicadores dos núcleos; monitorar metas; comparar períodos; decidir melhor com visão mais clara.
**Necessidades:** dashboard geral; dashboards por núcleo; comparação entre trimestres e anos; acompanhar metas; filtros por indicador; visualização histórica de um indicador.
**Cenário:** analisa o período atual no dashboard geral (indicadores e metas), faz consultas e comparativos e vê que várias metas foram batidas em relação ao período anterior graças a uma medida tomada com base nos dashboards do trimestre passado.

## Papéis no Mapa da Solução (nomenclatura oficial de perfis)
- **Administradora IPÊ:** edição de indicadores, validação global, devolução para ajuste e aprovação final.
- **Diretores de Núcleo (NEI, NINTER, NURI):** entrada de dados trimestrais e consulta ao histórico setorial.
- **Equipe de Comunicação:** acesso exclusivo para leitura de dados validados.
- **Gestão Executiva:** visualização de painéis consolidados para decisão estratégica.

## Matriz de permissões sugerida (derivada; confirmar com a PO)
Legenda: C criar · L ler · E editar · R remover · A aprovar/devolver · P publicar · — nenhum

| Recurso | Administradora | Direção de Núcleo | Comunicação | Gestão |
|---|---|---|---|---|
| Usuários/permissões (RF17–19) | C L E | — | — | — |
| Núcleos (RF25) | C L E | L (próprio) | — | L |
| Programas e ações (RF23) | C L E R | L | — | L |
| Indicadores (RF01–07) | C L E R | L (próprio) | L (aprovados) | L |
| Dados do indicador (RF08–12) | C L E R A P | C L E (próprio, enquanto não aprovado) | L (aprovados) | L (aprovados) |
| Metas (RF20–21) | C L E | L (próprio) | — | L |
| Importação (RF22) | C | — | — | — |
| Dashboards (públicos/internos) | L | L (próprio) | L (aprovados) | L |
| Exportação (RF28) | C | C (próprio) | C (aprovados) | C |
| Lembretes (RF27) | C | recebe | — | — |

Nota: o documento diz apenas "usuário com permissão suficiente" em vários RFs; a tabela acima é proposta coerente com as personas, não texto do documento. A dependência "Definição dos perfis e permissões" exige confirmação com a PO.


---

# 03 — Escopo, Mapa da Solução, Capacidades, Premissas e Dependências

## 4.1 Escopo positivo
- Gestão de indicadores institucionais
- Gestão de indicadores por núcleo
- Cadastro de programas, ações e indicadores
- Registro trimestral de valores
- Histórico de dados
- Painéis de visualização e consolidação
- Fluxo de revisão e aprovação
- Controle de usuários e permissões
- Consulta de dados aprovados pela equipe de comunicação
- Importação de dados históricos, preferencialmente a partir de 2025

## 4.2 Escopo negativo
- Aplicativo mobile
- Integração obrigatória com Instagram ou outras redes sociais
- Coleta automática e em tempo real de seguidores, posts ou métricas externas (pode interessar em versão futura, **não agora**)
- Integração confirmada com outras plataformas além do possível uso futuro no site institucional

## 4.3 Mapa mental da solução
Plataforma centralizada que moderniza, padroniza e automatiza o ciclo de vida dos dados institucionais do Instituto e dos núcleos NEI, NINTER, NURI, substituindo planilhas e e-mails por ambiente intuitivo com controle de acesso por perfis (Administração, Direção de Núcleo, Comunicação, Gestão Executiva). **Cinco eixos operacionais:**

1. **Controle de acessos** — permissões específicas; cada perfil atua só nas suas etapas.
2. **Coleta descentralizada e operação** — registro direto de valores trimestrais, programas, ações e metas; preservação e consulta do histórico.
   - Cadastro estruturado: Núcleos, Programas, Ações e Indicadores (com **unidade de medida** e metas).
   - Preenchimento trimestral direto pelos responsáveis, sem e-mails/planilhas soltas.
   - Gestão de histórico: importação e preservação de registros históricos (foco em **dados de 2025 em diante**).
   - Alertas e prazos: lembretes de encerramento do trimestre e avisos de pendências.
3. **Fluxo de validação e qualidade (workflow)** — controle de status + área de comentários = trava que impede divulgação de dados não auditados.
   - Controle de status (ciclo de vida do dado): Pendente, Em preenchimento, Enviado para revisão, Necessita correção, Aprovado, Publicado.
   - Módulo de revisão: interface centralizada para a administração conferir consistências.
   - Histórico de comentários: campo de observações para orientar correções.
   - Trava de segurança: garantia operacional de que nenhum dado não homologado chega à comunicação ou ao público.
4. **Camada de inteligência (dashboards)** — visões gerais e setoriais; monitorar metas do PDI; comparativos temporais.
   - Dashboard institucional (visão geral IPÊ).
   - Dashboards setoriais (NEI, NINTER, NURI).
   - Filtros dinâmicos: período (ano/trimestre), núcleo, programa, ação e status.
   - Análise comparativa: evolução temporal entre trimestres e anos anteriores.
5. **Saída e disseminação de dados** — central de consulta segura para Comunicação extrair dados homologados; **preparação para integração** (arquitetura pronta para futura exibição de painéis no site institucional).

Resultado esperado: elimina retrabalho, garante confiabilidade, assegura cumprimento dos prazos regulatórios.

## 4.4.1 Capacidades (benefício → capacidade)
Plataforma = **ambiente de governança** dos indicadores, não só repositório: fluxo do preenchimento pelos núcleos até validação, acompanhamento e uso pela gestão e comunicação.

| Benefício esperado | Capacidade do sistema |
|---|---|
| Centralizar informações institucionais | Única plataforma para cadastro, armazenamento e consulta dos indicadores do IPÊ e núcleos |
| Reduzir dependência de planilhas | Cadastro/atualização direto na plataforma pelos responsáveis de cada núcleo |
| Melhorar organização dos indicadores | Cadastro com nome, tipo, estado, núcleo, instituição, programas e ações relacionadas |
| Facilitar registro periódico | Cadastro de valores conforme períodos de referência |
| Preservar histórico institucional | Dados de períodos anteriores disponíveis para consulta e comparação |
| Melhorar confiabilidade | Fluxo de revisão, validação e aprovação antes de serem oficiais/publicáveis |
| Reduzir erros de preenchimento e transposição | Próprios responsáveis registram, menos intermediários |
| Melhorar rastreabilidade | Registro estruturado: origem, período, estado e situação de aprovação |
| Acompanhar metas | Definir metas e comparar valores registrados com resultados esperados |
| Apoiar decisão da gestão | Dashboards consolidados com comparações entre indicadores, períodos e núcleos |
| Facilitar trabalho da comunicação | Área de consulta com dados revisados e aprovados |
| Controlar acesso | Perfis de usuário e permissões por responsabilidade |
| Recuperar dados anteriores | Mecanismos de pesquisa e consulta de dados de períodos passados |
| Apoiar migração do processo atual | Importação de dados históricos das planilhas atuais |
| Permitir evolução | Cadastro de novos indicadores, programas e ações |

## 4.5.1 Premissas (MVP)
1. **Periodicidade:** acompanhamento principalmente **trimestral**, como hoje.
2. **Responsabilidade dos núcleos:** responsáveis de NEI, NINTER e NURI continuam preenchendo/atualizando seus indicadores.
3. **Validação pela Administração do IPÊ:** dados dos núcleos passam por conferência, revisão e aprovação antes de serem oficiais para consulta e publicação.
4. **Diferentes perfis:** Administração, diretores de núcleos, comunicação e gestão; funcionalidades controladas por perfil.
5. **Dados históricos disponíveis:** planilhas e registros atuais estarão disponíveis para apoiar a importação.
6. **Navegador web:** usuários têm computador/dispositivo com navegador e internet.
7. **Stakeholders:** a Product Owner e demais responsáveis disponíveis para esclarecer dúvidas, validar requisitos e avaliar entregas.
8. **Regras institucionais estáveis:** fluxo de acompanhamento/validação/publicação não muda significativamente no desenvolvimento inicial.
9. **Crescimento dos indicadores:** novos indicadores, programas e ações poderão ser adicionados → estrutura flexível, sem depender só dos existentes.

## 4.5.2 Dependências
| Dependência | Descrição |
|---|---|
| Disponibilidade das planilhas atuais | Migração depende de acesso às planilhas e de sua qualidade |
| Validação da Product Owner | Confirmação de requisitos, prioridades e regras depende da PO |
| Participação dos responsáveis pelos núcleos | Validação do fluxo de preenchimento depende de NEI, NINTER, NURI |
| Definição dos perfis e permissões | Controle de acesso depende de responsabilidades claras por tipo de usuário |
| Infraestrutura de hospedagem | Ambiente para aplicação, banco de dados e demais serviços |
| Acesso à internet | Solução web depende de conexão |
| Qualidade dos dados existentes | Sucesso da importação depende de consistência, organização e completude das planilhas |
| Regras institucionais de publicação | Fluxo de aprovação/disponibilização depende das regras do IPÊ |
| Disponibilidade dos usuários para testes | Validação de usabilidade depende de representantes de cada perfil |
| Futuras integrações institucionais | Integração com site institucional/outras plataformas depende de disponibilidade técnica, autorização e mecanismos desses sistemas |

**Regra:** dependências de integrações externas **não** são obrigatórias para o MVP; o MVP é independente delas, porém **preparado** para evoluções. Mudanças em premissas/dependências podem impactar escopo, cronograma, requisitos ou implantação.


---

# 04 — Requisitos Funcionais (literais do Documento de Visão, seção 5)

Texto fiel ao documento; observações entre colchetes são do documento ou desta skill.

| ID | Requisito | Descrição |
|---|---|---|
| RF01 | Cadastro de indicadores | O usuário poderá cadastrar indicadores novos ao sistema |
| RF02 | Alteração de indicadores | O usuário poderá alterar as informações dos indicadores (Nome, Tipo, Estado, Núcleo pertencente, Programas e ações relacionados) |
| RF03 | Remoção de indicadores | O usuário poderá remover indicadores do sistema. (Pode-se agrupar com o RF02) |
| RF04 | Visualização de indicadores | O usuário poderá ver os indicadores atualmente no sistema, os dados que estão neles, quais estão ativos, núcleo e instituição à qual pertencem e se todos os seus dados estão Confirmados |
| RF05 | Definição do núcleo dos indicadores | O usuário poderá definir a qual dos três núcleos o indicador pertence |
| RF06 | Definição da instituição dos indicadores | O usuário poderá definir qual instituição o indicador pertence |
| RF07 | Vinculação de indicadores | O usuário poderá vincular o indicador a programas e ações caso necessário |
| RF08 | Cadastro de dados | O usuário poderá cadastrar dados a indicadores em determinados períodos |
| RF09 | Alteração de dados | O usuário poderá alterar o valor e o estado dos dados (Confirmado ou não) |
| RF10 | Remoção de dados | O usuário poderá remover dados do sistema |
| RF11 | Inativação de dados | O usuário poderá deixar dados Inativos no sistema (Pode-se agrupar com o RF09) |
| RF12 | Visualização de dados | O usuário poderá ver os dados salvos, seu valor, de qual indicador e período pertence, o tipo do dado e se está correto |
| RF13 | Comparação de dados | O usuário poderá comparar dados de períodos diferentes para facilitar a verificação |
| RF14 | Checagem e aprovação de dados | O usuário poderá definir o estado do dado como Confirmado, o que o fará sujeito à visualização pública em dashboard (Pode-se agrupar com o RF09) |
| RF15 | Publicação de indicadores | O usuário poderá publicar indicadores para que sejam visíveis em dashboards públicos do trimestre |
| RF16 | Checagem de histórico de dados | O usuário poderá pesquisar para ver dados de períodos passados |
| RF17 | Cadastro de usuário | O usuário poderá se cadastrar no sistema com email e senha |
| RF18 | Alteração de permissões de usuários | Usuários poderão ter suas permissões alteradas por usuários "administradores" |
| RF19 | Visualização de usuários | O usuário poderá pesquisar e ver todos os usuários cadastrados no sistema junto de suas permissões |
| RF20 | Definição de metas | O usuário poderá definir metas a serem alcançadas em períodos específicos para cada indicador |
| RF21 | Acompanhamento de metas | O usuário poderá comparar o estado atual do indicador com sua meta definida caso houver |
| RF22 | Importação de dados | O usuário poderá importar dados de planilhas, onde o sistema cadastrará esses dados de acordo com a planilha |
| RF23 | Cadastro de programas e ações | O usuário poderá cadastrar programas e ações no sistema para atribuir aos indicadores |
| RF24 | Acesso de usuário | O usuário poderá acessar sua conta cadastrada por meio de uma tela de Login |
| RF25 | Cadastro de núcleo | O usuário com permissão suficiente poderá cadastrar um núcleo novo ao sistema |
| RF26 | Filtro de consulta | O usuário poderá filtrar indicadores por núcleo, programa/ação, estado, data ou trimestre |
| RF27 | Envio de lembrete | O usuário com permissão suficiente poderá enviar emails de lembrete aos demais usuários gestores perto de cada trimestre |
| RF28 | Exportação de dados | O usuário poderá exportar dados em dois formatos: **csv** e **pdf** (geração de relatórios). [No PDF o ID aparece como "R28"] |

## Agrupamentos sugeridos pelo próprio documento
- RF03 pode agrupar com RF02 (gestão/edição de indicador).
- RF11 pode agrupar com RF09 (estado do dado: ativo/inativo).
- RF14 pode agrupar com RF09 (estado Confirmado).

## Agrupamento por módulo (derivado; use para épicos/submódulos)
| Módulo/Épico | RFs |
|---|---|
| Autenticação e usuários | RF17, RF18, RF19, RF24 |
| Estrutura organizacional | RF05, RF06, RF25 (núcleos/instituição) |
| Catálogo de indicadores | RF01, RF02, RF03, RF04, RF05, RF06, RF07 |
| Programas e ações | RF07, RF23 |
| Registro de dados trimestrais | RF08, RF09, RF10, RF11, RF12 |
| Revisão, aprovação e publicação | RF14, RF15 (+ comentários/status do workflow) |
| Histórico e comparação | RF13, RF16 |
| Metas | RF20, RF21 |
| Consulta e filtros | RF04, RF12, RF26 |
| Migração/importação | RF22 |
| Notificações | RF27 |
| Relatórios/exportação | RF28 |
| Dashboards (institucional e setoriais) | RF04, RF13, RF15, RF21, RF26 (+ capacidades da seção 4.3) |

## Rastreabilidade RF ↔ Persona (derivada)
| Persona | RFs principais |
|---|---|
| Administradora | RF01–RF07, RF09–RF11, RF14, RF15, RF18–RF20, RF22, RF23, RF25, RF27, RF28 |
| Direção de Núcleo | RF04, RF08, RF09, RF12, RF13, RF16, RF24, RF26 |
| Comunicação | RF04/RF12 (somente aprovados), RF16, RF26, RF28 |
| Gestão | RF04, RF13, RF16, RF20 (consulta), RF21, RF26, RF28 + dashboards |

## Rastreabilidade RF ↔ Capacidade/Escopo
- Centralização/cadastro → RF01–RF07, RF23, RF25
- Registro trimestral → RF08–RF12
- Confiabilidade/aprovação → RF09, RF14, RF15
- Histórico/comparação → RF13, RF16
- Metas → RF20, RF21
- Controle de acesso → RF17–RF19, RF24
- Migração → RF22
- Alertas e prazos → RF27
- Comunicação (dados homologados) → RF15, RF26, RF28

## Lacunas de RF (não cobertas explicitamente, mas exigidas por visão/personas)
Comentários de revisão e devolução para correção; máquina de estados (seção 05); dashboards institucional/setoriais como RFs próprios; log de auditoria; recuperação de senha; períodos/trimestres de coleta; "unidade de medida" do indicador. Ver `07-ambiguidades-lacunas.md`.


---

# 05 — Workflow de status, regras de negócio e modelagem

## Ciclo de vida do dado (Mapa da Solução, p.15)
`Pendente → Em preenchimento → Enviado para revisão → (Necessita correção ↺ Em preenchimento) → Aprovado → Publicado`

| Status | Quem define | Significado |
|---|---|---|
| Pendente | Sistema/Administradora (solicitação do trimestre) | Período aberto, sem preenchimento |
| Em preenchimento | Direção de Núcleo | Núcleo digitando valores |
| Enviado para revisão | Direção de Núcleo | Aguarda conferência da Administradora |
| Necessita correção | Administradora (com comentário) | Devolvido ao núcleo |
| Aprovado | Administradora | Homologado; "Confirmado" (RF09/RF14) |
| Publicado | Administradora | Visível em dashboards públicos do trimestre (RF15) e à Comunicação |

(O texto 4.3 cita "pendente, em revisão ou aprovado"; o diagrama traz os 6 status acima — use os 6 e mapeie.)

## Regras de negócio
- RN01 Só **Aprovado/Publicado** é visível à Comunicação e a dashboards públicos (trava de segurança).
- RN02 Núcleo só vê/edita indicadores do próprio núcleo, e só em Pendente/Em preenchimento/Necessita correção.
- RN03 Devolução exige **comentário** orientando a correção; comentários ficam em histórico.
- RN04 Edição de valor após aprovação deve voltar o dado a revisão (e ser registrada).
- RN05 Todo valor tem indicador + período (ano/trimestre) + núcleo + status + autor + datas.
- RN06 Dado **Inativo** (RF11) é preservado no histórico, fora de cálculos/dashboards ativos.
- RN07 Remoção (RF10/RF03) restrita à Administradora; preferir remoção lógica para preservar rastreabilidade.
- RN08 Meta é por indicador e período (RF20); acompanhamento compara valor atual vs meta se existir (RF21).
- RN09 Importação (RF22) cria dados conforme planilha, foco em 2025+, com relatório de erros por linha; dados importados entram em estado a definir com a PO (sugestão: Enviado para revisão ou Aprovado histórico).
- RN10 Lembretes (RF27) enviados por e-mail a gestores perto do fim de cada trimestre; avisos de pendência.
- RN11 Exportação (RF28) em csv e pdf respeita permissões e visibilidade por status.
- RN12 Autenticação: e-mail e senha (RF17/RF24); **JWT de acesso, sem refresh token**; IDs `uuid`.
- RN13 Alterar permissões só por "administradores" (RF18).

## Modelagem sugerida (alinhada ao DBML do time: 18 entidades em 6 submódulos, ids uuid)
Entidades prováveis (confirmar com o DBML do repositório): `usuario`, `perfil/papel`, `permissao`, `instituicao`, `nucleo`, `programa`, `acao`, `indicador` (nome, tipo, estado/ativo, unidade_medida, nucleo_id, instituicao_id), `indicador_programa/acao`, `periodo` (ano, trimestre), `dado_indicador` (valor, tipo, status, ativo, indicador_id, periodo_id), `meta`, `comentario_revisao`, `historico_status/auditoria`, `importacao`, `lembrete/notificacao`.
Submódulos plausíveis: Acesso · Estrutura organizacional · Indicadores · Dados/Períodos · Workflow/Revisão · Metas/Relatórios. **O DBML do repositório prevalece** sobre esta sugestão.

## Dashboards
- Institucional (geral) e setoriais (NEI, NINTER, NURI).
- Filtros: ano/trimestre, núcleo, programa, ação, status, indicador.
- Comparação trimestre×trimestre e ano×ano; progresso vs meta (PDI); histórico por indicador.
- Versão **pública** do trimestre exibe apenas dados Publicados.


---

# 06 — Guia de Histórias de Usuário (documento "Descrição de Requisitos – História de Usuários")

Etapa que formaliza a transição do entendimento de alto nível para o nível de detalhamento necessário à implementação.

## Conceito
Técnica ágil que descreve uma funcionalidade sob a perspectiva de quem a usa. Diferente do Caso de Uso (fluxo completo de interação), foca no **valor** entregue.

## Estrutura
"Como [ator/papel], eu quero [ação/funcionalidade] para que [objetivo/razão]."
- **Como [ator]:** quem se beneficia; mesmo tipo de ator dos Casos de Uso (rastreabilidade entre técnicas).
- **Eu quero [ação]:** o que o ator deseja fazer/obter, breve e direto.
- **Para que [razão]:** valor real/porquê; ajuda a equipe a propor soluções melhores.

## Critérios de aceite
Toda história tem critérios de aceite: condições objetivas que definem "pronto". Versão enxuta dos Fluxos Principal/Alternativo/Exceção dos Casos de Uso, em checklist ou Gherkin/BDD: **"Dado [contexto], quando [ação], então [resultado esperado]"**.

## INVEST
Independente · Negociável · Valiosa · Estimável · Small (cabe em uma sprint) · Testável.

## Template a usar
```
### HU-XX — <título curto>
Persona: <Administradora | Direção de Núcleo | Comunicação | Gestão>
RF relacionados: RFxx[, RFyy]
Como <ator>, eu quero <ação> para que <razão>.
Critérios de aceite:
- Dado ..., quando ..., então ...   (feliz)
- Dado ..., quando ..., então ...   (alternativo)
- Dado ..., quando ..., então ...   (exceção/permissão)
INVEST: I[ ] N[ ] V[ ] E[ ] S[ ] T[ ]
Prioridade: <MVP/futuro>   Dependências: <HU/RF>
```

## Backlog inicial de exemplo (derivado dos RFs e personas; refine com a PO)
- **HU-01 Login (RF24).** Como usuário cadastrado, quero acessar com e-mail e senha para usar apenas as funções do meu perfil. *Dado* credenciais válidas, *quando* envio o login, *então* recebo JWT de acesso e vejo menu do meu perfil. *Dado* credenciais inválidas, *quando* envio, *então* vejo erro sem revelar qual campo falhou.
- **HU-02 Cadastro de usuário (RF17).** Como novo usuário, quero me cadastrar com e-mail e senha para ter acesso ao sistema. *Dado* e-mail inédito e senha válida, *então* conta criada sem permissões até a Administradora atribuir perfil.
- **HU-03 Gerir permissões (RF18, RF19).** Como Administradora, quero ver usuários e alterar permissões para que cada perfil atue só no que lhe cabe.
- **HU-04 Cadastrar núcleo (RF25).** Como Administradora, quero cadastrar um núcleo novo para que a plataforma acompanhe mudanças institucionais.
- **HU-05 Cadastrar programas e ações (RF23).** Como Administradora, quero cadastrar programas e ações para vinculá-los a indicadores.
- **HU-06 Cadastrar indicador (RF01, RF05, RF06, RF07).** Como Administradora, quero cadastrar indicador com nome, tipo, estado, núcleo, instituição e programas/ações para organizar a coleta. *Dado* campos obrigatórios preenchidos, *então* o indicador aparece na listagem do núcleo.
- **HU-07 Editar/remover indicador (RF02, RF03).** Como Administradora, quero alterar ou remover indicadores para manter o catálogo correto.
- **HU-08 Visualizar indicadores (RF04, RF26).** Como usuário autorizado, quero listar e filtrar indicadores por núcleo, programa/ação, estado, data ou trimestre para achar rapidamente o que preciso.
- **HU-09 Solicitar preenchimento do trimestre (Persona 3.1).** Como Administradora, quero abrir a coleta do trimestre para os 3 núcleos para que os dados sejam preenchidos no prazo.
- **HU-10 Lembretes (RF27).** Como Administradora, quero enviar e-mails de lembrete aos gestores perto do trimestre para evitar atrasos.
- **HU-11 Preencher dados trimestrais (RF08).** Como Direção de Núcleo, quero registrar valores dos indicadores do meu núcleo no período selecionado para dispensar planilhas e e-mails. *Dado* período aberto, *quando* salvo, *então* status "Em preenchimento".
- **HU-12 Enviar para revisão (workflow).** Como Direção de Núcleo, quero enviar meus dados para revisão para que sejam validados.
- **HU-13 Revisar e devolver (RF09, RF14).** Como Administradora, quero devolver dado com comentário para que o núcleo corrija. *Então* status "Necessita correção" e núcleo vê o comentário.
- **HU-14 Corrigir e reenviar.** Como Direção de Núcleo, quero ver solicitações de revisão, ajustar e reenviar para obter aprovação.
- **HU-15 Aprovar dados (RF14).** Como Administradora, quero marcar dados como Confirmado/Aprovado para torná-los oficiais.
- **HU-16 Publicar indicadores (RF15).** Como Administradora, quero publicar indicadores aprovados para que apareçam nos dashboards públicos do trimestre.
- **HU-17 Alterar/inativar/remover dados (RF09, RF10, RF11).**
- **HU-18 Visualizar dados (RF12).** Dados com valor, indicador, período, tipo e correção.
- **HU-19 Histórico (RF16).** Como Direção de Núcleo/Gestão/Administradora, quero pesquisar períodos passados para acompanhar evolução.
- **HU-20 Comparar períodos (RF13).** Como Gestão/Administradora, quero comparar dados de períodos diferentes para verificar consistência.
- **HU-21 Definir metas (RF20).** Como Administradora, quero definir metas por indicador e período.
- **HU-22 Acompanhar metas (RF21).** Como Gestão, quero comparar valor atual com meta para monitorar o PDI.
- **HU-23 Dashboard institucional e setoriais.** Como Gestão, quero dashboards geral e por núcleo com filtros e comparação trimestre/ano para decidir com base em dados.
- **HU-24 Central de consulta para Comunicação.** Como Comunicação, quero ver somente indicadores aprovados, filtrando por período, núcleo e indicador, para produzir artes sem risco de dado errado.
- **HU-25 Importar planilhas históricas (RF22).** Como Administradora, quero importar planilhas (2025+) para migrar o histórico sem redigitar. *Dado* arquivo com linhas inválidas, *então* vejo relatório de erros e linhas válidas seguem conforme regra.
- **HU-26 Exportar csv/pdf (RF28).** Como usuário autorizado, quero exportar dados em csv ou pdf para gerar relatórios.

Cada história deve respeitar INVEST; divida as grandes (ex.: HU-23, HU-25) antes de estimar.


---

# 07 — Inconsistências do documento, lacunas e decisões

## Inconsistências detectadas (não "corrija" em silêncio; sinalize e siga a decisão abaixo)
1. **ID "R28"** (Exportação) → tratar como **RF28**.
2. **Seção 2 nomeada "Contextualização"** na estrutura (1.3), mas o título real é "Descrição do Problema"; 1.3 diz "cinco seções" e a Seção 4 como "Visão Geral do Produto" (título real: "Escopo do Produto e Escopo Negativo").
3. **Persona 3.4** traz subtítulo "Perfil da equipe de comunicação" por engano; é a Equipe da Gestão.
4. **Nomes de perfis variam:** "Equipe responsável pelo núcleo" / "gestor do núcleo" / "Diretores de Núcleo"; "Equipe da Gestão" / "Gestão Executiva". Adotar: Administradora IPÊ, Direção de Núcleo, Comunicação, Gestão Executiva.
5. **Status:** 4.3 cita Pendente/Em revisão/Aprovado; mapa traz 6 status; RFs falam em "Confirmado ou não" e "Ativo/Inativo". Decisão: usar os 6 status do mapa; "Confirmado" = Aprovado; "Ativo/Inativo" é flag separada.
6. **RF15** ("publicar indicadores do para que...") tem erro de digitação; entenda "publicar indicadores".
7. **RF22** "cadastrar" no lugar de "cadastrará" (tipografia).
8. **RF04/RF12** falam "Confirmados"/"correto" sem definir; ligar a status Aprovado.
9. **RF17 cadastro livre** (auto-cadastro) vs **RF18** permissões por admin: sugerir conta nova sem permissões até atribuição.
10. Sem RF para: comentários de revisão, devolução/solicitação de correção, abertura de coleta, dashboards, recuperação de senha, auditoria. Estão presentes nas personas/mapa; implementar como complemento rastreado ao Mapa da Solução.
11. "Instituição" (RF06) vs "núcleo" (RF05): persona fala "cada instituto"; confirmar com a PO o que é "instituição" (IPÊ? unidade da UFRPE?).
12. Documento recebido em 3 PDFs; o conteúdo do 3º anexo (Documentos – Engenharia 16) não veio legível na análise — se houver mais regras, acrescente aqui.

## Decisões técnicas já tomadas (memória do time)
- Todos os IDs `uuid`.
- Autenticação apenas com JWT de acesso (sem refresh token).
- Modelo de dados em DBML: 18 entidades, 6 submódulos.
- Time Nautilus segue template visual próprio nos documentos; há Plano de Testes em elaboração (escopo, análise de risco, estratégia de teste, controle de qualidade).

## Perguntas abertas para a PO
- Estado inicial dos dados importados? Quem pode remover dados aprovados/publicados?
- O que exatamente é "instituição"? Existe hierarquia de programas↔ações↔indicadores?
- Edição pós-aprovação: volta para revisão? Prazo/calendário de trimestres e do decreto?
- Dashboards públicos: autenticados ou abertos? Perfis finais e permissões?
- Tipos de indicador/dado (numérico, percentual, texto?) e unidades de medida.
