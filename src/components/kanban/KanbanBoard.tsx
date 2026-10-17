"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Board, BoardColumn, Task } from "@/types/board";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import { Plus, MoreHorizontal, Trash2, X } from "lucide-react";

interface KanbanBoardProps {
  board: Board;
  onUpdateBoard: (updatedColumns: BoardColumn[]) => Promise<void>;
}

export default function KanbanBoard({ board, onUpdateBoard }: KanbanBoardProps) {
  const [columns, setColumns] = useState<BoardColumn[]>(board.columns || []);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumnIdForTask, setActiveColumnIdForTask] = useState<string | null>(null);

  // Quick card add state per column
  const [addingToColId, setAddingToColId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");

  // Add new column state
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");

  // Column options dropdown
  const [openColMenuId, setOpenColMenuId] = useState<string | null>(null);

  // Client mounted state for hello-pangea/dnd
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setColumns(board.columns || []);
  }, [board.columns]);

  if (!mounted) {
    return <div className="p-8 text-center text-gray-400">Loading Kanban board...</div>;
  }

  // Handle Drag & Drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColIndex = columns.findIndex((c) => c.id === source.droppableId);
    const destColIndex = columns.findIndex((c) => c.id === destination.droppableId);

    if (sourceColIndex === -1 || destColIndex === -1) return;

    const sourceCol = columns[sourceColIndex];
    const destCol = columns[destColIndex];

    const sourceTasks = Array.from(sourceCol.tasks);
    const [movedTask] = sourceTasks.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      // Reordering within the same column
      sourceTasks.splice(destination.index, 0, movedTask);
      const newColumns = [...columns];
      newColumns[sourceColIndex] = {
        ...sourceCol,
        tasks: sourceTasks,
      };
      setColumns(newColumns);
      onUpdateBoard(newColumns).catch((err) => console.error("Error updating board:", err));
    } else {
      // Moving across different columns
      const destTasks = Array.from(destCol.tasks);
      destTasks.splice(destination.index, 0, movedTask);

      const newColumns = [...columns];
      newColumns[sourceColIndex] = {
        ...sourceCol,
        tasks: sourceTasks,
      };
      newColumns[destColIndex] = {
        ...destCol,
        tasks: destTasks,
      };
      setColumns(newColumns);
      onUpdateBoard(newColumns).catch((err) => console.error("Error updating board:", err));
    }
  };

  // Add Task to Column
  const handleQuickAddTask = async (colId: string) => {
    if (!newCardTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newCardTitle.trim(),
      priority: "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newColumns = columns.map((col) => {
      if (col.id === colId) {
        return {
          ...col,
          tasks: [...col.tasks, newTask],
        };
      }
      return col;
    });

    setColumns(newColumns);
    setNewCardTitle("");
    setAddingToColId(null);
    await onUpdateBoard(newColumns);
  };

  // Update existing Task from Modal
  const handleSaveTaskModal = async (updatedTask: Task) => {
    const newColumns = columns.map((col) => ({
      ...col,
      tasks: col.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    }));
    setColumns(newColumns);
    await onUpdateBoard(newColumns);
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    const newColumns = columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((t) => t.id !== taskId),
    }));
    setColumns(newColumns);
    await onUpdateBoard(newColumns);
  };

  // Add Column
  const handleAddColumn = async () => {
    if (!newColTitle.trim()) return;
    const newCol: BoardColumn = {
      id: `col-${Date.now()}`,
      title: newColTitle.trim(),
      position: columns.length,
      tasks: [],
    };
    const newColumns = [...columns, newCol];
    setColumns(newColumns);
    setNewColTitle("");
    setIsAddingCol(false);
    await onUpdateBoard(newColumns);
  };

  // Delete Column
  const handleDeleteColumn = async (colId: string) => {
    if (!confirm("Are you sure you want to delete this list and all its cards?")) return;
    const newColumns = columns.filter((c) => c.id !== colId);
    setColumns(newColumns);
    setOpenColMenuId(null);
    await onUpdateBoard(newColumns);
  };

  return (
    <div className="flex-1 overflow-x-auto pb-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex items-start gap-4 min-h-[calc(100vh-14rem)]">
          {columns.map((column) => (
            <div
              key={column.id}
              className="w-72 sm:w-80 shrink-0 bg-gray-100/80 dark:bg-gray-900/70 rounded-2xl p-3 border border-gray-200/80 dark:border-gray-800 flex flex-col max-h-[calc(100vh-14rem)] shadow-xs"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-1 mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{column.title}</h3>
                  <span className="text-[11px] font-medium text-gray-400 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                    {column.tasks.length}
                  </span>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenColMenuId(openColMenuId === column.id ? null : column.id)
                    }
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {openColMenuId === column.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-1 z-30">
                      <button
                        type="button"
                        onClick={() => handleDeleteColumn(column.id)}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete List
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
                    className={`flex-1 overflow-y-auto px-1 min-h-[3rem] transition-colors rounded-xl ${
                      snapshot.isDraggingOver ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    {column.tasks.map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onSelect={(t) => {
                          setActiveTask(t);
                          setActiveColumnIdForTask(column.id);
                        }}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Quick Add Card */}
              <div className="mt-2 pt-1 border-t border-gray-200/50 dark:border-gray-800 px-1">
                {addingToColId === column.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      placeholder="Enter a title for this card..."
                      autoFocus
                      rows={2}
                      className="w-full text-xs p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-xl shadow-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickAddTask(column.id)}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg shadow-xs transition"
                      >
                        Add Card
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingToColId(null);
                          setNewCardTitle("");
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md"
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
                    className="w-full text-left flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200/70 dark:hover:bg-gray-800/80 p-2 rounded-xl transition"
                  >
                    <Plus className="w-4 h-4" /> Add a card
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add Another List (Column) */}
          <div className="w-72 sm:w-80 shrink-0">
            {isAddingCol ? (
              <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-3 border border-gray-200 dark:border-gray-800 shadow-xs space-y-2">
                <input
                  type="text"
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  placeholder="Enter list title..."
                  autoFocus
                  className="w-full text-xs p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-xl shadow-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAddColumn}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-1.5 rounded-lg shadow-xs transition"
                  >
                    Add List
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCol(false);
                      setNewColTitle("");
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingCol(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/70 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:border-gray-400 dark:hover:border-gray-700 shadow-xs transition"
              >
                <Plus className="w-4 h-4" /> Add another list
              </button>
            )}
          </div>
        </div>
      </DragDropContext>

      {/* Task Modal for details, priority, due date, tags */}
      {activeTask && (
        <TaskModal
          task={activeTask}
          isOpen={true}
          onClose={() => setActiveTask(null)}
          onSave={handleSaveTaskModal}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}
