import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AllExceptionsFilter } from './all-exceptions.filter';

/**
 * AllExceptionsFilter 단위 테스트.
 *
 * 핵심 회귀(T1-1): body-parser 단계의 비-HttpException(SyntaxError status=400,
 * PayloadTooLargeError statusCode=413)이 500으로 흡수되지 않고 4xx로 매핑되는지 박제한다.
 */
describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let statusFn: jest.Mock;
  let jsonFn: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jsonFn = jest.fn();
    statusFn = jest.fn().mockReturnValue({ json: jsonFn });

    const response = { status: statusFn } as unknown as Response;
    const request = {
      method: 'POST',
      originalUrl: '/api/chat/ask',
    } as unknown as Request;

    host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;
  });

  it('maps non-HttpException with status=400 (malformed JSON SyntaxError) to 400, not 500', () => {
    // express.json()이 깨진 JSON에 대해 던지는 형태: status/statusCode 400을 가진 Error
    const err = Object.assign(new SyntaxError('Unexpected token in JSON'), {
      status: 400,
      statusCode: 400,
    });

    filter.catch(err, host);

    expect(statusFn).toHaveBeenCalledWith(400);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'BAD_REQUEST' }),
    );
  });

  it('maps non-HttpException with statusCode=413 (PayloadTooLarge) to 413, not 500', () => {
    const err = Object.assign(new Error('request entity too large'), {
      statusCode: 413,
    });

    filter.catch(err, host);

    expect(statusFn).toHaveBeenCalledWith(413);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PAYLOAD_TOO_LARGE' }),
    );
  });

  it('keeps plain Error (no status) as 500', () => {
    filter.catch(new Error('boom'), host);
    expect(statusFn).toHaveBeenCalledWith(500);
  });

  it('attaches SCREAMING_SNAKE code for 5xx server errors', () => {
    filter.catch(new Error('boom'), host);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INTERNAL_SERVER_ERROR' }),
    );
  });

  it('maps 429 HttpException to TOO_MANY_REQUESTS code', () => {
    filter.catch(new HttpException('rate', HttpStatus.TOO_MANY_REQUESTS), host);
    expect(statusFn).toHaveBeenCalledWith(429);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'TOO_MANY_REQUESTS' }),
    );
  });

  it('does NOT honor a non-HttpException 5xx status — treats as 500 server error', () => {
    const err = Object.assign(new Error('upstream 503'), { status: 503 });
    filter.catch(err, host);
    expect(statusFn).toHaveBeenCalledWith(500);
  });

  it('still maps HttpException via getStatus()', () => {
    filter.catch(new BadRequestException('bad'), host);
    expect(statusFn).toHaveBeenCalledWith(400);
  });
});
