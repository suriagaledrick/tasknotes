"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Note, NOTE_COLORS } from "@/types/note";
import { Board, Task, PRIORITY_CONFIG } from "@/types/board";
import { getUserNotes, unarchiveNote, moveNoteToTrash } from "@/lib/notesService";
import {
  getUserBoards,
  unarchiveBoard,
  moveBoardToTrash,
  unarchiveTask,
  moveTaskToTrash,
} from "@/lib/boardsService";
import Link from "next/link";
import {
  Archive,
  RotateCcw,
  Trash2,
  Search,
  StickyNote,
  Kanban,
  Columns,
  Calendar,
  AlertCircle,
  FolderKanban,
  CheckCircle2,
} from "lucide-react";

export default function ArchivePage() {
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

  const loadArchiveData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [userNotes, userBoards] = await Promise.all([
        getUserNotes(user.uid),
        getUserBoards(user.uid),
      ]);
      setNotes(userNotes);
      setBoards(userBoards);
    } catch (err) {
      console.error("Failed to load archived items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadArchiveData();
    }
  }, [user]);

  // Extract archived items
  const archivedNotes = notes.filter((n) => n.isArchived && !n.isTrashed);

  const archivedBoards = boards.filter((b) => b.isArchived && !b.isTrashed);

  // Extract all archived tasks from all boards (including active or archived boards)
  const archivedTasks: { task: Task; board: Board; columnTitle: string }[] = [];
  boards.forEach((board) => {
    if (board.isTrashed) return;
    board.columns?.forEach((col) => {
      col.tasks?.forEach((t) => {
        if (t.isArchived && !t.isTrashed) {
          archivedTasks.push({
            task: t,
            board,
            columnTitle: col.title,
          });
        }
      });
    });
  });

  // Handle Unarchive Note
  const handleUnarchiveNote = async (noteId: string) => {
    if (!user) return;
    try {
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, isArchived: false, archivedAt: null } : n))
      );
      await unarchiveNote(user.uid, noteId);
      showToast("Note restored to active notes");
    } catch (err) {
      console.error("Error unarchiving note:", err);
      await loadArchiveData();
    }
  };

  // Handle Move Note to Trash
  const handleTrashNote = async (noteId: string) => {
    if (!user) return;
    try {
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, isTrashed: true, isArchived: false } : n))
      );
      await moveNoteToTrash(user.uid, noteId);
      showToast("Note moved to Trash (stored for 15 days)");
    } catch (err) {
      console.error("Error moving note to trash:", err);
      await loadArchiveData();
    }
  };

  // Handle Unarchive Task
  const handleUnarchiveTask = async (board: Board, taskId: string) => {
    if (!user) return;
    try {
      const updated = await unarchiveTask(user.uid, board, taskId);
      setBoards((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      showToast("Task restored to its Kanban board");
    } catch (err) {
      console.error("Error unarchiving task:", err);
      await loadArchiveData();
    }
  };

  // Handle Move Task to Trash
  const handleTrashTask = async (board: Board, taskId: string) => {
    if (!user) return;
    try {
      const updated = await moveTaskToTrash(user.uid, board, taskId);
      setBoards((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      showToast("Task moved to Trash (stored for 15 days)");
    } catch (err) {
      console.error("Error moving task to trash:", err);
      await loadArchiveData();
    }
  };

  // Handle Unarchive Board
  const handleUnarchiveBoard = async (boardId: string) => {
    if (!user) return;
    try {
      setBoards((prev) =>
        prev.map((b) => (b.id === boardId ? { ...b, isArchived: false, archivedAt: null } : b))
      );
      await unarchiveBoard(user.uid, boardId);
      showToast("Board restored to active workspace");
    } catch (err) {
      console.error("Error unarchiving board:", err);
      await loadArchiveData();
    }
  };

  // Handle Move Board to Trash
  const handleTrashBoard = async (boardId: string) => {
    if (!user) return;
    try {
      setBoards((prev) =>
        prev.map((b) => (b.id === boardId ? { ...b, isTrashed: true, isArchived: false } : b))
      );
      await moveBoardToTrash(user.uid, boardId);
      showToast("Board moved to Trash (stored for 15 days)");
    } catch (err) {
      console.error("Error moving board to trash:", err);
      await loadArchiveData();
    }
  };

  // Filter with search query
  const q = searchQuery.toLowerCase().trim();

  const filteredNotes = archivedNotes.filter((n) => {
    if (!q) return true;
    return n.title?.toLowerCase().includes(q) || n.previewText?.toLowerCase().includes(q);
  });

  const filteredTasks = archivedTasks.filter(({ task, board, columnTitle }) => {
    if (!q) return true;
    return (
      task.title?.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      board.title?.toLowerCase().includes(q) ||
      columnTitle?.toLowerCase().includes(q)
    );
  });

  const filteredBoards = archivedBoards.filter((b) => {
    if (!q) return true;
    return b.title?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q);
  });

  const totalArchivedCount = archivedNotes.length + archivedTasks.length + archivedBoards.length;

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
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Archive</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Archived notes, tasks, and boards are kept safe out of your main workspace. Unarchive anytime.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/trash"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition shrink-0"
              title="View Trash"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Trash</span>
            </Link>
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search archive..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-800 pb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "all"
                ? "bg-indigo-600 text-white shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <span>All Archived</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeTab === "all" ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"}`}>
              {totalArchivedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "notes"
                ? "bg-indigo-600 text-white shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Notes</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeTab === "notes" ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"}`}>
              {archivedNotes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "tasks"
                ? "bg-indigo-600 text-white shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Tasks</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeTab === "tasks" ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"}`}>
              {archivedTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("boards")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "boards"
                ? "bg-indigo-600 text-white shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Boards</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeTab === "boards" ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"}`}>
              {archivedBoards.length}
            </span>
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400">Loading archived items...</div>
        ) : totalArchivedCount === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-800 rounded-2xl p-14 text-center text-gray-500 dark:text-gray-400">
            <Archive className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">Archive is empty</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
              You can archive notes, Kanban tasks, or boards from their cards or menus to clear clutter without deleting them.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Archived Notes Section */}
            {(activeTab === "all" || activeTab === "notes") && filteredNotes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <StickyNote className="w-3.5 h-3.5 text-blue-500" />
                  <span>Archived Notes ({filteredNotes.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNotes.map((note) => {
                    const colorConfig = NOTE_COLORS.find((c) => c.id === note.color) || NOTE_COLORS[0];
                    return (
                      <div
                        key={note.id}
                        className={`rounded-xl border p-4 flex flex-col justify-between shadow-xs transition ${colorConfig.bgClass} ${colorConfig.darkBgClass} ${colorConfig.borderClass} ${colorConfig.darkBorderClass || "dark:border-gray-700"}`}
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 mb-1.5">
                            {note.title || "Untitled Note"}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-4 leading-relaxed mb-4">
                            {note.previewText || "Empty note"}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-gray-400">Archived</span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUnarchiveNote(note.id)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-2xs transition cursor-pointer"
                              title="Unarchive note"
                            >
                              <RotateCcw className="w-3 h-3 text-indigo-500" />
                              <span>Restore</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTrashNote(note.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                              title="Move to trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Archived Tasks Section */}
            {(activeTab === "all" || activeTab === "tasks") && filteredTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Kanban className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Archived Tasks ({filteredTasks.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTasks.map(({ task, board, columnTitle }) => {
                    const priorityConfig = task.priority ? PRIORITY_CONFIG[task.priority] : null;
                    return (
                      <div
                        key={task.id}
                        className="bg-white dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          {/* Board / Column origin badge */}
                          <div className="flex items-center justify-between gap-1 mb-2 text-[10px] text-gray-400 dark:text-gray-500">
                            <span className="truncate">
                              {board.title} &gt; {columnTitle}
                            </span>
                            {priorityConfig && (
                              <span
                                className={`font-semibold px-1.5 py-0.2 rounded border ${priorityConfig.bgClass} ${priorityConfig.textClass} ${priorityConfig.borderClass}`}
                              >
                                {priorityConfig.label}
                              </span>
                            )}
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

                        <div className="pt-2.5 mt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-2">
                          {task.dueDate ? (
                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Calendar className="w-3 h-3" />
                              {task.dueDate}
                            </span>
                          ) : (
                            <span />
                          )}

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUnarchiveTask(board, task.id)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition cursor-pointer"
                              title="Restore to board"
                            >
                              <RotateCcw className="w-3 h-3 text-indigo-500" />
                              <span>Restore</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTrashTask(board, task.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                              title="Move to trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Archived Boards Section */}
            {(activeTab === "all" || activeTab === "boards") && filteredBoards.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <FolderKanban className="w-3.5 h-3.5 text-purple-500" />
                  <span>Archived Boards ({filteredBoards.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBoards.map((board) => {
                    const totalTasks = board.columns?.reduce((acc, col) => acc + (col.tasks?.length || 0), 0) || 0;
                    return (
                      <div
                        key={board.id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between"
                      >
                        <div>
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

                        <div className="pt-2.5 mt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-gray-400">Archived Board</span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUnarchiveBoard(board.id)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition cursor-pointer"
                              title="Restore board"
                            >
                              <RotateCcw className="w-3 h-3 text-indigo-500" />
                              <span>Restore</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTrashBoard(board.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                              title="Move to trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
