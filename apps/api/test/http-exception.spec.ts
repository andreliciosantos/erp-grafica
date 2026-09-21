import { describe, it, expect, vi } from 'vitest';
import { BadRequestException, HttpStatus, NotFoundException } from '@nestjs/common';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Filtro Global de Exceções RFC 7807 (HttpExceptionFilter)', () => {
  it('deve formatar exceções HTTP no padrão RFC 7807', () => {
    const filter = new HttpExceptionFilter();

    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    const hostMock: any = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusMock }),
        getRequest: () => ({ url: '/api/v1/test-endpoint' }),
      }),
    };

    const exception = new BadRequestException('Parâmetro obrigatório ausente.');

    filter.catch(exception, hostMock);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Parâmetro obrigatório ausente.',
        error: 'Bad Request',
        path: '/api/v1/test-endpoint',
        timestamp: expect.any(String),
      }),
    );
  });

  it('deve tratar erros genéricos inesperados como 500 Internal Server Error no padrão RFC 7807', () => {
    const filter = new HttpExceptionFilter();

    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    const hostMock: any = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusMock }),
        getRequest: () => ({ url: '/api/v1/crash' }),
      }),
    };

    const genericError = new Error('Falha de I/O de disco.');

    filter.catch(genericError, hostMock);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Falha de I/O de disco.',
        error: 'Error',
        path: '/api/v1/crash',
        timestamp: expect.any(String),
      }),
    );
  });
});
