const config = {
  app: {
    host: process.env.HOST,
    port: process.env.PORT,
  },
  redis: {
    host: process.env.REDIS_SERVER,
  },
  nats: {
    url: process.env.NATS_URL,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    refresh_token_key: process.env.REFRESH_TOKEN_KEY,
  }
};

export default config;