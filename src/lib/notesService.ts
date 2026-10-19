import { db } from "@/lib/firebase";
import { Note, NoteColor } from "@/types/note";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

export async function getUserNotes(userId: string): Promise<Note[]> {
  try {
    const notesRef = collection(db, "users", userId, "notes");
    const q = query(notesRef, orderBy("updatedAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Note[];
  } catch (error) {
    console.error("Error fetching notes:", error);
    return [];
  }
}

export async function createNote(
  userId: string,
  data: {
    title: string;
    content: string;
    previewText?: string;
    color?: NoteColor;
    columnCount?: 1 | 2 | 3;
    isPinned?: boolean;
    tags?: string[];
  }
): Promise<string> {
  const notesRef = collection(db, "users", userId, "notes");
  const docRef = await addDoc(notesRef, {
    title: data.title || "",
    content: data.content || "",
    previewText: data.previewText || "",
    color: data.color || "default",
    columnCount: data.columnCount || 1,
    isPinned: data.isPinned || false,
    tags: data.tags || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateNote(
  userId: string,
  noteId: string,
  data: Partial<Omit<Note, "id">>
): Promise<void> {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  await updateDoc(noteRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  await deleteDoc(noteRef);
}
