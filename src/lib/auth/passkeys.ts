import { supabase } from '@/lib/supabase'

export const passkeysEnabled = import.meta.env.VITE_ENABLE_PASSKEYS === 'true'

export function isWebAuthnSupported() {
  return typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined' && window.isSecureContext
}

export function getPasskeySupportMessage(lang: 'ko' | 'en') {
  if (!passkeysEnabled) {
    return lang === 'ko'
      ? 'Passkey 기능은 아직 설정되지 않았어요. 환경 변수와 Supabase Passkeys 설정을 먼저 켜주세요.'
      : 'Passkeys are not enabled yet. Turn on the environment flag and Supabase Passkeys first.'
  }

  if (!isWebAuthnSupported()) {
    return lang === 'ko'
      ? '이 브라우저 또는 현재 연결에서는 기기 인증을 사용할 수 없어요. HTTPS 또는 localhost에서 다시 시도해주세요.'
      : 'This browser or connection cannot use device authentication. Try again on HTTPS or localhost.'
  }

  return null
}

// Passkey API는 아직 실험 기능이라 supabase-js 타입에 없음 — 런타임 존재 여부로 확인
type PasskeyAuth = typeof supabase.auth & {
  signInWithPasskey?: () => Promise<{ error?: unknown }>
  registerPasskey?: () => Promise<{ error?: unknown }>
}

export async function signInWithPasskey() {
  const auth = supabase.auth as PasskeyAuth
  if (typeof auth.signInWithPasskey !== 'function') {
    throw new Error('Passkey sign-in is not available in this Supabase client version.')
  }

  return auth.signInWithPasskey()
}

export async function registerPasskey() {
  const auth = supabase.auth as PasskeyAuth
  if (typeof auth.registerPasskey !== 'function') {
    throw new Error('Passkey registration is not available in this Supabase client version.')
  }

  return auth.registerPasskey()
}
