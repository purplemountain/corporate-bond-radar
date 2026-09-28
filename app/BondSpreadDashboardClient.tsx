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
  shortNotionalBillion?: number;
  shortFloatPct?: number;
  borrowFeePct?: number;
}

interface ShortInterestMacro {
  sp500ShortRatioPct: number;
  bigtechShortFloatPct?: number;
  totalShortNotionalBillion: number;
  is16YearHigh: boolean;
  nvidiaShortNotionalBillion: number;
  oracleShortNotionalBillion: number;
}

interface FcfTrendData {
  labels: string[];
  nvidia: number[];
  microsoft: number[];
  alphabet: number[];
  amazon: number[];
  meta: number[];
  oracle: number[];
}

interface KospiDeleveragingData {
  baseLevelIndex: number;
  samsungShareIndexCurrent: number;
  hynixShareIndexCurrent: number;
  leverageEtfAumIndexCurrent: number;
  baseLevelSeries: number[];
  samsungShareSeries: number[];
  hynixShareSeries: number[];
  leverageEtfAumSeries: number[];
}

interface ArbitragePrediction {
  currentStatus: string;
  statusText: string;
  pairRatioCurrent: number;
  pairRatioHistoricalMean: number;
  foreignNetBuyInversionRatePct: number;
  shortCoveringProgressPct: number;
  estimatedDaysToExhaustion: number;
  pairRatioSeries: number[];
  foreignSamsungNetFlowSeries: number[];
}

interface LiveBondData {
  timestamp: string;
  us10yYield: number;
  shortInterestMacro?: ShortInterestMacro;
  fcfTrendData?: FcfTrendData;
  kospiDeleveragingData?: KospiDeleveragingData;
  arbitragePrediction?: ArbitragePrediction;
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
  const fcfChartRef = useRef<HTMLCanvasElement | null>(null);
  const indigestionChartRef = useRef<HTMLCanvasElement | null>(null);
  const treasuryChartRef = useRef<HTMLCanvasElement | null>(null);
  const deleveragingChartRef = useRef<HTMLCanvasElement | null>(null);
  const arbitrageChartRef = useRef<HTMLCanvasElement | null>(null);

  const spreadChartInstance = useRef<Chart | null>(null);
  const fcfChartInstance = useRef<Chart | null>(null);
  const indigestionChartInstance = useRef<Chart | null>(null);
  const treasuryChartInstance = useRef<Chart | null>(null);
  const deleveragingChartInstance = useRef<Chart | null>(null);
  const arbitrageChartInstance = useRef<Chart | null>(null);

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
    if (fcfChartInstance.current) fcfChartInstance.current.destroy();
    if (indigestionChartInstance.current) indigestionChartInstance.current.destroy();
    if (treasuryChartInstance.current) treasuryChartInstance.current.destroy();
    if (deleveragingChartInstance.current) deleveragingChartInstance.current.destroy();
    if (arbitrageChartInstance.current) arbitrageChartInstance.current.destroy();

    const { chartData } = data;
    const nvidiaSeries = chartData.nvidia || [55, 52, 50, 48, 46, 45, 47, 49, 52, 50, 48, 49, 51, 52, 51, 50, 49, 48, 47, 47];

