'use client'

import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export function SessionMonitor() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Polling interval in milliseconds (e.g., 15 seconds)
  const POLL_INTERVAL = 15000 

  useEffect(() => {
    // Only poll if we definitely have an authenticated session and we are not on auth pages
    if (status !== 'authenticated' || !session?.user) return
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) return

    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/check-session')
        
        if (!res.ok) {
           // We might get 401 if the cookie naturally expired
           if (res.status === 401) {
             console.log("[SessionMonitor] Auto-logout due to 401")
             await signOut({ callbackUrl: '/login' })
           }
           return
        }

        const data = await res.json()
        
        // If the server says our session is no longer the active one, boot us out
        if (data.valid === false) {
          console.log("[SessionMonitor] Session invalidated. Kicked by another login.")
          await signOut({ callbackUrl: '/login?kicked=true' })
        }
      } catch (error) {
        // Silently fail if network is down etc.
        console.error("[SessionMonitor] Error checking session", error)
      }
    }

    // Initial check after a short delay
    const initialTimeout = setTimeout(checkSession, 5000)
    
    // Set up the polling interval
    const intervalId = setInterval(checkSession, POLL_INTERVAL)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(intervalId)
    }
  }, [session, status, pathname])

  // This is purely a background worker component, nothing to render
  return null
}
