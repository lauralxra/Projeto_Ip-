# Projeto IPÊ — Plataforma de Gestão de Indicadores

## Sobre o projeto

Desenvolvido na disciplina de **Engenharia de Software**, este projeto tem como objetivo criar uma plataforma web para o **Instituto IPÊ**, centralizando dados de programas e indicadores institucionais em um único ambiente.

A solução busca reduzir a descentralização de informações e facilitar o acompanhamento de metas e resultados por meio de um **dashboard interativo**, com gráficos, filtros e visualizações que apoiem a análise dos dados e a tomada de decisões.

## Objetivos

- Centralizar os dados de programas, núcleos e indicadores.
- Facilitar o registro e o acompanhamento de metas e resultados.
- Disponibilizar dashboards interativos e relatórios consolidados.
- Garantir controle de acesso conforme os perfis de usuário.
- Melhorar a organização, a rastreabilidade e a análise das informações.

## Funcionalidades previstas

- **Dashboard:** visualização de indicadores, metas e resultados, com gráficos e filtros.
- **Núcleos e programas:** cadastro, consulta, atualização e arquivamento.
- **Indicadores:** definição de metas, registro de resultados e acompanhamento de status.
- **Validação de dados:** revisão e aprovação de informações submetidas.
- **Histórico:** consulta de alterações e registros anteriores.
- **Usuários e acessibilidade:** gerenciamento de permissões e recursos de acessibilidade.
- **Relatórios:** consolidação e exportação de informações.


## Tecnologias

| Tecnologia | Finalidade |
|---|---|
| TypeScript e Node.js | Linguagem e ambiente de execução |
| NestJS | Framework do backend |
| PostgreSQL | Banco de dados relacional |
| Prisma ORM | Acesso e versionamento do esquema do banco |
| Docker e Docker Compose | Containerização e execução dos serviços |
| Jest e Supertest | Testes automatizados |
| Git e GitHub Actions | Versionamento e automação de integração contínua |

## Estrutura do projeto

```text
Projeto_Ipê/
├── .github/
│   └── workflows/
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── package.json
│   └── README.md
├── frontend/
├── .nvmrc
├── CHANGELOG.md
├── LICENSE
└── README.md
