import { ID, databases, storage } from '@/appwrite';
import uploadImage from '@/lib/uploadImage';
import { getTodosGroupedByColumn } from '@/lib/getTodosGroupedByColumn';
import { Permission, Role } from 'appwrite';
import toast from 'react-hot-toast';
import { create } from 'zustand'
import { useAuthStore } from './AuthStore';

interface BoardState{
  board: Board;
  getBoard: () => Promise<void>;
  setBoardState: (board: Board) => void;
  updateTodoInDB: (todo: Todo, columnId: TypedColumn)=> Promise<void>
  editTask: (taskId: string, updates: Partial<Todo>) => Promise<void>;

  image: File | null;
  setImage: (image: File | null) => void;

  newTaskInput: string;
  setNewTaskInput: (input: string) => void;
  newTaskDescription: string;
  setNewTaskDescription: (description: string) => void;
  newTaskPriority: 'low' | 'medium' | 'high';
  setNewTaskPriority: (priority: 'low' | 'medium' | 'high') => void;

  newTaskType: TypedColumn;
  setNewTaskType: (columnId: TypedColumn) => void;

  addTask: (
    todo: string,
    columnId: TypedColumn,
    image?: File | null,
    description?: string,
    priority?: 'low' | 'medium' | 'high',
    imageRef?: Image,
  ) => Promise<void>;

  deleteTask: (taskIndex: number, todoId: Todo, id: TypedColumn) => Promise<void>;

  editingTask: Todo | null;
  setEditingTask: (task: Todo | null) => void;

  searchString: string;
  setSearchString:(searchString: string) => void;

}

const EMPTY_BOARD: Board = {
  columns: new Map<TypedColumn, Column>([
    ['todo', { id: 'todo', todos: [] }],
    ['inprogress', { id: 'inprogress', todos: [] }],
    ['done', { id: 'done', todos: [] }],
  ]),
}

const getUserScopedPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
]

const getImagePermissions = (userId: string) => [
  Permission.read(Role.any()),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
]

export const useBoardStore = create<BoardState>((set, get) => ({
  board: {
    columns: new Map<TypedColumn, Column>()
  },

  searchString: "",
  newTaskInput: '',
  newTaskDescription: '',
  newTaskPriority: 'medium',
  newTaskType: 'todo',
  image: null,
  editingTask: null,
  
  setSearchString: (searchString) => set({searchString}),
  setEditingTask: (task) => set({ editingTask: task }),
  setNewTaskDescription: (description) => set({ newTaskDescription: description }),
  setNewTaskPriority: (priority) => set({ newTaskPriority: priority }),

  getBoard: async() => {
    const userId = useAuthStore.getState().userId
    if (!userId) {
      set({ board: EMPTY_BOARD })
      return
    }

    try {
      const board = await getTodosGroupedByColumn(userId);
      set({ board })
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message: string }).message)
          : ''
      if (message.toLowerCase().includes('ownerid')) {
        toast.error('Missing ownerId column in Appwrite table. Add it as string and retry.', {
          id: 'board-ownerid-missing',
        })
      } else {
        toast.error('Failed to load tasks. Check Appwrite table permissions.', {
          id: 'board-load-error',
        })
      }
      set({ board: EMPTY_BOARD })
    }
  },
  setBoardState: (board) => set({ board }),

  deleteTask: async (taskIndex: number, todo: Todo, id: TypedColumn) =>{
    try {
      const newColumns = new Map(get().board.columns);
    //  delete todoID from new column
      newColumns.get(id)?.todos.splice(taskIndex,1)

      set({ board: { columns: newColumns } })

      if (todo.image) {
        await storage.deleteFile(todo.image.bucketID, todo.image.fieldID)
      }

      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
        todo.$id,
      )
      toast.success('Task deleted')
    } catch {
      toast.error('Could not delete task.', { id: 'task-delete-error' })
      get().getBoard()
    }
  },

  setNewTaskInput: (input: string) => set({ newTaskInput: input}),
  setNewTaskType: (columnId: TypedColumn) => set({newTaskType: columnId}),
  setImage: (image: File | null) => set({ image }),

  updateTodoInDB: async (todo, columnId) =>{
    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
        todo.$id,
        {
          title: todo.title,
          status: columnId,
        }
      )
    } catch {
      toast.error('Could not move task.', { id: 'task-move-error' })
      get().getBoard()
    }
  },

  editTask: async (taskId: string, updates: Partial<Todo>) => {
    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
        taskId,
        {
          ...(updates.title && { title: updates.title }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.priority && { priority: updates.priority }),
        }
      )
      
      const newColumns = new Map(get().board.columns)
      for (const [, column] of Array.from(newColumns.entries())) {
        const taskIndex = column.todos.findIndex(t => t.$id === taskId)
        if (taskIndex !== -1) {
          column.todos[taskIndex] = { ...column.todos[taskIndex], ...updates }
          break
        }
      }
      set({ board: { columns: newColumns } })
      toast.success('Task updated')
    } catch {
      toast.error('Could not update task.', { id: 'task-edit-error' })
      get().getBoard()
    }
  },

  addTask: async (
    todo: string,
    columnId: TypedColumn,
    image?: File | null,
    description?: string,
    priority?: 'low' | 'medium' | 'high',
    imageRef?: Image,
  ) =>{
    try {
      const userId = useAuthStore.getState().userId
      if (!userId) {
        toast.error('No active session. Please refresh and try again.', {
          id: 'task-session-error',
        })
        return
      }

      const permissions = getUserScopedPermissions(userId)
      const imagePermissions = getImagePermissions(userId)
      let file: Image | undefined = imageRef;
      
      if (image) {
        const fileUploaded = await uploadImage(image, imagePermissions);
        if (fileUploaded) {
          file = {
            bucketID: fileUploaded.bucketId,
            fieldID: fileUploaded.$id,
          }
        }
      }

      const taskDescription = description !== undefined ? description : get().newTaskDescription
      const taskPriority = priority !== undefined ? priority : get().newTaskPriority

      const { $id } = await databases.createDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
        ID.unique(),
        {
          title: todo,
          status: columnId,
          ownerId: userId,
          description: taskDescription || '',
          priority: taskPriority,
        ...(file && {image: JSON.stringify(file) }),
        },
        permissions
      );

      set ((state) => {
        const newColumns = new Map(state.board.columns)

        const newTodo: Todo = {
          $id,
          $createdAt: new Date().toISOString(),
          title: todo,
          status: columnId,
          ownerId: userId,
          description: taskDescription || '',
          priority: taskPriority,
          ...(file && {image: file}),
        }

        const column = newColumns.get(columnId)
        
        if (!column) {
          newColumns.set(columnId, {
            id: columnId,
            todos: [newTodo],
          });
        }else{
          newColumns.get(columnId)?.todos.push(newTodo)
        }

        return {
          board: {
            columns: newColumns,
          }
        }
      })

      set({ newTaskInput: '', newTaskDescription: '', newTaskPriority: 'medium' })
      toast.success('Task created')
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message: string }).message)
          : ''
      if (message.toLowerCase().includes('ownerid')) {
        toast.error('Missing ownerId column in Appwrite table. Add it as string and retry.', {
          id: 'task-ownerid-missing',
        })
      } else {
        toast.error('Could not create task. Check table and bucket permissions.', {
          id: 'task-create-error',
        })
      }
      get().getBoard()
    }

  }
}));
