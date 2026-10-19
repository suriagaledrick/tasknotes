"use client";

import React, { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Task, PRIORITY_CONFIG } from "@/types/board";
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
  Clock,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

interface WorkspaceCalendarPaneProps {
  tasks: { task: Task; boardTitle: string; columnTitle: string }[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectTask: (task: Task) => void;
}

export default function WorkspaceCalendarPane({
  tasks,
  isCollapsed,
  onToggleCollapse,
  onSelectTask,
}: WorkspaceCalendarPaneProps) {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const todayStr = format(new Date(), "yyyy-MM-dd");

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 shrink-0 transition-all">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
          title="Expand Calendar Pane"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="mt-8 [writing-mode:vertical-lr] rotate-180 text-xs font-bold text-gray-400 dark:text-gray-500 tracking-wider flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 rotate-90" />
          <span>SCHEDULE ({tasks.length})</span>
        </div>
      </div>
    );
  }

  const selectedDayStr = format(selectedDay, "yyyy-MM-dd");
  const selectedDayTasks = tasks.filter((t) => t.task.dueDate === selectedDayStr);

  return (
    <div className="w-full md:w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-full shrink-0 transition-all select-none">
      {/* Pane Header */}
      <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-xs tracking-tight uppercase">
            Schedule & Agenda
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/calendar"
            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition"
            title="Open Full Page Calendar"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={onToggleCollapse}
            className="hidden md:inline-flex p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition cursor-pointer"
            title="Collapse Calendar Pane"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mini Calendar Month Header */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/50 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
          {format(currentDate, "MMMM yyyy")}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setCurrentDate(now);
              setSelectedDay(now);
            }}
            className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 text-center py-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      {/* Mini Month Grid - each day is a DROPPABLE zone! */}
      <div className="grid grid-cols-7 p-1 border-b border-gray-100 dark:border-gray-800 gap-0.5">
        {daysInCalendar.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const isSelected = isSameDay(day, selectedDay);
          const dayTasks = tasks.filter((t) => t.task.dueDate === dateKey);

          return (
            <Droppable key={dateKey} droppableId={`cal-day-${dateKey}`}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  onClick={() => setSelectedDay(day)}
                  className={`h-9 flex flex-col items-center justify-center rounded-lg text-[11px] cursor-pointer transition-colors relative ${
                    snapshot.isDraggingOver
                      ? "bg-blue-600 text-white font-bold z-20 shadow-md ring-2 ring-blue-400"
                      : isTodayDate
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-300 dark:border-blue-700"
                      : isSelected
                      ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-bold ring-1 ring-gray-400 dark:ring-gray-600"
                      : !isCurrentMonth
                      ? "text-gray-300 dark:text-gray-600"
                      : dayTasks.length > 0
                      ? "text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 bg-blue-50/20 dark:bg-blue-950/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  title={`${dateKey}: ${dayTasks.length} task${dayTasks.length === 1 ? "" : "s"}`}
                >
                  <span className="leading-none">{format(day, "d")}</span>
                  
                  {/* Colored Circle Markings for scheduled tasks */}
                  {dayTasks.length > 0 && !snapshot.isDraggingOver && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {dayTasks.slice(0, 3).map((item, idx) => {
                        const priority = item.task.priority || "medium";
                        const isDone = item.columnTitle.toLowerCase() === "done";
                        const dotColor = isDone
                          ? "bg-emerald-500"
                          : priority === "urgent"
                          ? "bg-rose-500"
                          : priority === "high"
                          ? "bg-orange-500"
                          : priority === "medium"
                          ? "bg-amber-500"
                          : "bg-blue-500";
                        return (
                          <span
                            key={item.task.id || idx}
                            className={`w-1.5 h-1.5 rounded-full ${dotColor} ring-1 ring-white dark:ring-gray-900 shadow-xs`}
                            title={`${item.task.title} (${priority})`}
                          />
                        );
                      })}
                      {dayTasks.length > 3 && (
                        <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600" />
                      )}
                    </div>
                  )}
                  <div className="hidden">{provided.placeholder}</div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>

      {/* Selected Day Agenda */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
          <span>{isToday(selectedDay) ? "Today's Agenda" : format(selectedDay, "EEE, MMM d")}</span>
          <span className="text-[11px] font-normal text-gray-400 dark:text-gray-500 font-mono">
            {selectedDayTasks.length} {selectedDayTasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {selectedDayTasks.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-gray-400 dark:text-gray-500 text-xs">
            <Clock className="w-4 h-4 mx-auto mb-1 text-gray-300 dark:text-gray-600" />
            <p>No tasks scheduled.</p>
            <p className="text-[10px] mt-0.5 text-gray-400 dark:text-gray-500">Drag a note or card here to schedule!</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {selectedDayTasks.map(({ task, boardTitle, columnTitle }) => {
              const priority = task.priority || "medium";
              const isOverdue = task.dueDate! < todayStr && columnTitle.toLowerCase() !== "done";

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className={`p-2 rounded-xl border transition cursor-pointer hover:shadow-xs flex items-center justify-between gap-2 ${
                    isOverdue
                      ? "bg-red-50/40 dark:bg-red-950/30 border-red-200 dark:border-red-900/40"
                      : "bg-white dark:bg-gray-800/90 border-gray-200 dark:border-gray-700/80 hover:border-blue-300 dark:hover:border-blue-500"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{task.title}</p>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 block truncate">
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

        {/* Quick Drop Helper Tip */}
        <div className="mt-4 p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 leading-snug">
          💡 <span className="font-semibold">Tip:</span> Drag any note or Kanban card directly onto a calendar date above to schedule it!
        </div>
      </div>
    </div>
  );
}