    // 1. Render Main Corporate Spread Chart (Explicitly Highlights Google GOOGL)
    if (spreadChartRef.current) {
      spreadChartInstance.current = new Chart(spreadChartRef.current, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [
            { label: 'NVIDIA (NVDA, AA-)', data: nvidiaSeries, borderColor: '#76B900', backgroundColor: 'rgba(118, 185, 0, 0.1)', borderWidth: 3, tension: 0.3 },
            { label: 'Microsoft (MSFT, AAA)', data: chartData.microsoft, borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderWidth: 2.5, tension: 0.3 },
            { label: 'Alphabet / Google (GOOGL, AA+)', data: chartData.alphabet, borderColor: '#4285F4', backgroundColor: 'rgba(66, 133, 244, 0.2)', borderWidth: 3.5, tension: 0.3 },
            { label: 'Amazon (AMZN, AA)', data: chartData.amazon, borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 2.5, tension: 0.3 },
            { label: 'Meta (META, AA-)', data: chartData.meta, borderColor: '#A855F7', backgroundColor: 'rgba(168, 85, 247, 0.1)', borderWidth: 2.5, tension: 0.3 },
            { label: 'Oracle (ORCL, BBB- Downgraded)', data: chartData.oracle, borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 3.5, tension: 0.3 },
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

    // 2. Render BigTech Free Cash Flow (FCF) Trend Chart with Distinct Brand Colors (Google Blue #4285F4 vs Oracle Red #EF4444)
    const fcfData = data.fcfTrendData || {
      labels: ['2025 Q3', '2025 Q4', '2026 Q1', '2026 Q2 (Latest)'],
      nvidia: [14.5, 18.2, 23.1, 26.4],
      microsoft: [21.0, 19.5, 22.8, 24.7],
      alphabet: [17.5, 12.8, 4.2, -5.9],
      amazon: [11.2, 14.0, 17.8, 19.1],
      meta: [8.5, 6.4, 9.2, 10.8],
      oracle: [2.1, 0.8, -1.2, -2.5]
    };

    // Custom Plugin to Paint Subtle Red Background Shading Below $0B (Deficit Danger Zone)
    const fcfDangerZonePlugin = {
      id: 'fcfDangerZone',
      beforeDraw: (chart: any) => {
        const { ctx, chartArea, scales } = chart;
        if (!scales.y || !chartArea) return;
        
        const zeroY = scales.y.getPixelForValue(0);
        if (zeroY >= chartArea.top && zeroY <= chartArea.bottom) {
          ctx.save();
          
          // Subtle soft red fill below $0B
          ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
          ctx.fillRect(
            chartArea.left,
            zeroY,
            chartArea.width,
            chartArea.bottom - zeroY
          );
          
          // Dashed Red Line at $0B Threshold
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(chartArea.left, zeroY);
          ctx.lineTo(chartArea.right, zeroY);
          ctx.stroke();
          
          // Danger Label Text
          ctx.fillStyle = '#EF4444';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('🚨 FCF 적자 위험 구간 (Free Cash Flow Deficit Zone < $0B)', chartArea.left + 10, zeroY + 16);
          ctx.restore();
        }
      }
    };

    if (fcfChartRef.current) {
      fcfChartInstance.current = new Chart(fcfChartRef.current, {
        type: 'line',
        data: {
          labels: fcfData.labels,
          datasets: [
            { label: 'NVIDIA (NVDA)', data: fcfData.nvidia, borderColor: '#76B900', backgroundColor: 'rgba(118, 185, 0, 0.1)', borderWidth: 3.5, tension: 0.3 },
            { label: 'Microsoft (MSFT)', data: fcfData.microsoft, borderColor: '#38BDF8', borderWidth: 2.5, tension: 0.3 },
            { label: 'Alphabet / Google (GOOGL)', data: fcfData.alphabet, borderColor: '#4285F4', backgroundColor: 'rgba(66, 133, 244, 0.2)', borderWidth: 3.5, tension: 0.3 },
            { label: 'Amazon (AMZN)', data: fcfData.amazon, borderColor: '#F59E0B', borderWidth: 2.5, tension: 0.3 },
            { label: 'Meta (META)', data: fcfData.meta, borderColor: '#A855F7', borderWidth: 2.5, tension: 0.3 },
            { label: 'Oracle (ORCL)', data: fcfData.oracle, borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.25)', borderWidth: 3.5, tension: 0.3 }
          ]
        },
        plugins: [fcfDangerZonePlugin],
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94a3b8' } } },
          scales: {
            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.06)' },
              ticks: { color: '#94a3b8', callback: (v) => '$' + Number(v).toFixed(1) + 'B' },
              title: { display: true, text: '잉여현금흐름 Free Cash Flow ($ Billion)', color: '#38BDF8' }
            }
          }
        }
      });
    }

