import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types'
import { CalculatorController } from './../src/calculator/calculator.controller'
import { CalculatorService } from './../src/calculator/calculator.service'

describe('CalculatorController (e2e)', () => {
  let app: INestApplication<App>

  // CalculatorController/Service는 상태가 없어 앱 인스턴스를 테스트 간 공유 가능 → 1회만 초기화
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CalculatorController],
      providers: [CalculatorService],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /api/calculator/penalties', () => {
    it('200 → 7개 위반 규칙 배열을 반환하고 각 항목이 필수 필드를 갖는다', () => {
      return request(app.getHttpServer())
        .get('/api/calculator/penalties')
        .expect(200)
        .expect((res) => {
          const body = res.body as Array<Record<string, unknown>>
          expect(Array.isArray(body)).toBe(true)
          expect(body).toHaveLength(7)
          for (const rule of body) {
            expect(typeof rule.id).toBe('string')
            expect(typeof rule.name).toBe('string')
            expect(typeof rule.category).toBe('string')
            expect(typeof rule.fineNormal).toBe('number')
            expect(typeof rule.fineChildZone).toBe('number')
            expect(typeof rule.pointsNormal).toBe('number')
            expect(typeof rule.description).toBe('string')
          }
        })
    })
  })

  describe('POST /api/calculator/maintenance', () => {
    it('201 → sedan/gasoline 유지비를 결정적 값으로 계산한다', () => {
      return request(app.getHttpServer())
        .post('/api/calculator/maintenance')
        .send({
          carType: 'sedan',
          fuelType: 'gasoline',
          annualMileage: 12000,
          insuranceCost: 800000,
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as {
            annual: {
              fuel: number
              tax: number
              maintenance: number
              total: number
            }
            monthly: { total: number }
            analysis: { fuelPercentage: number }
          }
          expect(body.annual.fuel).toBe(1584000)
          expect(body.annual.tax).toBe(290000)
          expect(body.annual.maintenance).toBe(350000)
          expect(body.annual.total).toBe(3024000)
          expect(body.monthly.total).toBe(252000)
          expect(body.analysis.fuelPercentage).toBe(52)
        })
    })

    it('201 → compact/electric은 전기차 세금·정비비 분기를 적용한다', () => {
      return request(app.getHttpServer())
        .post('/api/calculator/maintenance')
        .send({
          carType: 'compact',
          fuelType: 'electric',
          annualMileage: 10000,
          insuranceCost: 600000,
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as {
            annual: { tax: number; maintenance: number }
          }
          // 전기차 일괄 세액
          expect(body.annual.tax).toBe(130000)
          // compact 기본 정비비 200000 * 0.7
          expect(body.annual.maintenance).toBe(140000)
        })
    })

    it('400 → 허용되지 않은 carType이면 검증에 실패한다', () => {
      return request(app.getHttpServer())
        .post('/api/calculator/maintenance')
        .send({
          carType: 'truck',
          fuelType: 'gasoline',
          annualMileage: 12000,
          insuranceCost: 800000,
        })
        .expect(400)
    })

    it('400 → 허용되지 않은 fuelType이면 검증에 실패한다', () => {
      return request(app.getHttpServer())
        .post('/api/calculator/maintenance')
        .send({
          carType: 'sedan',
          fuelType: 'hydrogen',
          annualMileage: 12000,
          insuranceCost: 800000,
        })
        .expect(400)
    })

    it('400 → annualMileage가 숫자가 아니면 검증에 실패한다', () => {
      return request(app.getHttpServer())
        .post('/api/calculator/maintenance')
        .send({
          carType: 'sedan',
          fuelType: 'gasoline',
          annualMileage: 'many',
          insuranceCost: 800000,
        })
        .expect(400)
    })

    it('400 → 필수 필드가 누락되면 검증에 실패한다', () => {
      return request(app.getHttpServer())
        .post('/api/calculator/maintenance')
        .send({ carType: 'sedan' })
        .expect(400)
    })
  })
})
