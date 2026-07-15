// Cloudflare Pages Function — /stock-price

const SYMBOLS = {
  nexon:      { sym: '3659.T',    label: '넥슨',        cur: '¥',   link: 'https://kr.investing.com/equities/nexon-co-ltd' },
  krafton:    { sym: '259960.KS', label: '크래프톤',    cur: '₩',   link: 'https://kr.investing.com/equities/krafton' },
  netmarble:  { sym: '251270.KS', label: '넷마블',      cur: '₩',   link: 'https://kr.investing.com/equities/netmarble-games-corp' },
  ncsoft:     { sym: '036570.KS', label: '엔씨소프트',  cur: '₩',   link: 'https://kr.investing.com/equities/ncsoft-corp' },
  shiftup:    { sym: '462870.KS', label: '시프트업',    cur: '₩',   link: 'https://kr.investing.com/equities/shift-up' },
  pearlabyss: { sym: '263750.KS', label: '펄어비스',    cur: '₩',   link: 'https://kr.investing.com/equities/pearlabyss' },
  kakaogames: { sym: '293490.KS', label: '카카오게임즈',cur: '₩',   link: 'https://kr.investing.com/equities/kakao-games-corp' },
  nintendo:   { sym: '7974.T',    label: '닌텐도',      cur: '¥',   link: 'https://www.investing.com/equities/nintendo-ltd' },
  sony:       { sym: '6758.T',    label: '소니',        cur: '¥',   link: 'https://www.investing.com/equities/sony-corp.' },
  bandai:     { sym: '7832.T',    label: '반다이남코',  cur: '¥',   link: 'https://www.investing.com/equities/bandai-namco-holdings-inc' },
  tencent:    { sym: '0700.HK',   label: '텐센트',      cur: 'HK$', link: 'https://www.investing.com/equities/tencent-holdings-hk' },
  ea:         { sym: 'EA',        label: 'EA',          cur: '$',   link: 'https://finance.yahoo.com/quote/EA/' },
  netease:    { sym: 'NTES',      label: 'NetEase',     cur: '$',   link: 'https://finance.yahoo.com/quote/NTES/' },
  roblox:     { sym: 'RBLX',      label: 'Roblox',      cur: '$',   link: 'https://finance.yahoo.com/quote/RBLX/' },
  ttwo:       { sym: 'TTWO',      label: 'Take-Two',    cur: '$',   link: 'https://finance.yahoo.com/quote/TTWO/' },
};

const FX_TO_USD = { JPY: 1/160, KRW: 1/1527, HKD: 1/7.78, USD: 1 };

async function fetchPrice(symbol) {
  // 1. 기존 원본 야후 파이낸스 주소
  const rawChartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const rawSummaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=price`;

  // ⭐️ 2. 대표님의 무적 우회 서버 적용! (이제 절대 막히지 않습니다)
  const proxyBase = "https://111.shakiroy1.workers.dev/?url=";
  const chartUrl = proxyBase + encodeURIComponent(rawChartUrl);
  const summaryUrl = proxyBase + encodeURIComponent(rawSummaryUrl);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': '*/*', 'Accept-Language': 'en-US,en;q=0.9', 'Referer': 'https://finance.yahoo.com',
  };

  const [chartRes, summaryRes] = await Promise.all([
    fetch(chartUrl, { headers }), fetch(summaryUrl, { headers }),
  ]);

  if (!chartRes.ok) throw new Error(`chart HTTP ${chartRes.status}`);

  const chartData = await chartRes.json();
  const meta = chartData?.chart?.result?.[0]?.meta;

  if (!meta) throw new Error('No chart meta');

  let mktcapUSD = null;
  try {
    if (summaryRes.ok) {
      const sd = await summaryRes.json();
      const pm = sd?.quoteSummary?.result?.[0]?.price;
      const mc = pm?.marketCap?.raw;
      const fx = FX_TO_USD[meta.currency] ?? 1;
      if (mc) mktcapUSD = (mc * fx) / 1e9;
    }
  } catch(_) {}

  return {
    price: meta.regularMarketPrice ?? meta.previousClose,
    prev: meta.previousClose, high52: meta.fiftyTwoWeekHigh,
    low52: meta.fiftyTwoWeekLow, currency: meta.currency, mktcapUSD,
  };
}

export async function onRequest(context) {
  const results = {};
  await Promise.allSettled(
    Object.entries(SYMBOLS).map(async ([key, info]) => {
      try {
        const data = await fetchPrice(info.sym);
        const chg = data.prev ? ((data.price - data.prev) / data.prev * 100) : 0;
        results[key] = {
          price: data.price, prev: data.prev, chg: chg.toFixed(2),
          high52: data.high52, low52: data.low52, currency: data.currency,
          mktcapUSD: data.mktcapUSD, label: info.label, cur: info.cur, link: info.link, ok: true,
        };
      } catch(e) {
        results[key] = { ok: false, label: info.label, cur: info.cur, link: info.link, error: e.message };
      }
    })
  );

  return new Response(
    JSON.stringify({ updated: new Date().toISOString(), prices: results }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=900',
      },
    }
  );
}
