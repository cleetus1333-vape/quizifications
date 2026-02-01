const appJson = require('./app.json');

module.exports = () => {
  const config = appJson.expo;

  return {
    ...config,
    extra: {
      ...config.extra,
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
    },
  };
};
