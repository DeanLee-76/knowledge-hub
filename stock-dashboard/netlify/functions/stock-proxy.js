/**
 * Netlify Serverless Function — Stock Proxy
 * Bypasses CORS by fetching Yahoo Finance data server-side.
 *
 * Usage: /.netlify/functions/stock-proxy?symbols=2330.TW,AAPL,TSLA
 */

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const symbols = event.queryStringParameters?.symbols;
  if (!symbols) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing symbols parameter" }),
    };
  }

  try {
    // Yahoo Finance v8 quote endpoint
    const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${encodeURIComponent(symbols)}&range=1mo&interval=1d`;
    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume,regularMarketPreviousClose,fiftyTwoWeekHigh,fiftyTwoWeekLow,shortName,currency,regularMarketTime`;

    const [sparkRes, quoteRes] = await Promise.all([
      fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          "Accept": "application/json",
        },
      }),
      fetch(quoteUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          "Accept": "application/json",
        },
      }),
    ]);

    const sparkData = await sparkRes.json();
    const quoteData = await quoteRes.json();

    // Merge spark (historical) + quote (current) data
    const results = {};
    const quotes = quoteData?.quoteResponse?.result || [];

    for (const q of quotes) {
      const sym = q.symbol;
      const spark = sparkData?.spark?.result?.find((s) => s.symbol === sym);
      const closes = spark?.response?.[0]?.indicators?.quote?.[0]?.close || [];
      const timestamps = spark?.response?.[0]?.timestamp || [];

      // Build weekly & monthly series
      const history = closes
        .map((c, i) => ({
          date: timestamps[i] ? new Date(timestamps[i] * 1000).toISOString().slice(0, 10) : null,
          close: c ? parseFloat(c.toFixed(2)) : null,
        }))
        .filter((d) => d.date && d.close);

      const weekly = history.slice(-5);   // last 5 trading days
      const monthly = history;            // full month

      // Week change
      const weekStart = weekly[0]?.close;
      const weekEnd = weekly[weekly.length - 1]?.close;
      const weekChange = weekStart && weekEnd
        ? parseFloat((((weekEnd - weekStart) / weekStart) * 100).toFixed(2))
        : null;

      // Month change
      const monthStart = monthly[0]?.close;
      const monthEnd = monthly[monthly.length - 1]?.close;
      const monthChange = monthStart && monthEnd
        ? parseFloat((((monthEnd - monthStart) / monthStart) * 100).toFixed(2))
        : null;

      results[sym] = {
        symbol: sym,
        name: q.shortName || sym,
        currency: q.currency || "USD",
        price: q.regularMarketPrice,
        change: q.regularMarketChange ? parseFloat(q.regularMarketChange.toFixed(2)) : 0,
        changePct: q.regularMarketChangePercent
          ? parseFloat(q.regularMarketChangePercent.toFixed(2))
          : 0,
        prevClose: q.regularMarketPreviousClose,
        dayHigh: q.regularMarketDayHigh,
        dayLow: q.regularMarketDayLow,
        volume: q.regularMarketVolume,
        week52High: q.fiftyTwoWeekHigh,
        week52Low: q.fiftyTwoWeekLow,
        weekChange,
        monthChange,
        history: monthly,
        updatedAt: q.regularMarketTime
          ? new Date(q.regularMarketTime * 1000).toISOString()
          : new Date().toISOString(),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: results, fetchedAt: new Date().toISOString() }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
