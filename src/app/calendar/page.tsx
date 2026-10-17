"use client";

import React, { useState, useEffect, Suspense } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getUserBoards, updateBoard } from "@/lib/boardsService";
import { Board, BoardColumn, Task, PRIORITY_CONFIG } from "@/types/board";
import TaskModal from "@/components/kanban/TaskModal";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  ListFilter,
  CalendarDays,
  X,
} from "lucide-react";

interface CalendarTaskItem {
  task: Task;
  boardId: string;
  boardTitle: string;
  columnId: string;
  columnTitle: string;
}

function CalendarContent() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize directly to current real-time system date
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month");
  const [filterBoardId, setFilterBoardId] = useState<string>("all");

  // Active task modal state (for editing)
  const [activeTaskItem, setActiveTaskItem] = useState<CalendarTaskItem | null>(null);

  // Quick add task from calendar state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState<string>(() =>
    format(new Date(), "yyyy-MM-dd")
  );
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddBoardId, setQuickAddBoardId] = useState("");
  const [quickAddPriority, setQuickAddPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium");

  const fetchBoardsData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const userBoards = await getUserBoards(user.uid);
      setBoards(userBoards);
      if (userBoards.length > 0 && !quickAddBoardId) {
        setQuickAddBoardId(userBoards[0].id);
      }
    } catch (err) {
      console.error("Error loading calendar boards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBoardsData();
    }
  }, [user]);

  // Extract all tasks with due dates
  const scheduledTasks: CalendarTaskItem[] = [];
  boards.forEach((board) => {
    if (filterBoardId !== "all" && board.id !== filterBoardId) return;
    board.columns?.forEach((col) => {
      col.tasks?.forEach((task) => {
        if (task.dueDate) {
          scheduledTasks.push({
            task,
            boardId: board.id,
            boardTitle: board.title,
            columnId: col.id,
            columnTitle: col.title,
          });
        }
      });
    });
  });

  // Calculate Calendar Days for Month View
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Today string for comparison
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const overdueCount = scheduledTasks.filter(
    (item) => item.task.dueDate! < todayStr && item.columnTitle.toLowerCase() !== "done"
  ).length;
  const todayCount = scheduledTasks.filter(
    (item) => item.task.dueDate === todayStr
  ).length;
  const doneCount = scheduledTasks.filter(
    (item) => item.columnTitle.toLowerCase() === "done"
  ).length;

  // Handle Update Task from Modal
  const handleSaveTask = async (updatedTask: Task) => {
    if (!user || !activeTaskItem) return;
    const targetBoard = boards.find((b) => b.id === activeTaskItem.boardId);
    if (!targetBoard) return;

    const newColumns = targetBoard.columns.map((col) => ({
      ...col,
      tasks: col.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    }));

    try {
      await updateBoard(user.uid, targetBoard.id, { columns: newColumns });
      setBoards((prev) =>
        prev.map((b) => (b.id === targetBoard.id ? { ...b, columns: newColumns } : b))
      );
      setActiveTaskItem(null);
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  // Handle Delete Task from Modal
  const handleDeleteTask = async (taskId: string) => {
    if (!user || !activeTaskItem) return;
    const targetBoard = boards.find((b) => b.id === activeTaskItem.boardId);
    if (!targetBoard) return;

    const newColumns = targetBoard.columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((t) => t.id !== taskId),
    }));

    try {
      await updateBoard(user.uid, targetBoard.id, { columns: newColumns });
      setBoards((prev) =>
        prev.map((b) => (b.id === targetBoard.id ? { ...b, columns: newColumns } : b))
      );
      setActiveTaskItem(null);
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // Handle Quick Add Task from Calendar
  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !quickAddTitle.trim()) return;

    const targetBoard = boards.find((b) => b.id === quickAddBoardId) || boards[0];
    if (!targetBoard || !targetBoard.columns || targetBoard.columns.length === 0) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: quickAddTitle.trim(),
      dueDate: quickAddDate,
      priority: quickAddPriority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newColumns = targetBoard.columns.map((col, idx) => {
      if (idx === 0) {
        return {
          ...col,
          tasks: [...col.tasks, newTask],
        };
      }
      return col;
    });

    try {
      await updateBoard(user.uid, targetBoard.id, { columns: newColumns });
      setBoards((prev) =>
        prev.map((b) => (b.id === targetBoard.id ? { ...b, columns: newColumns } : b))
      );
      setQuickAddTitle("");
      setIsQuickAddOpen(false);
    } catch (err) {
      console.error("Error creating scheduled task:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule & Calendar</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Track deadlines, schedule tasks, and view your agenda across all boards
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter by Board */}
          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 shadow-xs text-xs">
            <ListFilter className="w-3.5 h-3.5 text-gray-400 mr-2" />
            <select
              value={filterBoardId}
              onChange={(e) => setFilterBoardId(e.target.value)}
              className="bg-transparent text-gray-800 dark:text-gray-200 font-medium outline-none cursor-pointer"
            >
              <option value="all">All Boards</option>
              {boards.map((b) => (
                <option key={b.id} value={b.id} className="dark:bg-gray-800 dark:text-white">
                  {b.title}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-200/80 dark:bg-gray-800 p-1 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === "month"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Month Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("agenda")}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === "agenda"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Agenda List
            </button>
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={() => {
              setQuickAddDate(format(selectedDay, "yyyy-MM-dd"));
              setIsQuickAddOpen(true);
            }}
            className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-2 rounded-xl shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Task
          </button>
        </div>
      </div>

      {/* Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-900 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Total Scheduled</p>
            <p className="text-base font-bold text-gray-900 dark:text-white">{scheduledTasks.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Due Today</p>
            <p className="text-base font-bold text-gray-900 dark:text-white">{todayCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Overdue</p>
            <p className="text-base font-bold text-red-600 dark:text-red-400">{overdueCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Completed</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{doneCount}</p>
          </div>
        </div>
      </div>

      {/* View Mode: Month Grid */}
      {viewMode === "month" ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          {/* Month Navigation Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/60">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              {/* Current Date Indicator */}
              <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Today: {format(new Date(), "MMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setCurrentDate(now);
                  setSelectedDay(now);
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-200 shadow-xs"
              >
                Go to Today
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-xs"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-xs"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekdays Header */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 text-center py-2.5 bg-gray-100/60 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-200 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800">
            {daysInCalendar.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayTasks = scheduledTasks.filter((item) => item.task.dueDate === dateKey);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              const isSelected = isSameDay(day, selectedDay);

              return (
                <div
                  key={dateKey}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[110px] sm:min-h-[130px] p-2 flex flex-col justify-between transition-colors group cursor-pointer ${
                    !isCurrentMonth
                      ? "bg-gray-50/40 dark:bg-gray-950/40 text-gray-300 dark:text-gray-600"
                      : isSelected
                      ? "bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-inset ring-blue-300 dark:ring-blue-700"
                      : "hover:bg-gray-50/80 dark:hover:bg-gray-800/60 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  <div>
                    {/* Day Number Row */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                          isTodayDate
                            ? "bg-blue-600 text-white font-bold ring-2 ring-blue-300 dark:ring-blue-800 shadow-xs"
                            : isSelected
                            ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-100 dark:bg-blue-900/40"
                            : isCurrentMonth
                            ? "text-gray-700 dark:text-gray-200"
                            : "text-gray-400 dark:text-gray-600"
                        }`}
                      >
                        {format(day, "d")}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDay(day);
                          setQuickAddDate(dateKey);
                          setIsQuickAddOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                        title="Schedule task on this date"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Day Tasks Pills */}
                    <div className="space-y-1 overflow-hidden">
                      {dayTasks.slice(0, 3).map((item) => {
                        const priority = item.task.priority || "medium";
                        const isDone = item.columnTitle.toLowerCase() === "done";
                        const isTaskOverdue = item.task.dueDate! < todayStr && !isDone;

                        return (
                          <div
                            key={item.task.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTaskItem(item);
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border truncate transition cursor-pointer flex items-center gap-1 ${
                              isDone
                                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 line-through"
                                : isTaskOverdue
                                ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                                : `${PRIORITY_CONFIG[priority].bgClass} ${PRIORITY_CONFIG[priority].textClass} ${PRIORITY_CONFIG[priority].borderClass}`
                            }`}
                            title={`${item.task.title} (${item.boardTitle} - ${item.columnTitle})`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isDone
                                  ? "bg-gray-400"
                                  : isTaskOverdue
                                  ? "bg-red-500"
                                  : priority === "urgent"
                                  ? "bg-rose-500"
                                  : priority === "high"
                                  ? "bg-orange-500"
                                  : "bg-blue-500"
                              }`}
                            />
                            <span className="truncate">{item.task.title}</span>
                          </div>
                        );
                      })}

                      {dayTasks.length > 3 && (
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium pl-1">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* View Mode: Agenda List */
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Upcoming Deadlines & Agenda
          </h2>

          {scheduledTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-xs">
              No tasks with scheduled due dates found.
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledTasks
                .sort((a, b) => a.task.dueDate!.localeCompare(b.task.dueDate!))
                .map((item) => {
                  const isDone = item.columnTitle.toLowerCase() === "done";
                  const isTaskOverdue = item.task.dueDate! < todayStr && !isDone;
                  const priority = item.task.priority || "medium";

                  return (
                    <div
                      key={item.task.id}
                      onClick={() => setActiveTaskItem(item)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-xs ${
                        isDone
                          ? "bg-gray-50/50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-60"
                          : isTaskOverdue
                          ? "bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60"
                          : "bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              PRIORITY_CONFIG[priority].bgClass
                            } ${PRIORITY_CONFIG[priority].textClass} ${
                              PRIORITY_CONFIG[priority].borderClass
                            }`}
                          >
                            {priority}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {item.boardTitle} • {item.columnTitle}
                          </span>
                        </div>
                        <h4
                          className={`text-sm font-semibold text-gray-900 dark:text-white ${
                            isDone ? "line-through text-gray-400 dark:text-gray-500" : ""
                          }`}
                        >
                          {item.task.title}
                        </h4>
                        {item.task.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                            {item.task.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                            isTaskOverdue
                              ? "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300"
                              : item.task.dueDate === todayStr
                              ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {item.task.dueDate}
                          {isTaskOverdue && " (Overdue)"}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Quick Add Scheduled Task Modal */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Schedule New Task</h3>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={quickAddTitle}
                  onChange={(e) => setQuickAddTitle(e.target.value)}
                  placeholder="e.g. Prepare presentation, Submit assignment..."
                  required
                  autoFocus
                  className="w-full text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 p-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={quickAddDate}
                    onChange={(e) => setQuickAddDate(e.target.value)}
                    required
                    className="w-full text-xs text-gray-900 dark:text-white p-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Priority
                  </label>
                  <select
                    value={quickAddPriority}
                    onChange={(e) => setQuickAddPriority(e.target.value as any)}
                    className="w-full text-xs text-gray-900 dark:text-white p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Target Board
                </label>
                <select
                  value={quickAddBoardId}
                  onChange={(e) => setQuickAddBoardId(e.target.value)}
                  className="w-full text-xs text-gray-900 dark:text-white p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                >
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="text-xs text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 shadow-xs"
                >
                  Save & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal for Editing Scheduled Task */}
      {activeTaskItem && (
        <TaskModal
          task={activeTaskItem.task}
          isOpen={true}
          onClose={() => setActiveTaskItem(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="flex h-96 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <CalendarContent />
      </Suspense>
    </AppLayout>
  );
}
