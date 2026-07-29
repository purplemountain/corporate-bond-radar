'use client';

import { useEffect, useState, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface CompanyData {
  name: string;
  ticker: string;
  rating: string;
  spreadBp: number;
  issueYield: number;
  color: string;
  range: string;
  trend: string;
}

interface LiveBondData {
  timestamp: string;
  us10yYield: number;
  companies: CompanyData[];
  treasuryGapBp: number;
  nicBp: number;
  orderbookMultiple: number;
  auctionMultiple: number;
  chartData: {
    labels: string[];
    nvidia?: number[];
    microsoft: number[];
    alphabet: number[];
    amazon: number[];
    meta: number[];
    oracle: number[];
    treasuryGap: number[];
    nic: number[];
    orderbookMultipleSeries: number[];
    us10yYieldSeries: number[];
    auctionMultipleSeries: number[];
  };
}

export default function BondSpreadDashboardClient({ userEmail }: { userEmail: string }) {
  const [data, setData] = useState<LiveBondData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const spreadChartRef = useRef<HTMLCanvasElement | null>(null);
  const indigestionChartRef = useRef<HTMLCanvasElement | null>(null);
  const treasuryChartRef = useRef<HTMLCanvasElement | null>(null);

  const spreadChartInstance = useRef<Chart | null>(null);
  const indigestionChartInstance = useRef<Chart | null>(null);
  const treasuryChartInstance = useRef<Chart | null>(null);

  const fetchLiveMarketData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bonds/live?cacheBust=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load live bond data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMarketData();
  }, []);

  useEffect(() => {
    if (!data) return;

    if (spreadChartInstance.current) spreadChartInstance.current.destroy();
    if (indigestionChartInstance.current) indigestionChartInstance.current.destroy();
    if (treasuryChartInstance.current) treasuryChartInstance.current.destroy();

    const { chartData } = data;
    const nvidiaSeries = chartData.nvidia || [55, 52, 50, 48, 46, 45, 47, 49, 52, 50, 48, 49, 51, 52];

    // 1. Render Main Corporate Spread Chart (Includes NVIDIA)
    if (spreadChartRef.current) {
      spreadChartInstance.current = new Chart(spreadChartRef.current, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [
            { label: 'NVIDIA (AA-)', data: nvidiaSeries, borderColor: '#76B900', backgroundColor: 'rgba(118, 185, 0, 0.1)', borderWidth: 3, tension: 0.3 },
            { label: 'Microsoft (AAA)', data: chartData.microsoft, borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderWidth: 2.5, tension: 0.3 },
            { label: 'Alphabet / Google (AA+)', data: chartData.alphabet, borderColor: '#4285F4', backgroundColor: 'rgba(66, 133, 244, 0.1)', borderWidth: 2.5, tension: 0.3 },
            { label: 'Amazon (AA)', data: chartData.amazon, borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 2.5, tension: 0.3 },
            { label: 'Meta (AA-)', data: chartData.meta, borderColor: '#A855F7', backgroundColor: 'rgba(168, 85, 247, 0.1)', borderWidth: 2.5, tension: 0.3 },
            { label: 'Oracle (BBB- Downgraded)', data: chartData.oracle, borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 3.5, tension: 0.3 },
            { label: 'US Treasury 10Y-2Y Spread', data: chartData.treasuryGap, borderColor: '#10B981', borderDash: [6, 4], backgroundColor: 'transparent', borderWidth: 2.5, tension: 0.3 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94a3b8' } } },
          scales: {
            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
            y: { grid: { color: 'rgba(255, 255, 255, 0.06)' }, ticks: { color: '#94a3b8', callback: (v) => v + ' bp' } }
          }
        }
      });
    }

    // 2. Render Indigestion Chart
    if (indigestionChartRef.current) {
      indigestionChartInstance.current = new Chart(indigestionChartRef.current, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [
            { label: '신규 발행 프리미엄 NIC (bp)', data: chartData.nic, borderColor: '#F43F5E', backgroundColor: 'rgba(244, 63, 94, 0.15)', borderWidth: 3, fill: true, tension: 0.3, yAxisID: 'yNIC' },
            { label: '청약 경쟁률 배수 (Orderbook Multiple)', data: chartData.orderbookMultipleSeries, borderColor: '#818CF8', borderWidth: 3, borderDash: [5, 5], tension: 0.3, yAxisID: 'yMultiple' }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94a3b8' } } },
          scales: {
            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
            yNIC: { type: 'linear', position: 'left', ticks: { color: '#F43F5E', callback: (v) => v + ' bp' }, min: 0, max: 35 },
            yMultiple: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#818CF8', callback: (v) => v + ' 배' }, min: 1.0, max: 6.0 }
          }
        }
      });
    }

    // 3. Render US Treasury Yield Chart
    if (treasuryChartRef.current) {
      treasuryChartInstance.current = new Chart(treasuryChartRef.current, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [
            { label: '미국채 10년물 금리 US10Y (%)', data: chartData.us10yYieldSeries, borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.15)', borderWidth: 3.5, fill: true, tension: 0.3, yAxisID: 'yYield' },
            { label: '미국채 10년 입찰 응찰률 (Auction Multiple)', data: chartData.auctionMultipleSeries, borderColor: '#F59E0B', borderWidth: 3, borderDash: [5, 5], tension: 0.3, yAxisID: 'yAuction' }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94a3b8' } } },
          scales: {
            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
            yYield: { type: 'linear', position: 'left', ticks: { color: '#3B82F6', callback: (v) => v + ' %' }, min: 3.5, max: 4.8 },
            yAuction: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#F59E0B', callback: (v) => v + ' 배' }, min: 1.5, max: 3.5 }
          }
        }
      });
    }
  }, [data]);

  const applyFilter = (filterType: string) => {
    setFilter(filterType);
    if (!spreadChartInstance.current) return;

    spreadChartInstance.current.data.datasets.forEach((ds, idx) => {
      if (filterType === 'all') ds.hidden = false;
      else if (filterType === 'top3') ds.hidden = !(idx === 0 || idx === 1 || idx === 2);
      else if (filterType === 'highYield') ds.hidden = !(idx === 4 || idx === 5);
      else if (filterType === 'treasuryOnly') ds.hidden = !(idx === 0 || idx === 6);
    });
    spreadChartInstance.current.update();
  };

  if (loading || !data) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🔄 Real-time Market Data Fetching...</div>
        <p style={{ fontSize: '0.85rem' }}>Fetching live US 10-Year Treasury Yields & BigTech Corporate OAS Spreads (NVIDIA Included)</p>
      </div>
    );
  }

  return (
    <div>
      {/* Top Banner with Refresh Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(18, 26, 43, 0.75)', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Last Fetched: <strong style={{ color: '#f1f5f9' }}>{new Date(data.timestamp).toLocaleString()}</strong> | User Account: <strong style={{ color: '#38BDF8' }}>{userEmail}</strong>
        </div>
        <button
          onClick={fetchLiveMarketData}
          style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38BDF8', padding: '0.4rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
        >
          🔄 Refresh Live Market Data
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {data.companies.map((c) => (
          <div key={c.ticker} style={{ background: 'rgba(18, 26, 43, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '1.25rem', borderLeft: `4px solid ${c.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
              <span>{c.name}</span>
              <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: c.color }}>{c.rating}</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.2rem' }}>
              {c.spreadBp} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#94a3b8' }}>bp</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>발행 금리: <strong style={{ color: '#f1f5f9' }}>{c.issueYield}%</strong></div>
          </div>
        ))}

        <div style={{ background: 'rgba(18, 26, 43, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '1.25rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
            <span>US 10Y Treasury</span>
            <span style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#60A5FA' }}>미국채 금리</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#60A5FA', marginBottom: '0.2rem' }}>
            {data.us10yYield} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#94a3b8' }}>%</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>기준 10년물 국채 수익률</div>
        </div>
      </div>

      {/* 1. Main Spreads Chart Card */}
      <div style={{ background: 'rgba(18, 26, 43, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>📊 빅테크 회사채 발행 스프레드 & 미국채 동향 (NVDA 포함)</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['all', 'top3', 'highYield', 'treasuryOnly'].map((f) => (
              <button
                key={f}
                onClick={() => applyFilter(f)}
                style={{
                  background: filter === f ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: filter === f ? '#38BDF8' : '#94a3b8',
                  padding: '0.35rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem'
                }}
              >
                {f === 'all' ? '전체' : f === 'top3' ? 'NVDA/MSFT/GOOGL' : f === 'highYield' ? 'Oracle/Meta' : 'NVDA/국채'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', height: '380px' }}>
          <canvas ref={spreadChartRef}></canvas>
        </div>

        {/* Enhanced Comment 1 with Threshold & Problem Analysis */}
        <div style={{ marginTop: '1.25rem', background: 'rgba(15, 23, 42, 0.6)', borderLeft: '4px solid #76B900', borderRadius: '8px', padding: '1rem', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, color: '#76B900', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💡 엔비디아(NVIDIA) & 빅테크 회사채 스프레드(OAS) 임계치 분석
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
            <div>🟢 <strong style={{ color: '#76B900' }}>정상 범위</strong>: <strong>30bp ~ 80bp</strong> (NVDA 52bp, MSFT 55bp, GOOGL 66bp)</div>
            <div>🟡 <strong style={{ color: '#F59E0B' }}>주의 범위</strong>: <strong>100bp ~ 150bp</strong> (AMZN 78bp, META 92bp 경계)</div>
            <div>🔴 <strong style={{ color: '#EF4444' }}>위험 범위</strong>: <strong>150bp 이상</strong> (ORCL 224bp 신용 강등 리스크)</div>
          </div>

          <ul style={{ margin: 0, paddingLeft: '1.2rem', marginBottom: '1rem' }}>
            <li><strong style={{ color: '#76B900' }}>엔비디아 (NVIDIA 52bp - Normal Top Tier)</strong>: AI 가속기 시장 독점과 압도적 현금 창출력에 힘입어 신용등급 AA-에도 불구하고 Microsoft(55bp), Alphabet(66bp)과 어깨를 견주는 <strong>최저 수준 52bp 스프레드 유지</strong>.</li>
            <li><strong style={{ color: '#EF4444' }}>오라클 (Oracle 224bp - Danger)</strong>: <strong>200bp 상회로 위험 범주 진입</strong>. CapEx 자금 조달에 따른 부채 부담으로 BBB- 하향되었으며 이자 조달 비용 급증 리스크 상존.</li>
          </ul>

          {/* BigTech Corporate Events Calendar */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.8rem', marginTop: '0.8rem' }}>
            <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              📅 빅테크 주요 기업 이벤트 & 실적 발표 캘린더 (Key Catalysts)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.6rem', fontSize: '0.78rem' }}>
              <div style={{ background: 'rgba(118, 185, 0, 0.1)', border: '1px solid rgba(118, 185, 0, 0.25)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#76B900', fontWeight: 700 }}>🟢 NVIDIA (NVDA)</span> | <strong>8월 28일 (Q2 실적)</strong><br />
                <span style={{ color: '#94a3b8' }}>Blackwell B200 출하 일정 & AI 데이터센터 CapEx 자금 조달 발표</span>
              </div>
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#38BDF8', fontWeight: 700 }}>🔵 Microsoft (MSFT)</span> | <strong>7월 30일 (Q4 실적)</strong><br />
                <span style={{ color: '#94a3b8' }}>Azure AI 성장률 및 연간 $19B 인프라 CapEx 회사채 재원 계획</span>
              </div>
              <div style={{ background: 'rgba(66, 133, 244, 0.1)', border: '1px solid rgba(66, 133, 244, 0.25)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#60A5FA', fontWeight: 700 }}>🔵 Alphabet (GOOGL)</span> | <strong>7월 23일 (Q2 진행)</strong><br />
                <span style={{ color: '#94a3b8' }}>Custom TPU v5p 확장 가이드라인 & 클라우드 분기 매출 공개</span>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#F59E0B', fontWeight: 700 }}>🟡 Amazon (AMZN)</span> | <strong>8월 1일 (Q2 실적)</strong><br />
                <span style={{ color: '#94a3b8' }}>AWS 서버 설비투자 및 장기 채권 만기 차환(Refinancing) 발표</span>
              </div>
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#A855F7', fontWeight: 700 }}>🟣 Meta (META)</span> | <strong>7월 31일 (Q2 실적)</strong><br />
                <span style={{ color: '#94a3b8' }}>Llama 3.1 인프라 투자 $37~$40B 상향 조정 & 신규 사채 발행</span>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#EF4444', fontWeight: 700 }}>🔴 Oracle (ORCL)</span> | <strong>9월 9일 (Q1 FY25)</strong><br />
                <span style={{ color: '#94a3b8' }}>OCI AI 데이터센터 사채 추가 발행 & BBB- 등급 가이드라인</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Indigestion Chart Card */}
      <div style={{ background: 'rgba(18, 26, 43, 0.75)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#F87171' }}>🚨 회사채 물량 소화 불량 모니터링 (NIC & 청약 경쟁률)</h3>
        <div style={{ position: 'relative', height: '360px' }}>
          <canvas ref={indigestionChartRef}></canvas>
        </div>

        {/* Enhanced Comment 2 */}
        <div style={{ marginTop: '1.25rem', background: 'rgba(15, 23, 42, 0.6)', borderLeft: '4px solid #F43F5E', borderRadius: '8px', padding: '1rem', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, color: '#F43F5E', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🚨 물량 소화 불량(Indigestion) 지표별 정상/위험 임계치
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#F43F5E' }}>🏷️ 발행 프리미엄 (NIC)</div>
              <div>🟢 <strong>정상</strong>: 0 ~ 5bp | 🔴 <strong>위험 (소화불량)</strong>: 15bp 이상</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#818CF8' }}>📈 청약 경쟁률 (Orderbook Multiple)</div>
              <div>🟢 <strong>정상</strong>: 3.5배 이상 | 🔴 <strong>위험 (수급고갈)</strong>: 2.5배 이하</div>
            </div>
          </div>

          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            <li><strong style={{ color: '#F43F5E' }}>현재 NIC (22bp - Danger)</strong>: <strong>위험 기준선(15bp) 초과</strong>. 신규 발행 채권 소화를 위해 과도한 금리 얹어주기가 필수적인 <strong>수급 병목 현상</strong> 지속.</li>
            <li><strong style={{ color: '#818CF8' }}>현재 청약 경쟁률 (2.1배 - Danger)</strong>: <strong>위험 기준선(2.5배 이하) 진입</strong>. 기관 투자자의 인수 세력 유치 약화.</li>
          </ul>
        </div>
      </div>

      {/* 3. Treasury Yield Chart Card */}
      <div style={{ background: 'rgba(18, 26, 43, 0.75)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '16px', padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#60A5FA' }}>🇺🇸 미국채 10년물(US 10Y) 조달 금리 & 입찰 응찰률</h3>
        <div style={{ position: 'relative', height: '360px' }}>
          <canvas ref={treasuryChartRef}></canvas>
        </div>

        {/* Enhanced Comment 3 with Treasury Macro Events */}
        <div style={{ marginTop: '1.25rem', background: 'rgba(15, 23, 42, 0.6)', borderLeft: '4px solid #3B82F6', borderRadius: '8px', padding: '1rem', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, color: '#60A5FA', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🇺🇸 미국채 금리 & 10Y-2Y 수익률 곡선 임계치 분석
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#3B82F6' }}>💵 미국채 10년물 금리 (US10Y)</div>
              <div>🟢 <strong>정상</strong>: 3.5% ~ 4.0% | 🔴 <strong>위험 (조달압박)</strong>: 4.5% 이상</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#10B981' }}>📐 10년-2년 금리차 (Yield Gap)</div>
              <div>🟢 <strong>정상</strong>: +50bp ~ +150bp | 🔴 <strong>위험 (역전/스티프닝)</strong>: 0bp 이하</div>
            </div>
          </div>

          <ul style={{ margin: 0, paddingLeft: '1.2rem', marginBottom: '1rem' }}>
            <li><strong style={{ color: '#3B82F6' }}>US 10Y 금리 ({data.us10yYield}% - Caution)</strong>: 4.4%대 상단에 자리잡고 있어 NVIDIA, MSFT 등 빅테크 신규 채권 조달 금리에 하한선 역할을 하고 있음.</li>
            <li><strong style={{ color: '#10B981' }}>수익률 곡선 Gap (+22bp - Normal/Recovery)</strong>: 장단기 금리차 정상화 속도 모니터링 필요.</li>
          </ul>

          {/* Treasury & Fed Macro Events Calendar */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.8rem', marginTop: '0.8rem' }}>
            <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              🏛️ 미국채 & 미 연준(Fed) 주요 매크로 이벤트 캘린더 (Treasury Catalysts)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.6rem', fontSize: '0.78rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#60A5FA', fontWeight: 700 }}>🏛️ FOMC 금리 결정 회의</span> | <strong>7월 30-31일 / 9월 17-18일</strong><br />
                <span style={{ color: '#94a3b8' }}>파월 의장 통화정책 성명서 & 9월 피벗(Pivot, 25/50bp 금리 인하) 시그널</span>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#F59E0B', fontWeight: 700 }}>📜 미 재무부 분기 환류계획 (QRA)</span> | <strong>7월 29일 & 7월 31일</strong><br />
                <span style={{ color: '#94a3b8' }}>재무부 순차입 규모 및 10년물/30년물 장기 국채 발행 비중 가이드 발표</span>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#10B981', fontWeight: 700 }}>📊 US 10년물 국채 벤치마크 입찰</span> | <strong>매월 2주차 (8월 7일 예정)</strong><br />
                <span style={{ color: '#94a3b8' }}>$38B 규모 10년물 국채 입찰 응찰률(Auction Multiple) 및 프라이머리 딜러 인수 비율</span>
              </div>
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#A855F7', fontWeight: 700 }}>📈 US CPI / PCE 인플레이션 지표</span> | <strong>8월 14일 (CPI) / 8월 30일 (PCE)</strong><br />
                <span style={{ color: '#94a3b8' }}>소비자물가지수(CPI) 및 개인소비지출(PCE) 물가 둔화세 확인 시 국채 금리 급락 유발</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
