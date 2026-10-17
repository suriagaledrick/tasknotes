"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Note, NoteColor } from "@/types/note";
import { getUserNotes, createNote, updateNote, deleteNote } from "@/lib/notesService";
import NoteCard from "@/components/notes/NoteCard";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { StickyNote, Plus, Search, Pin, X } from "lucide-react";

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Quick note creation expand state
  const [isCreating, setIsCreating] = useState(false);

  // Active note editing modal state
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Draft for creating a new note
  const [newNoteDraft, setNewNoteDraft] = useState<{
    title: string;
    content: string;
    previewText: string;
    color: NoteColor;
    columnCount: 1 | 2 | 3;
  }>({
    title: "",
    content: "",
    previewText: "",
    color: "default",
    columnCount: 1,
  });

  // Fetch notes
  const fetchNotes = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const userNotes = await getUserNotes(user.uid);
      setNotes(userNotes);
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  // Handle Create Note
  const handleSaveNewNote = async () => {
    if (!user) return;
    if (!newNoteDraft.title.trim() && !newNoteDraft.previewText.trim() && !newNoteDraft.content.trim()) {
      setIsCreating(false);
      return;
    }

    try {
      await createNote(user.uid, {
        title: newNoteDraft.title,
        content: newNoteDraft.content,
        previewText: newNoteDraft.previewText,
        color: newNoteDraft.color,
        columnCount: newNoteDraft.columnCount,
      });

      // Reset draft
      setNewNoteDraft({
        title: "",
        content: "",
        previewText: "",
        color: "default",
        columnCount: 1,
      });
      setIsCreating(false);
      await fetchNotes();
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  // Handle Update Note
  const handleUpdateNote = async (updatedData: {
    title: string;
    content: string;
    previewText: string;
    color: NoteColor;
    columnCount: 1 | 2 | 3;
  }) => {
    if (!user || !editingNote) return;

    try {
      await updateNote(user.uid, editingNote.id, updatedData);
      setEditingNote(null);
      await fetchNotes();
    } catch (err) {
      console.error("Failed to update note:", err);
    }
  };

  // Handle Toggle Pin
  const handleTogglePin = async (noteId: string, currentPin: boolean) => {
    if (!user) return;
    try {
      await updateNote(user.uid, noteId, { isPinned: !currentPin });
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, isPinned: !currentPin } : n))
      );
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  // Handle Change Color
  const handleChangeColor = async (noteId: string, color: NoteColor) => {
    if (!user) return;
    try {
      await updateNote(user.uid, noteId, { color });
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, color } : n))
      );
    } catch (err) {
      console.error("Failed to update color:", err);
    }
  };

  // Handle Delete Note
  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNote(user.uid, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (editingNote?.id === noteId) {
        setEditingNote(null);
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  // Filter notes by search query
  const filteredNotes = notes.filter((n) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title?.toLowerCase().includes(q) ||
      n.previewText?.toLowerCase().includes(q)
    );
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const otherNotes = filteredNotes.filter((n) => !n.isPinned);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <StickyNote className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notes & Notepad</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rich text, Docs/Word column layouts, and Google Keep color tags
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Quick Add Area (Google Keep style) */}
        <div className="max-w-2xl mx-auto">
          {!isCreating ? (
            <div
              onClick={() => setIsCreating(true)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3.5 shadow-sm hover:shadow transition cursor-pointer flex items-center justify-between text-gray-500 dark:text-gray-400"
            >
              <span className="text-sm font-medium">Take a note or start writing...</span>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Plus className="w-4 h-4" />
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  New Rich Text Note
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <RichTextEditor
                initialTitle={newNoteDraft.title}
                initialContent={newNoteDraft.content}
                initialColor={newNoteDraft.color}
                initialColumns={newNoteDraft.columnCount}
                onChange={(data) => setNewNoteDraft(data)}
                onSave={handleSaveNewNote}
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewNote}
                  className="px-5 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
                >
                  Save Note
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-xs text-gray-500 mt-3">Loading notes...</p>
          </div>
        ) : (
          <>
            {/* Pinned Notes Section */}
            {pinnedNotes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Pin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
                  <span>Pinned ({pinnedNotes.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onSelect={(n) => setEditingNote(n)}
                      onTogglePin={handleTogglePin}
                      onChangeColor={handleChangeColor}
                      onDelete={handleDeleteNote}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Notes Section */}
            <div className="space-y-3">
              {pinnedNotes.length > 0 && (
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <span>Others ({otherNotes.length})</span>
                </div>
              )}

              {otherNotes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {otherNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onSelect={(n) => setEditingNote(n)}
                      onTogglePin={handleTogglePin}
                      onChangeColor={handleChangeColor}
                      onDelete={handleDeleteNote}
                    />
                  ))}
                </div>
              ) : pinnedNotes.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-800 rounded-2xl p-12 text-center text-gray-500 dark:text-gray-400">
                  <StickyNote className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="font-semibold text-gray-700 dark:text-gray-200">No notes yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Click "Take a note" above to write with rich text, tables, and column styles!
                  </p>
                </div>
              ) : null}
            </div>
          </>
        )}

        {/* Edit Note Modal / Full View */}
        {editingNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
              <div className="sticky top-0 right-0 z-10 flex justify-end p-2 pointer-events-none">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="p-1.5 rounded-full bg-neutral-900/80 text-white hover:bg-neutral-900 pointer-events-auto transition"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <RichTextEditor
                initialTitle={editingNote.title}
                initialContent={editingNote.content}
                initialColor={editingNote.color}
                initialColumns={editingNote.columnCount}
                onSave={handleUpdateNote}
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
