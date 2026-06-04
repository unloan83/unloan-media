import pandas as pd

def format_results_for_display(results):
    if not results:
        return pd.DataFrame()
    
    df = pd.DataFrame(results)
    columns = ['ticker', 'name', 'market_cap_cr', 'conviction_score', 'potential_multiplier', 'recommendation']
    return df[columns] if all(col in df.columns for col in columns) else df
