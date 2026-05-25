'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  Calculator, 
  Car, 
  Scale, 
  AlertTriangle, 
  HelpCircle,
  TrendingUp,
  Droplet,
  FileText,
  Shield,
  Wrench
} from 'lucide-react';

interface PenaltyRule {
  id: string;
  name: string;
  category: string;
  fineNormal: number;
  fineChildZone: number;
  penaltyNormal: number;
  penaltyChildZone: number;
  pointsNormal: number;
  pointsChildZone: number;
  description: string;
}

interface MaintenanceResult {
  annual: {
    fuel: number;
    tax: number;
    insurance: number;
    maintenance: number;
    total: number;
  };
  monthly: {
    fuel: number;
    tax: number;
    insurance: number;
    maintenance: number;
    total: number;
  };
  analysis: {
    fuelPercentage: number;
    taxPercentage: number;
    insurancePercentage: number;
    maintenancePercentage: number;
  };
}

export default function CalculatorsPage() {
  const [activeTab, setActiveTab] = useState<'penalty' | 'maintenance'>('penalty');

  // 1. 범칙금 계산기 상태
  const [penalties, setPenalties] = useState<PenaltyRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [isChildZone, setIsChildZone] = useState(false);
  const [penaltyLoading, setPenaltyLoading] = useState(true);

  // 2. 유지비 계산기 상태
  const [carType, setCarType] = useState<'compact' | 'sedan' | 'suv' | 'large'>('sedan');
  const [fuelType, setFuelType] = useState<'gasoline' | 'diesel' | 'electric'>('gasoline');
  const [annualMileage, setAnnualMileage] = useState(15000);
  const [insuranceCost, setInsuranceCost] = useState(1200000);
  const [maintenanceResult, setMaintenanceResult] = useState<MaintenanceResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  useEffect(() => {
    fetchPenalties();
    handleCalculateMaintenance(); // 기본 세팅 기준 초기 유지비 연산 수행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 범칙금 규칙 데이터 조회
  const fetchPenalties = async () => {
    setPenaltyLoading(true);
    try {
      const data = (await api.getPenalties()) as PenaltyRule[];
      setPenalties(data);
      if (data.length > 0) {
        setSelectedRuleId(data[0].id);
      }
    } catch (err) {
      console.error('범칙금 데이터 조회 에러:', err);
    } finally {
      setPenaltyLoading(false);
    }
  };

  // 유지비 계산 처리
  const handleCalculateMaintenance = async () => {
    setCalcLoading(true);
    try {
      const result = (await api.calculateMaintenance({
        carType,
        fuelType,
        annualMileage: Number(annualMileage),
        insuranceCost: Number(insuranceCost),
      })) as MaintenanceResult;
      setMaintenanceResult(result);
    } catch (err) {
      console.error('유지비 연산 실패:', err);
    } finally {
      setCalcLoading(false);
    }
  };

  // 선택된 범칙금 규칙 파싱
  const selectedRule = penalties.find(r => r.id === selectedRuleId);

  return (
    <div className="relative w-full flex flex-col min-h-screen bg-[#0B0F19] py-12 overflow-x-hidden">
      {/* 장식용 글로우 */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-yellow-accent/4 blur-[130px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            실전 운전 <span className="text-yellow-gradient">스마트 계산기</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            헷갈리는 범칙금/과태료 기준과 매달 지출될 차량 유지비를 현실적인 공식으로 확인해 보세요.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex p-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-8 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('penalty')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === 'penalty'
                ? 'bg-yellow-accent text-[#0B0F19] shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">범칙금 · 과태료 계산기</span>
            <span className="sm:hidden">범칙금 · 과태료</span>
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === 'maintenance'
                ? 'bg-yellow-accent text-[#0B0F19] shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">차량 유지비 계산기</span>
            <span className="sm:hidden">차량 유지비</span>
          </button>
        </div>

        {/* 1. 범칙금 계산기 화면 */}
        {activeTab === 'penalty' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* 입력 폼 (왼쪽 3칸) */}
            <div className="md:col-span-3 rounded-3xl glass-panel p-6 border border-white/[0.06] flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-accent" />
                  단속 위반 유형 선택
                </h3>

                {penaltyLoading ? (
                  <div className="py-12 text-center text-xs text-slate-500">데이터 로드 중...</div>
                ) : (
                  <div className="space-y-5">
                    {/* 위반 항목 셀렉트 박스 */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-bold">위반 항목</label>
                      <select
                        value={selectedRuleId}
                        onChange={(e) => setSelectedRuleId(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-yellow-accent text-xs font-semibold text-slate-200 focus:outline-none"
                      >
                        {penalties.map((rule) => (
                          <option key={rule.id} value={rule.id} className="bg-[#121825] text-slate-200">
                            {rule.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 어린이 보호구역 여부 토글 */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-slate-200">어린이 보호구역 단속 여부</span>
                        <span className="text-[10px] text-slate-500">보호구역 내 단속 시 벌점 및 금액이 대폭 가중됩니다.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsChildZone(!isChildZone)}
                        className={`relative inline-flex h-[26px] w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isChildZone ? 'bg-yellow-accent' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isChildZone ? 'translate-x-[22px]' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 하단 부연 정보 및 도로 매너 */}
              {selectedRule && (
                <div className="mt-8 pt-6 border-t border-white/[0.05]">
                  <h4 className="text-xs font-bold text-yellow-accent mb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    실전 도로 매너 & 위반 팁
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    {selectedRule.description}
                  </p>
                </div>
              )}
            </div>

            {/* 결과 스코어 보드 (오른쪽 2칸) */}
            <div className="md:col-span-2 space-y-6">
              {selectedRule ? (
                <>
                  {/* 단속 결과 요약 카드 */}
                  <div className="rounded-3xl bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-yellow-accent/20 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-yellow-accent text-[#0B0F19] text-[9px] font-extrabold uppercase rounded-bl-xl tracking-wider">
                      {isChildZone ? '어린이보호구역 적용' : '일반도로 적용'}
                    </div>

                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">예상 단속 고지</span>
                    <h3 className="text-base font-extrabold text-white mb-6 truncate max-w-full">
                      {selectedRule.name}
                    </h3>

                    {/* 무인 단속 과태료 */}
                    <div className="w-full flex flex-col gap-0.5 pb-[18px] border-b border-white/[0.05] mb-[18px]">
                      <span className="text-[10px] text-slate-400 font-semibold">카메라 무인 단속 시 (과태료)</span>
                      <span className="text-2xl font-black text-yellow-accent">
                        {(isChildZone ? selectedRule.fineChildZone : selectedRule.fineNormal).toLocaleString()}원
                      </span>
                    </div>

                    {/* 현장 적발 범칙금 + 벌점 */}
                    <div className="w-full flex justify-between gap-4 mb-2">
                      <div className="flex-1 flex flex-col gap-0.5 text-left">
                        <span className="text-[9px] text-slate-500 font-bold">경찰관 현장 적발 (범칙금)</span>
                        <span className="text-base font-black text-white">
                          {(isChildZone ? selectedRule.penaltyChildZone : selectedRule.penaltyNormal).toLocaleString()}원
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5 text-right">
                        <span className="text-[9px] text-slate-500 font-bold">부과 벌점</span>
                        <span className={`text-base font-black ${
                          (isChildZone ? selectedRule.pointsChildZone : selectedRule.pointsNormal) > 0 ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {isChildZone ? selectedRule.pointsChildZone : selectedRule.pointsNormal}점
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 과태료 vs 범칙금 비교 팁 상자 */}
                  <div className="rounded-2xl bg-white/[0.01] border border-white/[0.04] p-4 text-[10px] leading-relaxed text-slate-500">
                    <span className="font-bold text-slate-400 block mb-1">💡 초보 필독: 과태료 vs 범칙금 차이</span>
                    - **과태료**: 단속 카메라 등에 걸린 경우로, 운전자가 확인되지 않아 차량 소유주에게 부과됩니다. (벌점 없음) <br />
                    - **범칙금**: 경찰관에게 직접 적발된 경우로, 실제 운전자에게 부과되며 범칙금 납부와 함께 **벌점이 합산**됩니다.
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-xs text-slate-500">규칙이 존재하지 않습니다.</div>
              )}
            </div>
          </div>
        )}

        {/* 2. 차량 유지비 계산기 화면 */}
        {activeTab === 'maintenance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 입력 폼 */}
            <div className="rounded-3xl glass-panel p-6 border border-white/[0.06] space-y-5">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Car className="w-5 h-5 text-yellow-accent" />
                내 차량 조건 입력
              </h3>

              {/* 차종 선택 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold">차종</label>
                <select
                  value={carType}
                  onChange={(e) => setCarType(e.target.value as typeof carType)}
                  className="w-full h-11 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-yellow-accent text-xs font-semibold text-slate-200 focus:outline-none"
                >
                  <option value="compact" className="bg-[#121825]">경차 (캐스퍼, 모닝 등)</option>
                  <option value="sedan" className="bg-[#121825]">준중형/중형 세단 (아반떼, 쏘나타 등)</option>
                  <option value="suv" className="bg-[#121825]">중형 SUV (투싼, 쏘렌토 등)</option>
                  <option value="large" className="bg-[#121825]">대형 / 수입차 (그랜저, E클래스 등)</option>
                </select>
              </div>

              {/* 연료 유형 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold">연료 종류</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as typeof fuelType)}
                  className="w-full h-11 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-yellow-accent text-xs font-semibold text-slate-200 focus:outline-none"
                >
                  <option value="gasoline" className="bg-[#121825]">휘발유 (Gasoline)</option>
                  <option value="diesel" className="bg-[#121825]">경유 (Diesel)</option>
                  <option value="electric" className="bg-[#121825]">전기 (Electricity)</option>
                </select>
              </div>

              {/* 예상 주행거리 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">연간 예상 주행거리</span>
                  <span className="text-yellow-accent">{annualMileage.toLocaleString()} km</span>
                </div>
                <input
                  type="range"
                  min="3000"
                  max="35000"
                  step="1000"
                  value={annualMileage}
                  onChange={(e) => setAnnualMileage(Number(e.target.value))}
                  className="w-full accent-yellow-accent bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-bold">
                  <span>3k km</span>
                  <span>15k km (평균)</span>
                  <span>35k km</span>
                </div>
              </div>

              {/* 보험 등급(보험료) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">연간 자동차 보험료</span>
                  <span className="text-yellow-accent">{(insuranceCost / 10000).toLocaleString()} 만원</span>
                </div>
                <input
                  type="range"
                  min="400000"
                  max="3000000"
                  step="50000"
                  value={insuranceCost}
                  onChange={(e) => setInsuranceCost(Number(e.target.value))}
                  className="w-full accent-yellow-accent bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-bold">
                  <span>40만원 (일반)</span>
                  <span>120만원 (초보 평균)</span>
                  <span>300만원</span>
                </div>
              </div>

              <button
                onClick={handleCalculateMaintenance}
                disabled={calcLoading}
                className="w-full h-11 rounded-xl btn-yellow-glow text-xs font-bold mt-4"
              >
                {calcLoading ? '유지비 재산출 중...' : '유지비 연산하기'}
              </button>
            </div>

            {/* 결과 차트 및 분석 */}
            <div className="space-y-6">
              {maintenanceResult ? (
                <div className="rounded-3xl glass-panel p-6 border border-white/[0.06] flex flex-col justify-between min-h-full">
                  <div>
                    {/* 상단 월별 종합 */}
                    <div className="text-center pb-5 border-b border-white/[0.05] mb-5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                        예상 월 평균 유지비
                      </span>
                      <h2 className="text-3xl font-black text-yellow-accent">
                        {maintenanceResult.monthly.total.toLocaleString()}원
                      </h2>
                      <span className="text-[9px] text-slate-400 font-semibold block mt-1.5">
                        (연간 합산: {maintenanceResult.annual.total.toLocaleString()}원)
                      </span>
                    </div>

                    {/* 항목별 비율 시각화 가로 차트 */}
                    <h4 className="text-xs font-bold text-slate-200 mb-[18px] flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-yellow-accent" />
                      지출 항목 세부 비중
                    </h4>

                    <div className="space-y-4">
                      {/* 1. 유류비 */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-300 flex items-center gap-1">
                            <Droplet className="w-3.5 h-3.5 text-sky-400" />
                            유류비 / 전기료
                          </span>
                          <span className="text-slate-400">
                            {maintenanceResult.monthly.fuel.toLocaleString()}원 ({maintenanceResult.analysis.fuelPercentage}%)
                          </span>
                        </div>
                        {/* Custom Bar Chart */}
                        <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full transition-all duration-500" 
                            style={{ width: `${maintenanceResult.analysis.fuelPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* 2. 보험료 */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-300 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-indigo-400" />
                            자동차 보험료
                          </span>
                          <span className="text-slate-400">
                            {maintenanceResult.monthly.insurance.toLocaleString()}원 ({maintenanceResult.analysis.insurancePercentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500" 
                            style={{ width: `${maintenanceResult.analysis.insurancePercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* 3. 세금 */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-300 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                            자동차세 (연 분납)
                          </span>
                          <span className="text-slate-400">
                            {maintenanceResult.monthly.tax.toLocaleString()}원 ({maintenanceResult.analysis.taxPercentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500" 
                            style={{ width: `${maintenanceResult.analysis.taxPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* 4. 소모품/정비 */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-300 flex items-center gap-1">
                            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                            정기점검 / 소모품비
                          </span>
                          <span className="text-slate-400">
                            {maintenanceResult.monthly.maintenance.toLocaleString()}원 ({maintenanceResult.analysis.maintenancePercentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500" 
                            style={{ width: `${maintenanceResult.analysis.maintenancePercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 하단 면책 문구 */}
                  <div className="mt-8 text-[9px] text-slate-500 leading-relaxed border-t border-white/[0.04] pt-4 text-center">
                    ⚠️ 본 계산은 연료 시세(휘발유 1,650원/L) 및 차종별 공인 복합 연비를 기반으로 추정한 평균 수치입니다. 타이어 마모, 엔진오일 주기 등 개별 운전 습관에 따라 실 비용은 달라질 수 있습니다.
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-slate-500">조건을 변경하시고 계산을 진행해주세요.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
