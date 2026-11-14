import { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;
  let response: { status: jest.Mock; json: jest.Mock };
  let host: ArgumentsHost;

  const knownError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('erro', {
      code,
      clientVersion: 'test',
    });

  beforeEach(() => {
    filter = new PrismaExceptionFilter();
    jest.spyOn(filter['logger'], 'error').mockImplementation(() => undefined);
    response = { status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);
    host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;
  });

  it.each([
    ['P2002', 409],
    ['P2003', 409],
    ['P2025', 404],
    ['P1001', 503],
    ['P2000', 500],
  ])('código %s vira HTTP %i', (code, status) => {
    filter.catch(knownError(code), host);

    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: status }),
    );
  });

  it('falha de inicialização da conexão vira 503', () => {
    filter.catch(
      new Prisma.PrismaClientInitializationError('sem conexão', 'test'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(503);
  });

  it('não expõe a mensagem original do banco', () => {
    filter.catch(
      new Prisma.PrismaClientUnknownRequestError('detalhe interno do SQL', {
        clientVersion: 'test',
      }),
      host,
    );

    expect(response.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Erro interno ao acessar o banco de dados.',
      error: 'Internal Server Error',
    });
  });
});
