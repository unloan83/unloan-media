import streamlit as st
from core.data_collector import IndiaDataCollector
from core.analyzer import MultiBaggerAnalyzer
from core.scorer import calculate_final_score
from app.utils import format_results_for_display
from config import MIN_CONVICTION_SCORE

st.set_page_config(page_title="India MultiBagger AI", layout="wide")
st.title("🚀 India Small-Cap Multi-Bagger Scanner")
st.markdown("**Aggressive Small-Cap (≤ ₹10,000 Cr) | 5x–50x Potential**")

collector = IndiaDataCollector()
analyzer = MultiBaggerAnalyzer()

theme = st.text_input("Enter Investment Theme / Sector", 
                     placeholder="defence", value="defence")

if st.button("🔍 Run Full Scan", type="primary"):
    with st.spinner("Collecting news, trends & analyzing stocks..."):
        news = collector.get_india_news(theme)
        
        # Dummy list of small-cap tickers (expand this with your watchlist or scraper)
        watchlist = ["MAZDOCK.NS", "HAL.NS", "RVNL.NS", "SUZLON.NS", "KPITTECH.NS", 
                     "CELLO.NS", "BEML.NS", "MTARTECH.NS", "GRAVITA.NS", "IREDA.NS"]
        
        results = []
        for ticker in watchlist:
            info = collector.get_stock_info(ticker)
            if not info:
                continue
                
            analysis = analyzer.analyze(ticker, news)
            if 'error' in analysis:
                continue
                
            analysis['final_score'] = calculate_final_score(analysis)
            
            if analysis['final_score'] >= MIN_CONVICTION_SCORE:
                results.append(analysis)
        
        # Sort by score
        results = sorted(results, key=lambda x: x['final_score'], reverse=True)
        
        st.success(f"Found {len(results)} High-Conviction Ideas")
        df = format_results_for_display(results)
        st.dataframe(df, use_container_width=True)
        
        for res in results[:8]:
            with st.expander(f"#{res['ticker']} | Score: {res['final_score']}/10 | {res.get('potential_multiplier')}"):
                st.write("**Thesis:**", res.get('investment_thesis', 'N/A'))
                st.write("**Catalysts:**", ", ".join(res.get('catalysts', [])))
                st.write("**Risks:**", ", ".join(res.get('key_risks', [])))
