'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { RecallItem, InspectionResult } from '@/types';
import {
  Car,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
  ChevronRight,
} from 'lucide-react';

type ActiveTab = 'recall' | 'inspection';

export default function MyCarPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('recall');

  // 리콜 검색 상태
  const [recallModel, setRecallModel] = useState('');
  const [recallMaker, setRecallMaker] = useState('');
  const [recallItems, setRecallItems] = useState<RecallItem[]>([]);
  const [recallTotal, setRecallTotal] = useState(0);
  const [recallLoading, setRecallLoading] = useState(false);
  const [recallError, setRecallError] = useState<string | null>(null);
  const [recallSearched, setRecallSearched] = useState(false);

  // 정기검사 상태
  const [plate, setPlate] = useState('');
  const [inspectionResult, setInspectionResult] = useState<InspectionResult | null>(null);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionError, setInspectionError] = useState<string | null>(null);

  async function handleRecallSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!recallModel.trim() && !recallMaker.trim()) return;
    setRecallLoading(true);
    setRecallError(null);
    setRecallSearched(true);
    try {
      const res = await api.getRecalls({
        model: recallModel.trim() || undefined,
        maker: recallMaker.trim() || undefined,
      });
      setRecallItems(res.items);
      setRecallTotal(res.total);
    } catch {
      setRecallError('리콜 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setRecallLoading(false);
    }
  }

  async function handleInspectionSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = plate.trim();
    if (!trimmed) return;
    setInspectionLoading(true);
    setInspectionError(null);
    setInspectionResult(null);
    try {
      const res = await api.getInspection(trimmed);
      setInspectionResult(res);
    } catch {
      setInspectionError('검사 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setInspectionLoading(false);
    }
  }

  function getInspectionStatus(result: InspectionResult) {
    if (!result.expiryDate) return null;
    const days = result.daysUntilExpiry ?? 0;
    if (result.isExpired) {
      return { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: '검사 기한 초과', icon: <AlertTriangle className="w-5 h-5 text-red-400" /> };
    }
    if (days <= 30) {
      return { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: '곧 만료 예정', icon: <Clock className="w-5 h-5 text-yellow-400" /> };
    }
    return { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', label: '검사 유효', icon: <CheckCircle className="w-5 h-5 text-green-400" /> };
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">내 차 관리</h1>
        </div>
        <p className="text-slate-400 text-sm mb-8 ml-[52px]">
          국토교통부 · 교통안전공단 공공데이터 기반 — 리콜 이력과 정기검사 기한을 한눈에 확인하세요.
        </p>

        {/* 탭 */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8">
          <button
            onClick={() => setActiveTab('recall')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'recall'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            리콜 조회
          </button>
          <button
            onClick={() => setActiveTab('inspection')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'inspection'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            정기검사 기한
          </button>
        </div>

        {/* 리콜 탭 */}
        {activeTab === 'recall' && (
          <div className="space-y-6">
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4">차량 리콜 이력 조회</h2>
              <form onSubmit={handleRecallSearch} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">차량 모델명</label>
                    <input
                      type="text"
                      value={recallModel}
                      onChange={(e) => setRecallModel(e.target.value)}
                      placeholder="예: 아반떼"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">제조사</label>
                    <input
                      type="text"
                      value={recallMaker}
                      onChange={(e) => setRecallMaker(e.target.value)}
                      placeholder="예: 현대"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={recallLoading || (!recallModel.trim() && !recallMaker.trim())}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
                >
                  <Search className="w-4 h-4" />
                  {recallLoading ? '조회 중...' : '리콜 이력 조회'}
                </button>
              </form>
            </div>

            {recallError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {recallError}
              </div>
            )}

            {recallSearched && !recallLoading && !recallError && (
              <div>
                <p className="text-slate-400 text-sm mb-3">
                  검색 결과 <span className="text-white font-semibold">{recallTotal}건</span>
                </p>
                {recallItems.length === 0 ? (
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center text-slate-500">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500/50" />
                    <p className="font-semibold text-slate-400">리콜 이력이 없습니다.</p>
                    <p className="text-xs mt-1">조회 기준: 국토교통부 자동차 리콜 공공데이터</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {recallItems.map((item, i) => (
                      <li key={i} className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <span className="font-bold text-white text-sm">{item.model}</span>
                            <span className="text-slate-500 text-xs ml-2">{item.maker}</span>
                          </div>
                          <span className="shrink-0 text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                            {item.recallDate}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-400">
                          <div className="flex gap-2">
                            <span className="text-red-400 font-semibold shrink-0">결함</span>
                            <span>{item.defect}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-blue-400 font-semibold shrink-0">조치</span>
                            <span>{item.remedy}</span>
                          </div>
                          {item.contact && (
                            <div className="flex gap-2">
                              <span className="text-slate-500 shrink-0">문의</span>
                              <span>{item.contact}</span>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex items-start gap-2 text-xs text-slate-600">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>국토교통부 자동차 리콜 현황 공공데이터(data.go.kr) 기반. API 키 미설정 시 빈 목록이 반환될 수 있습니다.</span>
            </div>
          </div>
        )}

        {/* 정기검사 탭 */}
        {activeTab === 'inspection' && (
          <div className="space-y-6">
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4">정기검사 유효기간 조회</h2>
              <form onSubmit={handleInspectionSearch} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">차량번호</label>
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    placeholder="예: 123가4567"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                    maxLength={10}
                  />
                  <p className="text-[11px] text-slate-600 mt-1">형식: 숫자 2~3자리 + 한글 1자 + 숫자 4자리 (예: 12가3456, 123가4567)</p>
                </div>
                <button
                  type="submit"
                  disabled={inspectionLoading || !plate.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
                >
                  <Search className="w-4 h-4" />
                  {inspectionLoading ? '조회 중...' : '검사 기한 조회'}
                </button>
              </form>
            </div>

            {inspectionError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {inspectionError}
              </div>
            )}

            {inspectionResult && !inspectionLoading && (
              <div>
                {inspectionResult.message ? (
                  <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-300 text-sm">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{inspectionResult.message}</span>
                  </div>
                ) : (
                  (() => {
                    const status = getInspectionStatus(inspectionResult);
                    return (
                      <div className={`border rounded-2xl p-6 ${status?.bg ?? 'bg-white/[0.04] border-white/10'}`}>
                        <div className="flex items-center gap-3 mb-4">
                          {status?.icon}
                          <div>
                            <p className={`font-bold text-base ${status?.color ?? 'text-white'}`}>
                              {status?.label ?? '조회 완료'}
                            </p>
                            <p className="text-slate-400 text-xs mt-0.5">차량번호: {inspectionResult.plate}</p>
                          </div>
                        </div>
                        {inspectionResult.expiryDate && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/20 rounded-xl p-3">
                              <p className="text-slate-500 text-xs mb-1">검사 만료일</p>
                              <p className="text-white font-bold text-sm">{inspectionResult.expiryDate}</p>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3">
                              <p className="text-slate-500 text-xs mb-1">
                                {inspectionResult.isExpired ? '초과일' : '남은 기간'}
                              </p>
                              <p className={`font-bold text-sm ${status?.color ?? 'text-white'}`}>
                                {Math.abs(inspectionResult.daysUntilExpiry ?? 0)}일
                                {inspectionResult.isExpired ? ' 경과' : ' 남음'}
                              </p>
                            </div>
                          </div>
                        )}
                        {inspectionResult.inspectionType && (
                          <p className="text-slate-500 text-xs mt-3 flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" />
                            검사 종류: {inspectionResult.inspectionType}
                          </p>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            <div className="flex items-start gap-2 text-xs text-slate-600">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>한국교통안전공단 자동차검사정보 공공데이터(data.go.kr) 기반. API 키 미설정 시 안내 메시지가 표시됩니다.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
