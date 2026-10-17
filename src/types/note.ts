export type NoteColor =
  | "default"
  | "coral"
  | "peach"
  | "sand"
  | "mint"
  | "sage"
  | "fog"
  | "storm"
  | "dusk"
  | "blossom"
  | "clay";

export interface Note {
  id: string;
  title: string;
  content: string; // HTML content from TipTap
  previewText?: string;
  color: NoteColor;
  columnCount: 1 | 2 | 3;
  isPinned: boolean;
  tags: string[];
  createdAt: any;
  updatedAt: any;
}

export const NOTE_COLORS: { id: NoteColor; name: string; bgClass: string; borderClass: string; darkBgClass: string; darkBorderClass: string }[] = [
  { id: "default", name: "Default", bgClass: "bg-white", borderClass: "border-gray-200", darkBgClass: "dark:bg-neutral-900", darkBorderClass: "dark:border-neutral-700" },
  { id: "coral", name: "Coral", bgClass: "bg-red-50", borderClass: "border-red-200", darkBgClass: "dark:bg-red-950", darkBorderClass: "dark:border-red-900/60" },
  { id: "peach", name: "Peach", bgClass: "bg-orange-50", borderClass: "border-orange-200", darkBgClass: "dark:bg-orange-950", darkBorderClass: "dark:border-orange-900/60" },
  { id: "sand", name: "Sand", bgClass: "bg-amber-50", borderClass: "border-amber-200", darkBgClass: "dark:bg-amber-950", darkBorderClass: "dark:border-amber-900/60" },
  { id: "mint", name: "Mint", bgClass: "bg-emerald-50", borderClass: "border-emerald-200", darkBgClass: "dark:bg-emerald-950", darkBorderClass: "dark:border-emerald-900/60" },
  { id: "sage", name: "Sage", bgClass: "bg-green-50", borderClass: "border-green-200", darkBgClass: "dark:bg-green-950", darkBorderClass: "dark:border-green-900/60" },
  { id: "fog", name: "Fog", bgClass: "bg-cyan-50", borderClass: "border-cyan-200", darkBgClass: "dark:bg-cyan-950", darkBorderClass: "dark:border-cyan-900/60" },
  { id: "storm", name: "Storm", bgClass: "bg-blue-50", borderClass: "border-blue-200", darkBgClass: "dark:bg-blue-950", darkBorderClass: "dark:border-blue-900/60" },
  { id: "dusk", name: "Dusk", bgClass: "bg-indigo-50", borderClass: "border-indigo-200", darkBgClass: "dark:bg-indigo-950", darkBorderClass: "dark:border-indigo-900/60" },
  { id: "blossom", name: "Blossom", bgClass: "bg-purple-50", borderClass: "border-purple-200", darkBgClass: "dark:bg-purple-950", darkBorderClass: "dark:border-purple-900/60" },
  { id: "clay", name: "Clay", bgClass: "bg-stone-100", borderClass: "border-stone-200", darkBgClass: "dark:bg-stone-900", darkBorderClass: "dark:border-stone-700" },
];