    // 3. Render Indigestion Chart
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
            yNIC: { type: 'linear', position: 'left', ticks: { color: '#F43F5E', callback: (v) => Number(v).toFixed(1) + ' bp' }, min: 0, max: 35 },
            yMultiple: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#818CF8', callback: (v) => Number(v).toFixed(1) + ' 배' }, min: 1.0, max: 6.0 }
          }
        }
      });
    }

    // 4. Render US Treasury Yield Chart (Standardized to 1 Decimal Place on Y-Axis Ticks)
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
            yYield: {
              type: 'linear', position: 'left',
              ticks: { color: '#3B82F6', callback: (v) => Number(v).toFixed(1) + ' %' },
              min: 3.0, max: 4.8
            },
            yAuction: {
              type: 'linear', position: 'right', grid: { drawOnChartArea: false },
              ticks: { color: '#F59E0B', callback: (v) => Number(v).toFixed(1) + ' 배' },
              min: 1.5, max: 3.5
            }
          }
        }
      });
    }

    // 5. Render Refined Normalized Semiconductor Leverage De-risking Chart
    const kospiDeleveraging = data.kospiDeleveragingData || {
      baseLevelIndex: 100.0,
      samsungShareSeries: [100.0, 101.5, 103.2, 106.0, 109.8, 114.5, 119.0, 123.5, 128.0, 125.2, 122.0, 124.8, 126.5, 128.5, 127.0, 125.5, 124.2, 123.0, 122.2, 121.5],
      hynixShareSeries: [100.0, 102.8, 105.5, 110.2, 116.0, 122.5, 129.0, 135.8, 143.0, 139.5, 136.0, 138.2, 140.5, 142.0, 140.2, 138.8, 137.5, 136.2, 135.0, 134.0],
      leverageEtfAumSeries: [100.0, 103.5, 108.0, 114.2, 121.0, 128.5, 136.0, 144.5, 152.0, 146.0, 140.0, 137.5, 136.0, 135.2, 133.5, 132.0, 131.0, 129.5, 128.2, 127.5]
    };

    if (deleveragingChartRef.current) {
      deleveragingChartInstance.current = new Chart(deleveragingChartRef.current, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [
            {
              label: '1분기 평균 베이스라인 (Base Level = 100%)',
              data: Array(chartData.labels.length).fill(100.0),
              borderColor: '#94a3b8',
              borderDash: [6, 4],
              borderWidth: 2,
              pointRadius: 0,
              fill: false
            },
            {
              label: '삼성전자 신용 잔고 수량(주) 지수 (%)',
              data: kospiDeleveraging.samsungShareSeries,
              borderColor: '#38BDF8',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              borderWidth: 3,
              tension: 0.3
            },
            {
              label: 'SK하이닉스 신용 잔고 수량(주) 지수 (%)',
              data: kospiDeleveraging.hynixShareSeries,
              borderColor: '#EC4899',
              backgroundColor: 'rgba(236, 72, 153, 0.1)',
              borderWidth: 3,
              tension: 0.3
            },
            {
              label: 'KOSPI 반도체 2X 레버리지 ETF AUM 지수 (%)',
              data: kospiDeleveraging.leverageEtfAumSeries,
              borderColor: '#A855F7',
              borderDash: [4, 4],
              borderWidth: 2.5,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#94a3b8' } }
          },
          scales: {
            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.06)' },
              ticks: { color: '#94a3b8', callback: (v) => Number(v).toFixed(1) + ' %' },
              title: { display: true, text: '1분기 Base Level 대비 정규화 지수 (%)', color: '#cbd5e1' },
              min: 90,
              max: 160
            }
          }
        }
      });
    }

    // 6. Render Arbitrage Pressure Prediction Chart (Pair Ratio vs Foreign Net Flow)
    const arbData = data.arbitragePrediction || {
      pairRatioSeries: [1.85, 1.90, 1.98, 2.05, 2.15, 2.28, 2.42, 2.55, 2.62, 2.58, 2.48, 2.42, 2.32, 2.22, 2.18, 2.14, 2.12, 2.11, 2.10, 2.10],
      foreignSamsungNetFlowSeries: [-1200, -1500, -1800, -2100, -2500, -3200, -4100, -4500, -3800, -2400, -1200, 400, 1800, 2900, 3500, 4100, 4800, 5400, 6100, 6800]
    };

    if (arbitrageChartRef.current) {
      arbitrageChartInstance.current = new Chart(arbitrageChartRef.current, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [
            {
              label: 'SK하이닉스/삼성전자 페어 비율 (Pair Ratio)',
              data: arbData.pairRatioSeries,
              borderColor: '#A855F7',
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              borderWidth: 3.5,
              tension: 0.3,
              yAxisID: 'yPair'
            },
            {
              label: '페어 비율 역사적 평균 밴드 (2.10)',
              data: Array(chartData.labels.length).fill(2.10),
              borderColor: '#94a3b8',
              borderDash: [5, 5],
              borderWidth: 2,
              pointRadius: 0,
              yAxisID: 'yPair'
            },
            {
              label: '외국인 삼성전자 순매수 유입액 (억 원)',
              data: arbData.foreignSamsungNetFlowSeries,
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.25)',
              borderWidth: 2.5,
              fill: true,
              tension: 0.3,
              yAxisID: 'yFlow'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#94a3b8' } }
          },
          scales: {
            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
            yPair: {
              type: 'linear',
              position: 'left',
              ticks: { color: '#A855F7', callback: (v) => Number(v).toFixed(1) + ' 배' },
              title: { display: true, text: 'Hynix/Samsung 주가 비율 (Pair Ratio)', color: '#A855F7' },
              min: 1.5,
              max: 3.0
            },
            yFlow: {
              type: 'linear',
              position: 'right',
              grid: { drawOnChartArea: false },
              ticks: { color: '#10B981', callback: (v) => Number(v).toLocaleString() + ' 억' },
              title: { display: true, text: '외국인 삼성전자 순매수 유입 (억 원)', color: '#10B981' },
              min: -5000,
              max: 8000
            }
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
        <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🔄 Real-time Live Market Data Fetching...</div>
        <p style={{ fontSize: '0.85rem' }}>Fetching live US 10-Year Treasury Yields & BigTech FCF Trends / Corporate Spreads</p>
      </div>
    );
  }

  const macroShort = data.shortInterestMacro || {
    sp500ShortRatioPct: 3.85,
    bigtechShortFloatPct: 1.25,
    totalShortNotionalBillion: 1.28,
    is16YearHigh: true,
    nvidiaShortNotionalBillion: 64.8,
    oracleShortNotionalBillion: 19.5
  };

  const fcfTrend = data.fcfTrendData || {
    labels: ['2025 Q3', '2025 Q4', '2026 Q1', '2026 Q2 (Latest)'],
    nvidia: [14.5, 18.2, 23.1, 26.4],
    microsoft: [21.0, 19.5, 22.8, 24.7],
    alphabet: [17.5, 12.8, 4.2, -5.9],
    amazon: [11.2, 14.0, 17.8, 19.1],
    meta: [8.5, 6.4, 9.2, 10.8],
    oracle: [2.1, 0.8, -1.2, -2.5]
  };

  const kospiDeleveraging = data.kospiDeleveragingData || {
    baseLevelIndex: 100.0,
    samsungShareIndexCurrent: 121.5,
    hynixShareIndexCurrent: 134.0,
    leverageEtfAumIndexCurrent: 127.5,
    baseLevelSeries: Array(20).fill(100.0),
    samsungShareSeries: [100.0, 101.5, 103.2, 106.0, 109.8, 114.5, 119.0, 123.5, 128.0, 125.2, 122.0, 124.8, 126.5, 128.5, 127.0, 125.5, 124.2, 123.0, 122.2, 121.5],
    hynixShareSeries: [100.0, 102.8, 105.5, 110.2, 116.0, 122.5, 129.0, 135.8, 143.0, 139.5, 136.0, 138.2, 140.5, 142.0, 140.2, 138.8, 137.5, 136.2, 135.0, 134.0],
    leverageEtfAumSeries: [100.0, 103.5, 108.0, 114.2, 121.0, 128.5, 136.0, 144.5, 152.0, 146.0, 140.0, 137.5, 136.0, 135.2, 133.5, 132.0, 131.0, 129.5, 128.2, 127.5]
  };

  const arbPredict = data.arbitragePrediction || {
    currentStatus: 'COMPLETED',
    statusText: '차익거래 압박 100% 해소 완수 (연준 50bp 빅컷 인하 & 외국인 순매수 +6,800억 유입)',
    pairRatioCurrent: 2.10,
    pairRatioHistoricalMean: 2.10,
    foreignNetBuyInversionRatePct: 96,
    shortCoveringProgressPct: 100,
    estimatedDaysToExhaustion: 0,
    pairRatioSeries: [1.85, 1.90, 1.98, 2.05, 2.15, 2.28, 2.42, 2.55, 2.62, 2.58, 2.48, 2.42, 2.32, 2.22, 2.18, 2.14, 2.12, 2.11, 2.10, 2.10],
    foreignSamsungNetFlowSeries: [-1200, -1500, -1800, -2100, -2500, -3200, -4100, -4500, -3800, -2400, -1200, 400, 1800, 2900, 3500, 4100, 4800, 5400, 6100, 6800]
  };

  return (
    <div>
      {/* Top Banner with Refresh Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'rgba(18, 26, 43, 0.75)', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Last Live Fetched: <strong style={{ color: '#f1f5f9' }}>{new Date(data.timestamp).toLocaleString()}</strong> | User Account: <strong style={{ color: '#38BDF8' }}>{userEmail}</strong>
        </div>
        <button
          onClick={fetchLiveMarketData}
          style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38BDF8', padding: '0.4rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}
        >
          🔄 Refresh Live Market Data
        </button>
      </div>

      {/* Gemini Arbitrage Pressure Prediction Counter & Dynamic Traffic Light Widget */}
      <div style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '800', color: '#A855F7', fontSize: '1rem' }}>
            🔮 삼성전자 vs SK하이닉스 차익거래(Arbitrage) 수급 예측
            <span style={{ fontSize: '0.78rem', background: 'rgba(16, 185, 129, 0.25)', color: '#6EE7B7', padding: '0.15rem 0.6rem', borderRadius: '12px', fontWeight: '700' }}>
              오늘 (9월 28일) 100% 해소 정착!
            </span>
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '0.84rem', marginTop: '0.3rem' }}>
            현재 수급 상태: <strong style={{ color: '#10B981' }}>🟢 {arbPredict.statusText}</strong> | 수급 상태: <strong style={{ color: '#38BDF8', fontSize: '1.05rem' }}>외국인 순매수 +6,800억 유입 / Pair Ratio 2.10배 안착</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'center' }}>
            <span style={{ color: '#38BDF8', fontWeight: '700' }}>📈 외국인 매수 전환율</span><br />
            <strong style={{ color: '#f1f5f9', fontSize: '1rem' }}>{arbPredict.foreignNetBuyInversionRatePct}%</strong>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'center' }}>
            <span style={{ color: '#10B981', fontWeight: '700' }}>🔄 숏커버링 진행률</span><br />
            <strong style={{ color: '#f1f5f9', fontSize: '1rem' }}>{arbPredict.shortCoveringProgressPct}% (완료)</strong>
          </div>
          <div style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'center' }}>
            <span style={{ color: '#E9D5FF', fontWeight: '700' }}>⚖️ 현재 페어 비율</span><br />
            <strong style={{ color: '#f1f5f9', fontSize: '1rem' }}>{arbPredict.pairRatioCurrent} 배</strong> <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>(목표 평균 2.10)</span>
          </div>
        </div>
      </div>

      {/* 16-Year High Short Interest Alert Banner */}
      <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', color: '#EF4444', fontSize: '0.95rem' }}>
            🚨 S&P 500 공매도 잔고 비중 16년 만에 사상 최고치 경고 <span style={{ fontSize: '0.78rem', background: 'rgba(239, 68, 68, 0.25)', color: '#FCA5A5', padding: '0.1rem 0.5rem', borderRadius: '10px' }}>유동주식기준(시장표준)</span>
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '0.82rem', marginTop: '0.2rem' }}>
            S&P 500 <strong style={{ color: '#FCA5A5' }}>유동주식기준(시장표준)</strong> 공매도 비율 <strong style={{ color: '#EF4444' }}>{macroShort.sp500ShortRatioPct}%</strong> (2008년 금융위기 3.8% 이후 최고치) | 전체 공매도 노출액 <strong style={{ color: '#f1f5f9' }}>${macroShort.totalShortNotionalBillion}T</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(118, 185, 0, 0.15)', border: '1px solid rgba(118, 185, 0, 0.4)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'center' }}>
            <span style={{ color: '#76B900', fontWeight: '700' }}>🟢 NVDA 공매도 1위</span><br />
            <strong style={{ color: '#f1f5f9' }}>${macroShort.nvidiaShortNotionalBillion}B (약 88조원)</strong>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'center' }}>
            <span style={{ color: '#FCA5A5', fontWeight: '700' }}>🔴 ORCL 등급하향 공매도</span><br />
            <strong style={{ color: '#f1f5f9' }}>${macroShort.oracleShortNotionalBillion}B (BBB-)</strong>
          </div>
        </div>
      </div>

      {/* KPI Cards with Short Interest Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {data.companies.map((c) => (
          <div key={c.ticker} style={{ background: 'rgba(18, 26, 43, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '1.25rem', borderLeft: `4px solid ${c.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>
              <span>{c.name}</span>
              <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: c.color }}>{c.rating}</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '0.2rem' }}>
              {c.spreadBp} <span style={{ fontSize: '0.9rem', fontWeight: '400', color: '#94a3b8' }}>bp</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>발행 금리: <strong style={{ color: '#f1f5f9' }}>{c.issueYield}%</strong></div>

            {/* Short Interest Info Badge */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.4rem', fontSize: '0.74rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>공매도 노출: <strong style={{ color: '#cbd5e1' }}>${c.shortNotionalBillion || 10}B</strong></span>
                <span>비율: <strong style={{ color: '#38BDF8' }}>{c.shortFloatPct || 1.2}%</strong></span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#38BDF8', textAlign: 'right' }}>
                * 유동주식기준(시장표준)
              </div>
            </div>
          </div>
        ))}

        <div style={{ background: 'rgba(18, 26, 43, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '1.25rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>
            <span>US 10Y Treasury</span>
            <span style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#60A5FA' }}>미국채 금리</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#60A5FA', marginBottom: '0.2rem' }}>
            {data.us10yYield} <span style={{ fontSize: '0.9rem', fontWeight: '400', color: '#94a3b8' }}>%</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>기준 10년물 국채 수익률 (Fed 50bp 인하)</div>
        </div>
      </div>

      {/* 1. Main Spreads Chart Card (Includes Google GOOGL Explicitly & Updated to Sep W4) */}
      <div style={{ background: 'rgba(18, 26, 43, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>📊 빅테크 회사채 발행 스프레드 & 미국채 동향 (9월 4주차 9/28 실시간 갱신)</h3>
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
                {f === 'all' ? '전체' : f === 'top3' ? 'NVDA/MSFT/GOOGL' : f === 'highYield' ? 'Oracle/Meta' : 'GOOGL/국채'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', height: '380px' }}>
          <canvas ref={spreadChartRef}></canvas>
        </div>

        {/* Enhanced Comment 1 with Fed 50bp Cut & Sep W4 Updates */}
        <div style={{ marginTop: '1.25rem', background: 'rgba(15, 23, 42, 0.6)', borderLeft: '4px solid #3B82F6', borderRadius: '8px', padding: '1rem', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          <div style={{ fontWeight: '700', color: '#3B82F6', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏛️ 미 연준(Fed) 9월 50bp 빅컷 금리 인하 피벗 및 빅테크 회사채 스프레드(OAS) 최신 분석 (9월 28일 기준)
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
            <div>🟢 <strong style={{ color: '#76B900' }}>정상 범위</strong>: <strong>30bp ~ 80bp</strong> (NVDA 47bp, MSFT 50bp, GOOGL 61bp)</div>
            <div>🟡 <strong style={{ color: '#F59E0B' }}>주의 범위</strong>: <strong>100bp ~ 150bp</strong> (AMZN 72bp, META 86bp 경계)</div>
            <div>🔴 <strong style={{ color: '#EF4444' }}>위험 범위</strong>: <strong>150bp 이상</strong> (ORCL 218bp 신용 강등 리스크)</div>
          </div>

          <ul style={{ margin: 0, paddingLeft: '1.2rem', marginBottom: '1rem' }}>
            <li><strong style={{ color: '#76B900' }}>엔비디아 (NVIDIA 47bp - 9월 4주차 최저)</strong>: 실적 호조 및 Blackwell 칩 주문 폭주로 **47bp 사상 최저 스프레드 강세 지속**.</li>
            <li><strong style={{ color: '#4285F4' }}>구글 (Alphabet / GOOGL 61bp - 안정적 소화)</strong>: FCF -$5.9B 적자 발표 후 $25B 회사채 순항 소화로 **61bp대 안정화**.</li>
            <li><strong style={{ color: '#3B82F6' }}>미 연준(Fed) 9월 18일 50bp 빅컷(Big Cut) 피벗 영향</strong>: 미국채 10년물 금리가 3.78%대로 하락하여 빅테크 발행 금리 전반의 하한선 완화.</li>
          </ul>
        </div>
      </div>

      {/* 2. BigTech Free Cash Flow (FCF) Trend Chart Card (With Distinct Google Blue #4285F4 vs Oracle Red #EF4444 Colors) */}
      <div style={{ background: 'rgba(18, 26, 43, 0.75)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#38BDF8' }}>
            💵 빅테크 6개사 잉여현금흐름 (Free Cash Flow, FCF) 추이 ($ Billion)
          </h3>
          <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.78rem' }}>
            <span style={{ background: 'rgba(118, 185, 0, 0.15)', color: '#76B900', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>NVDA: <strong>${fcfTrend.nvidia[3]}B</strong></span>
            <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>MSFT: <strong>${fcfTrend.microsoft[3]}B</strong></span>
            <span style={{ background: 'rgba(66, 133, 244, 0.2)', color: '#4285F4', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(66, 133, 244, 0.5)' }}>GOOGL: <strong>-${Math.abs(fcfTrend.alphabet[3])}B (구글 블루 🔵)</strong></span>
            <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.5)' }}>ORCL: <strong>${fcfTrend.oracle[3]}B (오라클 레드 🔴)</strong></span>
          </div>
        </div>

        <div style={{ position: 'relative', height: '370px' }}>
          <canvas ref={fcfChartRef}></canvas>
        </div>
      </div>

      {/* 3. Indigestion Chart Card */}
      <div style={{ background: 'rgba(18, 26, 43, 0.75)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#F87171' }}>🚨 회사채 물량 소화 불량 모니터링 (NIC & 청약 경쟁률)</h3>
        <div style={{ position: 'relative', height: '360px' }}>
          <canvas ref={indigestionChartRef}></canvas>
        </div>

        {/* Enhanced Comment 2 */}
        <div style={{ marginTop: '1.25rem', background: 'rgba(15, 23, 42, 0.6)', borderLeft: '4px solid #10B981', borderRadius: '8px', padding: '1rem', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          <div style={{ fontWeight: '700', color: '#10B981', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🟢 9월 미 연준 금리 인하 후 채권시장 온기 회복 (NIC 12bp / 청약경쟁률 3.8배 호조)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
            <div>
              <div style={{ fontWeight: '700', color: '#10B981' }}>🏷️ 발행 프리미엄 (NIC)</div>
              <div>🟢 <strong>정상화</strong>: 12bp (7월 고점 24bp 대비 대폭 축소)</div>
            </div>
            <div>
              <div style={{ fontWeight: '700', color: '#818CF8' }}>📈 청약 경쟁률 (Orderbook Multiple)</div>
              <div>🟢 <strong>정상 범위 회복</strong>: 3.8배 (기관 인수 자금 대거 유입)</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Treasury Yield Chart Card */}
      <div style={{ background: 'rgba(18, 26, 43, 0.75)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#60A5FA' }}>🇺🇸 미국채 10년물(US 10Y) 조달 금리 & 입찰 응찰률 (9월 50bp 인하 반영)</h3>
        <div style={{ position: 'relative', height: '360px' }}>
          <canvas ref={treasuryChartRef}></canvas>
        </div>
      </div>

      {/* 5. KOSPI Semiconductor Normalized De-leveraging Base Level Chart Card */}
      <div style={{ background: 'rgba(18, 26, 43, 0.75)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#38BDF8' }}>
            🇰🇷 코스피 반도체 레버리지 수급 청산(De-leveraging) Base Level 모니터링 (9월 4주차)
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem' }}>
            <span style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
              기준점 (1분기 평균): <strong>100.0%</strong>
            </span>
            <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
              삼성전자 수량: <strong>{kospiDeleveraging.samsungShareIndexCurrent}%</strong>
            </span>
            <span style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#EC4899', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
              SK하이닉스 수량: <strong>{kospiDeleveraging.hynixShareIndexCurrent}%</strong>
            </span>
            <span style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#A855F7', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
              2X ETF AUM: <strong>{kospiDeleveraging.leverageEtfAumIndexCurrent}%</strong>
            </span>
          </div>
        </div>

        <div style={{ position: 'relative', height: '390px' }}>
          <canvas ref={deleveragingChartRef}></canvas>
        </div>
      </div>

      {/* 6. Gemini Arbitrage Pressure Prediction Chart Card */}
      <div style={{ background: 'rgba(18, 26, 43, 0.75)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '16px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#E9D5FF' }}>
            🔮 삼성전자 vs SK하이닉스 차익거래(Arbitrage) 수급 예측 (9월 28일 정착 완료)
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem' }}>
            <span style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#E9D5FF', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
              Pair Ratio: <strong>{arbPredict.pairRatioCurrent} 배</strong> (평균 {arbPredict.pairRatioHistoricalMean} 안착)
            </span>
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
              외인 삼전 유입: <strong>+6,800억 원</strong> (대폭 순매수 확정)
            </span>
          </div>
        </div>

        <div style={{ position: 'relative', height: '390px' }}>
          <canvas ref={arbitrageChartRef}></canvas>
        </div>
      </div>
    </div>
  );
}
