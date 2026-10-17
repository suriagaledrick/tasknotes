"use client";

import React, { useState } from "react";
import { Note, NOTE_COLORS, NoteColor } from "@/types/note";
import { Pin, Trash2, Palette, Columns, CheckSquare } from "lucide-react";

interface NoteCardProps {
  note: Note;
  onSelect: (note: Note) => void;
  onTogglePin: (noteId: string, currentPin: boolean) => void;
  onChangeColor: (noteId: string, color: NoteColor) => void;
  onDelete: (noteId: string) => void;
}

export default function NoteCard({
  note,
  onSelect,
  onTogglePin,
  onChangeColor,
  onDelete,
}: NoteCardProps) {
  const [showPalette, setShowPalette] = useState(false);
  const colorConfig = NOTE_COLORS.find((c) => c.id === note.color) || NOTE_COLORS[0];

  return (
    <div
      onClick={() => onSelect(note)}
      className={`group relative rounded-xl border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${colorConfig.bgClass} dark:${colorConfig.darkBgClass} ${colorConfig.borderClass} dark:border-gray-700/80`}
    >
      <div>
        {/* Card Header: Title & Pin button */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base line-clamp-2">
            {note.title || "Untitled Note"}
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id, note.isPinned);
            }}
            className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition ${
              note.isPinned ? "text-blue-600 dark:text-blue-400 opacity-100" : "text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100"
            }`}
            title={note.isPinned ? "Unpin note" : "Pin note"}
          >
            <Pin className={`w-4 h-4 ${note.isPinned ? "fill-blue-600 dark:fill-blue-400" : ""}`} />
          </button>
        </div>

        {/* Content Snippet / Preview */}
        <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-6 whitespace-pre-wrap mb-4">
          {note.previewText || (
            <div
              className="text-xs text-gray-500 dark:text-gray-400 line-clamp-4 pointer-events-none"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          )}
        </div>
      </div>

      {/* Card Footer: Metadata and Action icons */}
      <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          {note.columnCount > 1 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[11px] font-medium text-gray-600 dark:text-gray-300">
              <Columns className="w-3 h-3" /> {note.columnCount} Cols
            </span>
          )}
        </div>

        {/* Action Buttons (Google Keep style on card hover) */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Color Palette Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPalette(!showPalette)}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition"
              title="Change color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {showPalette && (
              <div className="absolute bottom-full right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 z-50 grid grid-cols-6 gap-1 w-44">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onChangeColor(note.id, c.id);
                      setShowPalette(false);
                    }}
                    className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 hover:scale-110 transition"
                    style={{
                      backgroundColor:
                        c.id === "default" ? "#ffffff" :
                        c.id === "coral" ? "#fee2e2" :
                        c.id === "peach" ? "#ffedd5" :
                        c.id === "sand" ? "#fef3c7" :
                        c.id === "mint" ? "#d1fae5" :
                        c.id === "sage" ? "#dcfce7" :
                        c.id === "fog" ? "#cffafe" :
                        c.id === "storm" ? "#dbeafe" :
                        c.id === "dusk" ? "#e0e7ff" :
                        c.id === "blossom" ? "#f3e8ff" : "#f5f5f4",
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(note.id)}
            className="p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
            title="Delete note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
