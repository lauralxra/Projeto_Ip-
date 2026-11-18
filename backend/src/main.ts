import 'dotenv/config';
import type { ServerResponse } from 'http';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { parseCorsOrigins } from './common/cors-origins';
import { PASTA_UPLOADS } from './common/upload-imagem';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Permite as requisições do frontend Vite/React (origens separadas por vírgula)
  app.enableCors({
    origin: parseCorsOrigins(process.env.CORS_ORIGIN),
    credentials: true,
  });

  const prefixo = process.env.API_PREFIX ?? 'api';
  app.setGlobalPrefix(prefixo);

  // Imagens enviadas (fotos de perfil e de núcleos) sob o mesmo prefixo da API,
  // para passarem pelo mesmo proxy em produção. nosniff impede o navegador de
  // interpretar o arquivo como outro tipo (ex.: HTML)
  app.useStaticAssets(PASTA_UPLOADS, {
    prefix: `/${prefixo}/uploads/`,
    index: false,
    dotfiles: 'deny',
    setHeaders: (res: ServerResponse) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Plataforma Instituto Ipê - API')
    .setDescription(
      'Documentação oficial da API REST da Plataforma do Instituto Ipê (Gestão Institucional, Núcleos, Usuários e Autenticação).',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Insira o token JWT de acesso retornado pelo endpoint de login.',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Operações de cadastro e autenticação de usuários')
    .addTag('user', 'Operações de gerenciamento de usuários')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Instituto Ipê API - Swagger Docs',
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
