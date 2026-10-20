"use client";

import React, { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Task, PRIORITY_CONFIG, PRESET_LABELS } from "@/types/board";
import {
  Calendar,
  AlignLeft,
  AlertCircle,
  GripVertical,
  MoreHorizontal,
  StickyNote,
  Clock,
  ArrowRight,
} from "lucide-react";
import { format, addDays } from "date-fns";

interface TaskCardProps {
  task: Task;
  index: number;
  onSelect: (task: Task) => void;
  isDraggable?: boolean;
  availableColumns?: { id: string; title: string }[];
  onMoveToColumn?: (taskId: string, targetColId: string) => void;
  onScheduleDate?: (taskId: string, dateStr: string) => void;
  onConvertToNote?: (task: Task) => void;
}

export default function TaskCard({
  task,
  index,
  onSelect,
  isDraggable = true,
  availableColumns,
  onMoveToColumn,
  onScheduleDate,
  onConvertToNote,
}: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const priorityConfig = task.priority ? PRIORITY_CONFIG[task.priority] : null;

  // Check if due date is overdue
  const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)) : false;
  const isDueToday = task.dueDate ? new Date(task.dueDate).toDateString() === new Date().toDateString() : false;

  // Separate "From Notes" label to place into the footer row
  const hasFromNotes = task.labels?.includes("From Notes");
  const displayLabels = task.labels?.filter((l) => l !== "From Notes") || [];

  const hasTopLabels = Boolean(displayLabels.length > 0 || priorityConfig);
  const hasFooter = Boolean(task.dueDate || task.description || hasFromNotes);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const renderCardBody = (providedProps?: any, isDragging?: boolean) => (
    <div
      ref={providedProps?.innerRef}
      {...providedProps?.draggableProps}
      {...providedProps?.dragHandleProps}
      onClick={() => onSelect(task)}
      className={`group relative bg-white dark:bg-gray-800/95 rounded-xl p-3.5 mb-2.5 border border-gray-200/90 dark:border-gray-700/80 select-none transition-all ${
        isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${
        isDragging
          ? "shadow-2xl ring-2 ring-blue-500/60 z-50 bg-white dark:bg-gray-800 opacity-95"
          : "shadow-xs hover:shadow-md transition-shadow transition-colors duration-150"
      }`}
    >
      {/* Header Row: Labels/Priority + Grip & Quick Actions */}
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        {hasTopLabels ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {priorityConfig && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${priorityConfig.bgClass} ${priorityConfig.textClass} ${priorityConfig.borderClass}`}
              >
                {priorityConfig.label}
              </span>
            )}
            {displayLabels.map((label) => {
              const preset = PRESET_LABELS.find((p) => p.name === label);
              return (
                <span
                  key={label}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                    preset ? preset.color : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                  }`}
                >
                  {label}
                </span>
              );
            })}
          </div>
        ) : (
          <div />
        )}

        {/* Drag Handle & Quick Menu Controls */}
        <div
          className="flex items-center gap-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Desktop Drag-Handle Grip Icon (⋮⋮) */}
          {isDraggable && (
            <span
              className="hidden md:inline-flex p-0.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity cursor-grab"
              title="Drag to reorder or move across panels"
              aria-label="Drag handle"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </span>
          )}

          {/* Quick Action Menu Button */}
          {(onMoveToColumn || onScheduleDate || onConvertToNote) && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition cursor-pointer"
                title="Quick actions"
                aria-label="Card quick actions"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-1.5 z-40 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Schedule Options */}
                  {onScheduleDate && (
                    <div className="border-b border-gray-100 dark:border-gray-700 pb-1 mb-1">
                      <span className="text-[10px] uppercase font-bold text-gray-400 px-2 py-0.5 block">
                        Schedule Task
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onScheduleDate(task.id, todayStr);
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>Schedule for Today</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onScheduleDate(task.id, tomorrowStr);
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Schedule Tomorrow</span>
                      </button>
                    </div>
                  )}

                  {/* Move to Column */}
                  {onMoveToColumn && availableColumns && availableColumns.length > 0 && (
                    <div className="border-b border-gray-100 dark:border-gray-700 pb-1 mb-1">
                      <span className="text-[10px] uppercase font-bold text-gray-400 px-2 py-0.5 block">
                        Move to Column
                      </span>
                      {availableColumns.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => {
                            onMoveToColumn(task.id, col.id);
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-1 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="truncate">{col.title}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Convert to Note */}
                  {onConvertToNote && (
                    <button
                      type="button"
                      onClick={() => {
                        onConvertToNote(task);
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                      <span>Convert to Note</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-snug line-clamp-2">
        {task.title}
      </h4>

      {/* Card Footer: Metadata (Collapsible when empty) */}
      {hasFooter && (
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Repositioned "From Notes" badge inside footer */}
            {hasFromNotes && (
              <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
                <StickyNote className="w-2.5 h-2.5" /> From Note
              </span>
            )}

            {task.dueDate && (
              <span
                className={`flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
                  isOverdue
                    ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold"
                    : isDueToday
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold"
                    : "text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/60"
                }`}
              >
                {isOverdue && <AlertCircle className="w-3 h-3 text-red-500" />}
                <Calendar className="w-3 h-3" />
                {task.dueDate}
              </span>
            )}
          </div>

          {task.description && (
            <span className="text-gray-400 dark:text-gray-500" title="Has description">
              <AlignLeft className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (!isDraggable) {
    return renderCardBody();
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => renderCardBody(provided, snapshot.isDragging)}
    </Draggable>
  );
}
