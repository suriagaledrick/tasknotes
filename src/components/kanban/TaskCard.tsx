"use client";

import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Task, PRIORITY_CONFIG, PRESET_LABELS } from "@/types/board";
import { Calendar, AlignLeft, AlertCircle } from "lucide-react";

interface TaskCardProps {
  task: Task;
  index: number;
  onSelect: (task: Task) => void;
}

export default function TaskCard({ task, index, onSelect }: TaskCardProps) {
  const priorityConfig = task.priority ? PRIORITY_CONFIG[task.priority] : null;

  // Check if due date is overdue
  const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)) : false;
  const isDueToday = task.dueDate ? new Date(task.dueDate).toDateString() === new Date().toDateString() : false;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onSelect(task)}
          className={`group bg-white dark:bg-gray-800/95 rounded-xl p-3.5 mb-2.5 border border-gray-200/90 dark:border-gray-700/80 select-none cursor-grab active:cursor-grabbing ${
            snapshot.isDragging
              ? "shadow-2xl ring-2 ring-blue-500/60 z-50 bg-white dark:bg-gray-800 opacity-95"
              : "shadow-xs hover:shadow-md transition-shadow transition-colors duration-150"
          }`}
        >
          {/* Labels & Priority Row */}
          {(task.labels && task.labels.length > 0 || priorityConfig) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {priorityConfig && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${priorityConfig.bgClass} ${priorityConfig.textClass} ${priorityConfig.borderClass}`}
                >
                  {priorityConfig.label}
                </span>
              )}
              {task.labels?.map((label) => {
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
          )}

          {/* Task Title */}
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-snug line-clamp-2">
            {task.title}
          </h4>

          {/* Card Footer: Metadata (due date, description indicator) */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs text-gray-400 dark:text-gray-500">
            <div className="flex items-center gap-2">
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
        </div>
      )}
    </Draggable>
  );
}
