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
  reorderBoards,
} from "@/lib/boardsService";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import BoardTabs from "@/components/kanban/BoardTabs";
import BoardsSkeleton from "@/components/skeletons/BoardsSkeleton";
import { Kanban, FolderKanban, X } from "lucide-react";

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
    if (!user || boards.length <= 1) return;
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

  // Handle Reorder Boards
  const handleReorderBoards = async (newBoards: Board[]) => {
    setBoards(newBoards);
    if (!user) return;
    try {
      await reorderBoards(user.uid, newBoards.map((b) => b.id));
    } catch (err) {
      console.error("Error persisting board order:", err);
    }
  };

  // Handle Update Board Color
  const handleUpdateBoardColor = async (boardId: string, color: string) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, color } : b))
    );
    if (!user) return;
    try {
      await updateBoard(user.uid, boardId, { color });
    } catch (err) {
      console.error("Error updating board color:", err);
    }
  };

  // Handle Rename Board
  const handleRenameBoard = async (boardId: string, newTitle: string) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, title: newTitle } : b))
    );
    if (!user) return;
    try {
      await updateBoard(user.uid, boardId, { title: newTitle });
    } catch (err) {
      console.error("Error renaming board:", err);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100dvh-7rem)] sm:h-[calc(100dvh-6rem)]">
        {/* Top Header & Board Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <Kanban className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                {activeBoard?.title || "Task Boards"}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {activeBoard?.description || "Trello-style drag & drop task management"}
              </p>
            </div>
          </div>

          {/* Board Switcher Tabs & New Board button */}
          <div className="min-w-0">
            <BoardTabs
              boards={boards}
              selectedBoardId={selectedBoardId}
              onSelectBoard={(id) => setSelectedBoardId(id)}
              onReorderBoards={handleReorderBoards}
              onNewBoard={() => setIsNewBoardModalOpen(true)}
              onDeleteBoard={handleDeleteBoard}
              onUpdateBoardColor={handleUpdateBoardColor}
              onRenameBoard={handleRenameBoard}
            />
          </div>
        </div>

        {/* Board Content */}
        {loading ? (
          <BoardsSkeleton />
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
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-5 sm:p-6 max-h-[90dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200">
              {/* Mobile Drag Indicator */}
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-3 sm:hidden" />

              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Create New Board</h3>
                <button
                  onClick={() => setIsNewBoardModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
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
                    className="text-xs text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-xs bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 shadow-xs cursor-pointer"
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
