import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

// Falhas de conexão com o banco (servidor fora do ar, timeout, conexão encerrada)
const CODIGOS_CONEXAO = new Set(['P1001', 'P1002', 'P1008', 'P1017']);

// RNF16: converte erros do Prisma em respostas HTTP padronizadas, sem vazar detalhes do banco
@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientUnknownRequestError,
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientValidationError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    this.logger.error(exception.message, exception.stack);

    const httpException = this.toHttpException(exception);
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(httpException.getStatus())
      .json(httpException.getResponse());
  }

  private toHttpException(exception: Error): HttpException {
    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return this.bancoIndisponivel();
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (CODIGOS_CONEXAO.has(exception.code)) return this.bancoIndisponivel();

      switch (exception.code) {
        case 'P2002':
          return new ConflictException(
            'Já existe um registro cadastrado com estes dados.',
          );
        case 'P2003':
          return new ConflictException(
            'A operação viola um relacionamento com outro registro.',
          );
        case 'P2025':
          return new NotFoundException('Registro não encontrado.');
      }
    }

    return new InternalServerErrorException(
      'Erro interno ao acessar o banco de dados.',
    );
  }

  private bancoIndisponivel() {
    return new ServiceUnavailableException(
      'Banco de dados indisponível. Tente novamente mais tarde.',
    );
  }
}
