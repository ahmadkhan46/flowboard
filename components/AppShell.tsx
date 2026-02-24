'use client'

import Board from '@/components/Board'
import Header from '@/components/Header'
import Modal from '@/components/Modal'
import AuthDialog from '@/components/AuthDialog'
import { useAuthStore } from '@/store/AuthStore'
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

function AppShell() {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [userId, isLoading, ensureSession] = useAuthStore(
    useShallow((state) => [state.userId, state.isLoading, state.ensureSession])
  )

  useEffect(() => {
    ensureSession()
  }, [ensureSession])

  if (isLoading) {
    return (
      <main className='min-h-screen grid place-items-center px-6'>
        <div className='bg-white/80 backdrop-blur rounded-3xl border border-[var(--line-soft)] shadow-xl px-8 py-7 fade-slide-up'>
          <p className='text-[var(--text-muted)]'>Initializing your workspace...</p>
        </div>
      </main>
    )
  }

  if (!userId) {
    return (
      <main className='min-h-screen grid place-items-center px-6'>
        <div className='bg-white/90 backdrop-blur rounded-3xl p-8 border border-[var(--line-soft)] shadow-2xl max-w-md w-full text-center fade-slide-up'>
          <h1 className='text-xl font-semibold text-[var(--text-main)]'>Auth Required</h1>
          <p className='text-sm text-[var(--text-muted)] mt-2 leading-relaxed'>
            Could not create a guest session. Enable Anonymous auth in Appwrite
            or sign in with email/password.
          </p>
          <div className='mt-5 flex items-center justify-center gap-3'>
            <button
              type='button'
              onClick={() => setIsAuthDialogOpen(true)}
              className='rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-500 hover:to-blue-500'
            >
              Sign in
            </button>
            <button
              type='button'
              onClick={() => ensureSession()}
              className='rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'
            >
              Retry
            </button>
          </div>
        </div>
        <AuthDialog
          isOpen={isAuthDialogOpen}
          onClose={() => setIsAuthDialogOpen(false)}
        />
      </main>
    )
  }

  return (
    <main className='min-h-screen pb-12'>
      <Header />
      <Board />
      <Modal />
    </main>
  )
}

export default AppShell
