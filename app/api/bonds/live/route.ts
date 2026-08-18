import { NextResponse } from 'next/server';

export const revalidate = 0;

export async function GET() {
  try {
    const now = new Date();
    const formattedTimestamp = now.toISOString();

    // Dynamic D-Day calculation targeting 2026-08-15 (As of Aug 18, Arbitrage Pressure 100% Completed!)
    const targetDate = new Date('2026-08-15T00:00:00+09:00');
    const diffTime = targetDate.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    let liveUS10Y = 4.45;
    try {
      const yahooRes = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX?interval=1d&range=1d',
        {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          next: { revalidate: 0 }
        }
      );
      if (yahooRes.ok) {
        const yahooData = await yahooRes.json();
        const meta = yahooData?.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) {
          liveUS10Y = Number((meta.regularMarketPrice).toFixed(2));
        }
      }
    } catch (e) {
      console.warn('Yahoo Finance fetch fallback used:', e);
    }

    // Extended timeline labels up to August Week 3 (August 18, 2026 Live)
    const labels = [
      'Jan W1', 'Jan W3', 
      'Feb W1', 'Feb W3', 
      'Mar W1', 'Mar W3', 
      'Apr W1', 'Apr W3', 
      'May W1', 'May W3', 
      'Jun W1', 'Jun W3', 
      'Jul W2', 'Jul W4',
      'Aug W1', 'Aug W2', 'Aug W3 (Live 8/18)'
    ];

    const fcfLabels = ['2025 Q3', '2025 Q4', '2026 Q1', '2026 Q2 (Latest)'];

    const corporateData = {
      timestamp: formattedTimestamp,
      us10yYield: liveUS10Y,
      // Standardized Free-Float Short Interest Metrics (16-Year High 3.85%)
      shortInterestMacro: {
        sp500ShortRatioPct: 3.85,
        bigtechShortFloatPct: 1.25,
        totalShortNotionalBillion: 1.28,
        is16YearHigh: true,
        nvidiaShortNotionalBillion: 64.8,
        oracleShortNotionalBillion: 19.5,
      },
      // BigTech Free Cash Flow (FCF) Trend Data ($ Billion) - Q2 2026 Google FCF Deficit (-$5.9B)
      fcfTrendData: {
        labels: fcfLabels,
        nvidia: [14.5, 18.2, 23.1, 26.4],
        microsoft: [21.0, 19.5, 22.8, 24.7],
        alphabet: [17.5, 12.8, 4.2, -5.9],
        amazon: [11.2, 14.0, 17.8, 19.1],
        meta: [8.5, 6.4, 9.2, 10.8],
        oracle: [2.1, 0.8, -1.2, -2.5]
      },
      // Refined Normalized Leverage De-risking Metrics (Base Level = Q1 Avg 100%, 17 Data Points)
      kospiDeleveragingData: {
        baseLevelIndex: 100.0,
        samsungShareIndexCurrent: 124.2,
        hynixShareIndexCurrent: 137.5,
        leverageEtfAumIndexCurrent: 131.0,
        baseLevelSeries: Array(17).fill(100.0),
        samsungShareSeries: [100.0, 101.5, 103.2, 106.0, 109.8, 114.5, 119.0, 123.5, 128.0, 125.2, 122.0, 124.8, 126.5, 128.5, 127.0, 125.5, 124.2],
        hynixShareSeries: [100.0, 102.8, 105.5, 110.2, 116.0, 122.5, 129.0, 135.8, 143.0, 139.5, 136.0, 138.2, 140.5, 142.0, 140.2, 138.8, 137.5],
        leverageEtfAumSeries: [100.0, 103.5, 108.0, 114.2, 121.0, 128.5, 136.0, 144.5, 152.0, 146.0, 140.0, 137.5, 136.0, 135.2, 133.5, 132.0, 131.0]
      },
      // Gemini Shared Arbitrage Pressure Prediction Model Data (As of Aug 18: 100% Completed)
      arbitragePrediction: {
        currentStatus: 'COMPLETED',
        statusText: '차익거래 압박 100% 해소 완수 (외국인 순매수 지속 & 수급 회귀 완료)',
        pairRatioCurrent: 2.12,
        pairRatioHistoricalMean: 2.10,
        foreignNetBuyInversionRatePct: 94,
        shortCoveringProgressPct: 100,
        estimatedDaysToExhaustion: daysLeft,
        pairRatioSeries: [1.85, 1.90, 1.98, 2.05, 2.15, 2.28, 2.42, 2.55, 2.62, 2.58, 2.48, 2.42, 2.32, 2.22, 2.18, 2.14, 2.12],
        foreignSamsungNetFlowSeries: [-1200, -1500, -1800, -2100, -2500, -3200, -4100, -4500, -3800, -2400, -1200, 400, 1800, 2900, 3500, 4100, 4800]
      },
      companies: [
        { name: 'NVIDIA', ticker: 'NVDA', rating: 'AA-', spreadBp: 49, issueYield: Number((liveUS10Y + 0.49).toFixed(2)), color: '#76B900', range: '45 ~ 52 bp', trend: 'down', shortNotionalBillion: 64.8, shortFloatPct: 1.25, borrowFeePct: 0.25 },
        { name: 'Microsoft', ticker: 'MSFT', rating: 'AAA', spreadBp: 52, issueYield: Number((liveUS10Y + 0.52).toFixed(2)), color: '#38BDF8', range: '48 ~ 55 bp', trend: 'down', shortNotionalBillion: 24.1, shortFloatPct: 1.2, borrowFeePct: 0.25 },
        { name: 'Alphabet / Google', ticker: 'GOOGL', rating: 'AA+', spreadBp: 63, issueYield: Number((liveUS10Y + 0.63).toFixed(2)), color: '#4285F4', range: '60 ~ 66 bp', trend: 'down', shortNotionalBillion: 18.7, shortFloatPct: 1.2, borrowFeePct: 0.25 },
        { name: 'Amazon', ticker: 'AMZN', rating: 'AA', spreadBp: 74, issueYield: Number((liveUS10Y + 0.74).toFixed(2)), color: '#F59E0B', range: '70 ~ 78 bp', trend: 'neutral', shortNotionalBillion: 19.5, shortFloatPct: 1.2, borrowFeePct: 0.25 },
        { name: 'Meta', ticker: 'META', rating: 'AA-', spreadBp: 88, issueYield: Number((liveUS10Y + 0.88).toFixed(2)), color: '#A855F7', range: '82 ~ 92 bp', trend: 'down', shortNotionalBillion: 15.3, shortFloatPct: 1.3, borrowFeePct: 0.25 },
        { name: 'Oracle', ticker: 'ORCL', rating: 'BBB- (Downgraded)', spreadBp: 222, issueYield: Number((liveUS10Y + 2.22).toFixed(2)), color: '#EF4444', range: '210 ~ 228 bp', trend: 'danger', shortNotionalBillion: 19.5, shortFloatPct: 1.85, borrowFeePct: 0.45 }
      ],
      treasuryGapBp: 24,
      nicBp: 18,
      orderbookMultiple: 2.3,
      auctionMultiple: 2.25,
      chartData: {
        labels,
        nvidia: [55, 52, 50, 48, 46, 45, 47, 49, 52, 50, 48, 49, 51, 52, 51, 50, 49],
        microsoft: [58, 55, 53, 50, 48, 46, 49, 51, 54, 52, 50, 51, 54, 55, 54, 53, 52],
        alphabet: [68, 65, 62, 59, 57, 55, 58, 61, 64, 62, 60, 62, 65, 66, 65, 64, 63],
        amazon: [81, 79, 75, 72, 68, 66, 70, 74, 78, 76, 73, 74, 76, 78, 76, 75, 74],
        meta: [92, 89, 85, 82, 78, 76, 81, 86, 91, 88, 85, 87, 90, 92, 90, 89, 88],
        oracle: [154, 150, 145, 155, 168, 175, 185, 192, 205, 210, 215, 222, 228, 224, 226, 224, 222],
        treasuryGap: [-12, -8, -4, 2, 8, 12, 9, 14, 16, 15, 19, 18, 21, 22, 23, 24, 24],
        nic: [3, 4, 3, 5, 6, 8, 11, 14, 17, 19, 18, 20, 24, 22, 20, 19, 18],
        orderbookMultipleSeries: [5.2, 5.0, 4.8, 4.5, 4.2, 3.8, 3.4, 3.1, 2.7, 2.5, 2.3, 2.2, 2.0, 2.1, 2.2, 2.2, 2.3],
        us10yYieldSeries: [3.85, 3.90, 3.98, 4.05, 4.12, 4.20, 4.15, 4.28, 4.35, 4.38, 4.42, 4.40, 4.48, 4.45, 4.46, 4.44, liveUS10Y],
        auctionMultipleSeries: [2.75, 2.70, 2.65, 2.58, 2.50, 2.45, 2.40, 2.35, 2.28, 2.22, 2.18, 2.20, 2.12, 2.15, 2.20, 2.22, 2.25]
      }
    };

    return NextResponse.json(corporateData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch live data' }, { status: 500 });
  }
}
