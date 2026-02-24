'use client'

import { useBoardStore } from '@/store/BoardStore'
import { useAuthStore } from '@/store/AuthStore'
import { useModalStore } from '@/store/ModalStore'
import React, { useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import Column from './Column'
import { useShallow } from 'zustand/react/shallow'
import TodoCard from './TodoCard'
import ExportImport from './ExportImport'

const COLUMN_IDS: TypedColumn[] = ['todo', 'inprogress', 'done']

const isTypedColumn = (value: string): value is TypedColumn =>
  COLUMN_IDS.includes(value as TypedColumn)

const idToColumnText: {
  [key in TypedColumn]: string;
} = {
  todo: 'To Do',
  inprogress: 'In Progress',
  done: 'Done',
}

function Board() {
  const [board, getBoard, setBoardState, updateTodoInDB] = useBoardStore(useShallow((state) =>[
    state.board,
    state.getBoard,
    state.setBoardState,
    state.updateTodoInDB,
    ]))
  const [userId, isAuthLoading] = useAuthStore(
    useShallow((state) => [state.userId, state.isLoading])
  )
  const [activeTask, setActiveTask] = React.useState<Todo | null>(null)
  const columns = Array.from(board.columns.entries())
  const totalTasks = columns.reduce((sum, [, column]) => sum + column.todos.length, 0)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  useEffect(() =>{
    if (!isAuthLoading && userId) {
      getBoard()
    }
  }, [getBoard, isAuthLoading, userId])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeId = String(active.id)
    
    for (const [, column] of Array.from(board.columns.entries())) {
      const task = column.todos.find((t) => t.$id === activeId)
      if (task) {
        setActiveTask(task)
        break
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId === overId) return

    const activeColumn = findTaskColumn(activeId)
    const overColumn = isTypedColumn(overId) ? overId : findTaskColumn(overId)

    if (!activeColumn || !overColumn || activeColumn === overColumn) return

    setBoardState({
      columns: moveBetweenColumns(
        board.columns,
        activeColumn,
        overColumn,
        activeId,
        overId
      ),
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    const activeColumn = findTaskColumn(activeId)
    const overColumn = isTypedColumn(overId) ? overId : findTaskColumn(overId)

    if (!activeColumn || !overColumn) return

    if (activeColumn === overColumn) {
      const column = board.columns.get(activeColumn)
      if (!column) return

      const oldIndex = column.todos.findIndex((t) => t.$id === activeId)
      const newIndex = column.todos.findIndex((t) => t.$id === overId)

      if (oldIndex !== newIndex) {
        const newTodos = arrayMove(column.todos, oldIndex, newIndex)
        const newColumns = new Map(board.columns)
        newColumns.set(activeColumn, { ...column, todos: newTodos })
        setBoardState({ columns: newColumns })
      }
    } else {
      const task = findTask(activeId)
      if (task && task.status !== overColumn) {
        updateTodoInDB(task, overColumn)
      }
    }
  }

  const findTaskColumn = (taskId: string): TypedColumn | null => {
    for (const [columnId, column] of Array.from(board.columns.entries())) {
      if (column.todos.some((t) => t.$id === taskId)) {
        return columnId
      }
    }
    return null
  }

  const findTask = (taskId: string): Todo | null => {
    for (const [, column] of Array.from(board.columns.entries())) {
      const task = column.todos.find((t) => t.$id === taskId)
      if (task) return task
    }
    return null
  }

  const moveBetweenColumns = (
    columns: Map<TypedColumn, Column>,
    activeColumn: TypedColumn,
    overColumn: TypedColumn,
    activeId: string,
    overId: string
  ): Map<TypedColumn, Column> => {
    const sourceColumn = columns.get(activeColumn)
    const destColumn = columns.get(overColumn)

    if (!sourceColumn || !destColumn) return columns

    const sourceItems = [...sourceColumn.todos]
    const destItems = [...destColumn.todos]
    const [movedItem] = sourceItems.splice(
      sourceItems.findIndex((t) => t.$id === activeId),
      1
    )

    if (!movedItem) return columns

    const overIndex = destItems.findIndex((t) => t.$id === overId)
    destItems.splice(
      overIndex === -1 ? destItems.length : overIndex,
      0,
      { ...movedItem, status: overColumn }
    )

    const newColumns = new Map(columns)
    newColumns.set(activeColumn, { ...sourceColumn, todos: sourceItems })
    newColumns.set(overColumn, { ...destColumn, todos: destItems })

    return newColumns
  }

  return (
     <DndContext 
       sensors={sensors} 
       onDragStart={handleDragStart}
       onDragOver={handleDragOver}
       onDragEnd={handleDragEnd}
     >
        <section className='max-w-[1200px] mx-auto px-4 md:px-6 mt-6 md:mt-10'>
          <div className='rounded-3xl border border-[var(--line-soft)] bg-white/65 backdrop-blur-md p-4 md:p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]'>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5'>
              <div>
                <h1 className='text-2xl font-bold tracking-tight'>Your Task Lanes</h1>
                <p className='text-sm text-[var(--text-muted)] mt-1'>
                  Drag cards between lanes to keep momentum.
                </p>
              </div>
              <div className='flex items-center gap-3'>
                <ExportImport />
                <div className='inline-flex items-center gap-2 rounded-2xl border border-[var(--line-soft)] bg-[var(--bg-muted)] px-4 py-2'>
                  <span className='text-sm text-[var(--text-muted)]'>Total Tasks</span>
                  <span className='text-lg font-semibold text-slate-900'>{totalTasks}</span>
                </div>
              </div>
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5'>
              {totalTasks === 0 ? (
                <div className='col-span-full text-center py-16'>
                  <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 mb-4'>
                    <svg className='w-8 h-8 text-cyan-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
                    </svg>
                  </div>
                  <h3 className='text-xl font-semibold text-slate-800 mb-2'>No tasks yet</h3>
                  <p className='text-slate-500 mb-6'>Start organizing your work by creating your first task</p>
                  <div className='flex flex-wrap justify-center gap-3'>
                    {columns.map(([id]) => (
                      <button
                        key={id}
                        onClick={() => {
                          useBoardStore.getState().setNewTaskType(id)
                          useModalStore.getState().openModal()
                        }}
                        className='inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-slate-700 transition-colors'
                      >
                        Add to {idToColumnText[id]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                columns.map(([id, column], index)=>(
                  <Column
                  key = {id}
                  id = {id}
                  todos = {column.todos}
                  animationDelayMs={index * 55}
                  />
                ))
              )}
            </div>
        </div>
      </section>
      <DragOverlay>
        {activeTask ? (
          <div className='rotate-3 opacity-80'>
            <TodoCard todo={activeTask} index={0} id={activeTask.status} dragDisabled />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default Board
