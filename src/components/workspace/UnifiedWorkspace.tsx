"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useAuth } from "@/contexts/AuthContext";
import { Note } from "@/types/note";
import { Board, BoardColumn, Task } from "@/types/board";
import { getUserNotes, createNote, updateNote, deleteNote } from "@/lib/notesService";
import { getUserBoards, createBoard, updateBoard, deleteBoard } from "@/lib/boardsService";
import {
  moveNoteToTask,
  moveTaskToNote,
  scheduleTaskOnDate,
} from "@/lib/workspaceConverter";
import WorkspaceNotesPane from "./WorkspaceNotesPane";
import WorkspaceCalendarPane from "./WorkspaceCalendarPane";
import TaskCard from "@/components/kanban/TaskCard";
import TaskModal from "@/components/kanban/TaskModal";
import RichTextEditor from "@/components/editor/RichTextEditor";
import {
  Kanban,
  Plus,
  MoreHorizontal,
  Trash2,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";

export default function UnifiedWorkspace() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Pane toggle states
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Active editing modal states
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Quick card add state in center Kanban
  const [addingToColId, setAddingToColId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");

  // Add column state
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");
  const [openColMenuId, setOpenColMenuId] = useState<string | null>(null);

  // New board modal state
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [newBoardDesc, setNewBoardDesc] = useState("");
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);

  // Load all user data
  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [userNotes, userBoards] = await Promise.all([
        getUserNotes(user.uid),
        getUserBoards(user.uid),
      ]);
      setNotes(userNotes);

      if (userBoards.length === 0) {
        const newId = await createBoard(
          user.uid,
          "Main Workflow",
          "All-in-one productivity & task management"
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
      console.error("Error loading workspace data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const activeBoard = boards.find((b) => b.id === selectedBoardId) || boards[0];

  // Collect scheduled tasks for calendar pane
  const allScheduledTasks: { task: Task; boardTitle: string; columnTitle: string }[] = [];
  boards.forEach((board) => {
    board.columns?.forEach((col) => {
      col.tasks?.forEach((task) => {
        if (task.dueDate) {
          allScheduledTasks.push({
            task,
            boardTitle: board.title,
            columnTitle: col.title,
          });
        }
      });
    });
  });

  // Universal Drag & Drop Coordinator (Instant Zero-Lag Optimistic Updates)
  const handleUniversalDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || !user || !activeBoard) return;

    // Check if dropped in same spot
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const isFromNotes = source.droppableId === "droppable-notes";
    const isToNotes = destination.droppableId === "droppable-notes";
    const isFromKanban = source.droppableId.startsWith("col-");
    const isToKanban = destination.droppableId.startsWith("col-");
    const isToCalendar = destination.droppableId.startsWith("cal-day-");

    // ==========================================
    // CASE 0: Reorder within Notes List
    // ==========================================
    if (isFromNotes && isToNotes) {
      const newNotes = Array.from(notes);
      const [movedNote] = newNotes.splice(source.index, 1);
      newNotes.splice(destination.index, 0, movedNote);
      setNotes(newNotes);
      return;
    }

    // ==========================================
    // CASE 1: Note -> Kanban Column (Option 2: Move)
    // ==========================================
    if (isFromNotes && isToKanban) {
      const noteId = draggableId.replace("note-", "");
      const targetNote = notes.find((n) => n.id === noteId);
      if (!targetNote) return;

      const targetColId = destination.droppableId;
      const targetColIndex = activeBoard.columns.findIndex((c) => c.id === targetColId);
      if (targetColIndex === -1) return;

      // 1. Prepare new Task
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: targetNote.title || (targetNote.previewText ? targetNote.previewText.slice(0, 50) : "Untitled Task"),
        description: targetNote.previewText || targetNote.content || "",
        dueDate: "",
        priority: "medium",
        labels: targetNote.tags && targetNote.tags.length > 0 ? targetNote.tags : ["From Notes"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 2. Insert into the target column at destination.index
      const targetCol = activeBoard.columns[targetColIndex];
      const newTasks = Array.from(targetCol.tasks);
      newTasks.splice(destination.index, 0, newTask);

      const newColumns = activeBoard.columns.map((col, idx) =>
        idx === targetColIndex ? { ...col, tasks: newTasks } : col
      );
      const updatedBoard: Board = { ...activeBoard, columns: newColumns };

      // 3. SYNCHRONOUS OPTIMISTIC UPDATE: note removed AND task added in same frame
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setBoards((prev) =>
        prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b))
      );

      // 4. Background persistence
      Promise.all([
        updateBoard(user.uid, activeBoard.id, { columns: newColumns }),
        deleteNote(user.uid, targetNote.id),
      ]).catch((err) => console.error("Error moving note to board:", err));
      return;
    }

    // ==========================================
    // CASE 2: Note -> Calendar Date (Option 2: Move & Schedule)
    // ==========================================
    if (isFromNotes && isToCalendar) {
      const noteId = draggableId.replace("note-", "");
      const targetNote = notes.find((n) => n.id === noteId);
      if (!targetNote) return;

      const dateStr = destination.droppableId.replace("cal-day-", "");
      const targetColIndex = 0;
      const targetCol = activeBoard.columns[targetColIndex];
      if (!targetCol) return;

      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: targetNote.title || (targetNote.previewText ? targetNote.previewText.slice(0, 50) : "Untitled Task"),
        description: targetNote.previewText || targetNote.content || "",
        dueDate: dateStr,
        priority: "medium",
        labels: targetNote.tags && targetNote.tags.length > 0 ? targetNote.tags : ["From Notes"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newTasks = [...targetCol.tasks, newTask];
      const newColumns = activeBoard.columns.map((col, idx) =>
        idx === targetColIndex ? { ...col, tasks: newTasks } : col
      );
      const updatedBoard: Board = { ...activeBoard, columns: newColumns };

      // SYNCHRONOUS OPTIMISTIC UPDATE:
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setBoards((prev) =>
        prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b))
      );

      // Background persistence
      Promise.all([
        updateBoard(user.uid, activeBoard.id, { columns: newColumns }),
        deleteNote(user.uid, targetNote.id),
      ]).catch((err) => console.error("Error moving note to calendar:", err));
      return;
    }

    // ==========================================
    // CASE 3: Kanban Task -> Calendar Date (Schedule)
    // ==========================================
    if (isFromKanban && isToCalendar) {
      const taskId = draggableId;
      const dateStr = destination.droppableId.replace("cal-day-", "");

      // Synchronously update task due date
      const newColumns = activeBoard.columns.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) =>
          t.id === taskId
            ? { ...t, dueDate: dateStr, updatedAt: new Date().toISOString() }
            : t
        ),
      }));
      const updatedBoard: Board = { ...activeBoard, columns: newColumns };

      // SYNCHRONOUS OPTIMISTIC UPDATE:
      setBoards((prev) =>
        prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b))
      );

      // Background persistence
      updateBoard(user.uid, activeBoard.id, { columns: newColumns }).catch((err) =>
        console.error("Error scheduling task on calendar:", err)
      );
      return;
    }

    // ==========================================
    // CASE 4: Kanban Task -> Notes (Option 2: Move to Notes)
    // ==========================================
    if (isFromKanban && isToNotes) {
      const taskId = draggableId;
      const sourceColId = source.droppableId;
      const sourceCol = activeBoard.columns.find((c) => c.id === sourceColId);
      const task = sourceCol?.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const tempNoteId = `note-${Date.now()}`;
      const newNote: Note = {
        id: tempNoteId,
        title: task.title,
        content: task.description ? `<p>${task.description.replace(/\n/g, "<br>")}</p>` : `<p>${task.title}</p>`,
        previewText: task.description || task.title,
        color: "default",
        columnCount: 1,
        tags: task.labels || [],
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Remove task from column
      const newColumns = activeBoard.columns.map((col) => {
        if (col.id === sourceColId) {
          return {
            ...col,
            tasks: col.tasks.filter((t) => t.id !== task.id),
          };
        }
        return col;
      });
      const updatedBoard: Board = { ...activeBoard, columns: newColumns };

      // SYNCHRONOUS OPTIMISTIC UPDATE: Remove task & prepend note simultaneously
      setBoards((prev) =>
        prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b))
      );
      setNotes((prev) => [newNote, ...prev]);

      // Background persistence
      (async () => {
        try {
          const [realNoteId] = await Promise.all([
            createNote(user.uid, {
              title: newNote.title,
              content: newNote.content,
              previewText: newNote.previewText,
              color: newNote.color,
              columnCount: newNote.columnCount,
              tags: newNote.tags,
              isPinned: false,
            }),
            updateBoard(user.uid, activeBoard.id, { columns: newColumns }),
          ]);

          if (realNoteId) {
            setNotes((prev) =>
              prev.map((n) => (n.id === tempNoteId ? { ...n, id: realNoteId } : n))
            );
          }
        } catch (err) {
          console.error("Error moving task to note:", err);
        }
      })();
      return;
    }

    // ==========================================
    // CASE 5: Kanban -> Kanban (Within Board Drag & Drop)
    // ==========================================
    if (isFromKanban && isToKanban) {
      const sourceColIndex = activeBoard.columns.findIndex(
        (c) => c.id === source.droppableId
      );
      const destColIndex = activeBoard.columns.findIndex(
        (c) => c.id === destination.droppableId
      );
      if (sourceColIndex === -1 || destColIndex === -1) return;

      const sourceCol = activeBoard.columns[sourceColIndex];
      const destCol = activeBoard.columns[destColIndex];

      const sourceTasks = Array.from(sourceCol.tasks);
      const [movedTask] = sourceTasks.splice(source.index, 1);

      let newColumns: BoardColumn[] = [...activeBoard.columns];

      if (source.droppableId === destination.droppableId) {
        sourceTasks.splice(destination.index, 0, movedTask);
        newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks };
      } else {
        const destTasks = Array.from(destCol.tasks);
        destTasks.splice(destination.index, 0, movedTask);
        newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks };
        newColumns[destColIndex] = { ...destCol, tasks: destTasks };
      }

      const updatedBoard: Board = { ...activeBoard, columns: newColumns };

      // SYNCHRONOUS OPTIMISTIC UPDATE:
      setBoards((prev) =>
        prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b))
      );

      // Background persistence
      updateBoard(user.uid, activeBoard.id, { columns: newColumns }).catch((err) =>
        console.error("Error updating board columns:", err)
      );
      return;
    }
  };

  // Quick Add Note
  const handleQuickAddNote = async (title: string, content: string) => {
    if (!user) return;
    await createNote(user.uid, {
      title,
      content: `<p>${content.replace(/\n/g, "<br>")}</p>`,
      previewText: content,
      color: "default",
      columnCount: 1,
    });
    const freshNotes = await getUserNotes(user.uid);
    setNotes(freshNotes);
  };

  // Quick Add Card to Column
  const handleQuickAddCard = async (colId: string) => {
    if (!newCardTitle.trim() || !user || !activeBoard) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newCardTitle.trim(),
      priority: "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newColumns = activeBoard.columns.map((col) => {
      if (col.id === colId) {
        return {
          ...col,
          tasks: [...col.tasks, newTask],
        };
      }
      return col;
    });

    const updatedBoard = { ...activeBoard, columns: newColumns };
    setBoards((prev) =>
      prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b))
    );
    setNewCardTitle("");
    setAddingToColId(null);
    await updateBoard(user.uid, activeBoard.id, { columns: newColumns });
  };

  // Add Column
  const handleAddColumn = async () => {
    if (!newColTitle.trim() || !user || !activeBoard) return;
    const newCol: BoardColumn = {
      id: `col-${Date.now()}`,
      title: newColTitle.trim(),
      position: activeBoard.columns.length,
      tasks: [],
    };
    const newColumns = [...activeBoard.columns, newCol];
    const updatedBoard = { ...activeBoard, columns: newColumns };
    setBoards((prev) =>
      prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b))
    );
    setNewColTitle("");
    setIsAddingCol(false);
    await updateBoard(user.uid, activeBoard.id, { columns: newColumns });
  };

  // Delete Column
  const handleDeleteColumn = async (colId: string) => {
    if (!user || !activeBoard) return;
    if (!confirm("Are you sure you want to delete this list?")) return;
    const newColumns = activeBoard.columns.filter((c) => c.id !== colId);
    const updatedBoard = { ...activeBoard, columns: newColumns };
    setBoards((prev) =>
      prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b))
    );
    setOpenColMenuId(null);
    await updateBoard(user.uid, activeBoard.id, { columns: newColumns });
  };

  // Create New Board
  const handleCreateBoardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newBoardTitle.trim()) return;

    try {
      setIsCreatingBoard(true);
      const newId = await createBoard(user.uid, newBoardTitle.trim(), newBoardDesc.trim());
      setNewBoardTitle("");
      setNewBoardDesc("");
      setIsNewBoardModalOpen(false);
      const updated = await getUserBoards(user.uid);
      setBoards(updated);
      if (newId) {
        setSelectedBoardId(newId);
      }
    } catch (err) {
      console.error("Error creating board:", err);
    } finally {
      setIsCreatingBoard(false);
    }
  };

  // Delete Board
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-gray-50">
      <DragDropContext onDragEnd={handleUniversalDragEnd}>
        {/* 3-Pane Command Center Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* PANE 1: LEFT - Google Keep & Notes Scratchpad */}
          <WorkspaceNotesPane
            notes={notes}
            isCollapsed={leftCollapsed}
            onToggleCollapse={() => setLeftCollapsed(!leftCollapsed)}
            onSelectNote={(note) => setEditingNote(note)}
            onQuickAddNote={handleQuickAddNote}
            onTogglePin={async (id, pin) => {
              if (!user) return;
              await updateNote(user.uid, id, { isPinned: !pin });
              setNotes((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isPinned: !pin } : n))
              );
            }}
          />

          {/* PANE 2: CENTER - Trello Kanban Board */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
            {/* Center Header: Board Switcher & Controls */}
            <div className="h-12 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                <Kanban className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg text-xs">
                  {boards.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBoardId(b.id)}
                      className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                        activeBoard?.id === b.id
                          ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs font-semibold"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      }`}
                    >
                      {b.title}
                    </button>
                  ))}
                </div>

                {/* + New Board Button */}
                <button
                  type="button"
                  onClick={() => setIsNewBoardModalOpen(true)}
                  className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-2.5 py-1 rounded-lg shadow-xs transition shrink-0 cursor-pointer"
                  title="Create a new board"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Board</span>
                </button>

                {/* Delete Board Button (if more than 1 board) */}
                {activeBoard && boards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteBoard(activeBoard.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-md transition cursor-pointer"
                    title={`Delete "${activeBoard.title}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/50">
                  <Sparkles className="w-3 h-3" /> Drag cards across all 3 panels!
                </span>
              </div>
            </div>

            {/* Kanban Columns Horizontal Scroll Area */}
            <div className="flex-1 overflow-x-auto p-4 flex items-start gap-4">
              {activeBoard?.columns.map((column) => (
                <div
                  key={column.id}
                  className="w-72 shrink-0 bg-gray-100/90 dark:bg-gray-900/90 rounded-2xl p-3 border border-gray-200/90 dark:border-gray-800 flex flex-col max-h-full shadow-xs"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1 mb-2">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-gray-800 dark:text-gray-100 text-xs">{column.title}</h4>
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-400 bg-white dark:bg-gray-800 px-1.5 py-0.2 rounded-full border border-gray-200 dark:border-gray-700">
                        {column.tasks.length}
                      </span>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenColMenuId(openColMenuId === column.id ? null : column.id)
                        }
                        className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>

                      {openColMenuId === column.id && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-1 z-30">
                          <button
                            onClick={() => handleDeleteColumn(column.id)}
                            className="w-full text-left px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Delete List
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tasks Droppable Area */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto px-0.5 min-h-[4rem] transition-colors rounded-xl ${
                          snapshot.isDraggingOver ? "bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-300 dark:ring-blue-600" : ""
                        }`}
                      >
                        {column.tasks.map((task, index) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            onSelect={(t) => setEditingTask(t)}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Add a Card Button */}
                  <div className="mt-2 pt-1 border-t border-gray-200/60 dark:border-gray-800">
                    {addingToColId === column.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={newCardTitle}
                          onChange={(e) => setNewCardTitle(e.target.value)}
                          placeholder="Enter card title..."
                          autoFocus
                          rows={2}
                          className="w-full text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium"
                        />
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickAddCard(column.id)}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1 rounded-lg transition cursor-pointer"
                          >
                            Add Card
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingToColId(null);
                              setNewCardTitle("");
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingToColId(column.id);
                          setNewCardTitle("");
                        }}
                        className="w-full text-left flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200/70 dark:hover:bg-gray-800/70 p-1.5 rounded-xl transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add card
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add New List */}
              <div className="w-72 shrink-0">
                {isAddingCol ? (
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-3 border border-gray-200 dark:border-gray-800 shadow-xs space-y-2">
                    <input
                      type="text"
                      value={newColTitle}
                      onChange={(e) => setNewColTitle(e.target.value)}
                      placeholder="Enter list title..."
                      autoFocus
                      className="w-full text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleAddColumn}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1 rounded-lg transition cursor-pointer"
                      >
                        Add List
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCol(false);
                          setNewColTitle("");
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingCol(true)}
                    className="w-full flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-white/70 dark:bg-gray-900/60 hover:bg-white dark:hover:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-semibold hover:border-gray-400 dark:hover:border-gray-600 shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add another list
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* PANE 3: RIGHT - Live Calendar & Agenda Schedule */}
          <WorkspaceCalendarPane
            tasks={allScheduledTasks}
            isCollapsed={rightCollapsed}
            onToggleCollapse={() => setRightCollapsed(!rightCollapsed)}
            onSelectTask={(task) => setEditingTask(task)}
          />
        </div>
      </DragDropContext>

      {/* Note Editing Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
            <div className="sticky top-0 right-0 z-10 flex justify-end p-2 pointer-events-none">
              <button
                type="button"
                onClick={() => setEditingNote(null)}
                className="p-1.5 rounded-full bg-neutral-900/80 text-white hover:bg-neutral-900 pointer-events-auto transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <RichTextEditor
              initialTitle={editingNote.title}
              initialContent={editingNote.content}
              initialColor={editingNote.color}
              initialColumns={editingNote.columnCount}
              onSave={async (updated) => {
                if (!user) return;
                await updateNote(user.uid, editingNote.id, updated);
                setNotes((prev) =>
                  prev.map((n) => (n.id === editingNote.id ? { ...n, ...updated } : n))
                );
                setEditingNote(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Task Editing Modal */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          isOpen={true}
          onClose={() => setEditingTask(null)}
          onSave={async (updated) => {
            if (!user || !activeBoard) return;
            const newColumns = activeBoard.columns.map((col) => ({
              ...col,
              tasks: col.tasks.map((t) => (t.id === updated.id ? updated : t)),
            }));
            const updatedBoard = { ...activeBoard, columns: newColumns };
            setBoards((prev) =>
              prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b))
            );
            await updateBoard(user.uid, activeBoard.id, { columns: newColumns });
            setEditingTask(null);
          }}
          onDelete={async (taskId) => {
            if (!user || !activeBoard) return;
            const newColumns = activeBoard.columns.map((col) => ({
              ...col,
              tasks: col.tasks.filter((t) => t.id !== taskId),
            }));
            const updatedBoard = { ...activeBoard, columns: newColumns };
            setBoards((prev) =>
              prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b))
            );
            await updateBoard(user.uid, activeBoard.id, { columns: newColumns });
            setEditingTask(null);
          }}
        />
      )}

      {/* Create Board Modal */}
      {isNewBoardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Kanban className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Create New Board</h3>
              </div>
              <button
                onClick={() => setIsNewBoardModalOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBoardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Board Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marketing Launch, Study Sprint..."
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  autoFocus
                  className="w-full text-xs text-gray-900 dark:text-white p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  placeholder="What is this board for?"
                  value={newBoardDesc}
                  onChange={(e) => setNewBoardDesc(e.target.value)}
                  rows={3}
                  className="w-full text-xs text-gray-900 dark:text-white p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewBoardModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newBoardTitle.trim() || isCreatingBoard}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isCreatingBoard ? (
                    <span>Creating...</span>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Board</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
