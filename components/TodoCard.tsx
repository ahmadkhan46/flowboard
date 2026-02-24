'use client'

import getUrl from '@/lib/getUrl';
import { useBoardStore } from '@/store/BoardStore';
import { useModalStore } from '@/store/ModalStore';
import { XCircleIcon, PencilIcon } from '@heroicons/react/24/solid';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

type Props = {
    todo: Todo;
    index: number;
    id: TypedColumn
    dragDisabled?: boolean;
};

const priorityColors = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-red-100 text-red-700 border-red-200',
}

function TodoCard({todo, index, id, dragDisabled = false
}: Props){
  const [deleteTask, setEditingTask] = useBoardStore(useShallow((state) => [state.deleteTask, state.setEditingTask]))
  const openModal = useModalStore((state) => state.openModal)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: todo.$id,
      data: {
        todo,
        columnId: id,
        index,
      },
      disabled: dragDisabled,
    })
  const createdAt = new Date(todo.$createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })

  useEffect(() => {
    if(todo.image) {
      const fetchImage = async () =>{
        const url = await getUrl(todo.image!)
        if (url) {
          setImageUrl(url.toString())
        }
      }
      fetchImage()
    }
  }, [todo])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTask(todo)
    openModal()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      setTimeout(() => setShowDeleteConfirm(false), 3000)
    } else {
      deleteTask(index, todo, id)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div
    className={`group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-xl ring-2 ring-cyan-300/50' : ''}`}
    {...attributes}
    {...listeners}
    ref={setNodeRef}
    style={style}
    >
        <div className='flex justify-between items-start p-4'>
          <div className='pr-3 flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-2'>
              {todo.priority && (
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${priorityColors[todo.priority]}`}>
                  {todo.priority}
                </span>
              )}
              <p className='text-xs text-slate-500'>Created {createdAt}</p>
            </div>
            <p className='text-[15px] font-medium text-slate-800 leading-snug break-words'>
              {todo.title}
            </p>
            {todo.description && (
              <p className='text-sm text-slate-600 mt-2 line-clamp-2'>
                {todo.description}
              </p>
            )}
          </div>
          <div className='flex gap-1 shrink-0'>
            <button 
              type='button'
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleEdit}
              className='text-slate-400 hover:text-blue-600 transition-colors'>
                <PencilIcon className='h-5 w-5' />
            </button>
            <button 
              type='button'
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleDelete}
              className={`transition-colors ${showDeleteConfirm ? 'text-rose-600 animate-pulse' : 'text-slate-400 hover:text-rose-600'}`}>
                <XCircleIcon className='h-6 w-6' />
            </button>
          </div>
        </div>

        {imageUrl && (
          <div className='h-full w-full border-t border-slate-100'>
            <Image
              src={imageUrl}
              alt='Task Image'
              width={400}
              height={200}
              unoptimized
              className='w-full h-44 object-cover group-hover:scale-[1.01] transition-transform'
            />
          </div>
        )}
        {showDeleteConfirm && (
          <div className='bg-rose-50 border-t border-rose-200 px-4 py-2 text-xs text-rose-700 text-center'>
            Click again to confirm delete
          </div>
        )}
    </div>
  )
}
export default TodoCard
