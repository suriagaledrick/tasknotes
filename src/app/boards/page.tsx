"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Board, BoardColumn } from "@/types/board";
import {
  getUserBoards,
  createBoard,
  updateBoard,
  deleteBoard,
} from "@/lib/boardsService";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import { Kanban, Plus, Trash2, FolderKanban, Search, X } from "lucide-react";

export default function BoardsPage() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New board modal state
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [newBoardDesc, setNewBoardDesc] = useState("");

  const fetchBoards = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const userBoards = await getUserBoards(user.uid);
      if (userBoards.length === 0) {
        // Auto-create initial default board
        const newId = await createBoard(
          user.uid,
          "My First Board",
          "Manage and monitor your daily tasks"
        );
        const refreshed = await getUserBoards(user.uid);
        setBoards(refreshed);
        setSelectedBoardId(newId || refreshed[0]?.id || null);
      } else {
        setBoards(userBoards);
        if (!selectedBoardId || !userBoards.find((b) => b.id === selectedBoardId)) {
          setSelectedBoardId(userBoards[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading boards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBoards();
    }
  }, [user]);

  const activeBoard = boards.find((b) => b.id === selectedBoardId);

  // Handle Board update (columns / cards)
  const handleUpdateBoardColumns = async (updatedColumns: BoardColumn[]) => {
    if (!user || !activeBoard) return;
    try {
      await updateBoard(user.uid, activeBoard.id, {
        columns: updatedColumns,
      });
      setBoards((prev) =>
        prev.map((b) =>
          b.id === activeBoard.id ? { ...b, columns: updatedColumns } : b
        )
      );
    } catch (err) {
      console.error("Error updating board columns:", err);
    }
  };

  // Handle Create Board
  const handleCreateBoardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newBoardTitle.trim()) return;

    try {
      const newId = await createBoard(user.uid, newBoardTitle.trim(), newBoardDesc.trim());
      setNewBoardTitle("");
      setNewBoardDesc("");
      setIsNewBoardModalOpen(false);
      const updated = await getUserBoards(user.uid);
      setBoards(updated);
      setSelectedBoardId(newId);
    } catch (err) {
      console.error("Error creating board:", err);
    }
  };

  // Handle Delete Board
  const handleDeleteBoard = async (boardId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this board?")) return;
    try {
      await deleteBoard(user.uid, boardId);
      const updated = boards.filter((b) => b.id !== boardId);
      setBoards(updated);
      setSelectedBoardId(updated[0]?.id || null);
    } catch (err) {
      console.error("Error deleting board:", err);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        {/* Top Header & Board Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Kanban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {activeBoard?.title || "Task Boards"}
                </h1>
                {activeBoard && boards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteBoard(activeBoard.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-md transition"
                    title="Delete board"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activeBoard?.description || "Trello-style drag & drop task management"}
              </p>
            </div>
          </div>

          {/* Board Switcher Tabs & New Board button */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl">
              {boards.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBoardId(b.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    selectedBoardId === b.id
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs font-semibold"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {b.title}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsNewBoardModalOpen(true)}
              className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 rounded-xl shadow-xs transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> New Board
            </button>
          </div>
        </div>

        {/* Board Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : activeBoard ? (
          <KanbanBoard
            board={activeBoard}
            onUpdateBoard={handleUpdateBoardColumns}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400 dark:text-gray-500">
            <FolderKanban className="w-12 h-12 mb-2 text-gray-300 dark:text-gray-600" />
            <p className="font-semibold text-gray-700 dark:text-gray-200">No boards found</p>
            <button
              onClick={() => setIsNewBoardModalOpen(true)}
              className="mt-3 text-xs bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Create your first board
            </button>
          </div>
        )}

        {/* Create Board Modal */}
        {isNewBoardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Create New Board</h3>
                <button
                  onClick={() => setIsNewBoardModalOpen(false)}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateBoardSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Board Title *
                  </label>
                  <input
                    type="text"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    placeholder="e.g. Sprint Roadmap, Study Schedule..."
                    required
                    autoFocus
                    className="w-full text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 p-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newBoardDesc}
                    onChange={(e) => setNewBoardDesc(e.target.value)}
                    placeholder="Brief description of this board's goals..."
                    rows={2}
                    className="w-full text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 p-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewBoardModalOpen(false)}
                    className="text-xs text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-xs bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 shadow-xs"
                  >
                    Create Board
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
