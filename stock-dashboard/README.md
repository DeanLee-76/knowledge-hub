# Dean's Stock Dashboard

Personal stock tracker — Taiwan & US markets.  
Data via Yahoo Finance (free, ~15 min delayed).

## Features
- 🇹🇼 Taiwan (TWSE) + 🇺🇸 US (NYSE/NASDAQ) — separate tabs
- Add / remove stocks directly from the page
- Day / 1-week / 1-month price change + sparkline chart
- Buy / Hold / Sell signal (rule-based heuristic)
- Links to Yahoo Finance & TradingView for deeper analysis
- Auto-refresh every 5 minutes
- Watchlist saved in browser localStorage

## Deploy to Netlify (5 minutes)

### Step 1 — Create GitHub repo
```bash
git init
git add .
git commit -m "initial: stock dashboard"
gh repo create dean-stock-dashboard --public --push --source=.
```

### Step 2 — Connect Netlify
1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git**
2. Choose your `dean-stock-dashboard` repo
3. Build settings:
   - Build command: *(leave blank)*
   - Publish directory: `.`
   - Functions directory: `netlify/functions`
4. Click **Deploy site**

### Step 3 — Done
Your dashboard is live at `https://[site-name].netlify.app`

## File Structure
```
stock-dashboard/
├── index.html                    ← Main dashboard page
├── netlify.toml                  ← Netlify config
├── README.md
└── netlify/
    └── functions/
        └── stock-proxy.js        ← Serverless CORS proxy for Yahoo Finance
```

## Adding stocks
- Click **＋ Add Stock** on the dashboard
- Taiwan stocks: enter numbers only (e.g. `2330` for TSMC) — `.TW` suffix is automatic
- US stocks: enter ticker directly (e.g. `AAPL`, `NVDA`)

## Signal logic
Signals (Buy / Hold / Sell) are calculated from:
- Day change %
- 1-week trend
- 1-month trend  
- Position relative to 52-week high/low

**This is a personal heuristic tool, not financial advice.**  
Always check Yahoo Finance and TradingView links for deeper analysis.

## Upgrade path
- Want real-time data? Add Alpha Vantage or Finnhub API key to Netlify environment variables
- Want email alerts? Add a second Netlify function with a scheduled trigger
