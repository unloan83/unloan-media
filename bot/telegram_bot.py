from telegram.ext import Application, CommandHandler
from core.data_collector import IndiaDataCollector
from core.analyzer import MultiBaggerAnalyzer
from core.scorer import calculate_final_score
from config import TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, MIN_CONVICTION_SCORE

async def daily_report(context):
    collector = IndiaDataCollector()
    analyzer = MultiBaggerAnalyzer()
    
    news = collector.get_india_news("smallcap OR defence OR ev OR semiconductor OR renewable")
    watchlist = ["MAZDOCK.NS", "HAL.NS", "RVNL.NS", "SUZLON.NS", "IREDA.NS"]  # Add more
    
    message = "🚀 **Daily Multi-Bagger India Scan**\n\n"
    count = 0
    
    for ticker in watchlist:
        info = collector.get_stock_info(ticker)
        if not info:
            continue
        analysis = analyzer.analyze(ticker, news)
        if 'error' in analysis:
            continue
            
        analysis['final_score'] = calculate_final_score(analysis)
        
        if analysis['final_score'] >= MIN_CONVICTION_SCORE:
            count += 1
            message += f"**{ticker}** | Score: {analysis['final_score']}/10 | {analysis.get('potential_multiplier')}\n"
            message += f"{analysis.get('investment_thesis', '')[:180]}...\n\n"
    
    if count == 0:
        message += "No high-conviction ideas today."
    
    await context.bot.send_message(chat_id=TELEGRAM_CHAT_ID, text=message)

def run_bot():
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", lambda u,c: u.message.reply_text("MultiBagger AI Bot Started!")))
    app.run_polling()
