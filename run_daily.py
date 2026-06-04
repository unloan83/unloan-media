from apscheduler.schedulers.blocking import BlockingScheduler
from bot.telegram_bot import daily_report
import asyncio

def job():
    asyncio.run(daily_report(None))  # Context is not used here

if __name__ == "__main__":
    scheduler = BlockingScheduler(timezone="Asia/Kolkata")
    scheduler.add_job(job, 'cron', hour=8, minute=30)   # Daily at 8:30 AM IST
    print("Scheduler started... Daily scan at 8:30 AM IST")
    scheduler.start()
