import { Test, TestingModule } from '@nestjs/testing';
import { CalculatorService, MaintenanceInput } from './calculator.service';

/**
 * 계산기 도메인 로직 유닛테스트
 * - 외부 의존성(DB/Gemini) 없음 → 순수 함수 검증
 * - 사용자 입력 → 결과 합산이 깨지면 즉시 잡힘
 */
describe('CalculatorService', () => {
  let service: CalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalculatorService],
    }).compile();
    service = module.get<CalculatorService>(CalculatorService);
  });

  describe('getPenaltyRules', () => {
    it('returns the full rule set (>= 7 items)', () => {
      const rules = service.getPenaltyRules();
      expect(rules.length).toBeGreaterThanOrEqual(7);
    });

    it('every rule has child-zone amounts at least as high as normal (child zone is never cheaper)', () => {
      for (const rule of service.getPenaltyRules()) {
        expect(rule.fineChildZone).toBeGreaterThanOrEqual(rule.fineNormal);
        expect(rule.penaltyChildZone).toBeGreaterThanOrEqual(rule.penaltyNormal);
        expect(rule.pointsChildZone).toBeGreaterThanOrEqual(rule.pointsNormal);
      }
    });

    it('every rule has non-empty id/name/description', () => {
      for (const rule of service.getPenaltyRules()) {
        expect(rule.id).toMatch(/^[a-z_0-9]+$/);
        expect(rule.name.length).toBeGreaterThan(0);
        expect(rule.description.length).toBeGreaterThan(10);
      }
    });
  });

  describe('calculateMaintenance', () => {
    const baseSedan: MaintenanceInput = {
      carType: 'sedan',
      fuelType: 'gasoline',
      annualMileage: 12_000,
      insuranceCost: 800_000,
    };

    it('annual.total equals sum of components (no rounding drift in sum)', () => {
      const res = service.calculateMaintenance(baseSedan);
      expect(res.annual.total).toBe(
        res.annual.fuel +
          res.annual.tax +
          res.annual.insurance +
          res.annual.maintenance,
      );
    });

    it('monthly.total = round(annual.total / 12) (consistent rounding)', () => {
      const res = service.calculateMaintenance(baseSedan);
      expect(res.monthly.total).toBe(Math.round(res.annual.total / 12));
    });

    it('analysis percentages sum to ~100 (±2 due to rounding of each part)', () => {
      const res = service.calculateMaintenance(baseSedan);
      const sumPct =
        res.analysis.fuelPercentage +
        res.analysis.taxPercentage +
        res.analysis.insurancePercentage +
        res.analysis.maintenancePercentage;
      expect(sumPct).toBeGreaterThanOrEqual(98);
      expect(sumPct).toBeLessThanOrEqual(102);
    });

    it('electric vehicles have lower tax than equivalent ICE for sedan', () => {
      const electric = service.calculateMaintenance({ ...baseSedan, fuelType: 'electric' });
      const gasoline = service.calculateMaintenance({ ...baseSedan, fuelType: 'gasoline' });
      expect(electric.annual.tax).toBeLessThan(gasoline.annual.tax);
    });

    it('electric vehicles have lower maintenance (30% rule) than ICE', () => {
      const electric = service.calculateMaintenance({ ...baseSedan, fuelType: 'electric' });
      const gasoline = service.calculateMaintenance({ ...baseSedan, fuelType: 'gasoline' });
      expect(electric.annual.maintenance).toBeLessThan(gasoline.annual.maintenance);
    });

    it('higher mileage → higher fuel cost (monotonic)', () => {
      const low = service.calculateMaintenance({ ...baseSedan, annualMileage: 5_000 });
      const high = service.calculateMaintenance({ ...baseSedan, annualMileage: 20_000 });
      expect(high.annual.fuel).toBeGreaterThan(low.annual.fuel);
    });

    it('large SUV has higher tax than compact', () => {
      const compact = service.calculateMaintenance({ ...baseSedan, carType: 'compact' });
      const large = service.calculateMaintenance({ ...baseSedan, carType: 'large' });
      expect(large.annual.tax).toBeGreaterThan(compact.annual.tax);
    });

    it('zero insurance cost still produces valid result (no NaN)', () => {
      const res = service.calculateMaintenance({ ...baseSedan, insuranceCost: 0 });
      expect(Number.isFinite(res.annual.total)).toBe(true);
      expect(res.annual.insurance).toBe(0);
    });
  });
});
