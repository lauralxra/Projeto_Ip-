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
