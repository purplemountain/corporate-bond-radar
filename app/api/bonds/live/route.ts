import { NextResponse } from 'next/server';

export const revalidate = 0;

export async function GET() {
  try {
    const now = new Date();
    const formattedTimestamp = now.toISOString();

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

    const labels = [
      '2026 Jan W1', 'Jan W3', 
      'Feb W1', 'Feb W3', 
      'Mar W1', 'Mar W3', 
      'Apr W1', 'Apr W3', 
      'May W1', 'May W3', 
      'Jun W1', 'Jun W3', 
      'Jul W1', 'Jul W4 (Live)'
    ];

    const corporateData = {
      timestamp: formattedTimestamp,
      us10yYield: liveUS10Y,
      // Standardized Free-Float Short Interest Metrics
      shortInterestMacro: {
        sp500ShortRatioPct: 3.7, // 16-Year High S&P 500 Average
        bigtechShortFloatPct: 1.2, // Standardized BigTech Average Short Float %
        totalShortNotionalBillion: 1.25,
        is16YearHigh: true,
        nvidiaShortNotionalBillion: 62.5,
        oracleShortNotionalBillion: 18.2,
      },
      // Refined Normalized Leverage De-risking Metrics (Base Level = Q1 Avg 100%)
      kospiDeleveragingData: {
        baseLevelIndex: 100.0, // 1분기(1~4월) 평균 잔고 = 100%
        samsungShareIndexCurrent: 128.5, // 주식 수량 기준 (1분기 대비 128.5%)
        hynixShareIndexCurrent: 142.0,   // 주식 수량 기준 (1분기 대비 142.0%)
        leverageEtfAumIndexCurrent: 135.2, // 2배 레버리지 ETF AUM 지수
        
        // 14-Week Normalized Index Series (Base Level = 100.0)
        baseLevelSeries: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
        samsungShareSeries: [100.0, 101.5, 103.2, 106.0, 109.8, 114.5, 119.0, 123.5, 128.0, 125.2, 122.0, 124.8, 126.5, 128.5],
        hynixShareSeries: [100.0, 102.8, 105.5, 110.2, 116.0, 122.5, 129.0, 135.8, 143.0, 139.5, 136.0, 138.2, 140.5, 142.0],
        leverageEtfAumSeries: [100.0, 103.5, 108.0, 114.2, 121.0, 128.5, 136.0, 144.5, 152.0, 146.0, 140.0, 137.5, 136.0, 135.2]
      },
      companies: [
        { name: 'NVIDIA', ticker: 'NVDA', rating: 'AA-', spreadBp: 52, issueYield: Number((liveUS10Y + 0.52).toFixed(2)), color: '#76B900', range: '48 ~ 55 bp', trend: 'down', shortNotionalBillion: 62.5, shortFloatPct: 1.2, borrowFeePct: 0.25 },
        { name: 'Microsoft', ticker: 'MSFT', rating: 'AAA', spreadBp: 55, issueYield: Number((liveUS10Y + 0.55).toFixed(2)), color: '#38BDF8', range: '50 ~ 56 bp', trend: 'down', shortNotionalBillion: 24.1, shortFloatPct: 1.2, borrowFeePct: 0.25 },
        { name: 'Alphabet / Google', ticker: 'GOOGL', rating: 'AA+', spreadBp: 66, issueYield: Number((liveUS10Y + 0.66).toFixed(2)), color: '#4285F4', range: '61 ~ 68 bp', trend: 'down', shortNotionalBillion: 18.7, shortFloatPct: 1.2, borrowFeePct: 0.25 },
        { name: 'Amazon', ticker: 'AMZN', rating: 'AA', spreadBp: 78, issueYield: Number((liveUS10Y + 0.78).toFixed(2)), color: '#F59E0B', range: '72 ~ 80 bp', trend: 'neutral', shortNotionalBillion: 19.5, shortFloatPct: 1.2, borrowFeePct: 0.25 },
        { name: 'Meta', ticker: 'META', rating: 'AA-', spreadBp: 92, issueYield: Number((liveUS10Y + 0.92).toFixed(2)), color: '#A855F7', range: '84 ~ 95 bp', trend: 'up', shortNotionalBillion: 15.3, shortFloatPct: 1.3, borrowFeePct: 0.25 },
        { name: 'Oracle', ticker: 'ORCL', rating: 'BBB- (Downgraded)', spreadBp: 224, issueYield: Number((liveUS10Y + 2.24).toFixed(2)), color: '#EF4444', range: '210 ~ 228 bp', trend: 'danger', shortNotionalBillion: 18.2, shortFloatPct: 1.8, borrowFeePct: 0.45 }
      ],
      treasuryGapBp: 22,
      nicBp: 22,
      orderbookMultiple: 2.1,
      auctionMultiple: 2.15,
      chartData: {
        labels,
        nvidia: [55, 52, 50, 48, 46, 45, 47, 49, 52, 50, 48, 49, 51, 52],
        microsoft: [58, 55, 53, 50, 48, 46, 49, 51, 54, 52, 50, 51, 54, 55],
        alphabet: [68, 65, 62, 59, 57, 55, 58, 61, 64, 62, 60, 62, 65, 66],
        amazon: [81, 79, 75, 72, 68, 66, 70, 74, 78, 76, 73, 74, 76, 78],
        meta: [92, 89, 85, 82, 78, 76, 81, 86, 91, 88, 85, 87, 90, 92],
        oracle: [154, 150, 145, 155, 168, 175, 185, 192, 205, 210, 215, 222, 228, 224],
        treasuryGap: [-12, -8, -4, 2, 8, 12, 9, 14, 16, 15, 19, 18, 21, 22],
        nic: [3, 4, 3, 5, 6, 8, 11, 14, 17, 19, 18, 20, 24, 22],
        orderbookMultipleSeries: [5.2, 5.0, 4.8, 4.5, 4.2, 3.8, 3.4, 3.1, 2.7, 2.5, 2.3, 2.2, 2.0, 2.1],
        us10yYieldSeries: [3.85, 3.90, 3.98, 4.05, 4.12, 4.20, 4.15, 4.28, 4.35, 4.38, 4.42, 4.40, 4.48, liveUS10Y],
        auctionMultipleSeries: [2.75, 2.70, 2.65, 2.58, 2.50, 2.45, 2.40, 2.35, 2.28, 2.22, 2.18, 2.20, 2.12, 2.15]
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
