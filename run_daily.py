from apscheduler.schedulers.blocking import BlockingScheduler
from bot.alerts import send_daily_report

scheduler = BlockingScheduler(timezone="Asia/Kolkata")
scheduler.add_job(send_daily_report, 'cron', hour=8, minute=30)
scheduler.start()
