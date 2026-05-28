'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { HotspotItem } from '@/types';
import { SIDO_LIST, GUGUN_MAP } from '@/lib/korean-admin-codes';
import { ShieldAlert, Search, AlertTriangle, Info, TrendingUp, Skull, Activity } from 'lucide-react';

const YEARS = ['2023', '2022', '2021', '2020', '2019'];

export default function SafetyPage() {
  const [sidoCode, setSidoCode] = useState(SIDO_LIST[0].code);
  const [gugunCode, setGugunCode] = useState(GUGUN_MAP[SIDO_LIST[0].code][0].code);
  const [year, setYear] = useState('2023');
  const [items, setItems] = useState<HotspotItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [searchedLabel, setSearchedLabel] = useState('');

  const gugunList = GUGUN_MAP[sidoCode] ?? [];

  function handleSidoChange(code: string) {
    setSidoCode(code);
    const first = GUGUN_MAP[code]?.[0];
    setGugunCode(first?.code ?? '');
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setSearched(true);

    const sidoName = SIDO_LIST.find((s) => s.code === sidoCode)?.name ?? sidoCode;
    const gugunName = gugunList.find((g) => g.code === gugunCode)?.name ?? gugunCode;
    setSearchedLabel(`${sidoName} ${gugunName} (${year}년)`);

    try {
      const res = await api.getHotspots(sidoCode, gugunCode, year);
      setItems(res.items);
      setTotal(res.total);
      if (res.message) setMessage(res.message);
    } catch {
      setError('사고위험구역 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const riskColor = (cnt: number) => {
    if (cnt >= 30) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (cnt >= 15) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
  };
  const riskLabel = (cnt: number) => (cnt >= 30 ? '고위험' : cnt >= 15 ? '위험' : '주의');

  return (
    <div className="min-h-screen bg-[#0B0F19] py-12 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">교통사고 위험구역</h1>
        </div>
        <p className="text-slate-400 text-sm mb-8 ml-[52px]">
          도로교통공단 TAAS — 반경 50m 이내 사고 집중 구역을 미리 확인하세요.
        </p>

        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 mb-6">
          <form onSubmit={(e) => { void handleSearch(e); }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold">연도</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-red-500/60 transition-colors"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y} className="bg-[#121825]">{y}년</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold">시도</label>
                <select
                  value={sidoCode}
                  onChange={(e) => handleSidoChange(e.target.value)}
                  className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-red-500/60 transition-colors"
                >
                  {SIDO_LIST.map((s) => (
                    <option key={s.code} value={s.code} className="bg-[#121825]">{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold">구군</label>
                <select
                  value={gugunCode}
                  onChange={(e) => setGugunCode(e.target.value)}
                  className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-red-500/60 transition-colors"
                >
                  {gugunList.map((g) => (
                    <option key={g.code} value={g.code} className="bg-[#121825]">{g.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
            >
              <Search className="w-4 h-4" />
              {loading ? '조회 중...' : '사고위험구역 조회'}
            </button>
          </form>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {message && (
          <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-300 text-sm mb-4">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {searched && !loading && !error && !message && (
          <div>
            <p className="text-slate-400 text-sm mb-3">
              <span className="text-white font-semibold">{searchedLabel}</span> 사고위험구역{' '}
              <span className="text-white font-semibold">{total}건</span>
            </p>

            {items.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center">
                <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-slate-400 font-semibold">조회된 사고위험구역이 없습니다.</p>
                <p className="text-xs text-slate-600 mt-1">다른 연도나 구군을 선택해보세요.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="bg-white/[0.04] border border-white/10 hover:border-red-500/30 rounded-xl p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs text-slate-500">위험구역 #{item.id}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border font-bold ${riskColor(item.totalAccCnt)}`}>
                            {riskLabel(item.totalAccCnt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{item.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap mb-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-slate-400">사고</span>
                        <span className="font-bold text-orange-400">{item.totalAccCnt}건</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Skull className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-slate-400">사망</span>
                        <span className={`font-bold ${item.deathCnt > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                          {item.deathCnt}명
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Activity className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-slate-400">중상</span>
                        <span className="font-bold text-yellow-400">{item.seriousInjuryCnt}명</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Activity className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-400">경상</span>
                        <span className="font-bold text-slate-300">{item.slightInjuryCnt}명</span>
                      </div>
                    </div>

                    {item.causes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.causes.map((cause) => (
                          <span
                            key={cause}
                            className="text-[11px] bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full"
                          >
                            {cause}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-slate-600 mt-6">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            도로교통공단 TAAS 오픈API 기반. 반경 50m 이내 사고 집중 구역 정보이며 실제 도로 상황과
            다를 수 있습니다.
          </span>
        </div>
      </div>
    </div>
  );
}
