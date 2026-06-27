'use client'

import { useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAsyncData } from '@/hooks/useAsyncData'
import type { PenaltyRule, MaintenanceResult, MaintenanceInput } from '@/types'
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
  Wrench,
} from 'lucide-react'

const DEFAULT_INPUT: MaintenanceInput = {
  carType: 'sedan',
  fuelType: 'gasoline',
  annualMileage: 15000,
  insuranceCost: 1200000,
}

const BREAKDOWN_ITEMS = [
  { icon: Droplet, label: '유류비 / 전기료', colorHex: '#0066cc' },
  { icon: Shield, label: '자동차 보험료', colorHex: '#5856d6' },
  { icon: FileText, label: '자동차세 (연 분납)', colorHex: '#ff9500' },
  { icon: Wrench, label: '정기점검 / 소모품비', colorHex: '#34c759' },
] as const

export default function CalculatorsPage() {
  const [activeTab, setActiveTab] = useState<'penalty' | 'maintenance'>('penalty')

  const [selectedRuleId, setSelectedRuleId] = useState('')
  const [isChildZone, setIsChildZone] = useState(false)

  const [input, setInput] = useState<MaintenanceInput>(DEFAULT_INPUT)
  const [maintenanceResult, setMaintenanceResult] = useState<MaintenanceResult | null>(null)
  const [calcLoading, setCalcLoading] = useState(false)
  const [calcError, setCalcError] = useState<string | null>(null)

  const { data: penalties, isLoading: penaltyLoading } = useAsyncData<PenaltyRule[]>(
    () => api.getPenalties(),
    [],
  )

  const calculateMaintenance = useCallback(async () => {
    setCalcLoading(true)
    setCalcError(null)
    try {
      const result = await api.calculateMaintenance(input)
      setMaintenanceResult(result)
    } catch {
      setCalcError('유지비 계산 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setCalcLoading(false)
    }
  }, [input])

  const selectedRule = penalties.find((r) => r.id === selectedRuleId) ?? penalties[0]

  return (
    <div className="w-full min-h-screen" style={{ background: 'var(--canvas-parchment)' }}>
      <div className="max-w-[980px] mx-auto px-5 py-12 w-full">
        {/* 페이지 제목 */}
        <div className="text-center mb-10">
          <h1
            className="font-semibold mb-3"
            style={{
              fontSize: 'clamp(28px,4vw,40px)',
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: 'var(--ink)',
            }}
          >
            운전 스마트 계산기
          </h1>
          <p
            style={{
              fontSize: '17px',
              lineHeight: 1.47,
              letterSpacing: '-0.374px',
              color: 'var(--ink-muted-80)',
            }}
          >
            범칙금·과태료 기준과 차량 유지비를 즉시 확인하세요.
          </p>
        </div>

        {/* 탭 전환 */}
        <div
          role="tablist"
          aria-label="계산기 선택"
          className="flex p-1 mb-8 max-w-sm mx-auto"
          style={{
            background: 'var(--canvas)',
            border: '1px solid var(--hairline)',
            borderRadius: '9999px',
          }}
        >
          <button
            role="tab"
            aria-selected={activeTab === 'penalty'}
            aria-controls="panel-penalty"
            onClick={() => setActiveTab('penalty')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[14px] font-medium transition-all"
            style={{
              borderRadius: '9999px',
              background: activeTab === 'penalty' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'penalty' ? '#ffffff' : 'var(--ink-muted-80)',
              letterSpacing: '-0.224px',
            }}
          >
            <Scale className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">범칙금 · 과태료</span>
            <span className="sm:hidden">범칙금</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'maintenance'}
            aria-controls="panel-maintenance"
            onClick={() => setActiveTab('maintenance')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[14px] font-medium transition-all"
            style={{
              borderRadius: '9999px',
              background: activeTab === 'maintenance' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'maintenance' ? '#ffffff' : 'var(--ink-muted-80)',
              letterSpacing: '-0.224px',
            }}
          >
            <Calculator className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">차량 유지비</span>
            <span className="sm:hidden">유지비</span>
          </button>
        </div>

        {/* ── 범칙금 계산기 ──────────────────────────────────────── */}
        {activeTab === 'penalty' && (
          <div id="panel-penalty" role="tabpanel" className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* 입력 폼 */}
            <div className="md:col-span-3 utility-card flex flex-col justify-between">
              <div>
                <h2
                  className="font-semibold mb-5 flex items-center gap-2"
                  style={{ fontSize: '17px', color: 'var(--ink)', letterSpacing: '-0.374px' }}
                >
                  <AlertTriangle
                    className="w-5 h-5 shrink-0"
                    style={{ color: 'var(--primary)' }}
                    aria-hidden="true"
                  />
                  단속 위반 유형 선택
                </h2>

                {penaltyLoading ? (
                  <div
                    className="py-12 text-center text-[14px]"
                    style={{ color: 'var(--ink-muted-48)' }}
                  >
                    데이터 로드 중...
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* 위반 항목 선택 */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="penalty-rule-select"
                        className="text-[14px] font-semibold"
                        style={{ color: 'var(--ink)', letterSpacing: '-0.224px' }}
                      >
                        위반 항목
                      </label>
                      <select
                        id="penalty-rule-select"
                        value={selectedRuleId}
                        onChange={(e) => setSelectedRuleId(e.target.value)}
                        className="w-full h-11 px-4 focus:outline-none text-[14px] font-medium"
                        style={{
                          background: 'var(--canvas-parchment)',
                          border: '1px solid var(--hairline)',
                          borderRadius: '8px',
                          color: 'var(--ink)',
                          letterSpacing: '-0.224px',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary-focus)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'var(--hairline)'
                        }}
                      >
                        {penalties.map((rule) => (
                          <option key={rule.id} value={rule.id}>
                            {rule.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 어린이 보호구역 토글 */}
                    <div
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{
                        background: 'var(--canvas-parchment)',
                        border: '1px solid var(--hairline)',
                      }}
                    >
                      <div className="flex flex-col gap-0.5">
                        <label
                          htmlFor="child-zone-toggle"
                          className="text-[14px] font-semibold cursor-pointer"
                          style={{ color: 'var(--ink)', letterSpacing: '-0.224px' }}
                        >
                          어린이 보호구역 단속 여부
                        </label>
                        <span
                          className="text-[12px]"
                          style={{ color: 'var(--ink-muted-48)', letterSpacing: '-0.12px' }}
                        >
                          보호구역 내 단속 시 벌점 및 금액이 대폭 가중됩니다.
                        </span>
                      </div>
                      <button
                        id="child-zone-toggle"
                        type="button"
                        role="switch"
                        aria-checked={isChildZone}
                        aria-label="어린이 보호구역 단속 여부 토글"
                        onClick={() => setIsChildZone((prev) => !prev)}
                        className="relative inline-flex h-[26px] w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                        style={{ background: isChildZone ? 'var(--primary)' : 'var(--hairline)' }}
                      >
                        <span
                          aria-hidden="true"
                          className="pointer-events-none inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                          style={{ transform: isChildZone ? 'translateX(22px)' : 'translateX(0)' }}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 도로 매너 팁 */}
              {selectedRule && (
                <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--hairline)' }}>
                  <p
                    className="font-semibold mb-2 flex items-center gap-1.5 text-[12px]"
                    style={{ color: 'var(--primary)' }}
                  >
                    <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    실전 도로 매너 &amp; 위반 팁
                  </p>
                  <p
                    className="text-[13px] leading-relaxed"
                    style={{ color: 'var(--ink-muted-80)', letterSpacing: '-0.224px' }}
                  >
                    {selectedRule.description}
                  </p>
                </div>
              )}
            </div>

            {/* 결과 카드 */}
            <div className="md:col-span-2 space-y-4">
              {selectedRule ? (
                <>
                  {/* 메인 결과 */}
                  <div className="utility-card relative overflow-hidden text-center">
                    <div
                      className="absolute top-0 right-0 px-3 py-1 text-[11px] font-semibold"
                      style={{
                        background: 'var(--primary)',
                        color: '#ffffff',
                        borderRadius: '0 18px 0 8px',
                        letterSpacing: '-0.12px',
                      }}
                    >
                      {isChildZone ? '어린이보호구역' : '일반도로'}
                    </div>

                    <p
                      className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--ink-muted-48)' }}
                    >
                      예상 단속 고지
                    </p>
                    <h2
                      className="font-semibold mb-5 truncate"
                      style={{ fontSize: '17px', color: 'var(--ink)', letterSpacing: '-0.374px' }}
                    >
                      {selectedRule.name}
                    </h2>

                    <div
                      className="w-full flex flex-col gap-1 pb-4 mb-4"
                      style={{ borderBottom: '1px solid var(--hairline)' }}
                    >
                      <span
                        className="text-[12px] font-medium"
                        style={{ color: 'var(--ink-muted-48)' }}
                      >
                        카메라 무인 단속 시 (과태료)
                      </span>
                      <span
                        className="font-semibold"
                        style={{
                          fontSize: '28px',
                          color: 'var(--primary)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {(isChildZone
                          ? selectedRule.fineChildZone
                          : selectedRule.fineNormal
                        ).toLocaleString()}
                        원
                      </span>
                    </div>

                    <div className="w-full flex justify-between gap-4">
                      <div className="flex-1 flex flex-col gap-0.5 text-left">
                        <span className="text-[11px]" style={{ color: 'var(--ink-muted-48)' }}>
                          경찰관 현장 적발 (범칙금)
                        </span>
                        <span
                          className="font-semibold"
                          style={{
                            fontSize: '17px',
                            color: 'var(--ink)',
                            letterSpacing: '-0.374px',
                          }}
                        >
                          {(isChildZone
                            ? selectedRule.penaltyChildZone
                            : selectedRule.penaltyNormal
                          ).toLocaleString()}
                          원
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5 text-right">
                        <span className="text-[11px]" style={{ color: 'var(--ink-muted-48)' }}>
                          부과 벌점
                        </span>
                        <span
                          className="font-semibold"
                          style={{
                            fontSize: '17px',
                            letterSpacing: '-0.374px',
                            color:
                              (isChildZone
                                ? selectedRule.pointsChildZone
                                : selectedRule.pointsNormal) > 0
                                ? '#ff3b30'
                                : 'var(--ink-muted-48)',
                          }}
                        >
                          {isChildZone ? selectedRule.pointsChildZone : selectedRule.pointsNormal}점
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 과태료 vs 범칙금 설명 */}
                  <div
                    className="p-4 text-[13px] leading-relaxed"
                    style={{
                      background: 'var(--canvas)',
                      border: '1px solid var(--hairline)',
                      borderRadius: '12px',
                      color: 'var(--ink-muted-80)',
                    }}
                  >
                    <span
                      className="font-semibold block mb-2 text-[14px]"
                      style={{ color: 'var(--ink)' }}
                    >
                      초보 필독: 과태료 vs 범칙금 차이
                    </span>
                    <p style={{ marginBottom: '6px' }}>
                      <strong style={{ color: 'var(--ink)' }}>과태료</strong>: 단속 카메라 등에 걸린
                      경우로, 차량 소유주에게 부과됩니다. (벌점 없음)
                    </p>
                    <p>
                      <strong style={{ color: 'var(--ink)' }}>범칙금</strong>: 경찰관에게 직접
                      적발된 경우로, 실제 운전자에게 부과되며 벌점이 합산됩니다.
                    </p>
                  </div>
                </>
              ) : (
                <div
                  className="py-20 text-center text-[14px]"
                  style={{ color: 'var(--ink-muted-48)' }}
                >
                  규칙이 존재하지 않습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 유지비 계산기 ──────────────────────────────────────── */}
        {activeTab === 'maintenance' && (
          <div
            id="panel-maintenance"
            role="tabpanel"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* 입력 폼 */}
            <div className="utility-card space-y-5">
              <h2
                className="font-semibold mb-2 flex items-center gap-2"
                style={{ fontSize: '17px', color: 'var(--ink)', letterSpacing: '-0.374px' }}
              >
                <Car
                  className="w-5 h-5 shrink-0"
                  style={{ color: 'var(--primary)' }}
                  aria-hidden="true"
                />
                내 차량 조건 입력
              </h2>

              {/* 차종 선택 */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="car-type-select"
                  className="text-[14px] font-semibold"
                  style={{ color: 'var(--ink)', letterSpacing: '-0.224px' }}
                >
                  차종
                </label>
                <select
                  id="car-type-select"
                  value={input.carType}
                  onChange={(e) =>
                    setInput((prev) => ({
                      ...prev,
                      carType: e.target.value as MaintenanceInput['carType'],
                    }))
                  }
                  className="w-full h-11 px-4 focus:outline-none text-[14px] font-medium"
                  style={{
                    background: 'var(--canvas-parchment)',
                    border: '1px solid var(--hairline)',
                    borderRadius: '8px',
                    color: 'var(--ink)',
                    letterSpacing: '-0.224px',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-focus)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--hairline)'
                  }}
                >
                  <option value="compact">경차 (캐스퍼, 모닝 등)</option>
                  <option value="sedan">준중형/중형 세단 (아반떼, 쏘나타 등)</option>
                  <option value="suv">중형 SUV (투싼, 쏘렌토 등)</option>
                  <option value="large">대형 / 수입차 (그랜저, E클래스 등)</option>
                </select>
              </div>

              {/* 연료 유형 */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="fuel-type-select"
                  className="text-[14px] font-semibold"
                  style={{ color: 'var(--ink)', letterSpacing: '-0.224px' }}
                >
                  연료 종류
                </label>
                <select
                  id="fuel-type-select"
                  value={input.fuelType}
                  onChange={(e) =>
                    setInput((prev) => ({
                      ...prev,
                      fuelType: e.target.value as MaintenanceInput['fuelType'],
                    }))
                  }
                  className="w-full h-11 px-4 focus:outline-none text-[14px] font-medium"
                  style={{
                    background: 'var(--canvas-parchment)',
                    border: '1px solid var(--hairline)',
                    borderRadius: '8px',
                    color: 'var(--ink)',
                    letterSpacing: '-0.224px',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-focus)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--hairline)'
                  }}
                >
                  <option value="gasoline">휘발유 (Gasoline)</option>
                  <option value="diesel">경유 (Diesel)</option>
                  <option value="electric">전기 (Electricity)</option>
                </select>
              </div>

              {/* 연간 주행거리 슬라이더 */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="mileage-range"
                    className="text-[14px] font-semibold"
                    style={{ color: 'var(--ink)', letterSpacing: '-0.224px' }}
                  >
                    연간 예상 주행거리
                  </label>
                  <span className="text-[14px] font-semibold" style={{ color: 'var(--primary)' }}>
                    {input.annualMileage.toLocaleString()} km
                  </span>
                </div>
                <input
                  id="mileage-range"
                  type="range"
                  min="3000"
                  max="35000"
                  step="1000"
                  value={input.annualMileage}
                  onChange={(e) =>
                    setInput((prev) => ({ ...prev, annualMileage: Number(e.target.value) }))
                  }
                  aria-valuenow={input.annualMileage}
                  aria-valuemin={3000}
                  aria-valuemax={35000}
                  className="w-full cursor-pointer"
                  style={{ accentColor: 'var(--primary)' }}
                />
                <div
                  className="flex justify-between text-[12px]"
                  style={{ color: 'var(--ink-muted-48)' }}
                >
                  <span>3,000 km</span>
                  <span>15,000 km (평균)</span>
                  <span>35,000 km</span>
                </div>
              </div>

              {/* 보험료 슬라이더 */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="insurance-range"
                    className="text-[14px] font-semibold"
                    style={{ color: 'var(--ink)', letterSpacing: '-0.224px' }}
                  >
                    연간 자동차 보험료
                  </label>
                  <span className="text-[14px] font-semibold" style={{ color: 'var(--primary)' }}>
                    {(input.insuranceCost / 10000).toLocaleString()}만원
                  </span>
                </div>
                <input
                  id="insurance-range"
                  type="range"
                  min="400000"
                  max="3000000"
                  step="50000"
                  value={input.insuranceCost}
                  onChange={(e) =>
                    setInput((prev) => ({ ...prev, insuranceCost: Number(e.target.value) }))
                  }
                  aria-valuenow={input.insuranceCost}
                  aria-valuemin={400000}
                  aria-valuemax={3000000}
                  className="w-full cursor-pointer"
                  style={{ accentColor: 'var(--primary)' }}
                />
                <div
                  className="flex justify-between text-[12px]"
                  style={{ color: 'var(--ink-muted-48)' }}
                >
                  <span>40만원</span>
                  <span>120만원 (초보 평균)</span>
                  <span>300만원</span>
                </div>
              </div>

              <button
                onClick={() => {
                  void calculateMaintenance()
                }}
                disabled={calcLoading}
                aria-busy={calcLoading}
                className="btn-primary w-full mt-2 disabled:opacity-60"
                style={{ height: '44px' }}
              >
                {calcLoading ? '유지비 재산출 중...' : '유지비 연산하기'}
              </button>

              {calcError && (
                <p
                  role="alert"
                  className="text-[14px] text-center px-4 py-3 rounded-lg"
                  style={{ background: '#fff2f2', color: '#c00', border: '1px solid #fcc' }}
                >
                  {calcError}
                </p>
              )}
            </div>

            {/* 결과 패널 */}
            <div>
              {maintenanceResult ? (
                <div className="utility-card flex flex-col justify-between h-full">
                  <div>
                    {/* 월 합계 */}
                    <div
                      className="text-center pb-5 mb-5"
                      style={{ borderBottom: '1px solid var(--hairline)' }}
                    >
                      <span
                        className="text-[11px] font-semibold uppercase tracking-wider block mb-2"
                        style={{ color: 'var(--ink-muted-48)' }}
                      >
                        예상 월 평균 유지비
                      </span>
                      <p
                        className="font-semibold"
                        style={{
                          fontSize: '34px',
                          color: 'var(--primary)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {maintenanceResult.monthly.total.toLocaleString()}원
                      </p>
                      <span
                        className="text-[12px] block mt-1"
                        style={{ color: 'var(--ink-muted-48)' }}
                      >
                        연간 합산: {maintenanceResult.annual.total.toLocaleString()}원
                      </span>
                    </div>

                    <h2
                      className="font-semibold mb-4 flex items-center gap-1.5"
                      style={{ fontSize: '14px', color: 'var(--ink)', letterSpacing: '-0.224px' }}
                    >
                      <TrendingUp
                        className="w-4 h-4"
                        style={{ color: 'var(--primary)' }}
                        aria-hidden="true"
                      />
                      지출 항목 세부 비중
                    </h2>

                    <div className="space-y-4">
                      {[
                        {
                          ...BREAKDOWN_ITEMS[0],
                          monthly: maintenanceResult.monthly.fuel,
                          pct: maintenanceResult.analysis.fuelPercentage,
                        },
                        {
                          ...BREAKDOWN_ITEMS[1],
                          monthly: maintenanceResult.monthly.insurance,
                          pct: maintenanceResult.analysis.insurancePercentage,
                        },
                        {
                          ...BREAKDOWN_ITEMS[2],
                          monthly: maintenanceResult.monthly.tax,
                          pct: maintenanceResult.analysis.taxPercentage,
                        },
                        {
                          ...BREAKDOWN_ITEMS[3],
                          monthly: maintenanceResult.monthly.maintenance,
                          pct: maintenanceResult.analysis.maintenancePercentage,
                        },
                      ].map(({ icon: Icon, colorHex, label, monthly, pct }) => (
                        <div key={label} className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-[13px]">
                            <span
                              className="flex items-center gap-1.5 font-medium"
                              style={{ color: 'var(--ink)' }}
                            >
                              <Icon
                                className="w-3.5 h-3.5 shrink-0"
                                style={{ color: colorHex }}
                                aria-hidden="true"
                              />
                              {label}
                            </span>
                            <span style={{ color: 'var(--ink-muted-80)' }}>
                              {monthly.toLocaleString()}원 ({pct}%)
                            </span>
                          </div>
                          <div
                            className="w-full h-2 overflow-hidden"
                            style={{
                              background: 'var(--canvas-parchment)',
                              borderRadius: '9999px',
                            }}
                            role="progressbar"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${label} 비중`}
                          >
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                background: colorHex,
                                borderRadius: '9999px',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p
                    className="mt-6 text-[12px] text-center pt-4"
                    style={{
                      borderTop: '1px solid var(--hairline)',
                      color: 'var(--ink-muted-48)',
                      lineHeight: 1.6,
                    }}
                  >
                    본 계산은 연료 시세(휘발유 1,650원/L) 및 차종별 공인 복합 연비를 기반으로 추정한
                    평균 수치입니다.
                  </p>
                </div>
              ) : (
                <div
                  className="utility-card py-20 text-center text-[14px] flex items-center justify-center"
                  style={{ color: 'var(--ink-muted-48)', minHeight: '320px' }}
                >
                  조건을 선택 후 유지비 연산하기를 눌러주세요.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
