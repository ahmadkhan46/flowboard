'use client'

import { Toaster } from 'react-hot-toast'

function ToastProvider() {
  return (
    <Toaster
      position='top-right'
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '14px',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          background: '#ffffff',
          color: '#0f172a',
          boxShadow: '0 14px 30px rgba(15, 23, 42, 0.16)',
        },
      }}
    />
  )
}

export default ToastProvider
