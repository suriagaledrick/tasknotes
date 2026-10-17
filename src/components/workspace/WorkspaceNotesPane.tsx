"use client";

import React, { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Note, NOTE_COLORS, NoteColor } from "@/types/note";
import { StickyNote, Plus, Pin, ChevronLeft, ChevronRight, X, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface WorkspaceNotesPaneProps {
  notes: Note[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectNote: (note: Note) => void;
  onQuickAddNote: (title: string, content: string) => Promise<void>;
  onTogglePin: (noteId: string, currentPin: boolean) => void;
}

export default function WorkspaceNotesPane({
  notes,
  isCollapsed,
  onToggleCollapse,
  onSelectNote,
  onQuickAddNote,
  onTogglePin,
}: WorkspaceNotesPaneProps) {
  const [quickTitle, setQuickTitle] = useState("");
  const [quickContent, setQuickContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

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
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full shrink-0 transition-all select-none">
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
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition cursor-pointer"
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
                        <h4 className="font-semibold text-xs text-gray-900 dark:text-gray-100 line-clamp-1">
                          {note.title || "Untitled Note"}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(note.id, note.isPinned);
                          }}
                          className={`p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${
                            note.isPinned ? "text-blue-600 dark:text-blue-400" : "text-gray-300 dark:text-gray-500 opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          <Pin className={`w-3 h-3 ${note.isPinned ? "fill-blue-600 dark:fill-blue-400" : ""}`} />
                        </button>
                      </div>

                      <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                        {note.previewText || "Empty note"}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
                        <span className="text-[9px] font-mono opacity-60">Drag to board/calendar</span>
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
