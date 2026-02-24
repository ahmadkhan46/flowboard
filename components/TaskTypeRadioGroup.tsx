const types = [
  {
    id: 'todo',
    name: 'Todo',
    description: 'A new task to be completed',
    color:'from-cyan-500 to-blue-600',
  },
  {
    id:'inprogress',
    name:'In Progress',
    description: 'A task that is currently being worked on',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id:'done',
    name:'Done',
    description: 'A task that has been completed',
    color: 'from-emerald-500 to-green-600',
  },
]

import { useBoardStore } from '@/store/BoardStore'
import { RadioGroup } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import React from 'react'
import { useShallow } from 'zustand/react/shallow'

function TaskTypeRadioGroup() {
  const [setNewTaskType, newTaskType] = useBoardStore(useShallow((state) => [
    state.setNewTaskType,
    state.newTaskType,
  ]))

  return (
    <div className='w-full py-5'>
      <div className='mx-auto w-full max-w-md'>
        <RadioGroup
        value={newTaskType}
        onChange={(e) => {
          setNewTaskType(e)
        }}
        >
          <div className='space-y-2.5'>
            {types.map((type) => (
              <RadioGroup.Option
              key={type.id}
              value={type.id}
              className={({ active, checked }) =>
              `${
                active ?
                'ring-2 ring-cyan-500/50 ring-offset-2'
                :''
              }
              ${
                checked ? 
                `text-white border-transparent bg-gradient-to-r ${type.color}`
                : 'bg-white border-slate-200 text-slate-800'
              }
              relative flex cursor-pointer rounded-xl border px-4 py-3 shadow-sm transition-all focus:outline-none`
              }
              >
              {({ checked}) => (
                <>
                   <div className='flex w-full items-center justify-between gap-3'>
                      <div className='text-sm'>
                        <RadioGroup.Label
                          as='p'
                          className={`font-semibold ${
                          checked ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {type.name}
                        </RadioGroup.Label>
                        <RadioGroup.Description
                          as='span'
                          className={`inline ${
                          checked ? 'text-white/90' : 'text-slate-500'
                        }`}
                        >
                        <span>{type.description}</span>
                      </RadioGroup.Description>
                  </div>
                  {checked && (
                    <div className='shrink-0 text-white'>
                      <CheckCircleIcon className='h-6 w-6' />
                  </div>
                )}
              </div>
            </>
           )}
          </RadioGroup.Option>
              ))}
            </div>
          </RadioGroup>
        </div>
      </div>
    )
}

export default TaskTypeRadioGroup
