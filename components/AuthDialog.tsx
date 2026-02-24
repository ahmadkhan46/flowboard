'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment, FormEvent, useMemo, useState } from 'react'
import { useAuthStore } from '@/store/AuthStore'
import { useBoardStore } from '@/store/BoardStore'
import { useShallow } from 'zustand/react/shallow'
import toast from 'react-hot-toast'

type Props = {
  isOpen: boolean
  onClose: () => void
}

function AuthDialog({ isOpen, onClose }: Props) {
  const GUEST_MIGRATION_KEY = 'flowboard.guest.tasks.v1'
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signIn, signUp, isAuthActionLoading, isAnonymous] = useAuthStore(
    useShallow((state) => [
      state.signIn,
      state.signUp,
      state.isAuthActionLoading,
      state.isAnonymous,
    ])
  )
  const [board, addTask, getBoard] = useBoardStore(
    useShallow((state) => [state.board, state.addTask, state.getBoard])
  )

  const title = mode === 'signin' ? 'Sign in' : 'Create account'
  const submitLabel = mode === 'signin' ? 'Sign in' : 'Create account'
  const canSubmit = useMemo(() => {
    if (!email || !password) return false
    if (mode === 'signup' && !name.trim()) return false
    return password.length >= 8
  }, [email, mode, name, password])

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
  }

  const handleClose = () => {
    if (isAuthActionLoading) return
    onClose()
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const shouldMigrateGuest = isAnonymous

    if (shouldMigrateGuest) {
      const snapshot: Array<{
        title: string
        status: TypedColumn
        description?: string
        priority?: 'low' | 'medium' | 'high'
        image?: Image
      }> = []

      for (const [, column] of Array.from(board.columns.entries())) {
        for (const todo of column.todos) {
          snapshot.push({
            title: todo.title,
            status: todo.status,
            description: todo.description || '',
            priority: todo.priority || 'medium',
            image: todo.image,
          })
        }
      }

      if (snapshot.length > 0) {
        localStorage.setItem(GUEST_MIGRATION_KEY, JSON.stringify(snapshot))
      }
    }

    const ok =
      mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(name.trim(), email.trim(), password)

    if (ok) {
      if (shouldMigrateGuest) {
        try {
          const raw = localStorage.getItem(GUEST_MIGRATION_KEY)
          if (raw) {
            const snapshot = JSON.parse(raw) as Array<{
              title: string
              status: TypedColumn
              description?: string
              priority?: 'low' | 'medium' | 'high'
              image?: Image
            }>

            if (Array.isArray(snapshot) && snapshot.length > 0) {
              for (const task of snapshot) {
                await addTask(
                  task.title,
                  task.status,
                  null,
                  task.description || '',
                  task.priority || 'medium',
                  task.image
                )
              }
              await getBoard()
              toast.success(`Moved ${snapshot.length} guest task(s) to your account.`)
            }
          }
        } catch {
          toast.error('Signed in, but could not migrate some guest tasks.', {
            id: 'guest-migration-error',
          })
        } finally {
          localStorage.removeItem(GUEST_MIGRATION_KEY)
        }
      }

      resetForm()
      onClose()
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-40' onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-200'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-150'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-slate-900/55 backdrop-blur-[2px]' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-200'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-150'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel className='w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_30px_70px_rgba(15,23,42,0.35)]'>
                <Dialog.Title className='text-2xl font-semibold tracking-tight text-slate-900'>
                  {title}
                </Dialog.Title>
                <p className='text-sm text-slate-500 mt-1'>
                  Use your Appwrite auth account to access your board.
                </p>

                <div className='mt-4 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1'>
                  <button
                    type='button'
                    onClick={() => setMode('signin')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      mode === 'signin'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    Sign in
                  </button>
                  <button
                    type='button'
                    onClick={() => setMode('signup')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      mode === 'signup'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    Create account
                  </button>
                </div>

                <form onSubmit={handleSubmit} className='mt-5 space-y-3'>
                  {mode === 'signup' && (
                    <input
                      type='text'
                      placeholder='Full name'
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className='w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500'
                    />
                  )}
                  <input
                    type='email'
                    placeholder='Email address'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500'
                  />
                  <input
                    type='password'
                    placeholder='Password (min 8 chars)'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className='w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500'
                  />

                  <div className='flex items-center justify-end gap-2 pt-2'>
                    <button
                      type='button'
                      onClick={handleClose}
                      className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      disabled={!canSubmit || isAuthActionLoading}
                      className='rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-45'
                    >
                      {isAuthActionLoading ? 'Please wait...' : submitLabel}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default AuthDialog
