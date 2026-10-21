import { db } from "@/lib/firebase";
import { Note, NoteColor } from "@/types/note";
import { isTrashExpired } from "@/lib/trashUtils";
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

    const notes: Note[] = [];
    const expiredTrashIds: string[] = [];

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const note = {
        id: docSnap.id,
        ...data,
      } as Note;

      // Check if note is trashed and expired (older than 15 days)
      if (note.isTrashed && note.trashedAt && isTrashExpired(note.trashedAt)) {
        expiredTrashIds.push(note.id);
        return; // Exclude from active / trashed list
      }

      notes.push(note);
    });

    // Asynchronously purge expired trash notes in background
    if (expiredTrashIds.length > 0) {
      Promise.all(
        expiredTrashIds.map((id) =>
          deleteDoc(doc(db, "users", userId, "notes", id))
        )
      ).catch((err) =>
        console.error("Error auto-purging expired trash notes:", err)
      );
    }

    return notes;
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
    isArchived?: boolean;
    isTrashed?: boolean;
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
    isArchived: data.isArchived || false,
    isTrashed: data.isTrashed || false,
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

/**
 * Moves a note to Archive.
 */
export async function archiveNote(userId: string, noteId: string): Promise<void> {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  await updateDoc(noteRef, {
    isArchived: true,
    archivedAt: new Date().toISOString(),
    isTrashed: false,
    trashedAt: null,
    isPinned: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Restores a note from Archive back to active notes.
 */
export async function unarchiveNote(userId: string, noteId: string): Promise<void> {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  await updateDoc(noteRef, {
    isArchived: false,
    archivedAt: null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Moves a note to Trash with a 15-day retention timer.
 */
export async function moveNoteToTrash(userId: string, noteId: string): Promise<void> {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  await updateDoc(noteRef, {
    isTrashed: true,
    trashedAt: new Date().toISOString(),
    isArchived: false,
    archivedAt: null,
    isPinned: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Restores a note from Trash back to active notes.
 */
export async function restoreNoteFromTrash(userId: string, noteId: string): Promise<void> {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  await updateDoc(noteRef, {
    isTrashed: false,
    trashedAt: null,
    isArchived: false,
    archivedAt: null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Permanently deletes a note immediately from Firestore.
 */
export async function deleteNote(userId: string, noteId: string): Promise<void> {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  await deleteDoc(noteRef);
}

export const deleteNotePermanently = deleteNote;

/**
 * Permanently deletes all specified trashed notes.
 */
export async function emptyNotesTrash(userId: string, noteIds: string[]): Promise<void> {
  if (noteIds.length === 0) return;
  await Promise.all(
    noteIds.map((id) => deleteDoc(doc(db, "users", userId, "notes", id)))
  );
}
