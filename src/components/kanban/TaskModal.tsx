"use client";

import React, { useState } from "react";
import { Task, TaskPriority, PRIORITY_CONFIG, PRESET_LABELS } from "@/types/board";
import { X, Calendar, Flag, Tag, Trash2, AlignLeft } from "lucide-react";

interface TaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskModal({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: TaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority || "medium");
  const [labels, setLabels] = useState<string[]>(task.labels || []);
  const [customLabel, setCustomLabel] = useState("");

  if (!isOpen) return null;

  const handleToggleLabel = (labelName: string) => {
    if (labels.includes(labelName)) {
      setLabels(labels.filter((l) => l !== labelName));
    } else {
      setLabels([...labels, labelName]);
    }
  };

  const handleAddCustomLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLabel.trim()) return;
    if (!labels.includes(customLabel.trim())) {
      setLabels([...labels, customLabel.trim()]);
    }
    setCustomLabel("");
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      ...task,
      title,
      description,
      dueDate,
      priority,
      labels,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task Title..."
            className="text-lg font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 w-full outline-none border-b border-transparent focus:border-blue-500 pb-1 bg-transparent"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Priority & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority Selector */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                <Flag className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Due Date Picker */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" /> Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details, checklists, or context for this task..."
              rows={4}
              className="w-full text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Labels */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
              <Tag className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" /> Labels & Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {PRESET_LABELS.map((preset) => {
                const isSelected = labels.includes(preset.name);
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleToggleLabel(preset.name)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition ${
                      isSelected
                        ? `${preset.color} ring-1 ring-offset-1`
                        : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {preset.name} {isSelected && "✓"}
                  </button>
                );
              })}
            </div>

            {/* Custom tag add */}
            <form onSubmit={handleAddCustomLabel} className="flex gap-2">
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="+ Add custom tag..."
                className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg flex-1 outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => {
              if (confirm("Delete this task?")) {
                onDelete(task.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
          >
            <Trash2 className="w-4 h-4" /> Delete Task
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 px-4 py-2 rounded-lg font-medium transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
