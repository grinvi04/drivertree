import { describe, it, expect } from 'vitest';
import { ApiError } from './errors';

describe('ApiError', () => {
  it('isRateLimit: 429만 true', () => {
    expect(new ApiError(429, 'x').isRateLimit()).toBe(true);
    expect(new ApiError(500, 'x').isRateLimit()).toBe(false);
  });

  it('isServerError: 5xx만 true', () => {
    expect(new ApiError(500, 'x').isServerError()).toBe(true);
    expect(new ApiError(503, 'x').isServerError()).toBe(true);
    expect(new ApiError(404, 'x').isServerError()).toBe(false);
  });

  it('isClientError: 4xx만 true', () => {
    expect(new ApiError(404, 'x').isClientError()).toBe(true);
    expect(new ApiError(429, 'x').isClientError()).toBe(true);
    expect(new ApiError(500, 'x').isClientError()).toBe(false);
  });

  it('statusCode·message·name 보존, Error 인스턴스', () => {
    const e = new ApiError(418, "I'm a teapot");
    expect(e.statusCode).toBe(418);
    expect(e.message).toBe("I'm a teapot");
    expect(e.name).toBe('ApiError');
    expect(e).toBeInstanceOf(Error);
  });

  it('code: 백엔드 Envelope 코드를 보존(분기는 code로), 없으면 undefined', () => {
    expect(new ApiError(400, 'bad', 'BAD_REQUEST').code).toBe('BAD_REQUEST');
    expect(new ApiError(0, '네트워크 오류').code).toBeUndefined();
  });
});
