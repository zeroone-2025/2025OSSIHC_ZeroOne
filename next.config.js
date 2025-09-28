const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY)
const hasWeatherKey = Boolean(process.env.WEATHER_AUTH_KEY)

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    HAS_OPENAI_KEY: hasOpenAiKey ? 'true' : 'false',
    HAS_WEATHER_KEY: hasWeatherKey ? 'true' : 'false',
  },
}

// next.config.js
module.exports = {
  devIndicators: {
    buildActivity: false,
  },
};

module.exports = nextConfig


