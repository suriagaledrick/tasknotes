import { Note } from "@/types/note";
import { Board, Task } from "@/types/board";
import { createNote, deleteNote } from "@/lib/notesService";
import { updateBoard } from "@/lib/boardsService";

export async function moveNoteToTask(
  userId: string,
  note: Note,
  board: Board,
  targetColId: string,
  dueDate?: string
): Promise<{ updatedBoard: Board }> {
  const newTask: Task = {
    id: `task-${Date.now()}`,
    title: note.title || (note.previewText ? note.previewText.slice(0, 50) : "Untitled Task"),
    description: note.previewText || note.content || "",
    dueDate: dueDate || "",
    priority: "medium",
    labels: note.tags && note.tags.length > 0 ? note.tags : ["From Notes"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const newColumns = board.columns.map((col) => {
    if (col.id === targetColId) {
      return {
        ...col,
        tasks: [...col.tasks, newTask],
      };
    }
    return col;
  });

  const updatedBoard: Board = {
    ...board,
    columns: newColumns,
  };

  // 1. Update Board with new task
  await updateBoard(userId, board.id, { columns: newColumns });

  // 2. Option 2: Remove source Note
  await deleteNote(userId, note.id);

  return { updatedBoard };
}

export async function moveTaskToNote(
  userId: string,
  task: Task,
  board: Board,
  sourceColId: string
): Promise<{ updatedBoard: Board; newNoteId: string }> {
  // 1. Create Note from Task
  const newNoteId = await createNote(userId, {
    title: task.title,
    content: task.description ? `<p>${task.description.replace(/\n/g, "<br>")}</p>` : `<p>${task.title}</p>`,
    previewText: task.description || task.title,
    color: "default",
    columnCount: 1,
    tags: task.labels || [],
  });

  // 2. Remove Task from Board column
  const newColumns = board.columns.map((col) => {
    if (col.id === sourceColId) {
      return {
        ...col,
        tasks: col.tasks.filter((t) => t.id !== task.id),
      };
    }
    return col;
  });

  const updatedBoard: Board = {
    ...board,
    columns: newColumns,
  };

  await updateBoard(userId, board.id, { columns: newColumns });

  return { updatedBoard, newNoteId };
}

export async function scheduleTaskOnDate(
  userId: string,
  board: Board,
  taskId: string,
  dateStr: string
): Promise<{ updatedBoard: Board }> {
  const newColumns = board.columns.map((col) => ({
    ...col,
    tasks: col.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            dueDate: dateStr,
            updatedAt: new Date().toISOString(),
          }
        : t
    ),
  }));

  const updatedBoard: Board = {
    ...board,
    columns: newColumns,
  };

  await updateBoard(userId, board.id, { columns: newColumns });

  return { updatedBoard };
}
