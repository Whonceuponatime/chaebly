// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // https://nuxt.com/modules
  modules: [
    '@nuxthub/core',
    '@nuxt/eslint',
    '@nuxtjs/supabase'
  ],

  // https://devtools.nuxt.com
  devtools: { enabled: true },

  // Supabase configuration
  supabase: {
    url: 'https://xhyndjezupnvsfeexsne.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoeW5kamV6dXBudnNmZWV4c25lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3MjE1MjIsImV4cCI6MjA1NDI5NzUyMn0.mqnBVyj3vxYb_P13NgHBoZe5-Qz9xKXVnbKXo6vzbKQ',
    redirect: false,
    cookieOptions: {
      maxAge: 60 * 60 * 8, // 8 hours
      sameSite: 'lax',
      secure: true
    }
  },

  // Env variables - https://nuxt.com/docs/getting-started/configuration#environment-variables-and-private-tokens
  runtimeConfig: {
    public: {
      // Can be overridden by NUXT_PUBLIC_HELLO_TEXT environment variable
      helloText: 'Hello World!',
      supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY,
        redirectOptions: {
          login: '/auth/login',
          callback: '/confirm',
          exclude: ['/auth/register', '/auth/reset-password'],
        },
      },
    },
  },
  // https://nuxt.com/docs/getting-started/upgrade#testing-nuxt-4
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2024-07-30',

  // https://hub.nuxt.com/docs/getting-started/installation#options
  hub: {
    // Your NuxtHub configuration
    domains: [
      // Add your custom domains here if you have any
      // 'your-domain.com'
    ],
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
