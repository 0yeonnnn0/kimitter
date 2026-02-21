import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',

  kimitter: {
    apiUrl: process.env.KIMITTER_API_URL || 'http://localhost:3000/api',
  },

  bots: {
    stock: {
      username: process.env.BOT_STOCK_USERNAME || 'stock-bot',
      password: process.env.BOT_STOCK_PASSWORD || '',
    },
    news: {
      username: process.env.BOT_NEWS_USERNAME || 'news-bot',
      password: process.env.BOT_NEWS_PASSWORD || '',
    },
  },

  bot: {
    enabled: process.env.BOT_ENABLED === 'true',
    webhookPort: parseInt(process.env.BOT_WEBHOOK_PORT || '4000', 10),
    webhookSecret: process.env.BOT_WEBHOOK_SECRET || '',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },

  naver: {
    clientId: process.env.NAVER_CLIENT_ID || '',
    clientSecret: process.env.NAVER_CLIENT_SECRET || '',
  },

  kis: {
    appKey: process.env.KIS_APP_KEY || '',
    appSecret: process.env.KIS_APP_SECRET || '',
    baseUrl: process.env.KIS_BASE_URL || 'https://openapi.koreainvestment.com:9443',
  },
};
