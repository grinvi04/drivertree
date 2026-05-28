'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { HotspotItem } from '@/types';
import {
  ShieldAlert,
  Search,
  AlertTriangle,
  Info,
  MapPin,
  TrendingUp,
  Skull,
  Activity,
} from 'lucide-react';

const SIDO_LIST = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시',
  '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
  '경기도', '강원도', '충청북도', '충청남도',
  '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도',
];

export default function SafetyPage() {
  const [siDo, setSiDo] = useState('서울특별시');
  const [guGun, setGuGun] = useState('');
  const [items, setItems] = useState<HotspotItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setSearched(true);
    try {
      const res = await api.getHotspots(siDo, guGun.trim() || undefined);
      setItems(res.items);
      setTotal(res.total);
      if (res.message) setMessage(res.message);
    } catch {
      setError('사고다발지점 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const riskColor = (accCnt: number) => {
    if (accCnt >= 10) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (accCnt >= 5) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
  };

  const riskLabel = (accCnt: number) => {
    if (accCnt >= 10) return '고위험';
    if (accCnt >= 5) return '위험';
    return '주의';
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">교통사고 다발지점</h1>
        </div>
        <p className="text-slate-400 text-sm mb-8 ml-[52px]">
          도로교통공단 TAAS 기반 — 지역별 사고 집중 구간을 미리 확인하세요.
        </p>

        {/* 검색 폼 */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold">시도 선택</label>
                <select
                  value={siDo}
                  onChange={(e) => setSiDo(e.target.value)}
                  className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-red-500/60 transition-colors"
                >
                  {SIDO_LIST.map((s) => (
                    <option key={s} value={s} className="bg-[#121825]">{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold">구군 (선택)</label>
                <input
                  type="text"
                  value={guGun}
                  onChange={(e) => setGuGun(e.target.value)}
                  placeholder="예: 강남구, 해운대구"
                  className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500/60 transition-colors"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
            >
              <Search className="w-4 h-4" />
              {loading ? '조회 중...' : '사고 다발지점 조회'}
            </button>
          </form>
        </div>

        {/* 에러 */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* API 키 미설정 안내 */}
        {message && (
          <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-300 text-sm mb-4">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* 결과 */}
        {searched && !loading && !error && !message && (
          <div>
            <p className="text-slate-400 text-sm mb-3">
              <span className="text-white font-semibold">{siDo}{guGun ? ` ${guGun}` : ''}</span> 사고다발지점{' '}
              <span className="text-white font-semibold">{total}건</span>
            </p>

            {items.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center">
                <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-slate-400 font-semibold">조회된 사고다발지점이 없습니다.</p>
                <p className="text-xs text-slate-600 mt-1">구군을 변경하거나 시도만으로 검색해보세요.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((item, idx) => (
                  <li
                    key={idx}
                    className="bg-white/[0.04] border border-white/10 hover:border-red-500/30 rounded-xl p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-white text-sm">{item.spotNm}</span>
                          {item.spotType && (
                            <span className="text-[11px] bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full">
                              {item.spotType}
                            </span>
                          )}
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border font-bold ${riskColor(item.accCnt)}`}>
                            {riskLabel(item.accCnt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3" />
                          <span>{item.siDo} {item.guGun}{item.dong ? ` ${item.dong}` : ''}</span>
                          {item.startYear && item.endYear && (
                            <span className="ml-1">({item.startYear}~{item.endYear})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 통계 배지 */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs">
                        <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-slate-400">사고</span>
                        <span className="font-bold text-orange-400">{item.accCnt}건</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Skull className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-slate-400">사망</span>
                        <span className={`font-bold ${item.dthCnt > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                          {item.dthCnt}명
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Activity className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-slate-400">부상</span>
                        <span className="font-bold text-yellow-400">{item.injCnt}명</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 출처 안내 */}
        <div className="flex items-start gap-2 text-xs text-slate-600 mt-6">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            도로교통공단 TAAS(교통사고분석시스템) 오픈API 기반. 사고 이력은 참고용이며 실제 도로 상황과
            다를 수 있습니다.
          </span>
        </div>
      </div>
    </div>
  );
}
