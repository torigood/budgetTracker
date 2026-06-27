import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import './index.css'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

// 다크모드 초기화 — 앱 기본값은 라이트 모드로 유지
const savedTheme = localStorage.getItem('theme')
const isDark = savedTheme === 'dark'
document.documentElement.classList.toggle('dark', isDark)

const iconHref = '/icons/logo_512.png'
const manifestHref = '/manifest.webmanifest'
const themeColor = isDark ? '#0d0d0d' : '#f5f6f8'

const favicon = document.getElementById('app-favicon') as HTMLLinkElement | null
if (favicon) favicon.href = iconHref

const appleTouchIcon = document.getElementById('app-apple-touch-icon') as HTMLLinkElement | null
if (appleTouchIcon) appleTouchIcon.href = iconHref

const manifest = document.getElementById('app-manifest') as HTMLLinkElement | null
if (manifest) manifest.href = manifestHref

const themeColorMeta = document.getElementById('app-theme-color') as HTMLMetaElement | null
if (themeColorMeta) themeColorMeta.setAttribute('content', themeColor)

const savedLang = (localStorage.getItem('lang') as 'ko' | 'en' | null) ?? 'ko'
document.documentElement.lang = savedLang

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  </StrictMode>,
)
