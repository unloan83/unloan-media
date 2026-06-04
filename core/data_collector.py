import yfinance as yf
import requests
from pytrends.request import TrendReq
import feedparser

class IndiaDataCollector:
    def get_small_cap_stocks(self, limit=200):
        # Use screener.in or scrape NSE small-cap list (or maintain CSV)
        # For demo, we'll filter via yfinance
        pass

    def get_stock_info(self, ticker):  # ticker like "RELIANCE.NS"
        stock = yf.Ticker(ticker)
        info = stock.info
        if info.get('marketCap', 0) > 100000000000:  # > 10,000 Cr
            return None
        return info

    def get_india_news(self, query="stocks OR economy OR smallcap"):
        url = f"https://newsapi.org/v2/everything?q={query}&country=in&apiKey={NEWS_API_KEY}"
        return requests.get(url).json()

    def get_google_trends(self, keywords):
        pytrends = TrendReq(hl='en-IN', tz=360)
        pytrends.build_payload(keywords, cat=0, timeframe='today 3-m', geo='IN')
        return pytrends.interest_over_time()
