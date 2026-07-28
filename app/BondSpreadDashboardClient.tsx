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

    // 1. Render Main Corporate Spread Chart
    if (spreadChartRef.current) {
      spreadChartInstance.current = new Chart(spreadChartRef.current, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [
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
      else if (filterType === 'highYield') ds.hidden = !(idx === 3 || idx === 4 || idx === 5);
      else if (filterType === 'treasuryOnly') ds.hidden = !(idx === 1 || idx === 5);
    });
    spreadChartInstance.current.update();
  };

  if (loading || !data) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🔄 Real-time Market Data Fetching...</div>
        <p style={{ fontSize: '0.85rem' }}>Fetching live US 10-Year Treasury Yields & BigTech Corporate OAS Spreads</p>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
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
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>📊 빅테크 회사채 발행 스프레드 & 미국채 동향</h3>
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
                {f === 'all' ? '전체' : f === 'top3' ? 'AAA/AA+' : f === 'highYield' ? 'Oracle/Meta' : '국채 전용'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', height: '380px' }}>
          <canvas ref={spreadChartRef}></canvas>
        </div>

        {/* Enhanced Comment 1 with Threshold & Problem Analysis */}
        <div style={{ marginTop: '1.25rem', background: 'rgba(15, 23, 42, 0.6)', borderLeft: '4px solid #38BDF8', borderRadius: '8px', padding: '1rem', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, color: '#38BDF8', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💡 회사채 스프레드(OAS) 임계치 및 리스크 분석
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
            <div>🟢 <strong style={{ color: '#10B981' }}>정상 범위</strong>: <strong>30bp ~ 80bp</strong> (우량 빅테크 저리 자금 조달 원활)</div>
            <div>🟡 <strong style={{ color: '#F59E0B' }}>주의 범위</strong>: <strong>100bp ~ 150bp</strong> (조달 이자 비용 증가 시작)</div>
            <div>🔴 <strong style={{ color: '#EF4444' }}>위험 범위</strong>: <strong>150bp 이상</strong> (신용등급 강등 및 발행 위축)</div>
          </div>

          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            <li><strong style={{ color: '#EF4444' }}>오라클 (Oracle 224bp - Danger)</strong>: <strong>200bp 상회로 위험 범주 진입</strong>. CapEx 부채 누적으로 BBB- 하향되었으며, 이자 부담 급증으로 추가 채권 발행 시 자금 조달 비용 대폭 상승 리스크 발생.</li>
            <li><strong style={{ color: '#38BDF8' }}>우량 빅테크 (Microsoft 45bp, Alphabet 58bp - Normal)</strong>: <strong>30~60bp 정상 범주 유효</strong>. 독보적인 현금 창출력으로 시장 변동성 속에서도 최상위 유동성 안전판 확보.</li>
          </ul>
        </div>
      </div>

      {/* 2. Indigestion Chart Card */}
      <div style={{ background: 'rgba(18, 26, 43, 0.75)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#F87171' }}>🚨 회사채 물량 소화 불량 모니터링 (NIC & 청약 경쟁률)</h3>
        <div style={{ position: 'relative', height: '360px' }}>
          <canvas ref={indigestionChartRef}></canvas>
        </div>

        {/* Enhanced Comment 2 with Threshold & Problem Analysis */}
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
            <li><strong style={{ color: '#F43F5E' }}>현재 NIC (22bp - Danger)</strong>: <strong>위험 기준선(15bp) 초과</strong>. 채권을 발행할 때 투자자에게 과도한 덤핑 금리를 얹어주어야만 청약이 완료되는 <strong>수급 소화 불량 병목 문제</strong> 발생.</li>
            <li><strong style={{ color: '#818CF8' }}>현재 청약 경쟁률 (2.1배 - Danger)</strong>: <strong>위험 기준선(2.5배 이하) 진입</strong>. 기관 투자자의 매수 수요 고갈로 향후 발행 미달(Under-subscription) 및 유통가 하락 위험 우려.</li>
          </ul>
        </div>
      </div>

      {/* 3. Treasury Yield Chart Card */}
      <div style={{ background: 'rgba(18, 26, 43, 0.75)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '16px', padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#60A5FA' }}>🇺🇸 미국채 10년물(US 10Y) 조달 금리 & 입찰 응찰률</h3>
        <div style={{ position: 'relative', height: '360px' }}>
          <canvas ref={treasuryChartRef}></canvas>
        </div>

        {/* Enhanced Comment 3 with Threshold & Problem Analysis */}
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

          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            <li><strong style={{ color: '#3B82F6' }}>US 10Y 금리 ({data.us10yYield}% - Caution)</strong>: 4.0% 상단에 위치하여 기업들의 전체 베이스라인 조달 금리 산정 부담이 커진 상태.</li>
            <li><strong style={{ color: '#10B981' }}>수익률 곡선 Gap (+22bp - Normal/Recovery)</strong>: 장단기 금리 역전 해소 구간이나, 장기채 금리가 가파르게 상승하는 Bear Steepening 발생 시 10년 이상 장기 빅테크 회사채 발행 금리에 직접적 상승 압력 유발.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
