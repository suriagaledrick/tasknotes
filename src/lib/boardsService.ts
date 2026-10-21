import { db } from "@/lib/firebase";
import { Board, BoardColumn, Task } from "@/types/board";
import { isTrashExpired } from "@/lib/trashUtils";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  serverTimestamp,
} from "firebase/firestore";

export async function getUserBoards(userId: string): Promise<Board[]> {
  try {
    const boardsRef = collection(db, "users", userId, "boards");
    const snapshot = await getDocs(boardsRef);
    const rawBoards = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Board[];

    const boards: Board[] = [];
    const expiredBoardIds: string[] = [];

    // Auto-purge check: boards or tasks in trash > 15 days
    for (const board of rawBoards) {
      // 1. If entire board is trashed and expired
      if (board.isTrashed && board.trashedAt && isTrashExpired(board.trashedAt)) {
        expiredBoardIds.push(board.id);
        continue;
      }

      // 2. Check if individual tasks inside board columns are expired
      let hadExpiredTasks = false;
      const cleanedColumns = (board.columns || []).map((col) => {
        const remainingTasks = (col.tasks || []).filter((task) => {
          if (task.isTrashed && task.trashedAt && isTrashExpired(task.trashedAt)) {
            hadExpiredTasks = true;
            return false;
          }
          return true;
        });
        return { ...col, tasks: remainingTasks };
      });

      if (hadExpiredTasks) {
        // Save cleaned board in background
        updateBoard(userId, board.id, { columns: cleanedColumns }).catch((err) =>
          console.error("Error auto-purging expired tasks from board:", err)
        );
        boards.push({ ...board, columns: cleanedColumns });
      } else {
        boards.push(board);
      }
    }

    // Clean up expired boards
    if (expiredBoardIds.length > 0) {
      Promise.all(
        expiredBoardIds.map((id) =>
          deleteDoc(doc(db, "users", userId, "boards", id))
        )
      ).catch((err) =>
        console.error("Error auto-purging expired trash boards:", err)
      );
    }

    // Sort by order ascending if set, otherwise by createdAt descending
    boards.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;

      const aTime = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;
      const bTime = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;
      return bTime - aTime;
    });

    return boards;
  } catch (error) {
    console.error("Error fetching boards:", error);
    return [];
  }
}

export async function reorderBoards(
  userId: string,
  orderedBoardIds: string[]
): Promise<void> {
  try {
    const promises = orderedBoardIds.map((id, index) => {
      const boardRef = doc(db, "users", userId, "boards", id);
      return updateDoc(boardRef, { order: index, updatedAt: serverTimestamp() });
    });
    await Promise.all(promises);
  } catch (error) {
    console.error("Error reordering boards:", error);
  }
}

