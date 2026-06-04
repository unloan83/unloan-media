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

# ====================== BACKTESTING SECTION ======================

st.header("📊 Strategy Backtesting")

col1, col2 = st.columns(2)
with col1:
    backtest_start = st.date_input("Backtest Start Date", datetime(2022, 1, 1))
with col2:
    holding_months = st.slider("Holding Period (Months)", 12, 60, 36)

if st.button("Run Backtest on Historical Signals", type="primary"):
    with st.spinner("Running backtest... This may take a while"):
        backtester = MultiBaggerBacktester()
        
        test_tickers = ["MAZDOCK.NS", "HAL.NS", "RVNL.NS", "SUZLON.NS", "IREDA.NS", 
                       "KPITTECH.NS", "BEML.NS", "MTARTECH.NS"]
        
        signals = backtester.generate_historical_signals(
            test_tickers, 
            backtest_start, 
            datetime.now()
        )
        
        if not signals.empty:
            backtest_result = backtester.run_backtest(signals, holding_months)
            
            # Display Metrics
            metrics = backtest_result['metrics']
            col_m1, col_m2, col_m3, col_m4 = st.columns(4)
            col_m1.metric("Total Return", f"{metrics['total_return_pct']}%")
            col_m2.metric("CAGR", f"{metrics['cagr_pct']}%")
            col_m3.metric("Win Rate", f"{metrics['win_rate_pct']}%")
            col_m4.metric("Trades", metrics['num_trades'])
            
            st.plotly_chart(backtester.plot_portfolio(backtest_result['portfolio']), use_container_width=True)
            
            st.subheader("Trade Log")
            st.dataframe(backtest_result['trades'].sort_values('pnl_pct', ascending=False), use_container_width=True)
        else:
            st.warning("No signals generated in the period.")
