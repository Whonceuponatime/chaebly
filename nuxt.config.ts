// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // https://nuxt.com/modules
  modules: [
    '@nuxthub/core',
    '@nuxtjs/supabase'
  ],

  // https://devtools.nuxt.com
  devtools: { enabled: true },

  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    redirectOptions: {
      login: '/auth/login',
      callback: '/confirm',
      exclude: ['/auth/register', '/auth/reset-password'],
    }
  },

  // Env variables
  runtimeConfig: {
    openaiApiKey: process.env.NUXT_OPENAI_API_KEY,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY
    }
  },

  // https://nuxt.com/docs/getting-started/upgrade#testing-nuxt-4
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2024-07-30',

  // https://hub.nuxt.com/docs/getting-started/installation#options
  hub: {
    // Configure deployment settings
    deployment: {
      runtime: 'edge',
      regions: ['icn1'], // Seoul region for better performance in Korea
      memory: 1024, // 1GB memory
    },
    // Configure build settings
    build: {
      preset: 'node-server'
    }
  },

  // https://eslint.nuxt.com
  eslint: {
    config: {
      stylistic: {
        quotes: 'single',
      },
    },
  },
})
