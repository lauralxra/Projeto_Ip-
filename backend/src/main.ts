import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
