'use client'

import { useBoardStore } from '@/store/BoardStore'
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useRef, useState } from 'react'
import toast from 'react-hot-toast'

export default function ExportImport() {
  const board = useBoardStore((state) => state.board)
  const addTask = useBoardStore((state) => state.addTask)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const parseAppwriteImageUrl = (rawUrl: string): Image | undefined => {
    if (!rawUrl) return undefined
    try {
      const url = new URL(rawUrl)
      const match = url.pathname.match(/\/storage\/buckets\/([^/]+)\/files\/([^/]+)/)
      if (!match) return undefined

      return {
        bucketID: decodeURIComponent(match[1]),
        fieldID: decodeURIComponent(match[2]),
      }
    } catch {
      return undefined
    }
  }

  const parseCSVLine = (line: string) => {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const next = line[i + 1]

      if (char === '"' && inQuotes && next === '"') {
        current += '"'
        i++
        continue
      }

      if (char === '"') {
        inQuotes = !inQuotes
        continue
      }

      if (char === ',' && !inQuotes) {
        values.push(current)
        current = ''
        continue
      }

      current += char
    }

    values.push(current)
    return values.map((value) => value.trim())
  }

  const handleExportCSV = () => {
    const rows = [['Title', 'Description', 'Status', 'Priority', 'Created Date', 'Image URL']]
    
    for (const [columnId, column] of Array.from(board.columns.entries())) {
      for (const todo of column.todos) {
        const imageUrl = todo.image 
          ? `https://cloud.appwrite.io/v1/storage/buckets/${todo.image.bucketID}/files/${todo.image.fieldID}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
          : ''
        
        rows.push([
          todo.title,
          todo.description || '',
          columnId,
          todo.priority || 'medium',
          new Date(todo.$createdAt).toLocaleDateString(),
          imageUrl,
        ])
      }
    }

    const csv = rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}`).join(',')
    ).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasks-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Tasks exported to CSV')
    setIsOpen(false)
  }

  const handleDownloadTemplate = () => {
    const template = [
      ['Title', 'Description', 'Status', 'Priority', 'Image URL'],
      ['Example: Design homepage', 'Create wireframes and mockups', 'todo', 'high', ''],
      ['Example: Setup database', 'Configure Appwrite collections', 'inprogress', 'medium', ''],
      ['Example: Write documentation', 'Add README with setup instructions', 'done', 'low', ''],
      ['', '', 'todo', 'medium', ''],
      ['', '', 'inprogress', 'medium', ''],
      ['', '', 'done', 'medium', ''],
    ]

    const csv = template.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tasks-template.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Template downloaded!')
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const csv = event.target?.result as string
        const lines = csv.split(/\r?\n/).filter(line => line.trim())
        
        if (lines.length < 2) {
          toast.error('CSV file is empty')
          return
        }

        const headers = parseCSVLine(lines[0]).map((header) => header.toLowerCase())
        const titleIndex = headers.indexOf('title')
        const descriptionIndex = headers.indexOf('description')
        const statusIndex = headers.indexOf('status')
        const priorityIndex = headers.indexOf('priority')
        const imageIndex = headers.findIndex((header) =>
          ['image url', 'image', 'imageurl'].includes(header),
        )

        if (titleIndex === -1 || statusIndex === -1) {
          toast.error('CSV must have Title and Status columns')
          return
        }

        let imported = 0
        for (let i = 1; i < lines.length; i++) {
          const row = parseCSVLine(lines[i])
          const title = (row[titleIndex] || '').trim()
          const description =
            descriptionIndex !== -1 ? (row[descriptionIndex] || '').trim() : ''
          const status = (row[statusIndex] || '').trim().toLowerCase()
          const priority =
            priorityIndex !== -1 ? (row[priorityIndex] || '').trim().toLowerCase() : ''
          const imageUrl = imageIndex !== -1 ? (row[imageIndex] || '').trim() : ''

          if (!title) continue

          const validStatus = ['todo', 'inprogress', 'done'].includes(status) 
            ? status as TypedColumn 
            : 'todo'

          const validPriority = ['low', 'medium', 'high'].includes(priority)
            ? priority as 'low' | 'medium' | 'high'
            : 'medium'

          const parsedImage = parseAppwriteImageUrl(imageUrl)

          await addTask(
            title,
            validStatus,
            null,
            description || '',
            validPriority,
            parsedImage,
          )
          imported++
        }

        toast.success(`Imported ${imported} tasks`)
        useBoardStore.getState().getBoard()
        setIsOpen(false)
      } catch (error) {
        console.error(error)
        toast.error('Failed to import CSV')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className='inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors'
      >
        <ArrowsRightLeftIcon className='h-4 w-4' />
        <span className='hidden sm:inline'>Import/Export</span>
      </button>

      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={() => setIsOpen(false)} className='relative z-50'>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-[2px]" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className='w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6'>
                <Dialog.Title className='text-2xl font-semibold text-slate-900 mb-2'>
                  Import / Export Tasks
                </Dialog.Title>
                <p className='text-sm text-slate-500 mb-6'>
                  Manage your tasks in bulk using CSV files
                </p>

                <div className='space-y-3'>
                  <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
                    <h3 className='font-semibold text-slate-900 mb-2 flex items-center gap-2'>
                      <svg className='h-5 w-5 text-green-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                      </svg>
                      Export Tasks
                    </h3>
                    <p className='text-sm text-slate-600 mb-3'>
                      Download all your tasks as a CSV file
                    </p>
                    <button
                      onClick={handleExportCSV}
                      className='w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2.5 text-sm font-semibold hover:from-green-500 hover:to-emerald-500 transition-all'
                    >
                      Export to CSV
                    </button>
                  </div>

                  <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
                    <h3 className='font-semibold text-slate-900 mb-2 flex items-center gap-2'>
                      <svg className='h-5 w-5 text-blue-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' />
                      </svg>
                      Import Tasks
                    </h3>
                    <p className='text-sm text-slate-600 mb-3'>
                      Upload a CSV file to add multiple tasks
                    </p>
                    <div className='space-y-2'>
                      <button
                        onClick={handleDownloadTemplate}
                        className='w-full rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 px-4 py-2.5 text-sm font-semibold hover:bg-blue-100 transition-all'
                      >
                        📋 Download Template First
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className='w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2.5 text-sm font-semibold hover:from-blue-500 hover:to-cyan-500 transition-all'
                      >
                        Upload CSV File
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className='w-full mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all'
                >
                  Close
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      <input
        ref={fileInputRef}
        type='file'
        accept='.csv'
        onChange={handleImportCSV}
        className='hidden'
      />
    </>
  )
}
