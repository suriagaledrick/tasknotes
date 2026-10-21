"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Note, NOTE_COLORS } from "@/types/note";
import { Board, Task, PRIORITY_CONFIG } from "@/types/board";
import {
  getUserNotes,
  restoreNoteFromTrash,
  deleteNotePermanently,
  emptyNotesTrash,
} from "@/lib/notesService";
import {
  getUserBoards,
  restoreBoardFromTrash,
  deleteBoardPermanently,
  restoreTaskFromTrash,
  deleteTaskPermanently,
  updateBoard,
} from "@/lib/boardsService";
import { getTrashRemainingDays, formatTrashedDate } from "@/lib/trashUtils";
import Link from "next/link";
import {
  Trash2,
  RotateCcw,
  Clock,
  AlertTriangle,
  Search,
  StickyNote,
  Kanban,
  FolderKanban,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Archive,
} from "lucide-react";

export default function TrashPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "notes" | "tasks" | "boards">("all");
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadTrashData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Auto-purge runs inside getUserNotes & getUserBoards for any item > 15 days old
      const [userNotes, userBoards] = await Promise.all([
        getUserNotes(user.uid),
        getUserBoards(user.uid),
      ]);
      setNotes(userNotes);
      setBoards(userBoards);
    } catch (err) {
      console.error("Failed to load trash:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTrashData();
    }
  }, [user]);

  // Extract trashed items
  const trashedNotes = notes.filter((n) => n.isTrashed);
  const trashedBoards = boards.filter((b) => b.isTrashed);

  // Extract all trashed tasks
  const trashedTasks: { task: Task; board: Board; columnTitle: string }[] = [];
  boards.forEach((board) => {
    board.columns?.forEach((col) => {
      col.tasks?.forEach((t) => {
        if (t.isTrashed) {
          trashedTasks.push({
            task: t,
            board,
            columnTitle: col.title,
          });
        }
      });
    });
  });

  const totalTrashCount = trashedNotes.length + trashedTasks.length + trashedBoards.length;

  // Restore Note
  const handleRestoreNote = async (noteId: string) => {
    if (!user) return;
    try {
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, isTrashed: false, trashedAt: null } : n))
      );
      await restoreNoteFromTrash(user.uid, noteId);
      showToast("Note restored to active notes");
    } catch (err) {
      console.error("Error restoring note:", err);
      await loadTrashData();
    }
  };

  // Delete Note Permanently
  const handlePermanentDeleteNote = async (noteId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to permanently delete this note? This cannot be undone.")) {
      return;
    }
    try {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      await deleteNotePermanently(user.uid, noteId);
      showToast("Note permanently deleted");
    } catch (err) {
      console.error("Error permanently deleting note:", err);
      await loadTrashData();
    }
  };

  // Restore Task
  const handleRestoreTask = async (board: Board, taskId: string) => {
    if (!user) return;
    try {
      const updated = await restoreTaskFromTrash(user.uid, board, taskId);
      setBoards((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      showToast("Task restored to board");
    } catch (err) {
      console.error("Error restoring task:", err);
      await loadTrashData();
    }
  };

  // Delete Task Permanently
  const handlePermanentDeleteTask = async (board: Board, taskId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to permanently delete this task? This cannot be undone.")) {
      return;
    }
    try {
      const updated = await deleteTaskPermanently(user.uid, board, taskId);
      setBoards((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      showToast("Task permanently deleted");
    } catch (err) {
      console.error("Error permanently deleting task:", err);
      await loadTrashData();
    }
  };

  // Restore Board
  const handleRestoreBoard = async (boardId: string) => {
    if (!user) return;
    try {
      setBoards((prev) =>
        prev.map((b) => (b.id === boardId ? { ...b, isTrashed: false, trashedAt: null } : b))
      );
      await restoreBoardFromTrash(user.uid, boardId);
      showToast("Board restored to workspace");
    } catch (err) {
      console.error("Error restoring board:", err);
      await loadTrashData();
    }
  };

  // Delete Board Permanently
  const handlePermanentDeleteBoard = async (boardId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to permanently delete this board and its contents? This cannot be undone.")) {
      return;
    }
    try {
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
      await deleteBoardPermanently(user.uid, boardId);
      showToast("Board permanently deleted");
    } catch (err) {
      console.error("Error permanently deleting board:", err);
      await loadTrashData();
    }
  };

  // Empty Entire Trash
  const handleEmptyTrash = async () => {
    if (!user || totalTrashCount === 0) return;
    if (
      !confirm(
        `Are you sure you want to permanently delete all ${totalTrashCount} items in Trash? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      // 1. Purge notes
      const noteIds = trashedNotes.map((n) => n.id);
      if (noteIds.length > 0) {
        await emptyNotesTrash(user.uid, noteIds);
      }

      // 2. Purge boards
      for (const board of trashedBoards) {
        await deleteBoardPermanently(user.uid, board.id);
      }

      // 3. Purge individual trashed tasks
      for (const board of boards) {
        if (board.isTrashed) continue;
        let hasTrashed = false;
        const cleanedCols = board.columns?.map((col) => {
          const remainingTasks = col.tasks?.filter((t) => !t.isTrashed) || [];
          if (remainingTasks.length !== col.tasks?.length) hasTrashed = true;
          return { ...col, tasks: remainingTasks };
        });
        if (hasTrashed && cleanedCols) {
          await updateBoard(user.uid, board.id, { columns: cleanedCols });
        }
      }

      showToast("Trash emptied completely");
      await loadTrashData();
    } catch (err) {
      console.error("Error emptying trash:", err);
      showToast("Failed to empty trash");
    } finally {
      setLoading(false);
    }
  };

  // Filter with search query
  const q = searchQuery.toLowerCase().trim();

  const filteredNotes = trashedNotes.filter((n) => {
    if (!q) return true;
    return n.title?.toLowerCase().includes(q) || n.previewText?.toLowerCase().includes(q);
  });

  const filteredTasks = trashedTasks.filter(({ task, board, columnTitle }) => {
    if (!q) return true;
    return (
      task.title?.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      board.title?.toLowerCase().includes(q) ||
      columnTitle?.toLowerCase().includes(q)
    );
  });

  const filteredBoards = trashedBoards.filter((b) => {
    if (!q) return true;
    return b.title?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q);
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-16">
        {/* Toast Alert */}
        {notification && (
          <div className="fixed top-16 right-4 z-50 flex items-center gap-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Trash</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Deleted items are saved here for 15 days before being deleted automatically.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/archive"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition shrink-0"
              title="View Archive"
            >
              <Archive className="w-3.5 h-3.5 text-gray-500" />
              <span>Archive</span>
            </Link>
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trash..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 15-Day Auto-Purge Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-xl shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                15-Day Automatic Deletion Policy
              </h3>
              <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
                All deleted notes, tasks, and boards are kept for 15 days from their deletion date, after which they are permanently removed.
              </p>
            </div>
          </div>

          {totalTrashCount > 0 && (
            <button
              type="button"
              onClick={handleEmptyTrash}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs transition cursor-pointer shrink-0"
              title="Permanently remove all items in trash"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Trash Now</span>
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-800 pb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "all"
                ? "bg-red-600 text-white shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <span>All Trash</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeTab === "all" ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"}`}>
              {totalTrashCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "notes"
                ? "bg-red-600 text-white shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Notes</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeTab === "notes" ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"}`}>
              {trashedNotes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "tasks"
                ? "bg-red-600 text-white shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Tasks</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeTab === "tasks" ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"}`}>
              {trashedTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("boards")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "boards"
                ? "bg-red-600 text-white shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Boards</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeTab === "boards" ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"}`}>
              {trashedBoards.length}
            </span>
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400">Loading trash bin...</div>
        ) : totalTrashCount === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-800 rounded-2xl p-14 text-center text-gray-500 dark:text-gray-400">
            <Trash2 className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">Trash is empty</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
              Any notes, Kanban tasks, or boards you move to trash will appear here and remain for 15 days before automatic permanent deletion.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Trashed Notes */}
            {(activeTab === "all" || activeTab === "notes") && filteredNotes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <StickyNote className="w-3.5 h-3.5 text-blue-500" />
                  <span>Notes in Trash ({filteredNotes.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNotes.map((note) => {
                    const daysLeft = getTrashRemainingDays(note.trashedAt);
                    const colorConfig = NOTE_COLORS.find((c) => c.id === note.color) || NOTE_COLORS[0];
                    return (
                      <div
                        key={note.id}
                        className={`rounded-xl border p-4 flex flex-col justify-between shadow-xs transition ${colorConfig.bgClass} ${colorConfig.darkBgClass} ${colorConfig.borderClass} ${colorConfig.darkBorderClass || "dark:border-gray-700"}`}
                      >
                        <div>
                          {/* Timer Badge */}
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                daysLeft <= 2
                                  ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {daysLeft <= 1 ? "Deletes today" : `${daysLeft} days left`}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {formatTrashedDate(note.trashedAt)}
                            </span>
                          </div>

                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 mb-1.5">
                            {note.title || "Untitled Note"}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed mb-4">
                            {note.previewText || "Empty note"}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleRestoreNote(note.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-2xs transition cursor-pointer"
                            title="Restore note"
                          >
                            <RotateCcw className="w-3 h-3 text-blue-500" />
                            <span>Restore</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermanentDeleteNote(note.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 transition cursor-pointer"
                            title="Delete forever"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete Forever</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trashed Tasks */}
            {(activeTab === "all" || activeTab === "tasks") && filteredTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Kanban className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Tasks in Trash ({filteredTasks.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTasks.map(({ task, board, columnTitle }) => {
                    const daysLeft = getTrashRemainingDays(task.trashedAt);
                    const priorityConfig = task.priority ? PRIORITY_CONFIG[task.priority] : null;
                    return (
                      <div
                        key={task.id}
                        className="bg-white dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          {/* Timer Badge & Origin */}
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                daysLeft <= 2
                                  ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {daysLeft <= 1 ? "Deletes today" : `${daysLeft} days left`}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {board.title} &gt; {columnTitle}
                            </span>
                          </div>

                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug mb-1">
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mb-3">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-2.5 mt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleRestoreTask(board, task.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition cursor-pointer"
                            title="Restore to board"
                          >
                            <RotateCcw className="w-3 h-3 text-blue-500" />
                            <span>Restore</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermanentDeleteTask(board, task.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 transition cursor-pointer"
                            title="Delete forever"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete Forever</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trashed Boards */}
            {(activeTab === "all" || activeTab === "boards") && filteredBoards.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <FolderKanban className="w-3.5 h-3.5 text-purple-500" />
                  <span>Boards in Trash ({filteredBoards.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBoards.map((board) => {
                    const daysLeft = getTrashRemainingDays(board.trashedAt);
                    const totalTasks = board.columns?.reduce((acc, col) => acc + (col.tasks?.length || 0), 0) || 0;
                    return (
                      <div
                        key={board.id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                daysLeft <= 2
                                  ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {daysLeft <= 1 ? "Deletes today" : `${daysLeft} days left`}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {formatTrashedDate(board.trashedAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mb-1.5">
                            <FolderKanban className="w-4 h-4 text-purple-500 shrink-0" />
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                              {board.title}
                            </h3>
                          </div>

                          {board.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                              {board.description}
                            </p>
                          )}

                          <div className="text-[11px] text-gray-400 flex items-center gap-3">
                            <span>{board.columns?.length || 0} lists</span>
                            <span>•</span>
                            <span>{totalTasks} cards</span>
                          </div>
                        </div>

                        <div className="pt-2.5 mt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleRestoreBoard(board.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition cursor-pointer"
                            title="Restore board"
                          >
                            <RotateCcw className="w-3 h-3 text-blue-500" />
                            <span>Restore</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermanentDeleteBoard(board.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 transition cursor-pointer"
                            title="Delete forever"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete Forever</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
