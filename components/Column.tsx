import { PlusCircleIcon } from '@heroicons/react/24/solid'
import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TodoCard from './TodoCard'
import { useBoardStore } from '@/store/BoardStore'
import { useModalStore } from '@/store/ModalStore'
import { useShallow } from 'zustand/react/shallow'

type Props = {
    id: TypedColumn,
    todos: Todo[],
    animationDelayMs?: number,
}

const idToColumnText: {
    [key in TypedColumn]: string;
} = {
    todo: 'To Do',
    inprogress: 'In Progress',
    done: 'Done',
}
const idToTone: {
    [key in TypedColumn]: string;
} = {
    todo: 'from-cyan-500 to-blue-600',
    inprogress: 'from-amber-500 to-orange-500',
    done: 'from-emerald-500 to-green-600',
}

function Column({id, todos, animationDelayMs = 0}: Props) {
    const [searchString, setNewTaskType] = useBoardStore(useShallow((state) => [
        state.searchString,
        state.setNewTaskType,
    ]))
    const openModal = useModalStore((state) => state.openModal)
    const { setNodeRef, isOver } = useDroppable({
        id,
        disabled: Boolean(searchString),
    })
    const visibleTodos = !searchString
      ? todos
      : todos.filter((todo) =>
          todo.title.toLowerCase().includes(searchString.toLowerCase())
        )

    const handleAddTodo = () => {
        setNewTaskType(id)
        openModal()
    }

    return (
      <div
        className='min-w-[300px] sm:min-w-[340px] lg:min-w-0 lg:flex-1 fade-slide-up'
        style={{ animationDelay: `${animationDelayMs}ms` }}
      >
                <div
                    ref = {setNodeRef}
                    className={`rounded-3xl border border-[var(--line-soft)] p-3 md:p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition-all
                      ${isOver ? "bg-emerald-50 border-emerald-200": "bg-white/80"}`}
                >
                    <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center gap-2'>
                            <h2 className='flex items-center gap-2 font-bold text-xl'>
                            <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${idToTone[id]} pulse-soft`} />
                            {idToColumnText[id]}
                            </h2>
                            <span className='text-slate-500 px-2 py-1 rounded-full text-sm font-medium bg-slate-100'>
                                {visibleTodos.length}
                            </span>
                        </div>
                    </div>
                    <div className='h-1 bg-slate-100 rounded-full mb-3 overflow-hidden'>
                        <div 
                            className={`h-full bg-gradient-to-r ${idToTone[id]} transition-all duration-500`}
                            style={{ width: `${Math.min((visibleTodos.length / Math.max(todos.length, 1)) * 100, 100)}%` }}
                        />
                    </div>
                    {searchString && (
                        <p className='text-xs text-slate-500 mb-3'>
                            Drag is paused while search is active.
                        </p>
                    )}

                    <div className='space-y-2 min-h-[140px]'>
                        <SortableContext
                          items={visibleTodos.map((todo) => todo.$id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {visibleTodos.map((todo, index) =>(
                            <TodoCard
                              key={todo.$id}
                              todo={todo}
                              index={index}
                              id={id}
                              dragDisabled={Boolean(searchString)}
                            />
                          ))}
                        </SortableContext>
                        {visibleTodos.length === 0 && (
                            <div className='rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500'>
                                No tasks yet. Add one to get started.
                            </div>
                        )}

                        <div className='flex items-end justify-end pt-2'>
                            <button
                            onClick={handleAddTodo}
                            className='inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-3 py-2 text-sm font-medium hover:bg-slate-700 transition-colors'>
                                <PlusCircleIcon className='h-5 w-5' />
                                Add task
                            </button>
                        </div>
                    </div>
                </div>
      </div>
    )
}

export default Column
