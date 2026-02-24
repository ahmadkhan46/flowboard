"use client"

import React, { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import Avatar from 'react-avatar'
import { useBoardStore } from '@/store/BoardStore'
import { useAuthStore } from '@/store/AuthStore'
import { useShallow } from 'zustand/react/shallow'
import AuthDialog from './AuthDialog'

function Header() {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [searchString, setSearchString] = useBoardStore(useShallow((state) =>[
    state.searchString,
    state.setSearchString,
  ]))
  const [user, userId, signOut, isAuthActionLoading] = useAuthStore(
    useShallow((state) => [
      state.user,
      state.userId,
      state.signOut,
      state.isAuthActionLoading,
    ])
  )
  const isAnonymous = !user?.email

  return (
    <>
    <header className='sticky top-0 z-20'>
      <div className='mx-3 mt-3 md:mx-6'>
        <div className='fade-slide-up rounded-3xl border border-[var(--line-soft)] bg-white/78 backdrop-blur-xl shadow-[0_12px_35px_rgba(15,23,42,0.10)] px-4 py-3 md:px-6'>
          <div className='flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-6'>
            <div className='flex items-center gap-3 min-w-0'>
              <div className='rounded-2xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-blue)] p-2 shadow-md'>
                <svg
                  viewBox='0 0 24 24'
                  aria-hidden='true'
                  className='h-9 w-9 text-white'
                >
                  <rect x='3' y='4' width='18' height='16' rx='4' fill='currentColor' opacity='0.2' />
                  <rect x='7' y='7' width='4' height='10' rx='1.5' fill='currentColor' />
                  <rect x='13' y='7' width='4' height='6.5' rx='1.5' fill='currentColor' />
                </svg>
              </div>
              <div className='min-w-0'>
                <p className='text-2xl md:text-3xl font-bold tracking-tight leading-none'>
                  FlowBoard
                </p>
                <p className='text-xs md:text-sm text-[var(--text-muted)] mt-1'>
                  Plan. Prioritize. Finish.
                </p>
              </div>
            </div>

            <div className='flex items-center gap-4 lg:ml-auto w-full lg:w-auto'>
              <form
                onSubmit={(e) => e.preventDefault()}
                className='flex items-center gap-3 rounded-2xl border border-[var(--line-soft)] bg-[var(--bg-muted)] px-3 py-2.5 shadow-inner w-full lg:w-[460px] xl:w-[560px]'
              >
            <MagnifyingGlassIcon className='h-5 w-5 text-slate-400'/>
            <input
              type="text"
              placeholder='Search'
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
              className='w-full bg-transparent text-[15px] placeholder:text-slate-400 focus:outline-none' />
              </form>

              <div className='flex items-center gap-3 rounded-2xl border border-[var(--line-soft)] bg-white px-2.5 py-2 shadow-md'>
                <Avatar
                  name={user?.name || user?.email || `Guest ${userId?.slice(0, 6) ?? ''}`}
                  round
                  size='36'
                  color='#0f766e'
                />
                <div className='hidden sm:block leading-tight'>
                  <p className='text-sm font-semibold text-slate-800'>
                    {user?.name || (isAnonymous ? 'Guest session' : 'Signed in user')}
                  </p>
                  <p className='text-xs text-slate-500'>
                    ID: {userId ? `${userId.slice(0, 8)}...` : 'n/a'}
                  </p>
                </div>
                {isAnonymous ? (
                  <button
                    type='button'
                    onClick={() => setIsAuthDialogOpen(true)}
                    className='text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-3 py-2 transition-opacity hover:opacity-90'
                  >
                    Sign in
                  </button>
                ) : (
                  <button
                    type='button'
                    disabled={isAuthActionLoading}
                    onClick={() => signOut()}
                    className='text-xs font-medium rounded-xl border border-[var(--line-soft)] bg-slate-100 hover:bg-slate-200 px-3 py-2 transition-colors disabled:opacity-50'
                  >
                    Sign out
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    <AuthDialog
      isOpen={isAuthDialogOpen}
      onClose={() => setIsAuthDialogOpen(false)}
    />
    </>
  )
}

export default Header
