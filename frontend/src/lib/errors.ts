export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    // 백엔드 에러 Envelope의 SCREAMING_SNAKE 코드(예: 'BAD_REQUEST', 'NOT_FOUND').
    // 분기는 code/statusCode로 — message는 표시용. 네트워크 실패 등 코드 없는 경우 undefined.
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  isRateLimit(): boolean {
    return this.statusCode === 429
  }

  isServerError(): boolean {
    return this.statusCode >= 500
  }

  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500
  }
}
