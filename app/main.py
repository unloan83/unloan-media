import streamlit as st

st.set_page_config(page_title="India MultiBagger AI", layout="wide")
st.title("🚀 India Small-Cap Multi-Bagger Scanner")

col1, col2 = st.columns([3,1])
with col1:
    theme = st.text_input("Enter Theme (e.g., EV, Defence, AI, Renewable)", "nuclear energy")

if st.button("Run Scan"):
    with st.spinner("Analyzing news, trends & stocks..."):
        results = run_theme_scan(theme)
        st.dataframe(results, use_container_width=True)
        
        for _, row in results.iterrows():
            with st.expander(f"{row['ticker']} - Score: {row['score']}"):
                st.write(row['analysis'])
