"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserNotes } from "@/lib/notesService";
import { getUserBoards } from "@/lib/boardsService";
import { Note } from "@/types/note";
import { Task, Board } from "@/types/board";
import { Search, StickyNote, Kanban, Calendar, X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "notes" | "tasks">("all");
  const [notes, setNotes] = useState<Note[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userNotes, userBoards] = await Promise.all([
          getUserNotes(user.uid),
          getUserBoards(user.uid),
        ]);
        setNotes(userNotes);
        setBoards(userBoards);
      } catch (err) {
        console.error("Error loading search index:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, user]);

  // Extract all tasks with board and column metadata
  const allTasks: { task: Task; boardTitle: string; columnTitle: string }[] = [];
  boards.forEach((board) => {
    board.columns?.forEach((col) => {
      col.tasks?.forEach((t) => {
        allTasks.push({
          task: t,
          boardTitle: board.title,
          columnTitle: col.title,
        });
      });
    });
  });

  const q = query.trim().toLowerCase();

  const filteredNotes = notes.filter((n) => {
    if (!q) return false;
    return (
      n.title?.toLowerCase().includes(q) ||
      n.previewText?.toLowerCase().includes(q) ||
      n.content?.toLowerCase().includes(q)
    );
  });

  const filteredTasks = allTasks.filter(({ task, boardTitle }) => {
    if (!q) return false;
    return (
      task.title?.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      task.labels?.some((l) => l.toLowerCase().includes(q)) ||
      boardTitle?.toLowerCase().includes(q)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-3 sm:pt-20 p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-200 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, tasks, boards, or labels... (e.g. 'Meeting', 'Bug')"
            autoFocus
            className="w-full text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Esc
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 text-xs">
          <span className="text-gray-400 dark:text-gray-400 font-medium">Filter:</span>
          {(["all", "notes", "tasks"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-full capitalize font-medium transition ${
                filterType === type
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-xs">
              Indexing items...
            </div>
          ) : !query.trim() ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-xs">
              Type keywords above to search across your notes and tasks.
            </div>
          ) : filteredNotes.length === 0 && filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-xs">
              No notes or tasks found matching &quot;{query}&quot;.
            </div>
          ) : (
            <>
              {/* Notes Results */}
              {(filterType === "all" || filterType === "notes") && filteredNotes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Notes ({filteredNotes.length})</span>
                  </div>
                  {filteredNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => {
                        onClose();
                        router.push("/notes");
                      }}
                      className="p-3 bg-gray-50/70 dark:bg-gray-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700/80 rounded-xl transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">
                          {note.title || "Untitled Note"}
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                          {note.previewText || "No additional text content"}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks Results */}
              {(filterType === "all" || filterType === "tasks") && filteredTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 flex items-center gap-1.5">
                    <Kanban className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Kanban Tasks ({filteredTasks.length})</span>
                  </div>
                  {filteredTasks.map(({ task, boardTitle, columnTitle }) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        onClose();
                        router.push("/boards");
                      }}
                      className="p-3 bg-gray-50/70 dark:bg-gray-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700/80 rounded-xl transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">
                            {task.title}
                          </h4>
                          {task.priority && (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold">
                              {task.priority}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                          <span>Board: {boardTitle} ({columnTitle})</span>
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                              <Calendar className="w-2.5 h-2.5" /> {task.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer tip */}
        <div className="p-2.5 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400 dark:text-gray-500 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded font-mono text-[10px] text-gray-700 dark:text-gray-300">Esc</kbd> to close or click any item to jump directly to it
        </div>
      </div>
    </div>
  );
}
