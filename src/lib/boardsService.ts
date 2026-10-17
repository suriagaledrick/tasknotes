import { db } from "@/lib/firebase";
import { Board, BoardColumn, Task } from "@/types/board";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

export async function getUserBoards(userId: string): Promise<Board[]> {
  try {
    const boardsRef = collection(db, "users", userId, "boards");
    const q = query(boardsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Board[];
  } catch (error) {
    console.error("Error fetching boards:", error);
    return [];
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

export async function deleteBoard(userId: string, boardId: string): Promise<void> {
  const boardRef = doc(db, "users", userId, "boards", boardId);
  await deleteDoc(boardRef);
}
