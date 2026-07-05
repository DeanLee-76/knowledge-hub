#!/usr/bin/env python3
"""
Stock Dashboard Data Fetcher
讀取 watchlist.json → 抓 Yahoo Finance 數據 → 存 data.json
"""
import json, yfinance as yf
from datetime import datetime
from pathlib import Path

# 讀取股票清單
wl_path = Path(__file__).parent / "watchlist.json"
with open(wl_path, "r", encoding="utf-8") as f:
    WATCHLIST = json.load(f)

def fetch_stock(symbol, name):
    print(f"  抓取 {symbol} ({name})...")
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="35d")
        if hist.empty:
            print(f"    ⚠ 無數據"); return None
        latest = hist.iloc[-1]
        prev   = hist.iloc[-2] if len(hist) >= 2 else hist.iloc[-1]
        price      = round(float(latest["Close"]), 2)
        prev_close = round(float(prev["Close"]), 2)
        change     = round(price - prev_close, 2)
        change_pct = round((change / prev_close) * 100, 2) if prev_close else 0
        week_start  = float(hist.tail(6).iloc[0]["Close"]) if len(hist) >= 2 else price
        week_change = round(((price - week_start) / week_start) * 100, 2) if week_start else 0
        month_start  = float(hist.iloc[0]["Close"])
        month_change = round(((price - month_start) / month_start) * 100, 2) if month_start else 0
        try:
            info   = ticker.fast_info
            w52h   = round(float(info.fifty_two_week_high), 2)
            w52l   = round(float(info.fifty_two_week_low),  2)
            curr   = info.currency or ("TWD" if ".TW" in symbol else "USD")
            vol    = int(info.last_volume or 0)
        except:
            w52h = round(float(hist["High"].max()), 2)
            w52l = round(float(hist["Low"].min()),  2)
            curr = "TWD" if ".TW" in symbol else "USD"
            vol  = int(latest.get("Volume", 0))
        history = [{"date": str(idx.date()), "close": round(float(row["Close"]), 2)}
                   for idx, row in hist.iterrows()]
        return {
            "symbol": symbol, "name": name, "currency": curr,
            "price": price, "change": change, "changePct": change_pct,
            "prevClose": prev_close, "weekChange": week_change,
            "monthChange": month_change, "week52High": w52h,
            "week52Low": w52l, "volume": vol, "history": history,
            "updatedAt": datetime.now().isoformat(),
        }
    except Exception as e:
        print(f"    ✗ 錯誤: {e}"); return None

def main():
    print(f"\n📈 Stock Fetcher — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    result = {"fetchedAt": datetime.now().isoformat(), "data": {}}
    total = 0
    for market, stocks in WATCHLIST.items():
        print(f"── {market} ──")
        for item in stocks:
            total += 1
            data = fetch_stock(item["symbol"], item["name"])
            if data:
                result["data"][item["symbol"]] = data
    out_path = Path(__file__).parent / "data.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    success = len(result["data"])
    print(f"\n✅ 完成！{success}/{total} 支股票 → data.json\n")

if __name__ == "__main__":
    main()
