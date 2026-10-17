"use client";

import React, { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Highlight } from "@tiptap/extension-highlight";
import { Link } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  ChevronDown,
  List,
  ListOrdered,
  CheckSquare,
  Columns,
  Table as TableIcon,
  Highlighter,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import { NoteColor, NOTE_COLORS } from "@/types/note";

interface RichTextEditorProps {
  initialContent?: string;
  initialTitle?: string;
  initialColor?: NoteColor;
  initialColumns?: 1 | 2 | 3;
  onChange?: (data: { title: string; content: string; previewText: string; color: NoteColor; columnCount: 1 | 2 | 3 }) => void;
  onSave?: (data: { title: string; content: string; previewText: string; color: NoteColor; columnCount: 1 | 2 | 3 }) => void;
}

export default function RichTextEditor({
  initialContent = "",
  initialTitle = "",
  initialColor = "default",
  initialColumns = 1,
  onChange,
  onSave,
}: RichTextEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [selectedColor, setSelectedColor] = useState<NoteColor>(initialColor);
  const [columnCount, setColumnCount] = useState<1 | 2 | 3>(initialColumns);

  // Dropdown states
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [highlightMenuOpen, setHighlightMenuOpen] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);

  // Table grid hover state (5x5 matrix)
  const [hoveredRow, setHoveredRow] = useState(0);
  const [hoveredCol, setHoveredCol] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 dark:text-blue-400 underline cursor-pointer",
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange({
          title,
          content: editor.getHTML(),
          previewText: editor.getText().slice(0, 160),
          color: selectedColor,
          columnCount,
        });
      }
    },
  });

  // Keep editor content synced if initialContent changes
  useEffect(() => {
    if (editor && initialContent && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  // Sync title
  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  // Sync color
  useEffect(() => {
    setSelectedColor(initialColor);
  }, [initialColor]);

  // Sync columns
  useEffect(() => {
    setColumnCount(initialColumns);
  }, [initialColumns]);

  if (!editor) {
    return (
      <div className="p-8 text-center text-gray-400">Loading editor...</div>
    );
  }

  // Get current active style label for H1 dropdown
  const getCurrentStyleLabel = () => {
    if (editor.isActive("heading", { level: 1 })) return "Title";
    if (editor.isActive("heading", { level: 2 })) return "Subtitle";
    if (editor.isActive("heading", { level: 3 })) return "Heading";
    if (editor.isActive("heading", { level: 4 })) return "Subheading";
    if (editor.isActive("heading", { level: 5 })) return "Section";
    if (editor.isActive("heading", { level: 6 })) return "Subsection";
    return "Body";
  };

  const handleStyleSelect = (level: number | "body") => {
    if (level === "body") {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: level as any }).run();
    }
    setHeadingMenuOpen(false);
  };

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter link URL:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setTableMenuOpen(false);
  };

  const handleColorChange = (newColor: NoteColor) => {
    setSelectedColor(newColor);
    setColorMenuOpen(false);
    if (onChange && editor) {
      onChange({
        title,
        content: editor.getHTML(),
        previewText: editor.getText().slice(0, 160),
        color: newColor,
        columnCount,
      });
    }
  };

  const handleColumnChange = (cols: 1 | 2 | 3) => {
    setColumnCount(cols);
    setColumnMenuOpen(false);
    if (onChange && editor) {
      onChange({
        title,
        content: editor.getHTML(),
        previewText: editor.getText().slice(0, 160),
        color: selectedColor,
        columnCount: cols,
      });
    }
  };

  const colorConfig = NOTE_COLORS.find((c) => c.id === selectedColor) || NOTE_COLORS[0];

  return (
    <div className={`rounded-xl border shadow-sm transition-all overflow-hidden ${colorConfig.bgClass} ${colorConfig.darkBgClass} ${colorConfig.borderClass} ${colorConfig.darkBorderClass || "dark:border-neutral-700"}`}>
      {/* Top Toolbar matching user's design reference */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-neutral-900 text-neutral-200 border-b border-neutral-800 text-sm">
        {/* 1. Hierarchy / Headings Dropdown (Image 1: Title, Subtitle, Heading, Subheading, Section, Subsection, Body) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setHeadingMenuOpen(!headingMenuOpen);
              setListMenuOpen(false);
              setTableMenuOpen(false);
              setColumnMenuOpen(false);
              setHighlightMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-xs font-medium transition"
          >
            <span>{getCurrentStyleLabel()}</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {headingMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl py-1 z-50">
              <button
                type="button"
                onClick={() => handleStyleSelect(1)}
                className={`w-full text-left px-3 py-2 text-base font-bold hover:bg-neutral-800 transition ${
                  editor.isActive("heading", { level: 1 }) ? "text-blue-400 bg-neutral-800/60" : "text-neutral-100"
                }`}
              >
                Title
              </button>
              <button
                type="button"
                onClick={() => handleStyleSelect(2)}
                className={`w-full text-left px-3 py-1.5 text-sm font-semibold hover:bg-neutral-800 transition ${
                  editor.isActive("heading", { level: 2 }) ? "text-blue-400 bg-neutral-800/60" : "text-neutral-200"
                }`}
              >
                Subtitle
              </button>
              <button
                type="button"
                onClick={() => handleStyleSelect(3)}
                className={`w-full text-left px-3 py-1.5 text-sm font-medium hover:bg-neutral-800 transition ${
                  editor.isActive("heading", { level: 3 }) ? "text-blue-400 bg-neutral-800/60" : "text-neutral-200"
                }`}
              >
                Heading
              </button>
              <button
                type="button"
                onClick={() => handleStyleSelect(4)}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 transition ${
                  editor.isActive("heading", { level: 4 }) ? "text-blue-400 bg-neutral-800/60" : "text-neutral-300"
                }`}
              >
                Subheading
              </button>
              <button
                type="button"
                onClick={() => handleStyleSelect(5)}
                className={`w-full text-left px-3 py-1.5 text-xs uppercase tracking-wider font-semibold hover:bg-neutral-800 transition ${
                  editor.isActive("heading", { level: 5 }) ? "text-blue-400 bg-neutral-800/60" : "text-neutral-400"
                }`}
              >
                Section
              </button>
              <button
                type="button"
                onClick={() => handleStyleSelect(6)}
                className={`w-full text-left px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-800 transition ${
                  editor.isActive("heading", { level: 6 }) ? "text-blue-400 bg-neutral-800/60" : "text-neutral-400"
                }`}
              >
                Subsection
              </button>
              <div className="h-px bg-neutral-800 my-1" />
              <button
                type="button"
                onClick={() => handleStyleSelect("body")}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-800 transition ${
                  editor.isActive("paragraph") ? "text-blue-400 bg-neutral-800/60" : "text-neutral-300"
                }`}
              >
                Body
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-neutral-800 mx-0.5" />

        {/* 2. Lists Dropdown (Image 1: Bulleted, Numbered, Checklist) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setListMenuOpen(!listMenuOpen);
              setHeadingMenuOpen(false);
              setTableMenuOpen(false);
              setColumnMenuOpen(false);
              setHighlightMenuOpen(false);
            }}
            className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-neutral-800 text-xs transition"
          >
            <List className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {listMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl py-1 z-50">
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleBulletList().run();
                  setListMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-neutral-800 ${
                  editor.isActive("bulletList") ? "text-blue-400 bg-neutral-800/60" : "text-neutral-200"
                }`}
              >
                <List className="w-4 h-4 text-neutral-400" />
                Bulleted List
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleOrderedList().run();
                  setListMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-neutral-800 ${
                  editor.isActive("orderedList") ? "text-blue-400 bg-neutral-800/60" : "text-neutral-200"
                }`}
              >
                <ListOrdered className="w-4 h-4 text-neutral-400" />
                Numbered List
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleTaskList().run();
                  setListMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-neutral-800 ${
                  editor.isActive("taskList") ? "text-blue-400 bg-neutral-800/60" : "text-neutral-200"
                }`}
              >
                <CheckSquare className="w-4 h-4 text-neutral-400" />
                Task / Checklist
              </button>
            </div>
          )}
        </div>

        {/* 3. Basic Formatting Buttons: Bold, Italic, Strikethrough, Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-neutral-800 transition ${
            editor.isActive("bold") ? "text-blue-400 bg-neutral-800" : "text-neutral-200"
          }`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-neutral-800 transition ${
            editor.isActive("italic") ? "text-blue-400 bg-neutral-800" : "text-neutral-200"
          }`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded hover:bg-neutral-800 transition ${
            editor.isActive("strike") ? "text-blue-400 bg-neutral-800" : "text-neutral-200"
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-neutral-800 transition ${
            editor.isActive("underline") ? "text-blue-400 bg-neutral-800" : "text-neutral-200"
          }`}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleSetLink}
          className={`p-1.5 rounded hover:bg-neutral-800 transition ${
            editor.isActive("link") ? "text-blue-400 bg-neutral-800" : "text-neutral-200"
          }`}
          title="Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-0.5" />

        {/* 4. Table Grid Selector (Image 2: 5x5 Matrix Hover Selector) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setTableMenuOpen(!tableMenuOpen);
              setHeadingMenuOpen(false);
              setListMenuOpen(false);
              setColumnMenuOpen(false);
              setHighlightMenuOpen(false);
            }}
            className={`flex items-center gap-1 px-2 py-1.5 rounded hover:bg-neutral-800 text-xs transition ${
              editor.isActive("table") ? "text-blue-400 bg-neutral-800" : "text-neutral-200"
            }`}
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {tableMenuOpen && (
            <div className="absolute left-0 top-full mt-1 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-3 z-50 w-64">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-300">Insert table</span>
                <span className="text-xs font-mono text-neutral-400">
                  {hoveredRow > 0 && hoveredCol > 0 ? `${hoveredRow} × ${hoveredCol}` : "Choose size"}
                </span>
              </div>

              {/* 5x5 Grid matrix matching image 2 */}
              <div
                className="grid grid-cols-5 gap-1.5 p-2 bg-neutral-950/70 rounded-lg border border-neutral-800 mb-3"
                onMouseLeave={() => {
                  setHoveredRow(0);
                  setHoveredCol(0);
                }}
              >
                {Array.from({ length: 5 }).map((_, rIdx) => {
                  const r = rIdx + 1;
                  return Array.from({ length: 5 }).map((_, cIdx) => {
                    const c = cIdx + 1;
                    const isHovered = r <= hoveredRow && c <= hoveredCol;
                    return (
                      <div
                        key={`${r}-${c}`}
                        onMouseEnter={() => {
                          setHoveredRow(r);
                          setHoveredCol(c);
                        }}
                        onClick={() => insertTable(r, c)}
                        className={`w-7 h-7 rounded border cursor-pointer transition-all ${
                          isHovered
                            ? "bg-blue-600/50 border-blue-400 scale-105"
                            : "bg-neutral-800/50 border-neutral-700 hover:border-neutral-500"
                        }`}
                      />
                    );
                  });
                })}
              </div>

              {/* Table Action Controls if inside a table */}
              {editor.isActive("table") && (
                <div className="border-t border-neutral-800 pt-2 space-y-1 text-xs">
                  <div className="font-semibold text-neutral-400 px-1 pb-1">Edit table:</div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().addRowAfter().run()}
                      className="px-2 py-1 text-left rounded hover:bg-neutral-800 text-neutral-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-neutral-400" /> Add row
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().addColumnAfter().run()}
                      className="px-2 py-1 text-left rounded hover:bg-neutral-800 text-neutral-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-neutral-400" /> Add col
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().deleteRow().run()}
                      className="px-2 py-1 text-left rounded hover:bg-neutral-800 text-red-300 flex items-center gap-1"
                    >
                      <Minus className="w-3 h-3" /> Del row
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().deleteColumn().run()}
                      className="px-2 py-1 text-left rounded hover:bg-neutral-800 text-red-300 flex items-center gap-1"
                    >
                      <Minus className="w-3 h-3" /> Del col
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().deleteTable().run();
                      setTableMenuOpen(false);
                    }}
                    className="w-full mt-1 px-2 py-1 text-left rounded hover:bg-red-950/40 text-red-400 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove whole table
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Docs/Word Column Style (1 col, 2 cols, 3 cols) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setColumnMenuOpen(!columnMenuOpen);
              setHeadingMenuOpen(false);
              setListMenuOpen(false);
              setTableMenuOpen(false);
              setHighlightMenuOpen(false);
            }}
            className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-neutral-800 text-xs transition text-neutral-200"
            title="Columns Style (Docs/Word)"
          >
            <Columns className="w-4 h-4" />
            <span className="text-[11px] font-mono">{columnCount} Col</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {columnMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl py-1 z-50 text-xs">
              <div className="px-3 py-1 font-semibold text-neutral-400 text-[11px] uppercase">Column Layout</div>
              <button
                type="button"
                onClick={() => handleColumnChange(1)}
                className={`w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-800 ${
                  columnCount === 1 ? "text-blue-400 bg-neutral-800/60 font-medium" : "text-neutral-200"
                }`}
              >
                <span>1 Column (Standard)</span>
                {columnCount === 1 && <span>✓</span>}
              </button>
              <button
                type="button"
                onClick={() => handleColumnChange(2)}
                className={`w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-800 ${
                  columnCount === 2 ? "text-blue-400 bg-neutral-800/60 font-medium" : "text-neutral-200"
                }`}
              >
                <span>2 Columns (Docs/Word)</span>
                {columnCount === 2 && <span>✓</span>}
              </button>
              <button
                type="button"
                onClick={() => handleColumnChange(3)}
                className={`w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-800 ${
                  columnCount === 3 ? "text-blue-400 bg-neutral-800/60 font-medium" : "text-neutral-200"
                }`}
              >
                <span>3 Columns (Magazine)</span>
                {columnCount === 3 && <span>✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* 6. Highlighter / Text Color Picker (Image 2: Ab ✎) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setHighlightMenuOpen(!highlightMenuOpen);
              setHeadingMenuOpen(false);
              setListMenuOpen(false);
              setTableMenuOpen(false);
              setColumnMenuOpen(false);
            }}
            className={`p-1.5 rounded hover:bg-neutral-800 transition ${
              editor.isActive("highlight") ? "text-amber-400 bg-neutral-800" : "text-neutral-200"
            }`}
            title="Text Highlight"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          {highlightMenuOpen && (
            <div className="absolute left-0 top-full mt-1 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl p-2 z-50 flex items-center gap-1.5">
              {[
                { name: "Yellow", color: "#fef08a" },
                { name: "Green", color: "#bbf7d0" },
                { name: "Cyan", color: "#a5f3fc" },
                { name: "Pink", color: "#fbcfe8" },
                { name: "Orange", color: "#fed7aa" },
              ].map((item) => (
                <button
                  key={item.color}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color: item.color }).run();
                    setHighlightMenuOpen(false);
                  }}
                  className="w-5 h-5 rounded-full border border-neutral-700 hover:scale-110 transition"
                  style={{ backgroundColor: item.color }}
                  title={item.name}
                />
              ))}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setHighlightMenuOpen(false);
                }}
                className="text-[10px] text-neutral-400 hover:text-white px-1.5 py-0.5 rounded border border-neutral-800 hover:bg-neutral-800"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* 7. Google Keep Note Background Palette Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setColorMenuOpen(!colorMenuOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300"
            title="Note Color"
          >
            <span className="w-3 h-3 rounded-full border border-neutral-600" style={{ backgroundColor: colorConfig.bgClass.includes("white") ? "#fff" : undefined }} />
            <span className="hidden sm:inline">{colorConfig.name}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {colorMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-3 z-50 grid grid-cols-6 gap-2 w-52">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleColorChange(c.id)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    selectedColor === c.id ? "border-blue-500 scale-110 ring-2 ring-blue-400/40" : "border-neutral-700"
                  }`}
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

        {/* Save button if onSave provided */}
        {onSave && (
          <button
            type="button"
            onClick={() => {
              onSave({
                title,
                content: editor.getHTML(),
                previewText: editor.getText().slice(0, 160),
                color: selectedColor,
                columnCount,
              });
            }}
            className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1 rounded text-xs transition"
          >
            Save
          </button>
        )}
      </div>

      {/* Editor Content Area */}
      <div className="p-6 md:p-8">
        {/* Note Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (onChange && editor) {
              onChange({
                title: e.target.value,
                content: editor.getHTML(),
                previewText: editor.getText().slice(0, 160),
                color: selectedColor,
                columnCount,
              });
            }
          }}
          placeholder="Title"
          className="w-full text-2xl md:text-3xl font-bold bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 mb-4 text-gray-900 dark:text-neutral-100 border-none p-0 focus:ring-0"
        />

        {/* Multi-column wrapper for Docs/Word column style */}
        <div className={`doc-columns-${columnCount} transition-all`}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
