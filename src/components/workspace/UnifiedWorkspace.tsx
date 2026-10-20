"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useAuth } from "@/contexts/AuthContext";
import { Note, NOTE_COLORS } from "@/types/note";
import { Board, BoardColumn, Task, PRIORITY_CONFIG } from "@/types/board";
import { getUserNotes, createNote, updateNote, deleteNote } from "@/lib/notesService";
import { getUserBoards, createBoard, updateBoard, deleteBoard, reorderBoards } from "@/lib/boardsService";
import BoardTabs from "@/components/kanban/BoardTabs";
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
import WorkspaceSkeleton from "@/components/skeletons/WorkspaceSkeleton";
import Link from "next/link";
import { format } from "date-fns";
import {
  Kanban,
  Plus,
  MoreHorizontal,
  Trash2,
  X,
  Sparkles,
  StickyNote,
  Calendar,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  Pin,
} from "lucide-react";

export default function UnifiedWorkspace() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Mobile segmented tab state
  const [mobileTab, setMobileTab] = useState<"notes" | "board" | "calendar">("board");

  // Pane toggle states (Desktop)
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Active editing modal states
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Mobile scratchpad input state
  const [mobileNoteTitle, setMobileNoteTitle] = useState("");
  const [mobileNoteContent, setMobileNoteContent] = useState("");

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

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayScheduledTasks = allScheduledTasks.filter((t) => t.task.dueDate === todayStr);
  const overdueTasks = allScheduledTasks.filter(
    (t) => t.task.dueDate && t.task.dueDate < todayStr && t.columnTitle.toLowerCase() !== "done"
  );

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

  // Reorder Boards (Drag & Drop or buttons)
  const handleReorderBoards = async (newBoards: Board[]) => {
    setBoards(newBoards);
    if (!user) return;
    try {
      await reorderBoards(user.uid, newBoards.map((b) => b.id));
    } catch (err) {
      console.error("Error persisting board order:", err);
    }
  };

  // Change Board Color
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

  // Rename Board
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

  // 1-Tap Convert Note to Board Task (Mobile & Touch Accessible)
  const handleMoveNoteToBoard = async (note: Note) => {
    if (!user || !activeBoard || activeBoard.columns.length === 0) return;
    const targetColId = activeBoard.columns[0].id;
    const { updatedBoard } = await moveNoteToTask(user.uid, note, activeBoard, targetColId);
    setBoards((prev) => prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b)));
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
  };

  // 1-Tap Schedule Note on Calendar (Mobile & Touch Accessible)
  const handleScheduleNote = async (note: Note, dateStr: string) => {
    if (!user || !activeBoard || activeBoard.columns.length === 0) return;
    const targetColId = activeBoard.columns[0].id;
    const { updatedBoard } = await moveNoteToTask(user.uid, note, activeBoard, targetColId, dateStr);
    setBoards((prev) => prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b)));
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
  };

  // 1-Tap Move Task to Column
  const handleMoveTaskToColumn = async (taskId: string, targetColId: string) => {
    if (!user || !activeBoard) return;
    const sourceCol = activeBoard.columns.find((col) => col.tasks.some((t) => t.id === taskId));
    const targetTask = sourceCol?.tasks.find((t) => t.id === taskId);
    if (!sourceCol || !targetTask) return;

    const newColumns = activeBoard.columns.map((col) => {
      if (col.id === sourceCol.id) {
        return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
      }
      if (col.id === targetColId) {
        return { ...col, tasks: [...col.tasks, targetTask] };
      }
      return col;
    });

    const updated = { ...activeBoard, columns: newColumns };
    setBoards((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    await updateBoard(user.uid, activeBoard.id, { columns: newColumns });
  };

  // 1-Tap Schedule Task on Date
  const handleScheduleTaskDate = async (taskId: string, dateStr: string) => {
    if (!user || !activeBoard) return;
    const { updatedBoard } = await scheduleTaskOnDate(user.uid, activeBoard, taskId, dateStr);
    setBoards((prev) => prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b)));
  };

  // 1-Tap Convert Task to Note
  const handleConvertTaskToNote = async (task: Task) => {
    if (!user || !activeBoard) return;
    const sourceCol = activeBoard.columns.find((col) => col.tasks.some((t) => t.id === task.id));
    if (!sourceCol) return;
    const { updatedBoard } = await moveTaskToNote(user.uid, task, activeBoard, sourceCol.id);
    setBoards((prev) => prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b)));
    const freshNotes = await getUserNotes(user.uid);
    setNotes(freshNotes);
  };

  if (loading) {
    return <WorkspaceSkeleton />;
  }

  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* ======================================================== */}
      {/* MOBILE ONLY: Unified Daily Command Center & Summary View */}
      {/* ======================================================== */}
      <div className="md:hidden flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Header / Date Badge */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Daily Briefing
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <span className="text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>Dashboard</span>
          </span>
        </div>

        {/* Section 1: Today's Agenda */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-3.5 border border-gray-200 dark:border-gray-800 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <CalendarDays className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                Today&apos;s Agenda ({todayScheduledTasks.length})
              </h3>
            </div>
            <Link
              href="/calendar"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>View Calendar</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {todayScheduledTasks.length === 0 && overdueTasks.length === 0 ? (
            <div className="text-center py-4 text-xs text-gray-400 dark:text-gray-500 bg-gray-50/60 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
              <p className="font-medium text-gray-600 dark:text-gray-300">All caught up for today!</p>
              <p className="text-[10px] mt-0.5">No tasks due today. Schedule a task anytime!</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {overdueTasks.map(({ task, boardTitle, columnTitle }) => (
                <div
                  key={`overdue-${task.id}`}
                  onClick={() => setEditingTask(task)}
                  className="p-2.5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{task.title}</p>
                    <span className="text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Overdue • {boardTitle}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 shrink-0">
                    Overdue
                  </span>
                </div>
              ))}
              {todayScheduledTasks.map(({ task, boardTitle, columnTitle }) => {
                const priority = task.priority || "medium";
                return (
                  <div
                    key={`today-${task.id}`}
                    onClick={() => setEditingTask(task)}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800/90 hover:border-blue-300 flex items-center justify-between gap-2 cursor-pointer shadow-xs"
                  >
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{task.title}</p>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {boardTitle} • {columnTitle}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                        PRIORITY_CONFIG[priority].bgClass
                      } ${PRIORITY_CONFIG[priority].textClass} ${PRIORITY_CONFIG[priority].borderClass}`}
                    >
                      {priority}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Active Kanban Board Snapshot */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-3.5 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <Kanban className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 truncate max-w-[180px]">
                {activeBoard?.title || "Board Snapshot"}
              </h3>
            </div>
            <Link
              href="/boards"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>Full Board</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Quick Board Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
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

          {/* Horizontal snapshot of Kanban columns */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar -mx-1 px-1">
            {activeBoard?.columns.map((column) => (
              <div
                key={`mob-col-${column.id}`}
                className="w-64 shrink-0 snap-center bg-gray-100/90 dark:bg-gray-800/70 rounded-xl p-2.5 border border-gray-200 dark:border-gray-700/70 flex flex-col shadow-xs"
              >
                <div className="flex items-center justify-between mb-2 px-1">
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">{column.title}</h4>
                  <span className="text-[10px] font-semibold text-gray-400 bg-white dark:bg-gray-700 px-1.5 py-0.2 rounded-full border border-gray-200 dark:border-gray-600">
                    {column.tasks.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1 max-h-56 overflow-y-auto px-0.5">
                  {column.tasks.map((task, idx) => (
                    <TaskCard
                      key={`mob-task-${task.id}`}
                      task={task}
                      index={idx}
                      isDraggable={false}
                      onSelect={(t) => setEditingTask(t)}
                      availableColumns={activeBoard.columns
                        .filter((c) => c.id !== column.id)
                        .map((c) => ({ id: c.id, title: c.title }))}
                      onMoveToColumn={handleMoveTaskToColumn}
                      onScheduleDate={handleScheduleTaskDate}
                      onConvertToNote={handleConvertTaskToNote}
                    />
                  ))}
                  {column.tasks.length === 0 && (
                    <div className="py-4 text-center text-[11px] text-gray-400">
                      Empty column
                    </div>
                  )}
                </div>

                {/* Quick Add Card */}
                <div className="mt-2 pt-1 border-t border-gray-200/60 dark:border-gray-700">
                  {addingToColId === column.id ? (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        placeholder="Card title..."
                        autoFocus
                        className="w-full text-xs p-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-700 outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAddCard(column.id)}
                          className="text-[11px] bg-blue-600 text-white font-medium px-2 py-0.5 rounded-md cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingToColId(null)}
                          className="p-1 text-gray-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingToColId(column.id)}
                      className="w-full text-left flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 p-1 hover:bg-gray-200/60 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add card
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Notes & Quick Scratchpad */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-3.5 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <StickyNote className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                Recent Notes ({notes.length})
              </h3>
            </div>
            <Link
              href="/notes"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>All Notes</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Mobile Quick Scratchpad Input */}
          <div className="p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-1.5">
            <input
              type="text"
              value={mobileNoteTitle}
              onChange={(e) => setMobileNoteTitle(e.target.value)}
              placeholder="Quick note title..."
              className="w-full text-xs font-semibold bg-transparent text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
            />
            <textarea
              value={mobileNoteContent}
              onChange={(e) => setMobileNoteContent(e.target.value)}
              placeholder="Jot down a thought or reminder..."
              rows={2}
              className="w-full text-xs bg-transparent text-gray-700 dark:text-gray-300 outline-none resize-none placeholder:text-gray-400"
            />
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={async () => {
                  if (!mobileNoteTitle.trim() && !mobileNoteContent.trim()) return;
                  await handleQuickAddNote(mobileNoteTitle, mobileNoteContent);
                  setMobileNoteTitle("");
                  setMobileNoteContent("");
                }}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1 rounded-lg transition cursor-pointer"
              >
                Save Note
              </button>
            </div>
          </div>

          {/* Recent Notes List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {notes.slice(0, 4).map((note) => {
              const colorConfig = NOTE_COLORS.find((c) => c.id === note.color) || NOTE_COLORS[0];
              return (
                <div
                  key={`mob-note-${note.id}`}
                  onClick={() => setEditingNote(note)}
                  className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${colorConfig.bgClass} ${colorConfig.darkBgClass} ${colorConfig.borderClass} ${colorConfig.darkBorderClass || "dark:border-gray-700"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate flex-1">
                      {note.title || "Untitled Note"}
                    </h5>
                    {note.isPinned && <Pin className="w-3 h-3 text-blue-600 fill-blue-600 shrink-0 ml-1" />}
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {note.previewText || "Empty note"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DESKTOP ONLY: 3-Pane Power Command Center with Canvas    */}
      {/* ======================================================== */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <DragDropContext onDragEnd={handleUniversalDragEnd}>
          {/* 3-Pane Command Center Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* PANE 1: LEFT - Google Keep & Notes Scratchpad */}
            <div className="h-full flex shrink-0">
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
                onMoveNoteToBoard={handleMoveNoteToBoard}
                onScheduleNote={handleScheduleNote}
              />
            </div>

            {/* PANE 2: CENTER - Trello Kanban Board with Radial Dot-Grid Canvas */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950 md:bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:md:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]">
              {/* Center Header: Board Switcher & Controls */}
              <div className="h-12 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xs px-3 sm:px-4 flex items-center justify-between shrink-0 gap-2">
                <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar min-w-0 flex-1">
                  <Kanban className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 hidden sm:block" />
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

                <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                  <span className="hidden lg:inline-flex items-center gap-1 text-[11px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/50">
                    <Sparkles className="w-3 h-3" /> Drag cards across all 3 panels!
                  </span>
                </div>
              </div>

              {/* Kanban Columns Horizontal Scroll Area */}
              <div className="flex-1 overflow-x-auto p-3 sm:p-4 flex items-start gap-3 sm:gap-4 snap-x snap-mandatory no-scrollbar">
                {activeBoard?.columns.map((column) => (
                  <div
                    key={column.id}
                    className="w-[85vw] sm:w-72 shrink-0 snap-center bg-gray-100/90 dark:bg-gray-900/90 rounded-2xl p-3 border border-gray-200/90 dark:border-gray-800 flex flex-col max-h-full shadow-xs"
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
                          type="button"
                          onClick={() =>
                            setOpenColMenuId(openColMenuId === column.id ? null : column.id)
                          }
                          className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer"
                          aria-label="Column options"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>

                        {openColMenuId === column.id && (
                          <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-1 z-30">
                            <button
                              type="button"
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
                              availableColumns={activeBoard.columns
                                .filter((c) => c.id !== column.id)
                                .map((c) => ({ id: c.id, title: c.title }))}
                              onMoveToColumn={handleMoveTaskToColumn}
                              onScheduleDate={handleScheduleTaskDate}
                              onConvertToNote={handleConvertTaskToNote}
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
                <div className="w-[85vw] sm:w-72 shrink-0 snap-center">
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
            <div className="h-full flex shrink-0">
              <WorkspaceCalendarPane
                tasks={allScheduledTasks}
                isCollapsed={rightCollapsed}
                onToggleCollapse={() => setRightCollapsed(!rightCollapsed)}
                onSelectTask={(task) => setEditingTask(task)}
              />
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* Note Editing Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/70 sm:backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-3xl overflow-hidden rounded-none sm:rounded-2xl shadow-2xl flex flex-col">
            <RichTextEditor
              initialTitle={editingNote.title}
              initialContent={editingNote.content}
              initialColor={editingNote.color}
              initialColumns={editingNote.columnCount}
              onClose={() => setEditingNote(null)}
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
