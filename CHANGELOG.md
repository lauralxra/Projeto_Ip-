# [1.1.0-dev.23](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.22...v1.1.0-dev.23) (2026-11-20)


### Bug Fixes

* **usuarios:** abrir menu de acoes fora da lista, centralizar colunas e remover id ([d0ba6f3](https://github.com/lauralxra/Projeto_Ip-/commit/d0ba6f31048d6b43fcf8d5b614afb9e6f8c25a19))

# [1.1.0-dev.22](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.21...v1.1.0-dev.22) (2026-11-20)


### Bug Fixes

* **prisma:** tornar migration de responsavel do programa idempotente ([5da07ba](https://github.com/lauralxra/Projeto_Ip-/commit/5da07ba860ae8020c5ae23b0ca476a25616eec8a))

# [1.1.0-dev.21](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.20...v1.1.0-dev.21) (2026-11-20)


### Bug Fixes

* **backend:** corrigir duplicidades em auth e propriedade imagemUrl em nucleo ([64329ce](https://github.com/lauralxra/Projeto_Ip-/commit/64329cec7bca32779edc7d333960ffd6f8d56b24))
* **backend:** definir porta padrao 3001 no bootstrap da aplicacao ([665b62d](https://github.com/lauralxra/Projeto_Ip-/commit/665b62d1be4825af6ffc9057021b397dec74d0ed))
* **config:** ajustar porta do backend para 3001 no docker e frontend ([8cdb58b](https://github.com/lauralxra/Projeto_Ip-/commit/8cdb58b0cff68c98803ef89eedb28f7052fd073e))
* **frontend:** corrigir carregamento de fontes Google Sans e overflow do menu de acoes ([1c51c55](https://github.com/lauralxra/Projeto_Ip-/commit/1c51c55e646b6172f6728beabae1b2ca091898c3))
* **indicadores:** aceitar campo status no DTO de atualizacao do indicador ([0de7703](https://github.com/lauralxra/Projeto_Ip-/commit/0de77033dc38c0d788848b07af423eb5e23abe0b))
* **indicadores:** corrigir fluxo uc038 de revisao aprovacao e devolucao ([6f902ad](https://github.com/lauralxra/Projeto_Ip-/commit/6f902ad61bd798085fe8ff5e84872b312598b95c))
* **perfil:** integrar alteracao e exibicao da foto de perfil ([1e38bcb](https://github.com/lauralxra/Projeto_Ip-/commit/1e38bcba3a363a4f9864d016f103b12530e7eada))
* **prisma:** alinhar fk de responsavel do programa ao schema com on delete restrict ([b2a5874](https://github.com/lauralxra/Projeto_Ip-/commit/b2a5874721b1e6d1047f22edfd0e18a15b1af621))


### Features

* **auth:** adicionar link para tela de cadastro na tela de login ([699e799](https://github.com/lauralxra/Projeto_Ip-/commit/699e7999baad2f1bf963eb82feb682ad59bbdde6))
* **dashboard:** adicionar barra de pesquisa e filtro de programas do banco de dados ([c360b52](https://github.com/lauralxra/Projeto_Ip-/commit/c360b5269765e6dc2d28efed9aa15e0657969a2d))
* **dashboard:** adicionar seletor de cores para os graficos ([41c5742](https://github.com/lauralxra/Projeto_Ip-/commit/41c57426c65c2dc0d1af97723288d8106f155d45))
* **dashboard:** corrigir paginacao de pdf e adicionar exportacao de grafico em png ([195a00d](https://github.com/lauralxra/Projeto_Ip-/commit/195a00dc2108d4d1f3e376a05d45e26e24cef631))
* **dashboard:** migrar tela para consumir API agregada do backend com meta vs realizado e RBAC ([5f1a42a](https://github.com/lauralxra/Projeto_Ip-/commit/5f1a42acebcce78971089667539ffde16041ede2))
* **frontend:** aprimorar responsividade geral, tipografia Google Sans e acoes de indicadores ([e8c0b2d](https://github.com/lauralxra/Projeto_Ip-/commit/e8c0b2d592ac8ecf20c22a23e1405872b502b173)), closes [#fbd7f0](https://github.com/lauralxra/Projeto_Ip-/issues/fbd7f0) [#a13680](https://github.com/lauralxra/Projeto_Ip-/issues/a13680)
* **historico:** criar endpoint de auditoria e conectar tela de historico a api real ([96e02b3](https://github.com/lauralxra/Projeto_Ip-/commit/96e02b355c43bef177328706a8900f6f5cf699ef))
* **indicadores:** add GET/:id, PATCH/:id and inativar endpoints RF02-RF04 ([d22864f](https://github.com/lauralxra/Projeto_Ip-/commit/d22864f66308d6de8e99bba9a6d768a4b458d8ab))
* **indicadores:** adicionar botao e acao para excluir medicao de ano e trimestre especificos ([66bf013](https://github.com/lauralxra/Projeto_Ip-/commit/66bf0135e7e11b61392331f0538ec5c0c22e6c05))
* **indicadores:** atualizar rotulo para importar CSV e Excel ([3f31438](https://github.com/lauralxra/Projeto_Ip-/commit/3f31438a705a31c2f9878c65150130e7ae20313a))
* **indicadores:** corrigir duplicacao na importacao, integrar patch de indicador e cruds no frontend ([f7365d1](https://github.com/lauralxra/Projeto_Ip-/commit/f7365d1c63f5796a7033d1d342eb8c17f7568ac3))
* **indicadores:** filtrar dashboard automaticamente ao clicar no icone do indicador ([1250e6d](https://github.com/lauralxra/Projeto_Ip-/commit/1250e6dc5e16805fa38830ad43834d0be190a80f))
* **indicadores:** implementar uc041 arquivar e desativar indicador ([dc234ec](https://github.com/lauralxra/Projeto_Ip-/commit/dc234ec343ce5f59b0028eb54ec22a8a54948de0))
* **indicadores:** permitir atualizar indicador sem meta e remover metas existentes ([29809ff](https://github.com/lauralxra/Projeto_Ip-/commit/29809ffd1b5f615f89cfd72791092850ec2befd0))
* **indicadores:** vincular novos periodos ao indicador existente e adicionar modal de historico de medicoes ([8a058ca](https://github.com/lauralxra/Projeto_Ip-/commit/8a058caff94b5b97a52f5e880a61a8746ae33bc6))
* **layout:** adicionar navbar responsiva com menu retratil e suporte mobile ([8f42354](https://github.com/lauralxra/Projeto_Ip-/commit/8f42354986a7938fd8d4e1af11c9427601855a81))
* **notificacoes:** conectar painel de notificacoes a api do backend ([74add59](https://github.com/lauralxra/Projeto_Ip-/commit/74add59a11cbc42c95a964342b29a1b8c704b87c))
* **nucleo:** implementar atualizacao de nucleo com validacao e auditoria ([e0a2096](https://github.com/lauralxra/Projeto_Ip-/commit/e0a20961020565c294a1bf81e7e01ca4f3a85acd))
* **programas:** vincular responsavel real ao programa no backend e frontend ([43a5a29](https://github.com/lauralxra/Projeto_Ip-/commit/43a5a29cbbec421ca16585bc1fbfda4f630cb457))
* **users:** adicionar endpoints para alterar status e email do usuario ([d297344](https://github.com/lauralxra/Projeto_Ip-/commit/d297344dd62bd29b12595c5ad0c623d68e121084))

# [1.1.0-dev.20](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.19...v1.1.0-dev.20) (2026-11-20)


### Features

* implementa tela de notificações ([f6f9f73](https://github.com/lauralxra/Projeto_Ip-/commit/f6f9f739d09ddd741f8301e3f812bda22802f7cd))

# [1.1.0-dev.19](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.18...v1.1.0-dev.19) (2026-11-20)


### Bug Fixes

* **frontend:** restaura onClick do botão de logout perdido no merge ([54d80f6](https://github.com/lauralxra/Projeto_Ip-/commit/54d80f6f7262e992f59000ca32cf288275fbf80c))
* **test:** corrige regex do moduleNameMapper no jest-e2e.json ([608d420](https://github.com/lauralxra/Projeto_Ip-/commit/608d4204a179e219f754a85f645af25596fa789a))


### Features

* ajustes visuais no menu lateral e tela de login ([be2449d](https://github.com/lauralxra/Projeto_Ip-/commit/be2449d86dd5d1280ded6857ccfd8220cf1cb570))
* Implementação das telas de recuperção e redefinição de senha ([cf27e36](https://github.com/lauralxra/Projeto_Ip-/commit/cf27e361f22c9491177bf656c688ff450ba6a895))
* updating package ([175aea1](https://github.com/lauralxra/Projeto_Ip-/commit/175aea1d4282fe024b206879db6b23e1803e88f9))

# [1.1.0-dev.18](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.17...v1.1.0-dev.18) (2026-11-18)


### Bug Fixes

* **deploy:** add prod docker-compose, nginx config and fix upload swagger ([cea931f](https://github.com/lauralxra/Projeto_Ip-/commit/cea931f731da0ab003fbbb79bb811f5d148ce6a5))

# [1.1.0-dev.17](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.16...v1.1.0-dev.17) (2026-11-18)


### Features

* **indicadores:** implement indicator edit ([0ae229b](https://github.com/lauralxra/Projeto_Ip-/commit/0ae229b87629bc817b124b9aa6515bf8d9141a06))
* **nucleos:** implement nucleus edit ([5aac99e](https://github.com/lauralxra/Projeto_Ip-/commit/5aac99e2c7bc560d4326181ee5fdaabccd15752d))
* **programas:** store responsible user, start date and participants ([268c269](https://github.com/lauralxra/Projeto_Ip-/commit/268c2694186989b57c7c0e4f93937c2584a57274))
* **users:** edit email, status, password and photo of users and own profile ([bfb5f39](https://github.com/lauralxra/Projeto_Ip-/commit/bfb5f39cd40794ea4648f3274fc9d89d48404c4f))

# [1.1.0-dev.16](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.15...v1.1.0-dev.16) (2026-11-18)


### Features

* **auth:** return the profile photo path on login ([fe6cd30](https://github.com/lauralxra/Projeto_Ip-/commit/fe6cd30edfde9090ef5c2a2ff31d6042d21d37bc))
* **frontend:** create, edit, change status and delete programs through the api ([1fce10d](https://github.com/lauralxra/Projeto_Ip-/commit/1fce10de9831411ccba8c173d638d1fbffe399e5))
* **frontend:** save indicator approval through the api ([7a8b713](https://github.com/lauralxra/Projeto_Ip-/commit/7a8b7135b407e599610c1615e687041cbfc1e903))
* **frontend:** show user photos and upload the profile photo ([8e53764](https://github.com/lauralxra/Projeto_Ip-/commit/8e53764a10a11717113c55b4e3e98d928844ba00))

# [1.1.0-dev.15](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.14...v1.1.0-dev.15) (2026-11-18)


### Bug Fixes

* **dashboard:** ignore inactive values in indicator calculations ([283e410](https://github.com/lauralxra/Projeto_Ip-/commit/283e41005827ca6a8473ba0c9dd69ba17f92ebac))
* **metas:** compute realized values for every goal and prevent duplicates ([aa117a3](https://github.com/lauralxra/Projeto_Ip-/commit/aa117a3a308a3894f806df59b2932d9e09d45332))
* **registro:** align visibility, add filters and reactivation, avoid concurrent writes ([b2ada9a](https://github.com/lauralxra/Projeto_Ip-/commit/b2ada9a03f3a5e1d147e1a44be050cdbae4c4008))
* **registro:** harden approval flow transitions and add tests ([1bd6a39](https://github.com/lauralxra/Projeto_Ip-/commit/1bd6a3952ef261745af00daab614e80953741496))
* **registro:** restrict approving and returning values to the administrator ([31d0d2f](https://github.com/lauralxra/Projeto_Ip-/commit/31d0d2fb9326c8bb5be1f9a64dff6d04073ea0a2))
* **user:** remove nucleus links when deleting a user ([e6994f5](https://github.com/lauralxra/Projeto_Ip-/commit/e6994f528c7b6c259a2de89376f7dbe560fa1a9b))


### Features

* **frontend:** show and save indicator goals through the metas api ([d4b75a7](https://github.com/lauralxra/Projeto_Ip-/commit/d4b75a78300f0aa80db6149a1bc9fa74d4754011))
* **metas:** add full CRUD RF20-RF21 with meta vs realizado comparison and RBAC ([c2d3e44](https://github.com/lauralxra/Projeto_Ip-/commit/c2d3e441dd60c1ee26614eec57d0a7c105f5fa4c))
* **registro:** add approval flow RF14-RF15 with enviar, devolver, aprovar and publicar ([7905f52](https://github.com/lauralxra/Projeto_Ip-/commit/7905f52b58ed9a73be0b09786fa55527fb5ab6f3))
* **registro:** add full CRUD RF09-RF12 with RBAC, audit and visibility rules ([136a4e4](https://github.com/lauralxra/Projeto_Ip-/commit/136a4e417e7d9830d929d959702fcf6cd8705541))

# [1.1.0-dev.14](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.13...v1.1.0-dev.14) (2026-11-18)


### Bug Fixes

* **programas:** keep list contract, scope visibility by role and protect deletion ([91ba59f](https://github.com/lauralxra/Projeto_Ip-/commit/91ba59fa12a5019349196d17a7b1ffe30e7fad7d))


### Features

* **programas:** add full CRUD RF27-RF32 with filters, audit and rbac ([18703e4](https://github.com/lauralxra/Projeto_Ip-/commit/18703e42b60cd5be671cf92ee59668a2aa58ff03))

# [1.1.0-dev.13](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.12...v1.1.0-dev.13) (2026-11-18)


### Bug Fixes

* **notificacoes:** enforce rn01, harden email sending and fix quarterly cron ([ff66a32](https://github.com/lauralxra/Projeto_Ip-/commit/ff66a32901c92b777c0ba6568570e6bfb4b8cea8))
* **user:** keep password change from failing when the email notice fails ([e7f9148](https://github.com/lauralxra/Projeto_Ip-/commit/e7f914833edb0b552b55b3bce37a1bef688616b1))


### Features

* **api:** return user nuclei and program creation date for the frontend ([fa7cb8a](https://github.com/lauralxra/Projeto_Ip-/commit/fa7cb8adcfe1ca03361baaabef83d4db7fce3f99))
* **frontend:** integrate screens with the existing api endpoints ([3221812](https://github.com/lauralxra/Projeto_Ip-/commit/322181217feddc40f40abf2d461e82202c6ea61a))
* **notificacoes:** add notifications endpoint with smtp email and cron scheduler ([d01c6d6](https://github.com/lauralxra/Projeto_Ip-/commit/d01c6d66d5152486954837be71ec9a76aea7b27a))
* **notificacoes:** add read and read-all endpoints with user filter ([fafd067](https://github.com/lauralxra/Projeto_Ip-/commit/fafd067d785d89b32558da670675839583ea2972))
* **nucleo:** add image upload endpoint and serve uploaded files ([cc2d65b](https://github.com/lauralxra/Projeto_Ip-/commit/cc2d65b51cf45076c9010ce670018f8059ef246c))

# [1.1.0-dev.12](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.11...v1.1.0-dev.12) (2026-11-18)


### Bug Fixes

* **frontend:** excluir indicador pela api e remover a opcao de limpar todos ([265a710](https://github.com/lauralxra/Projeto_Ip-/commit/265a71071d7f41d747b2679fd12e621379ff54b2))
* **indicador:** proteger rotas de indicadores e registros com dto, rbac e auditoria ([f99b090](https://github.com/lauralxra/Projeto_Ip-/commit/f99b090ae8e8c1ed03ae80f2bc3438c86106549c))

# [1.1.0-dev.11](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.10...v1.1.0-dev.11) (2026-11-18)


### Bug Fixes

* **mail:** add sendMail and validate SMTP config on startup ([cb72949](https://github.com/lauralxra/Projeto_Ip-/commit/cb72949a0611046e1ed2522c949ad2b7c112efcf))
* **user:** corrigir troca de senha com repositorio, notificacao, swagger e testes ([23828a9](https://github.com/lauralxra/Projeto_Ip-/commit/23828a954410528b1a4197d9924dce04f3b086cf))


### Features

* **mail:** add mail module as shared email service ([079f6ec](https://github.com/lauralxra/Projeto_Ip-/commit/079f6ecb2d33db67517608087ad3b315f5541057))
* **mail:** adicionar e-mail de aviso de seguranca para troca de senha ([16aa3c7](https://github.com/lauralxra/Projeto_Ip-/commit/16aa3c7c572217f938f25ffd6c0e5c113a335fec))
* **notificacao:** enviar aviso de troca de senha sem interromper o fluxo em falha de smtp ([1571d42](https://github.com/lauralxra/Projeto_Ip-/commit/1571d428356123b038ba69030b3c4e71f8b4b735))
* **user:** add change password endpoint with email notification via gmail smtp ([340aff6](https://github.com/lauralxra/Projeto_Ip-/commit/340aff615e39c949aec452210993bc05e0293600))
* **user:** validar complexidade, senhas comuns e confirmacao no dto de troca de senha ([a521b45](https://github.com/lauralxra/Projeto_Ip-/commit/a521b4547ded0710e75bc1393b3061fcb1288048))

# [1.1.0-dev.10](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.9...v1.1.0-dev.10) (2026-11-18)


### Bug Fixes

* **auth:** exigir jwt em todas as rotas por padrao com guard global e decorator public ([f64723e](https://github.com/lauralxra/Projeto_Ip-/commit/f64723e8229eda09fb37136774fbafc11314d657))
* **auth:** manter validade padrao do jwt em 2h no exemplo de ambiente ([aabeecd](https://github.com/lauralxra/Projeto_Ip-/commit/aabeecd2db60fa7b613144ba666212d70b52eb0b))
* **auth:** padronizar resposta de login para nao revelar e-mails cadastrados nem a senha durante o bloqueio ([8b9395b](https://github.com/lauralxra/Projeto_Ip-/commit/8b9395b51042b0b03c8bf7e2c325141b7af1303a))
* **frontend:** proteger rotas internas exigindo sessao valida ([649b23a](https://github.com/lauralxra/Projeto_Ip-/commit/649b23a4a18db8e017ecbf4fd33591a8c8558c74))
* **prisma:** adicionar unicidade parcial, check de escopo e trigger de auditoria imutavel ([b7b7fd7](https://github.com/lauralxra/Projeto_Ip-/commit/b7b7fd7ff9e38475f560add8f5b8253f94f825a5))
* **seed:** remover senha padrao do administrador do codigo ([0a1a7e1](https://github.com/lauralxra/Projeto_Ip-/commit/0a1a7e17c5e4fc78faa56fb0696ca8a5e8a81ff1))


### Features

* add ipe-indicadores skill ([49b16b8](https://github.com/lauralxra/Projeto_Ip-/commit/49b16b8f6d492a2790e732f4fc3c6ceae5e82e34))
* **frontend:** integrar tela de cadastro com a api ([a8894f7](https://github.com/lauralxra/Projeto_Ip-/commit/a8894f77c202d2254d90fa285d7331bb5fa71b10))
* **user:** implementar exclusao logica de usuario com auditoria ([dfc2219](https://github.com/lauralxra/Projeto_Ip-/commit/dfc22195493d9484e1bb42e215050939daa00b9e))

# [1.1.0-dev.9](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.8...v1.1.0-dev.9) (2026-11-15)


### Bug Fixes

* **backend:** accept multiple CORS origins from environment ([df5a8a6](https://github.com/lauralxra/Projeto_Ip-/commit/df5a8a6eb99bc385837ca5b1e71bfdc1fb5053c0))
* **docker:** bind postgres port to localhost only ([0f43cb6](https://github.com/lauralxra/Projeto_Ip-/commit/0f43cb67f034f84836c8b78b2d65d18324f4378c))
* **frontend:** read API URL and allowed hosts from server environment ([7ce194f](https://github.com/lauralxra/Projeto_Ip-/commit/7ce194f3f1ff363a254c57654322f00981d644c2))

# [1.1.0-dev.8](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.7...v1.1.0-dev.8) (2026-11-15)


### Bug Fixes

* **frontend:** remover env.production do versionamento ([aac8d07](https://github.com/lauralxra/Projeto_Ip-/commit/aac8d079ecb35d18ab9b867aa86335e119a57ad8))

# [1.1.0-dev.7](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.6...v1.1.0-dev.7) (2026-11-15)


### Features

* **frontend:** conectar tela de dashboard com api base url ([8584cc9](https://github.com/lauralxra/Projeto_Ip-/commit/8584cc93a7d5174d6f14799d1ce15dd2b5788b03))
* **frontend:** conectar tela de indicadores com api base url ([dcdb2b4](https://github.com/lauralxra/Projeto_Ip-/commit/dcdb2b47c7c752fa4e046ad8034b3f42e02b5f71))
* **frontend:** conectar tela de login com api base url ([131e8d5](https://github.com/lauralxra/Projeto_Ip-/commit/131e8d5210791804fa4b3f1d3fdb6c2463473f3d))
* **frontend:** criar modulo de configuracao de api e variaveis de ambiente ([78c09db](https://github.com/lauralxra/Projeto_Ip-/commit/78c09dba75e8c427376bbc0ffdf67f7843c65b84))

# [1.1.0-dev.6](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.5...v1.1.0-dev.6) (2026-11-15)


### Features

* **deploy:** autorizando acesso ao dominio ([5626fe6](https://github.com/lauralxra/Projeto_Ip-/commit/5626fe6be51a8d4a278abe3e766bdb7c122cf806))

# [1.1.0-dev.5](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.4...v1.1.0-dev.5) (2026-11-14)


### Bug Fixes

* ajustando erros no arquivo ([06f4413](https://github.com/lauralxra/Projeto_Ip-/commit/06f44130d61314cf967419981dd346dcac2c9e27))
* ajuste na funcção de atualizar foto ([c5c7e07](https://github.com/lauralxra/Projeto_Ip-/commit/c5c7e07573910060af36aa2f323514f0da3486e3))
* ajuste na lógica de atualização de  foto com audit ([4935075](https://github.com/lauralxra/Projeto_Ip-/commit/49350751a4f19742f488dc871b975753a06e2bc0))
* **dashboard:** keep indicator ordering stable between requests ([0ad6c23](https://github.com/lauralxra/Projeto_Ip-/commit/0ad6c23ae9e08cddd64f7e1dc81c544fa7e0c287))


### Features

* **common:** register Prisma exception filter globally ([822e84e](https://github.com/lauralxra/Projeto_Ip-/commit/822e84e59b8793d7d4ad4c39068bb9e7601af40a))
* **user:** add profile photo upload with old photo cleanup and error handling ([11129ad](https://github.com/lauralxra/Projeto_Ip-/commit/11129ad6284e199e63815f2e2d66a26a527c2a25))
* **user:** add update permissions endpoint with rbac and nucleo validation ([2e28abc](https://github.com/lauralxra/Projeto_Ip-/commit/2e28abc563a06ca0438f1b7ebd3aebd6f05184d9))

# [1.1.0-dev.4](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.3...v1.1.0-dev.4) (2026-11-06)


### Bug Fixes

* Teste e Correção da API para Login, Cadastro e Atualização do Usuário ([88db937](https://github.com/lauralxra/Projeto_Ip-/commit/88db9375a46394f4da13188639fa61a9f2556dda))


### Features

* add create user ([849165a](https://github.com/lauralxra/Projeto_Ip-/commit/849165aaa7ea6733285de882d2424930864792bc))
* add new function for audit ([61566cc](https://github.com/lauralxra/Projeto_Ip-/commit/61566cc2458e283c0291fb72303f4f1650a128a1))
* **api:** add global /api route prefix ([d84d832](https://github.com/lauralxra/Projeto_Ip-/commit/d84d8324fe3d9435b9337ac03e48b03cb367a118))
* **api:** adiciona módulos base das entidades ([2512d3c](https://github.com/lauralxra/Projeto_Ip-/commit/2512d3c7b0177906e080bffc803464e9ffb4fb7b))
* **auth:** add logout endpoint ([d7188c3](https://github.com/lauralxra/Projeto_Ip-/commit/d7188c32e628a9a9c94a5debc7e8a0f887467d7c))
* **auth:** adiciona guard de autenticação JWT para rotas protegidas ([223e125](https://github.com/lauralxra/Projeto_Ip-/commit/223e12574a7a418971559d459b23c1f3c02faeba))
* **common:** add Prisma exception filter for standardized HTTP errors ([456bb19](https://github.com/lauralxra/Projeto_Ip-/commit/456bb190fb6bb71e6e27ec8b516d412fcac0f270))
* conecting audit module and user repository on this module ([015d324](https://github.com/lauralxra/Projeto_Ip-/commit/015d3240b09f1ee0b75fb1517b21b8a2f2e408fb))
* **dashboard:** add GET /api/dashboard/indicators with RBAC-filtered aggregates ([cbdf032](https://github.com/lauralxra/Projeto_Ip-/commit/cbdf032849a336da38cc2c70037a911fe8284bc9))
* **dashboard:** formalize chart-agnostic response contract ([53b9365](https://github.com/lauralxra/Projeto_Ip-/commit/53b9365962c7003d3e51f23db68af0db73f8ed52))
* **dashboard:** support combined filters ([0358445](https://github.com/lauralxra/Projeto_Ip-/commit/035844585043002dcff9b34431e816e1857fa48c))
* esta ligado ao commit anterior ([d87b6b0](https://github.com/lauralxra/Projeto_Ip-/commit/d87b6b02415973004df6510fa28d22ccfb0a08a1))
* extra functions to locate in database ([f30d40a](https://github.com/lauralxra/Projeto_Ip-/commit/f30d40a8ee946aeb19d29c85bbf40a77b690f732))
* **nucleo:** add audited deactivation endpoint ([1e51efe](https://github.com/lauralxra/Projeto_Ip-/commit/1e51efe8be7a51ec41767214cda8ebbbe7607183))
* **nucleo:** add DELETE /api/nucleos/:id with soft delete and audit ([ed17692](https://github.com/lauralxra/Projeto_Ip-/commit/ed17692acc2bf446510156a45f54c5b4e7100f2b))
* **nucleo:** add GET /api/nucleos search with filters and RBAC scope ([39744b1](https://github.com/lauralxra/Projeto_Ip-/commit/39744b1118ee28ccd0f965618f89bb0d1b478cc1))
* **nucleo:** add POST /api/nucleos endpoint restricted to admins ([abe0c25](https://github.com/lauralxra/Projeto_Ip-/commit/abe0c25812a44a657b947c041a40233a11c9ea93))
* **nucleo:** implement GET /api/nucleos and /:id excluding soft-deleted nucleos ([36b7611](https://github.com/lauralxra/Projeto_Ip-/commit/36b7611a09f29a73d6ecba44c3c739bc8065fe2e))
* **nucleo:** implement GET /nucleos/:id endpoint with RBAC scope ([229a5f4](https://github.com/lauralxra/Projeto_Ip-/commit/229a5f453d5ad2ac7a85145774509be029bc0632))
* **nucleo:** query nuclei associated with a user ([e1dc1ed](https://github.com/lauralxra/Projeto_Ip-/commit/e1dc1edc07edf38577bf7d063f45e7b9dca95231))
* upgrading post endpoint ([a75300f](https://github.com/lauralxra/Projeto_Ip-/commit/a75300fb4682321e16bc37ba71c4203c41691a9a))
* user dtos ([ffd413c](https://github.com/lauralxra/Projeto_Ip-/commit/ffd413cf04ba70b7f91f5787c5a492260c175b24))
* **user:** expose associated nuclei endpoint ([7af9390](https://github.com/lauralxra/Projeto_Ip-/commit/7af939069072fca7027ec9f030fc83fc108d2894))
* **users:** implementa atualização do nome ([a3d724f](https://github.com/lauralxra/Projeto_Ip-/commit/a3d724f819ae9f65910a414982f2324a086e70a6))

# [1.1.0-dev.3](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.2...v1.1.0-dev.3) (2026-11-04)


### Bug Fixes

* **docker:** copy vendor folder before npm ci ([a8491a0](https://github.com/lauralxra/Projeto_Ip-/commit/a8491a0919db609289c9e1c5f4702e540bcd38b8))
* **frontend:** corrigir criação e validação de indicadores ([ed30d91](https://github.com/lauralxra/Projeto_Ip-/commit/ed30d91a83280527c626aadca219f5d43282b4d5))
* **frontend:** remover fallback mockado do filtro de programas ([f8830ae](https://github.com/lauralxra/Projeto_Ip-/commit/f8830ae16915164086331a75ad49453126b8adda))
* **importacao:** exigir núcleo e programa existentes ([d8a59aa](https://github.com/lauralxra/Projeto_Ip-/commit/d8a59aa22e78e9a3a7631f42d77bdd1570ccbe72))


### Features

* **importacao:** validar e persistir indicadores com contexto de núcleo e programa ([4119e0e](https://github.com/lauralxra/Projeto_Ip-/commit/4119e0e917c3b8fcd086aeeded3254429c88c136))
* integra indicadores e dashboards com backend e permite importação e exportação (ainda não está 100% concluído) ([e95c353](https://github.com/lauralxra/Projeto_Ip-/commit/e95c35370fea53993b52b9330d663c4703708ad6))

# [1.1.0-dev.2](https://github.com/lauralxra/Projeto_Ip-/compare/v1.1.0-dev.1...v1.1.0-dev.2) (2026-10-27)


### Features

* **auth:** integracao do login com backend ([6fcca5b](https://github.com/lauralxra/Projeto_Ip-/commit/6fcca5b29e00df6665961819761246918e1cef03))

# [1.1.0-dev.1](https://github.com/lauralxra/Projeto_Ip-/compare/v1.0.0...v1.1.0-dev.1) (2026-10-20)


### Bug Fixes

* add dependecies for package ([a393506](https://github.com/lauralxra/Projeto_Ip-/commit/a393506bc4cd8750f932a993e381037b0b53a134))
* add tsx files to semantic commit ([12c1455](https://github.com/lauralxra/Projeto_Ip-/commit/12c1455fb547298fc3749288ad18f3d31e5539df))
* ajust schema and migrations to auth ([885de10](https://github.com/lauralxra/Projeto_Ip-/commit/885de10d2c397ab40efb23137cc7174145fb97b5))
* **docker:** ajusting conection to db ([4a9d9d1](https://github.com/lauralxra/Projeto_Ip-/commit/4a9d9d1ac654d66b41aaa6de5088aeae6881ef73))
* frontend files from backend ([14d1a8c](https://github.com/lauralxra/Projeto_Ip-/commit/14d1a8c06d82c7c444f39a75a805ba71e6b109c4))


### Features

* **app:** import prisma module and auth module in root app module ([07f92bf](https://github.com/lauralxra/Projeto_Ip-/commit/07f92bf2cd9cec789f8349d4b386b83aa286630c))
* **auth:** add auth entity scaffold ([e59dd5e](https://github.com/lauralxra/Projeto_Ip-/commit/e59dd5e08f7a1109c88a2edc749682d0ccec61bd))
* **auth:** configure auth module with dynamic jwt configuration ([a5971bf](https://github.com/lauralxra/Projeto_Ip-/commit/a5971bf61a7fb60a79309ca8b82fa9a728c10fdc))
* **auth:** define authenticated request and user interfaces ([8e36328](https://github.com/lauralxra/Projeto_Ip-/commit/8e363284dc18011713bba81a55cdc4edbf172cf9))
* **auth:** define jwt payload contract with subject and role ([b9c45b6](https://github.com/lauralxra/Projeto_Ip-/commit/b9c45b613007bb824f380e8f888859c86e537f56))
* **auth:** define login dto with validation, transformation and swagger metadata ([80b49cb](https://github.com/lauralxra/Projeto_Ip-/commit/80b49cb8f4f937cbb630c13636813d654986f4cf))
* **auth:** define register dto with input sanitization and password policies ([52d7ff5](https://github.com/lauralxra/Projeto_Ip-/commit/52d7ff50203074a592dfaa562c282bf6b388545a))
* **auth:** define roles decorator for route authorization metadata ([270b2cb](https://github.com/lauralxra/Projeto_Ip-/commit/270b2cb5db44d8352b9ca25dba964008355c4b0f))
* **auth:** define swagger response dtos for register and login endpoints ([9a7b41d](https://github.com/lauralxra/Projeto_Ip-/commit/9a7b41d557ed4b998925387ad282200b052d4ba4))
* **auth:** expose register and login endpoints in auth controller ([5953ca7](https://github.com/lauralxra/Projeto_Ip-/commit/5953ca75dd156b77e64e199c24ba0ead9d47d834))
* **auth:** implement authentication service with register and login logic ([8acc4fc](https://github.com/lauralxra/Projeto_Ip-/commit/8acc4fc374603959ae153ff45eda5e06408621ab))
* **auth:** implement roles guard for role-based authorization check ([6dd2119](https://github.com/lauralxra/Projeto_Ip-/commit/6dd21196e1e8fdad9e8eaba8698843ef14753c5e))
* calls audit function to registrate ([944bbae](https://github.com/lauralxra/Projeto_Ip-/commit/944bbaef35b899979fb4b06318404ec2cbd207d1))
* create audit module and a function to registrate, without public endpoint ([6c19494](https://github.com/lauralxra/Projeto_Ip-/commit/6c19494e739d416c2e540c1b0066d800683c55ee))
* **database:** update access control enum from PerfilAcesso to Role in schema ([24e4026](https://github.com/lauralxra/Projeto_Ip-/commit/24e4026f164e081f180a2f5b0f6ec2a0e2a5755f))
* implements dockerization on backend ([fa35403](https://github.com/lauralxra/Projeto_Ip-/commit/fa354030920f0ff117b31bd6ccdd5cfb5d32125e))
* just skipping some issues ([2f42297](https://github.com/lauralxra/Projeto_Ip-/commit/2f4229770dd9a534a6470acee89ed1df5f7eccf4))
* **login:** ajust login for UC1, with limit and audit ([12f5039](https://github.com/lauralxra/Projeto_Ip-/commit/12f503953ac2d42150a97b2908f76c634962eb24))
* **main:** enable global validation pipe with payload transformation ([aa9f3d1](https://github.com/lauralxra/Projeto_Ip-/commit/aa9f3d1fc43274a1c4cc12409aeb23f10b9dcc17))
* **migration:** add safe migration for user and faq role enums ([cc182a8](https://github.com/lauralxra/Projeto_Ip-/commit/cc182a84ad95eacf922d0b1bb0ac1ddd5895656b))
* **prisma:** introduce global prisma module for database access ([9c583d1](https://github.com/lauralxra/Projeto_Ip-/commit/9c583d1c4400852b24a02d014b7f78b952c74095))
* **prisma:** register admin seed service in global prisma module ([5e8da94](https://github.com/lauralxra/Projeto_Ip-/commit/5e8da94e192b640f5994146e4ed37e4000a944ef))
* **RBAC:** role access on endpoint ([bbf91f5](https://github.com/lauralxra/Projeto_Ip-/commit/bbf91f5159447ca97a7d9071aeb3f5f70a95c616))
* schema migration + full schema ([0da3d8c](https://github.com/lauralxra/Projeto_Ip-/commit/0da3d8cb8afbd064004673e246a2fc002e75e906))
* **seed:** create admin seed service running on application bootstrap ([175d9a4](https://github.com/lauralxra/Projeto_Ip-/commit/175d9a4184b4fb42879e5c55c97c454ef5fcbff1))
* **seed:** implement database seed script for admin user creation ([4edab4b](https://github.com/lauralxra/Projeto_Ip-/commit/4edab4b253a340bd1d14a541f1c23717766702e6))
* some packages ([6c7e316](https://github.com/lauralxra/Projeto_Ip-/commit/6c7e316f233c47d4b491db13078f3ab04c85ae2c))
* some stuff outside the principal ([3901086](https://github.com/lauralxra/Projeto_Ip-/commit/390108629118cea3a31c00d212db9d243f503db4))
* **user:** add validation decorators and role field to create-user dto ([05d70d2](https://github.com/lauralxra/Projeto_Ip-/commit/05d70d2693bef426df4ce955a17128caa89f0513))
* **user:** query users via prisma and add findById with password exclusion ([f8bbede](https://github.com/lauralxra/Projeto_Ip-/commit/f8bbede956897191a9205bbcb6939102619158f7))

# 1.0.0 (2026-10-05)


### Bug Fixes

* **CI:** ajusting workflow ([4102412](https://github.com/lauralxra/Projeto_Ip-/commit/4102412450b2c63c840eb7e3ef094519ed928a64))
* package json ([e39a07f](https://github.com/lauralxra/Projeto_Ip-/commit/e39a07f0672f4b2699e6b1a647ab12b11543b9aa))


### Features

* add git attributes ([b4b046a](https://github.com/lauralxra/Projeto_Ip-/commit/b4b046a30ba3e25cd81d2f5587f752cff09c330e))
* initial commit ([a52bd11](https://github.com/lauralxra/Projeto_Ip-/commit/a52bd11344f00dcb7522791f37e2e239dc5db9fc))
