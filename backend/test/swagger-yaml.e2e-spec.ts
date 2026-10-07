import { createRequire } from 'node:module'
import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Test } from '@nestjs/testing'
import { ThrottlerModule } from '@nestjs/throttler'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppController } from './../src/app.controller'
import { AppService } from './../src/app.service'

const swaggerRequire = createRequire(require.resolve('@nestjs/swagger'))
const swaggerYaml = swaggerRequire('js-yaml') as {
  load: (source: string, options?: Record<string, unknown>) => unknown
  YAML11_SCHEMA: unknown
}

describe('Swagger YAML dependency (e2e)', () => {
  let app: INestApplication<App>

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([])],
      controllers: [AppController],
      providers: [AppService],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('DriveTree API').setVersion('1.0').build(),
    )
    SwaggerModule.setup('api/docs', app, document)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('serves equivalent OpenAPI JSON and YAML documents', async () => {
    const json = await request(app.getHttpServer()).get('/api/docs-json').expect(200)
    const yaml = await request(app.getHttpServer()).get('/api/docs-yaml').expect(200)

    expect(json.body).toHaveProperty('paths./api')
    expect(swaggerYaml.load(yaml.text)).toEqual(json.body)
  })

  it('rejects empty mapping merge sources exceeding the key budget', () => {
    const input = 'arr: &arr [{}, {}, {}, {}, {}]\ntargets:\n  - <<: *arr\n'

    expect(() =>
      swaggerYaml.load(input, {
        schema: swaggerYaml.YAML11_SCHEMA,
        maxTotalMergeKeys: 2,
      }),
    ).toThrow(/maxTotalMergeKeys/)
  })
})
