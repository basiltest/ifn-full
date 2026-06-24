import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

// Holds the current Supabase session for the whole app. `loading` is true until the
// initial session check resolves, so guards do not flash before we know who you are.
// Also loads the caller's own profiles row (role drives admin UI, onboarded gates the app).
const AuthContext = createContext({ session: null, loading: true, profile: null, isAdmin: false, banned: false })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    // onAuthStateChange is the single source of truth. On init it emits an INITIAL_SESSION
    // event carrying the restored session AFTER the client has finished reading/refreshing it
    // from localStorage, then fires again on sign in, sign out, token refresh, and email
    // confirm. We clear `loading` on the first event (not on getSession) on purpose: a bare
    // getSession().then() could resolve null a tick before the stored session was ready, which
    // flipped loading=false with session=null and bounced every hard refresh of a deep route to
    // /login and then home. Reading the session off this event removes that race.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setLoading(false)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const uid = session?.user?.id
  const refreshProfile = useCallback(async () => {
    if (!uid) { setProfile(null); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    setProfile(data || null)
  }, [uid])

  // own profile row (RLS: read own). Role/onboarded here are display/routing only;
  // the server re-checks is_admin() inside every admin RPC.
  useEffect(() => {
    let active = true
    if (!uid) { setProfile(null); return }
    supabase.from('profiles').select('*').eq('id', uid).single().then(({ data }) => {
      if (active) setProfile(data || null)
    })
    return () => { active = false }
  }, [uid])

  return (
    <AuthContext.Provider
      value={{
        session, loading, profile, refreshProfile,
        isAdmin: profile?.role === 'admin',
        isMentor: profile?.role === 'mentor' || profile?.role === 'admin',
        banned: !!profile?.banned,
        restricted: !!profile?.restricted,
        onboarded: !!profile?.onboarded,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
