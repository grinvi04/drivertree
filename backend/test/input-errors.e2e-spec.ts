import { Body, Controller, INestApplication, Post, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AllExceptionsFilter } from '../src/common/all-exceptions.filter'

// 실제 Nest/Express 기본 JSON parser와 운영 filter를 연결한다.
// 제품 controller/DB/외부 AI는 이 parser 경계의 관찰 대상이 아니다.
@Controller('chat')
class ParserProbeController {
  @Post('ask')
  ask(@Body() body: { message: string }) {
    if (body.message === 'server-error') throw new Error('fixture server error')
    return { message: body.message }
  }
}

describe('JSON parser 오류의 HTTP 응답 경계', () => {
  let app: INestApplication<App>

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ParserProbeController],
    }).compile()
    app = moduleRef.createNestApplication({ logger: false })
    app.setGlobalPrefix('api')
    app.useGlobalFilters(new AllExceptionsFilter())
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('정상 JSON은 201과 입력 메시지를 유지한다', async () => {
    await request(app.getHttpServer())
      .post('/api/chat/ask')
      .send({ message: 'normal' })
      .expect(201)
      .expect({ message: 'normal' })
  })

  it('깨진 JSON은 BAD_REQUEST 400이며 500이 아니다', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/chat/ask')
      .set('Content-Type', 'application/json')
      .send('{"message":')
      .expect(400)
    expect(response.body).toMatchObject({ statusCode: 400, code: 'BAD_REQUEST' })
  })

  it('기본 parser 한도 초과는 PAYLOAD_TOO_LARGE 413이다', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/chat/ask')
      .send({ message: 'x'.repeat(110 * 1024) })
      .expect(413)
    expect(response.body).toMatchObject({ statusCode: 413, code: 'PAYLOAD_TOO_LARGE' })
  })

  it('예상 밖 controller 오류는 INTERNAL_SERVER_ERROR 500이다', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/chat/ask')
      .send({ message: 'server-error' })
      .expect(500)
    expect(response.body).toMatchObject({ statusCode: 500, code: 'INTERNAL_SERVER_ERROR' })
  })
})
