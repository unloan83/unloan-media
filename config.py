import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
GROK_API_KEY = os.getenv("GROK_API_KEY")          # xAI Grok
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")  # Your private channel/group ID

# Preferences
MARKET_CAP_LIMIT_CR = 10000   # Aggressive small-cap filter
MIN_CONVICTION_SCORE = 7.5