export async function createBoard(
  userId: string,
  title: string,
  description?: string
): Promise<string> {
  const defaultColumns: BoardColumn[] = [
    {
      id: `col-${Date.now()}-1`,
      title: "To Do",
      position: 0,
      tasks: [
        {
          id: `task-${Date.now()}-1`,
          title: "Welcome to your Kanban board!",
          description: "Click on this card to edit details, add due dates, or assign labels.",
          priority: "medium",
          labels: ["Personal"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    },
    {
      id: `col-${Date.now()}-2`,
      title: "In Progress",
      position: 1,
      tasks: [],
    },
    {
      id: `col-${Date.now()}-3`,
      title: "Review",
      position: 2,
      tasks: [],
    },
    {
      id: `col-${Date.now()}-4`,
      title: "Done",
      position: 3,
      tasks: [],
    },
  ];

  const boardsRef = collection(db, "users", userId, "boards");
  const docRef = await addDoc(boardsRef, {
    title: title || "New Board",
    description: description || "",
    columns: defaultColumns,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateBoard(
  userId: string,
  boardId: string,
  data: Partial<Omit<Board, "id">>
): Promise<void> {
  const boardRef = doc(db, "users", userId, "boards", boardId);
  await updateDoc(boardRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Move a board to Trash with 15-day timer.
 */
export async function moveBoardToTrash(userId: string, boardId: string): Promise<void> {
  const boardRef = doc(db, "users", userId, "boards", boardId);
  await updateDoc(boardRef, {
    isTrashed: true,
    trashedAt: new Date().toISOString(),
    isArchived: false,
    archivedAt: null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Restore a board from Trash.
 */
export async function restoreBoardFromTrash(userId: string, boardId: string): Promise<void> {
  const boardRef = doc(db, "users", userId, "boards", boardId);
  await updateDoc(boardRef, {
    isTrashed: false,
    trashedAt: null,
    isArchived: false,
    archivedAt: null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Archive a board.
 */
export async function archiveBoard(userId: string, boardId: string): Promise<void> {
  const boardRef = doc(db, "users", userId, "boards", boardId);
  await updateDoc(boardRef, {
    isArchived: true,
    archivedAt: new Date().toISOString(),
    isTrashed: false,
    trashedAt: null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Unarchive a board.
 */
export async function unarchiveBoard(userId: string, boardId: string): Promise<void> {
  const boardRef = doc(db, "users", userId, "boards", boardId);
  await updateDoc(boardRef, {
    isArchived: false,
    archivedAt: null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Permanently deletes a board immediately.
 */
export async function deleteBoard(userId: string, boardId: string): Promise<void> {
  const boardRef = doc(db, "users", userId, "boards", boardId);
  await deleteDoc(boardRef);
}

export const deleteBoardPermanently = deleteBoard;

/**
 * Moves a single task inside a board column into Trash.
 */
export async function moveTaskToTrash(
  userId: string,
  board: Board,
  taskId: string
): Promise<Board> {
  const updatedColumns = board.columns.map((col) => ({
    ...col,
    tasks: col.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            isTrashed: true,
            trashedAt: new Date().toISOString(),
            isArchived: false,
            archivedAt: null,
            columnId: col.id,
            columnTitle: col.title,
            boardId: board.id,
            boardTitle: board.title,
            updatedAt: new Date().toISOString(),
          }
        : task
    ),
  }));

  const updatedBoard: Board = { ...board, columns: updatedColumns };
  await updateBoard(userId, board.id, { columns: updatedColumns });
  return updatedBoard;
}

/**
 * Restores a task from Trash.
 */
export async function restoreTaskFromTrash(
  userId: string,
  board: Board,
  taskId: string
): Promise<Board> {
  const updatedColumns = board.columns.map((col) => ({
    ...col,
    tasks: col.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            isTrashed: false,
            trashedAt: null,
            isArchived: false,
            archivedAt: null,
            updatedAt: new Date().toISOString(),
          }
        : task
    ),
  }));

  const updatedBoard: Board = { ...board, columns: updatedColumns };
  await updateBoard(userId, board.id, { columns: updatedColumns });
  return updatedBoard;
}

/**
 * Archives a single task inside a board column.
 */
export async function archiveTask(
  userId: string,
  board: Board,
  taskId: string
): Promise<Board> {
  const updatedColumns = board.columns.map((col) => ({
    ...col,
    tasks: col.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            isArchived: true,
            archivedAt: new Date().toISOString(),
            isTrashed: false,
            trashedAt: null,
            columnId: col.id,
            columnTitle: col.title,
            boardId: board.id,
            boardTitle: board.title,
            updatedAt: new Date().toISOString(),
          }
        : task
    ),
  }));

  const updatedBoard: Board = { ...board, columns: updatedColumns };
  await updateBoard(userId, board.id, { columns: updatedColumns });
  return updatedBoard;
}

/**
 * Unarchives a task.
 */
export async function unarchiveTask(
  userId: string,
  board: Board,
  taskId: string
): Promise<Board> {
  const updatedColumns = board.columns.map((col) => ({
    ...col,
    tasks: col.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            isArchived: false,
            archivedAt: null,
            updatedAt: new Date().toISOString(),
          }
        : task
    ),
  }));

  const updatedBoard: Board = { ...board, columns: updatedColumns };
  await updateBoard(userId, board.id, { columns: updatedColumns });
  return updatedBoard;
}

/**
 * Permanently deletes a single task from a board column.
 */
export async function deleteTaskPermanently(
  userId: string,
  board: Board,
  taskId: string
): Promise<Board> {
  const updatedColumns = board.columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((t) => t.id !== taskId),
  }));

  const updatedBoard: Board = { ...board, columns: updatedColumns };
  await updateBoard(userId, board.id, { columns: updatedColumns });
  return updatedBoard;
}
