interface Board {
    columns: Map<TypedColumn, Column>
}

type TypedColumn = 'todo' | "inprogress" | "done"

interface Column {
    id: TypedColumn
    todos: Todo[]
}

interface Todo {
    $id: string
    $createdAt: string
    title: string
    status: TypedColumn;
    ownerId?: string;
    image?: Image;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
}

interface Image {
    bucketID: string
    fieldID: string
}
