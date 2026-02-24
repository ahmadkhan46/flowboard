'use client'
import { useRef, Fragment, FormEvent, useEffect, useMemo, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useModalStore } from '@/store/ModalStore'
import { useBoardStore } from '@/store/BoardStore'
import TaskTypeRadioGroup from './TaskTypeRadioGroup'
import Image from 'next/image'
import { PhotoIcon } from '@heroicons/react/24/solid'
import { useShallow } from 'zustand/react/shallow'

function Modal() {
  const [addTask, editTask, image, setImage, newTaskInput, setNewTaskInput, newTaskDescription, setNewTaskDescription, newTaskPriority, setNewTaskPriority, newTaskType, editingTask, setEditingTask] = useBoardStore(useShallow((state) =>[
    state.addTask,
    state.editTask,
    state.image,
    state.setImage,
    state.newTaskInput,
    state.setNewTaskInput,
    state.newTaskDescription,
    state.setNewTaskDescription,
    state.newTaskPriority,
    state.setNewTaskPriority,
    state.newTaskType,
    state.editingTask,
    state.setEditingTask,
  ]))
  
  const [isOpen, closeModal] = useModalStore(useShallow((state) => [
    state.isOpen,
    state.closeModal
  ]))

  const imagePickerRef = useRef<HTMLInputElement>(null)
  const previewUrl = useMemo(() => (image ? URL.createObjectURL(image) : null), [image])

  useEffect(() => {
    if (editingTask) {
      setNewTaskInput(editingTask.title)
      setNewTaskDescription(editingTask.description || '')
      setNewTaskPriority(editingTask.priority || 'medium')
    }
  }, [editingTask, setNewTaskInput, setNewTaskDescription, setNewTaskPriority])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleClose = useCallback(() => {
    setEditingTask(null)
    setNewTaskInput('')
    setNewTaskDescription('')
    setNewTaskPriority('medium')
    setImage(null)
    closeModal()
  }, [closeModal, setEditingTask, setImage, setNewTaskDescription, setNewTaskInput, setNewTaskPriority])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [handleClose, isOpen])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) =>{
    e.preventDefault();
    if(!newTaskInput) return

    if (editingTask) {
      await editTask(editingTask.$id, {
        title: newTaskInput,
        description: newTaskDescription,
        priority: newTaskPriority,
      })
    } else {
      await addTask(newTaskInput, newTaskType, image)
    }
    
    setImage(null);
    handleClose()
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
      as='form'
      onSubmit={handleSubmit}
      className={'relative z-30'}
      onClose={handleClose}>
        
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

        <div className="fixed inset-0 overflow-y-auto">
          <div className='flex min-h-full items-center justify-center p-4 md:p-8 text-center'>
        
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className='w-full max-w-2xl transform overflow-hidden 
                  rounded-3xl border border-slate-200/80 bg-white p-5 md:p-7 text-left align-middle
                  shadow-[0_30px_70px_rgba(15,23,42,0.35)] transition-all'>
                <Dialog.Title
                  as='h3'
                  className='text-2xl font-semibold tracking-tight text-slate-900 pb-1'
                  >
                    {editingTask ? 'Edit Task' : 'Add a Task'}
                </Dialog.Title>
                <p className='text-sm text-slate-500 mb-4'>
                  {editingTask ? 'Update your task details.' : 'Capture what matters and route it to the right lane.'}
                </p>
                <div className='mt-2'>
                  <input
                  type='text'
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder='Enter a task here...'
                  className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-shadow'
                  />
                </div>

                <div className='mt-3'>
                  <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder='Add description (optional)...'
                  rows={3}
                  className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-shadow resize-none'
                  />
                </div>

                <div className='mt-3'>
                  <label className='text-sm font-medium text-slate-700 mb-2 block'>Priority</label>
                  <div className='flex gap-2'>
                    {(['low', 'medium', 'high'] as const).map((priority) => (
                      <button
                        key={priority}
                        type='button'
                        onClick={() => setNewTaskPriority(priority)}
                        className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                          newTaskPriority === priority
                            ? priority === 'high' ? 'bg-red-500 text-white' : priority === 'medium' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {!editingTask && <TaskTypeRadioGroup/>}
                  
                {!editingTask && (
                  <div className='mt-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3'>
                    <button
                    type='button'
                    onClick={() =>{
                      imagePickerRef.current?.click()
                    }}
                    className='w-full border border-dashed border-slate-300 rounded-xl outline-none px-4 py-4
                      text-slate-700 font-medium hover:bg-white transition-colors
                      focus-visible:ring-2 focus-visible:ring-cyan-500
                      focus-visible:ring-offset-2'
                    >
                      <PhotoIcon
                        className='h-5 w-5 mr-2 inline-block' />
                      Upload Image
                    </button>

                    {previewUrl && (
                      <Image
                        alt='Upload Image'
                        width={400}
                        height={176}
                        unoptimized
                        className='w-full h-48 object-cover mt-3 rounded-xl border border-slate-200 hover:opacity-85 transition-opacity cursor-pointer'
                        src={previewUrl}
                        onClick={() => {
                          setImage(null);
                        }}
                      />
                    ) }
                    
                    <input
                    type='file'
                    ref={imagePickerRef}
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file || !file.type.startsWith('image')) return;
                      setImage(file);
                    }}
                    />
                  </div>
                )}

                    <div className='mt-5 flex gap-3'>
                      <button
                      type='submit'
                      disabled={!newTaskInput}
                      className='inline-flex justify-center rounded-xl border border-transparent
                      bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-cyan-500 hover:to-blue-500
                      focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2
                      disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed'
                      >{editingTask ? 'Update Task' : 'Add Task'}
                      </button>
                      <button
                      type='button'
                      onClick={handleClose}
                      className='inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50'
                      >Cancel
                      </button>
                    </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
       </Dialog>
    </Transition>
  )
}

export default Modal
