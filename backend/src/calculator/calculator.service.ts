import { Injectable } from '@nestjs/common';

// 범칙금/과태료 기준 데이터 (도로교통공단 공식 정보 요약 기반)
export interface PenaltyRule {
  id: string;
  name: string;
  category: string;
  fineNormal: number;      // 일반 도로 과태료 (승용차 기준)
  fineChildZone: number;   // 어린이 보호구역 과태료 (승용차 기준)
  penaltyNormal: number;   // 일반 도로 범칙금 (승용차 기준)
  penaltyChildZone: number;// 어린이 보호구역 범칙금 (승용차 기준)
  pointsNormal: number;    // 일반 도로 벌점
  pointsChildZone: number; // 어린이 보호구역 벌점
  description: string;
}

export interface MaintenanceInput {
  carType: 'compact' | 'sedan' | 'suv' | 'large';
  fuelType: 'gasoline' | 'diesel' | 'electric';
  annualMileage: number;  // 연간 주행거리 (km)
  insuranceCost: number;  // 연간 보험료 (원)
}

@Injectable()
export class CalculatorService {
  private penaltyRules: PenaltyRule[] = [
    {
      id: 'signal_violation',
      name: '신호 및 지시 위반',
      category: 'signal',
      fineNormal: 70000,
      fineChildZone: 130000,
      penaltyNormal: 60000,
      penaltyChildZone: 120000,
      pointsNormal: 15,
      pointsChildZone: 30,
      description: '적색 신호나 꼬리물기, 좌회전 금지 구역에서 신호를 위반한 경우 적용됩니다.',
    },
    {
      id: 'speed_20_under',
      name: '속도 위반 (20km/h 이하 초과)',
      category: 'speed',
      fineNormal: 40000,
      fineChildZone: 70000,
      penaltyNormal: 30000,
      penaltyChildZone: 60000,
      pointsNormal: 0,
      pointsChildZone: 15,
      description: '제한속도를 20km/h 이하로 초과하여 단속된 경우로, 일반도로에서는 벌점이 없습니다.',
    },
    {
      id: 'speed_20_40',
      name: '속도 위반 (20km/h 초과 ~ 40km/h 이하)',
      category: 'speed',
      fineNormal: 80000,
      fineChildZone: 100000,
      penaltyNormal: 70000,
      penaltyChildZone: 90000,
      pointsNormal: 15,
      pointsChildZone: 30,
      description: '제한속도를 20km/h 초과 40km/h 이하로 주행하여 단속된 경우입니다.',
    },
    {
      id: 'speed_40_60',
      name: '속도 위반 (40km/h 초과 ~ 60km/h 이하)',
      category: 'speed',
      fineNormal: 110000,
      fineChildZone: 130000,
      penaltyNormal: 100000,
      penaltyChildZone: 120000,
      pointsNormal: 30,
      pointsChildZone: 60,
      description: '속도를 크게 위반한 경우로, 벌점이 대폭 무거워져 면허 정지 처분으로 이어질 수 있습니다.',
    },
    {
      id: 'parking_violation',
      name: '주정차 위반 (소방시설 제외)',
      category: 'parking',
      fineNormal: 40000,
      fineChildZone: 120000,
      penaltyNormal: 40000,
      penaltyChildZone: 120000,
      pointsNormal: 0,
      pointsChildZone: 0,
      description: '불법 주정차 금지 구역에 주차 시 부과됩니다. 어린이 보호구역은 일반 도로의 3배가 부과됩니다.',
    },
    {
      id: 'cellphone_use',
      name: '운전 중 휴대용 전화 사용',
      category: 'manner',
      fineNormal: 70000,
      fineChildZone: 130000,
      penaltyNormal: 60000,
      penaltyChildZone: 120000,
      pointsNormal: 15,
      pointsChildZone: 30,
      description: '주행 중 휴대전화를 조작하거나 통화하는 행동은 사고 위험이 매우 높아 단속 및 벌점 대상입니다.',
    },
    {
      id: 'seatbelt_unfastened',
      name: '안전띠 미착용 (운전자)',
      category: 'manner',
      fineNormal: 30000,
      fineChildZone: 30000,
      penaltyNormal: 30000,
      penaltyChildZone: 30000,
      pointsNormal: 0,
      pointsChildZone: 0,
      description: '운전석 및 동승자 전 좌석 안전띠 착용은 필수 의무입니다.',
    }
  ];

