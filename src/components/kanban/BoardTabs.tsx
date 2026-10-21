"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Board, BOARD_COLORS } from "@/types/board";
import { Plus, MoreHorizontal, Trash2, ArrowLeft, ArrowRight, Edit2, Check, Palette, Archive } from "lucide-react";

interface BoardTabsProps {
  boards: Board[];
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onReorderBoards: (newBoards: Board[]) => void;
  onNewBoard: () => void;
  onDeleteBoard: (boardId: string) => void;
  onArchiveBoard?: (boardId: string) => void;
  onUpdateBoardColor: (boardId: string, color: string) => void;
  onRenameBoard?: (boardId: string, newTitle: string) => void;
}

export default function BoardTabs({
  boards,
  selectedBoardId,
  onSelectBoard,
  onReorderBoards,
  onNewBoard,
  onDeleteBoard,
  onArchiveBoard,
  onUpdateBoardColor,
  onRenameBoard,
}: BoardTabsProps) {
  // Drag & drop reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Active 3-dot menu state and screen coordinates
  const [openMenuBoardId, setOpenMenuBoardId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Inline rename state
  const [renamingBoardId, setRenamingBoardId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  // Close 3-dot menu when clicking outside (ignoring clicks on the trigger button itself so it toggles cleanly)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        menuRef.current &&
        !menuRef.current.contains(target as Node) &&
        !target?.closest(`[data-menu-trigger="${openMenuBoardId}"]`)
      ) {
        setOpenMenuBoardId(null);
        setMenuPosition(null);
      }
    };
    if (openMenuBoardId) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [openMenuBoardId]);

  // Close menu on window scroll/resize
  useEffect(() => {
    const handleClose = () => {
      if (openMenuBoardId) {
        setOpenMenuBoardId(null);
        setMenuPosition(null);
      }
    };
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [openMenuBoardId]);

  // Focus input when inline renaming begins
  useEffect(() => {
    if (renamingBoardId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingBoardId]);

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${index}`);
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = Array.from(boards);
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    onReorderBoards(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Open 3-dot menu and compute screen coordinates
  const handleOpenMenu = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    if (openMenuBoardId === boardId) {
      setOpenMenuBoardId(null);
      setMenuPosition(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 224; // w-56 = 224px
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8));
    const top = rect.bottom + 6;

    setMenuPosition({ top, left });
    setOpenMenuBoardId(boardId);
  };

  // Move Board Left/Right via Buttons (for mobile or keyboard)
  const handleMoveBoard = (fromIndex: number, direction: "left" | "right") => {
    const toIndex = direction === "left" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= boards.length) return;

    const reordered = Array.from(boards);
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    onReorderBoards(reordered);
    setOpenMenuBoardId(null);
    setMenuPosition(null);
  };

  // Start Rename
  const handleStartRename = (board: Board) => {
    setRenamingBoardId(board.id);
    setRenameValue(board.title);
    setOpenMenuBoardId(null);
    setMenuPosition(null);
  };

  // Save Rename
  const handleSaveRename = (boardId: string) => {
    const trimmed = renameValue.trim();
    if (trimmed && onRenameBoard) {
      onRenameBoard(boardId, trimmed);
    }
    setRenamingBoardId(null);
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-full">
      {/* + Button for Adding New Board on the LEFT side */}
      <button
        type="button"
        onClick={onNewBoard}
        className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-100/90 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700 p-2 sm:px-2.5 sm:py-1.5 rounded-xl font-medium shadow-xs transition cursor-pointer shrink-0 border border-gray-200/50 dark:border-gray-700/50"
        title="Add New Board"
      >
        <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span className="hidden sm:inline font-medium">New Board</span>
      </button>

      {/* Tabs Container */}
      <div className="flex items-center gap-1 bg-gray-100/90 dark:bg-gray-800/80 p-1 rounded-xl">
        {boards.map((board, index) => {
          const isSelected = selectedBoardId === board.id;
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index && draggedIndex !== index;
          const boardColorConfig =
            BOARD_COLORS.find((c) => c.id === board.color) || BOARD_COLORS[0];
          const isRenaming = renamingBoardId === board.id;

          return (
            <div
              key={board.id}
              draggable={!isRenaming}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => {
                onSelectBoard(board.id);
                if (openMenuBoardId && openMenuBoardId !== board.id) {
                  setOpenMenuBoardId(null);
                  setMenuPosition(null);
                }
              }}
              onDoubleClick={() => handleStartRename(board)}
              className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-grab active:cursor-grabbing select-none shrink-0 ${
                isSelected
                  ? `bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs font-semibold ${boardColorConfig.activeBorder} border-b-2`
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-800"
              } ${isDragging ? "opacity-40 scale-95" : "opacity-100"} ${
                isDragOver ? "ring-2 ring-blue-500 ring-offset-1" : ""
              }`}
              title={`${board.title} (Drag to reorder, double click to rename)`}
            >
              {/* Colored Dot Indicator */}
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${boardColorConfig.dotColor} ${
                  isSelected ? "ring-2 ring-white dark:ring-gray-900 shadow-xs" : "opacity-80"
                }`}
              />

              {/* Board Title (or inline rename input) */}
              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleSaveRename(board.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveRename(board.id);
                    if (e.key === "Escape") setRenamingBoardId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border-b border-blue-500 text-xs font-semibold text-gray-900 dark:text-white outline-none w-24 p-0"
                />
              ) : (
                <span className="truncate max-w-[130px] sm:max-w-[170px]">{board.title}</span>
              )}

              {/* Three-Dot Menu Trigger - Only visible on current board */}
              {isSelected && (
                <button
                  type="button"
                  data-menu-trigger={board.id}
                  onClick={(e) => handleOpenMenu(e, board.id)}
                  className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition cursor-pointer"
                  title="Board options & customization"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Three-Dot Dropdown Menu Rendered via Portal to avoid stacking/clipping */}
      {openMenuBoardId && menuPosition && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
          className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-2.5 z-[9999] text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-100 cursor-default"
        >
          {(() => {
            const menuBoard = boards.find((b) => b.id === openMenuBoardId);
            const menuBoardIndex = boards.findIndex((b) => b.id === openMenuBoardId);
            if (!menuBoard || menuBoardIndex === -1) return null;

            return (
              <>
                {/* Menu Header with Title */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-1.5 px-0.5">
                  <span className="font-bold text-gray-800 dark:text-gray-100 truncate max-w-[140px]">
                    {menuBoard.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStartRename(menuBoard)}
                    className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded flex items-center gap-1 text-[11px] cursor-pointer"
                    title="Rename board"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Rename</span>
                  </button>
                </div>

                {/* Section 1: Color Customization */}
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 px-0.5">
                    <Palette className="w-3 h-3" />
                    <span>Tab Color</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 p-1 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-100 dark:border-gray-700/60">
                    {BOARD_COLORS.map((c) => {
                      const isCurrentColor = (menuBoard.color || "default") === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            onUpdateBoardColor(menuBoard.id, c.id);
                            setOpenMenuBoardId(null);
                            setMenuPosition(null);
                          }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer hover:scale-110 ${c.dotColor} ${
                            isCurrentColor
                              ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 shadow-xs"
                              : ""
                          }`}
                          title={c.name}
                        >
                          {isCurrentColor && <Check className="w-3 h-3 text-white drop-shadow" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Move Position (Left / Right) */}
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 px-0.5">
                    <span>Reorder Position</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={menuBoardIndex === 0}
                      onClick={() => handleMoveBoard(menuBoardIndex, "left")}
                      className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-[11px]"
                    >
                      <ArrowLeft className="w-3 h-3" /> Move Left
                    </button>
                    <button
                      type="button"
                      disabled={menuBoardIndex === boards.length - 1}
                      onClick={() => handleMoveBoard(menuBoardIndex, "right")}
                      className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-[11px]"
                    >
                      Move Right <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Section 3: Archive & Move to Trash */}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-1.5 space-y-1">
                  {onArchiveBoard && (
                    <button
                      type="button"
                      disabled={boards.length <= 1}
                      onClick={() => {
                        setOpenMenuBoardId(null);
                        setMenuPosition(null);
                        onArchiveBoard(menuBoard.id);
                      }}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-xs font-medium"
                      title={
                        boards.length <= 1
                          ? "Cannot archive your only remaining board"
                          : `Archive "${menuBoard.title}"`
                      }
                    >
                      <span className="flex items-center gap-1.5">
                        <Archive className="w-3.5 h-3.5 text-gray-500" />
                        <span>Archive Board</span>
                      </span>
                      {boards.length <= 1 && (
                        <span className="text-[10px] text-gray-400">(Only board)</span>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={boards.length <= 1}
                    onClick={() => {
                      setOpenMenuBoardId(null);
                      setMenuPosition(null);
                      onDeleteBoard(menuBoard.id);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-xs font-medium"
                    title={
                      boards.length <= 1
                        ? "Cannot delete your only remaining board"
                        : `Move "${menuBoard.title}" to Trash`
                    }
                  >
                    <span className="flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Move to Trash</span>
                    </span>
                    {boards.length <= 1 && (
                      <span className="text-[10px] text-gray-400">(Only board)</span>
                    )}
                  </button>
                </div>
              </>
            );
          })()}
        </div>,
        document.body
      )}
    </div>
  );
}
