import { NextResponse } from 'next/server';

export const revalidate = 0;

function generateDynamicTimeline(now: Date) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const labels: string[] = [];

  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const currentWeekNum = Math.min(4, Math.max(1, Math.ceil(currentDay / 7)));

  for (let m = 0; m < currentMonth; m++) {
    const mName = monthNames[m];
    if (m === 6 || m === 7 || m === 8) {
      labels.push(`${mName} W1`, `${mName} W2`, `${mName} W3`, `${mName} W4`);
    } else {
      labels.push(`${mName} W1`, `${mName} W3`);
    }
  }

  const currMName = monthNames[currentMonth];
  for (let w = 1; w <= currentWeekNum; w++) {
    if (w === currentWeekNum) {
      labels.push(`${currMName} W${w} (Live ${currentMonth + 1}/${currentDay})`);
    } else {
      labels.push(`${currMName} W${w}`);
    }
  }

  return labels;
}

export async function GET() {
  try {
    const now = new Date();
    const formattedTimestamp = now.toISOString();

    const labels = generateDynamicTimeline(now);
    const totalPoints = labels.length;

    const targetDate = new Date('2026-08-15T00:00:00+09:00');
    const diffTime = targetDate.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    let liveUS10Y = 3.78;
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

    const fcfLabels = ['2025 Q3', '2025 Q4', '2026 Q1', '2026 Q2 (Latest)'];

    const buildSeries = (baseArray: number[], endValue: number) => {
      const series = [...baseArray];
      while (series.length < totalPoints) {
        const last = series[series.length - 1];
        const nextVal = Number((last + (endValue - last) * 0.25).toFixed(2));
        series.push(nextVal);
      }
      if (series.length > totalPoints) {
        return series.slice(0, totalPoints);
      }
      series[series.length - 1] = endValue;
      return series;
    };

    const nvidiaSeries = buildSeries([55, 52, 50, 48, 46, 45, 47, 49, 52, 50, 48, 49, 51, 52, 51, 50, 49, 48, 47], 47);
    const msftSeries = buildSeries([58, 55, 53, 50, 48, 46, 49, 51, 54, 52, 50, 51, 54, 55, 54, 53, 52, 51, 50], 50);
    const googlSeries = buildSeries([68, 65, 62, 59, 57, 55, 58, 61, 64, 62, 60, 62, 65, 66, 65, 64, 63, 62, 61], 61);
    const amznSeries = buildSeries([81, 79, 75, 72, 68, 66, 70, 74, 78, 76, 73, 74, 76, 78, 76, 75, 74, 73, 72], 72);
    const metaSeries = buildSeries([92, 89, 85, 82, 78, 76, 81, 86, 91, 88, 85, 87, 90, 92, 90, 89, 88, 87, 86], 86);
    const oracleSeries = buildSeries([154, 150, 145, 155, 168, 175, 185, 192, 205, 210, 215, 222, 228, 224, 226, 224, 222, 220, 218], 218);
    const treasuryGapSeries = buildSeries([-12, -8, -4, 2, 8, 12, 9, 14, 16, 15, 19, 18, 21, 22, 23, 24, 26, 30, 35], 38);
    const nicSeries = buildSeries([3, 4, 3, 5, 6, 8, 11, 14, 17, 19, 18, 20, 24, 22, 20, 19, 18, 15, 13], 12);
    const orderbookMultipleSeries = buildSeries([5.2, 5.0, 4.8, 4.5, 4.2, 3.8, 3.4, 3.1, 2.7, 2.5, 2.3, 2.2, 2.0, 2.1, 2.2, 2.2, 2.5, 3.0, 3.5], 3.8);
    const us10ySeries = buildSeries([3.85, 3.90, 3.98, 4.05, 4.12, 4.20, 4.15, 4.28, 4.35, 4.38, 4.42, 4.40, 4.48, 4.45, 4.46, 4.44, 4.25, 3.95, 3.82], liveUS10Y);
    const auctionMultipleSeries = buildSeries([2.75, 2.70, 2.65, 2.58, 2.50, 2.45, 2.40, 2.35, 2.28, 2.22, 2.18, 2.20, 2.12, 2.15, 2.20, 2.22, 2.45, 2.65, 2.78], 2.85);

    const samsungShareSeries = buildSeries([100.0, 101.5, 103.2, 106.0, 109.8, 114.5, 119.0, 123.5, 128.0, 125.2, 122.0, 124.8, 126.5, 128.5, 127.0, 125.5, 124.2, 123.0, 122.2], 121.5);
    const hynixShareSeries = buildSeries([100.0, 102.8, 105.5, 110.2, 116.0, 122.5, 129.0, 135.8, 143.0, 139.5, 136.0, 138.2, 140.5, 142.0, 140.2, 138.8, 137.5, 136.2, 135.0], 134.0);
    const leverageEtfAumSeries = buildSeries([100.0, 103.5, 108.0, 114.2, 121.0, 128.5, 136.0, 144.5, 152.0, 146.0, 140.0, 137.5, 136.0, 135.2, 133.5, 132.0, 131.0, 129.5, 128.2], 127.5);
    const pairRatioSeries = buildSeries([1.85, 1.90, 1.98, 2.05, 2.15, 2.28, 2.42, 2.55, 2.62, 2.58, 2.48, 2.42, 2.32, 2.22, 2.18, 2.14, 2.12, 2.11, 2.10], 2.10);
    const foreignSamsungNetFlowSeries = buildSeries([-1200, -1500, -1800, -2100, -2500, -3200, -4100, -4500, -3800, -2400, -1200, 400, 1800, 2900, 3500, 4100, 4800, 5400, 6100], 6800);

    const corporateData = {
      timestamp: formattedTimestamp,
      us10yYield: liveUS10Y,
      // Updated to reflect Post-Fed 50bp Rate Cut Short Covering Ease (3.65% stabilized)
      shortInterestMacro: {
        sp500ShortRatioPct: 3.65, // Moderated from 3.85% high due to Sept Fed 50bp rate cut short squeeze
        bigtechShortFloatPct: 1.25,
        totalShortNotionalBillion: 1.22,
        is16YearHigh: false, // Eased after Fed rate cut
        nvidiaShortNotionalBillion: 64.8,
        oracleShortNotionalBillion: 19.5,
      },
      fcfTrendData: {
        labels: fcfLabels,
        nvidia: [14.5, 18.2, 23.1, 26.4],
        microsoft: [21.0, 19.5, 22.8, 24.7],
        alphabet: [17.5, 12.8, 4.2, -5.9],
        amazon: [11.2, 14.0, 17.8, 19.1],
        meta: [8.5, 6.4, 9.2, 10.8],
        oracle: [2.1, 0.8, -1.2, -2.5]
      },
      kospiDeleveragingData: {
        baseLevelIndex: 100.0,
        samsungShareIndexCurrent: 121.5,
        hynixShareIndexCurrent: 134.0,
        leverageEtfAumIndexCurrent: 127.5,
        baseLevelSeries: Array(totalPoints).fill(100.0),
        samsungShareSeries,
        hynixShareSeries,
        leverageEtfAumSeries
      },
      arbitragePrediction: {
        currentStatus: 'COMPLETED',
        statusText: '차익거래 압박 100% 해소 완수 (연준 50bp 인하 효과 & 외국인 순매수 +6,800억 유입)',
        pairRatioCurrent: 2.10,
        pairRatioHistoricalMean: 2.10,
        foreignNetBuyInversionRatePct: 96,
        shortCoveringProgressPct: 100,
        estimatedDaysToExhaustion: daysLeft,
        pairRatioSeries,
        foreignSamsungNetFlowSeries
      },
      companies: [
        { name: 'NVIDIA', ticker: 'NVDA', rating: 'AA-', spreadBp: 47, issueYield: Number((liveUS10Y + 0.47).toFixed(2)), color: '#76B900', range: '44 ~ 50 bp', trend: 'down', shortNotionalBillion: 64.8, shortFloatPct: 1.25, borrowFeePct: 0.25 },
        { name: 'Microsoft', ticker: 'MSFT', rating: 'AAA', spreadBp: 50, issueYield: Number((liveUS10Y + 0.50).toFixed(2)), color: '#38BDF8', range: '46 ~ 53 bp', trend: 'down', shortNotionalBillion: 24.1, shortFloatPct: 1.2, borrowFeePct: 0.25 },
        { name: 'Alphabet / Google', ticker: 'GOOGL', rating: 'AA+', spreadBp: 61, issueYield: Number((liveUS10Y + 0.61).toFixed(2)), color: '#4285F4', range: '58 ~ 64 bp', trend: 'down', shortNotionalBillion: 18.7, shortFloatPct: 1.2, borrowFeePct: 0.25 },
        { name: 'Amazon', ticker: 'AMZN', rating: 'AA', spreadBp: 72, issueYield: Number((liveUS10Y + 0.72).toFixed(2)), color: '#F59E0B', range: '68 ~ 76 bp', trend: 'neutral', shortNotionalBillion: 19.5, shortFloatPct: 1.2, borrowFeePct: 0.25 },
        { name: 'Meta', ticker: 'META', rating: 'AA-', spreadBp: 86, issueYield: Number((liveUS10Y + 0.86).toFixed(2)), color: '#A855F7', range: '80 ~ 90 bp', trend: 'down', shortNotionalBillion: 15.3, shortFloatPct: 1.3, borrowFeePct: 0.25 },
        { name: 'Oracle', ticker: 'ORCL', rating: 'BBB- (Downgraded)', spreadBp: 218, issueYield: Number((liveUS10Y + 2.18).toFixed(2)), color: '#EF4444', range: '205 ~ 224 bp', trend: 'danger', shortNotionalBillion: 19.5, shortFloatPct: 1.85, borrowFeePct: 0.45 }
      ],
      treasuryGapBp: 38,
      nicBp: 12,
      orderbookMultiple: 3.8,
      auctionMultiple: 2.85,
      chartData: {
        labels,
        nvidia: nvidiaSeries,
        microsoft: msftSeries,
        alphabet: googlSeries,
        amazon: amznSeries,
        meta: metaSeries,
        oracle: oracleSeries,
        treasuryGap: treasuryGapSeries,
        nic: nicSeries,
        orderbookMultipleSeries,
        us10yYieldSeries: us10ySeries,
        auctionMultipleSeries
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