  /**
   * 전체 위반 항목 규정 목록을 가져옵니다.
   */
  getPenaltyRules(): PenaltyRule[] {
    return this.penaltyRules;
  }

  /**
   * 차량 유지비를 정밀 연산합니다.
   */
  calculateMaintenance(input: MaintenanceInput) {
    const { carType, fuelType, annualMileage, insuranceCost } = input;

    // 1. 연비 및 연료 가격 세팅
    let fuelEfficiency = 12.0; // km/L (또는 km/kWh)
    let fuelUnitPrice = 1650;  // 원/L (또는 원/kWh)

    // 차종별 연비 보정
    switch (carType) {
      case 'compact':
        fuelEfficiency = fuelType === 'electric' ? 6.0 : 15.5;
        break;
      case 'sedan':
        fuelEfficiency = fuelType === 'electric' ? 5.2 : 12.5;
        break;
      case 'suv':
        fuelEfficiency = fuelType === 'electric' ? 4.5 : 11.0;
        break;
      case 'large':
        fuelEfficiency = fuelType === 'electric' ? 3.8 : 8.5;
        break;
    }

    // 연료별 단가 세팅
    switch (fuelType) {
      case 'gasoline':
        fuelUnitPrice = 1650;
        break;
      case 'diesel':
        fuelUnitPrice = 1500;
        break;
      case 'electric':
        fuelUnitPrice = 340; // 한전 전기차 충전 단가 평균 가정
        break;
    }

    // 2. 항목별 연간 비용 계산
    // 연간 유류비 = (연간주행거리 / 연비) * 연료단가
    const annualFuelCost = Math.round((annualMileage / fuelEfficiency) * fuelUnitPrice);

    // 연간 세금 계산
    let annualTax = 290000; // 준중형/중형 세단 기본세율 가정
    switch (carType) {
      case 'compact':
        annualTax = 100000;
        break;
      case 'sedan':
        annualTax = 290000; // 1,600cc 기준
        break;
      case 'suv':
        annualTax = 390000; // 2,000cc 기준
        break;
      case 'large':
        annualTax = 520000; // 2,500cc 이상 기준
        break;
    }
    if (fuelType === 'electric') {
      annualTax = 130000; // 전기차 일괄 세액 적용 (지방세 포함)
    }

    // 연간 소모품 및 정비 점검비 추정
    let annualMaintenanceCost = 350000;
    switch (carType) {
      case 'compact':
        annualMaintenanceCost = 200000;
        break;
      case 'sedan':
        annualMaintenanceCost = 350000;
        break;
      case 'suv':
        annualMaintenanceCost = 450000;
        break;
      case 'large':
        annualMaintenanceCost = 600000;
        break;
    }
    // 전기차는 오일류 소모품 비용이 매우 낮음 (30% 절감 가정)
    if (fuelType === 'electric') {
      annualMaintenanceCost = Math.round(annualMaintenanceCost * 0.7);
    }

    const annualTotal = annualFuelCost + annualTax + insuranceCost + annualMaintenanceCost;
    
    // 3. 월 평균 비용 도출
    const monthlyTotal = Math.round(annualTotal / 12);

    return {
      annual: {
        fuel: annualFuelCost,
        tax: annualTax,
        insurance: insuranceCost,
        maintenance: annualMaintenanceCost,
        total: annualTotal,
      },
      monthly: {
        fuel: Math.round(annualFuelCost / 12),
        tax: Math.round(annualTax / 12),
        insurance: Math.round(insuranceCost / 12),
        maintenance: Math.round(annualMaintenanceCost / 12),
        total: monthlyTotal,
      },
      analysis: {
        fuelPercentage: Math.round((annualFuelCost / annualTotal) * 100),
        taxPercentage: Math.round((annualTax / annualTotal) * 100),
        insurancePercentage: Math.round((insuranceCost / annualTotal) * 100),
        maintenancePercentage: Math.round((annualMaintenanceCost / annualTotal) * 100),
      }
    };
  }
}
