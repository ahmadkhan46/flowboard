import { account, ID } from '@/appwrite'
import { Models } from 'appwrite'
import toast from 'react-hot-toast'
import { create } from 'zustand'

interface AuthState {
  user: Models.User<Models.Preferences> | null
  userId: string | null
  isAnonymous: boolean
  isLoading: boolean
  isAuthActionLoading: boolean
  ensureSession: () => Promise<void>
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (name: string, email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
}

const getMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message: string }).message)
  }
  return fallback
}

const isActiveSessionError = (error: unknown) => {
  const message = getMessage(error, '').toLowerCase()
  return (
    message.includes('session is active') ||
    message.includes('session already exists')
  )
}

const isAnonymousProvider = (session: unknown) => {
  if (
    typeof session === 'object' &&
    session &&
    'provider' in session &&
    typeof (session as { provider: unknown }).provider === 'string'
  ) {
    return ((session as { provider: string }).provider || '').toLowerCase() === 'anonymous'
  }
  return false
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userId: null,
  isAnonymous: false,
  isLoading: true,
  isAuthActionLoading: false,
  ensureSession: async () => {
    set({ isLoading: true })
    try {
      const user = await account.get()
      let isAnonymous = false
      try {
        const session = await account.getSession('current')
        isAnonymous = isAnonymousProvider(session)
      } catch {
        isAnonymous = false
      }

      set({ user, userId: user.$id, isAnonymous, isLoading: false })
      return
    } catch {
      try {
        const session = await account.createAnonymousSession()

        // Some Appwrite auth setups may restrict account.get() for guest scopes.
        try {
          const user = await account.get()
          set({ user, userId: user.$id, isAnonymous: true, isLoading: false })
        } catch {
          set({ user: null, userId: session.userId, isAnonymous: true, isLoading: false })
        }
      } catch {
        toast.error(
          'Authentication failed. Enable Anonymous auth in Appwrite console.',
          { id: 'auth-error' }
        )
        set({ user: null, userId: null, isAnonymous: false, isLoading: false })
      }
    }
  },
  signIn: async (email, password) => {
    set({ isAuthActionLoading: true })
    try {
      await account.createEmailPasswordSession({ email, password })
      const user = await account.get()
      set({ user, userId: user.$id, isAnonymous: false, isAuthActionLoading: false })
      toast.success('Signed in successfully.')
      return true
    } catch (error) {
      if (isActiveSessionError(error)) {
        try {
          await account.deleteSession('current')
          await account.createEmailPasswordSession({ email, password })
          const user = await account.get()
          set({ user, userId: user.$id, isAnonymous: false, isAuthActionLoading: false })
          toast.success('Signed in successfully.')
          return true
        } catch (retryError) {
          toast.error(getMessage(retryError, 'Unable to sign in.'), {
            id: 'auth-signin-error',
          })
          set({ isAuthActionLoading: false })
          return false
        }
      }

      toast.error(getMessage(error, 'Unable to sign in.'), {
        id: 'auth-signin-error',
      })
      set({ isAuthActionLoading: false })
      return false
    }
  },
  signUp: async (name, email, password) => {
    set({ isAuthActionLoading: true })
    try {
      await account.deleteSession('current')
    } catch {
      // No active session to clear.
    }

    try {
      await account.create({
        userId: ID.unique(),
        email,
        password,
        name: name.trim() || undefined,
      })

      await account.createEmailPasswordSession({ email, password })
      const user = await account.get()
      set({ user, userId: user.$id, isAnonymous: false, isAuthActionLoading: false })
      toast.success('Account created and signed in.')
      return true
    } catch (error) {
      toast.error(getMessage(error, 'Unable to create account.'), {
        id: 'auth-signup-error',
      })
      set({ isAuthActionLoading: false })
      return false
    }
  },
  signOut: async () => {
    try {
      await account.deleteSession('current')
      toast.success('Signed out')
    } catch {
      toast.error('Unable to sign out right now.', { id: 'auth-signout-error' })
    } finally {
      set({ user: null, userId: null, isAnonymous: false })
      await get().ensureSession()
    }
  },
}))
