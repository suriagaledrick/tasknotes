"use client";

import React, { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Note, NOTE_COLORS } from "@/types/note";
import {
  StickyNote,
  Plus,
  Pin,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpRight,
  GripVertical,
  MoreHorizontal,
  Kanban,
  Clock,
  Calendar,
  Archive,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { format, addDays } from "date-fns";

interface WorkspaceNotesPaneProps {
  notes: Note[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectNote: (note: Note) => void;
  onQuickAddNote: (title: string, content: string) => Promise<void>;
  onTogglePin: (noteId: string, currentPin: boolean) => void;
  onMoveNoteToBoard?: (note: Note) => void;
  onScheduleNote?: (note: Note, dateStr: string) => void;
  onArchiveNote?: (noteId: string) => void;
  onMoveNoteToTrash?: (noteId: string) => void;
}

export default function WorkspaceNotesPane({
  notes,
  isCollapsed,
  onToggleCollapse,
  onSelectNote,
  onQuickAddNote,
  onTogglePin,
  onMoveNoteToBoard,
  onScheduleNote,
  onArchiveNote,
  onMoveNoteToTrash,
}: WorkspaceNotesPaneProps) {
  const [quickTitle, setQuickTitle] = useState("");
  const [quickContent, setQuickContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuNoteId, setMenuNoteId] = useState<string | null>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() && !quickContent.trim()) return;
    try {
      setSaving(true);
      await onQuickAddNote(quickTitle, quickContent);
      setQuickTitle("");
      setQuickContent("");
      setIsAdding(false);
    } finally {
      setSaving(false);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 shrink-0 transition-all">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
          title="Expand Notes Pane"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="mt-8 [writing-mode:vertical-lr] rotate-180 text-xs font-bold text-gray-400 dark:text-gray-500 tracking-wider flex items-center gap-2">
          <StickyNote className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 rotate-90" />
          <span>NOTES ({notes.length})</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full shrink-0 transition-all select-none">
      {/* Pane Header */}
      <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-xs tracking-tight uppercase">
            Notes & Keep ({notes.length})
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/notes"
            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition"
            title="Open Full Page Notepad"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={onToggleCollapse}
            className="hidden md:inline-flex p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition cursor-pointer"
            title="Collapse Notes Pane"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Add Bar */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        {!isAdding ? (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full text-left bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-400 dark:text-gray-400 font-medium hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-xs flex items-center justify-between transition cursor-pointer"
          >
            <span>+ Quick scratchpad / note...</span>
            <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </button>
        ) : (
          <form onSubmit={handleSave} className="space-y-2 bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Title..."
              autoFocus
              className="w-full text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 font-semibold outline-none bg-transparent"
            />
            <textarea
              value={quickContent}
              onChange={(e) => setQuickContent(e.target.value)}
              placeholder="Jot down a quick thought or task..."
              rows={2}
              className="w-full text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none resize-none bg-transparent"
            />
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                type="submit"
                disabled={saving}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Droppable Notes List */}
      <Droppable droppableId="droppable-notes">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-3 space-y-2.5 transition-colors ${
              snapshot.isDraggingOver
                ? "bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-inset ring-blue-300 dark:ring-blue-600 rounded-xl"
                : ""
            }`}
          >
            {notes.map((note, index) => {
              const colorConfig = NOTE_COLORS.find((c) => c.id === note.color) || NOTE_COLORS[0];
              return (
                <Draggable key={note.id} draggableId={`note-${note.id}`} index={index}>
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      onClick={() => onSelectNote(note)}
                      className={`group relative rounded-xl border p-3 select-none cursor-grab active:cursor-grabbing ${colorConfig.bgClass} ${colorConfig.darkBgClass} ${colorConfig.borderClass} ${colorConfig.darkBorderClass || "dark:border-gray-700"} ${
                        dragSnapshot.isDragging
                          ? "shadow-2xl ring-2 ring-blue-500 z-50 opacity-95"
                          : "shadow-xs hover:shadow-md transition-shadow transition-colors duration-150"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          {/* Desktop Drag Grip Handle (⋮⋮) */}
                          <span
                            className="hidden md:inline-flex p-0.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity cursor-grab shrink-0"
                            title="Drag note to board or calendar"
                            aria-label="Drag handle"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </span>
                          <h4 className="font-semibold text-xs text-gray-900 dark:text-gray-100 line-clamp-1 truncate">
                            {note.title || "Untitled Note"}
                          </h4>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Mobile Quick Action Menu */}
                          {(onMoveNoteToBoard || onScheduleNote || onArchiveNote || onMoveNoteToTrash) && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setMenuNoteId(menuNoteId === note.id ? null : note.id)}
                                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition cursor-pointer"
                                title="Quick actions"
                                aria-label="Note quick actions"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>

                              {menuNoteId === note.id && (
                                <div
                                  className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-1.5 z-50 text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {onMoveNoteToBoard && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onMoveNoteToBoard(note);
                                        setMenuNoteId(null);
                                      }}
                                      className="w-full text-left px-2 py-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Kanban className="w-3.5 h-3.5 text-blue-500" />
                                      <span>Move to Board</span>
                                    </button>
                                  )}

                                  {onScheduleNote && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onScheduleNote(note, todayStr);
                                          setMenuNoteId(null);
                                        }}
                                        className="w-full text-left px-2 py-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Schedule Today</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onScheduleNote(note, tomorrowStr);
                                          setMenuNoteId(null);
                                        }}
                                        className="w-full text-left px-2 py-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>Schedule Tomorrow</span>
                                      </button>
                                    </>
                                  )}

                                  {(onArchiveNote || onMoveNoteToTrash) && (
                                    <div className="border-t border-gray-100 dark:border-gray-700 pt-1 mt-1">
                                      {onArchiveNote && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onArchiveNote(note.id);
                                            setMenuNoteId(null);
                                          }}
                                          className="w-full text-left px-2 py-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1.5 cursor-pointer"
                                        >
                                          <Archive className="w-3.5 h-3.5 text-gray-500" />
                                          <span>Archive Note</span>
                                        </button>
                                      )}
                                      {onMoveNoteToTrash && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onMoveNoteToTrash(note.id);
                                            setMenuNoteId(null);
                                          }}
                                          className="w-full text-left px-2 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 cursor-pointer font-medium"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                          <span>Move to Trash</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePin(note.id, note.isPinned);
                            }}
                            className={`p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${
                              note.isPinned ? "text-blue-600 dark:text-blue-400" : "text-gray-300 dark:text-gray-500 opacity-0 group-hover:opacity-100"
                            }`}
                            aria-label={note.isPinned ? "Unpin note" : "Pin note"}
                          >
                            <Pin className={`w-3 h-3 ${note.isPinned ? "fill-blue-600 dark:fill-blue-400" : ""}`} />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                        {note.previewText || "Empty note"}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
                        <span className="text-[9px] font-mono opacity-60">
                          <span className="hidden md:inline">Drag to board/calendar</span>
                          <span className="md:hidden">Tap ⋯ to move/schedule</span>
                        </span>
                        {note.tags && note.tags.length > 0 && (
                          <span className="bg-black/5 dark:bg-white/10 px-1.5 py-0.2 rounded text-gray-600 dark:text-gray-300">
                            {note.tags[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}

            {notes.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center py-12 text-xs text-gray-400 dark:text-gray-500">
                No notes yet. Add one above or drag tasks here!
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
