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

export const NOTE_COLORS: { id: NoteColor; name: string; bgClass: string; borderClass: string; darkBgClass: string }[] = [
  { id: "default", name: "Default", bgClass: "bg-white", borderClass: "border-gray-200", darkBgClass: "bg-neutral-800" },
  { id: "coral", name: "Coral", bgClass: "bg-red-50", borderClass: "border-red-200", darkBgClass: "bg-red-950/40" },
  { id: "peach", name: "Peach", bgClass: "bg-orange-50", borderClass: "border-orange-200", darkBgClass: "bg-orange-950/40" },
  { id: "sand", name: "Sand", bgClass: "bg-amber-50", borderClass: "border-amber-200", darkBgClass: "bg-amber-950/40" },
  { id: "mint", name: "Mint", bgClass: "bg-emerald-50", borderClass: "border-emerald-200", darkBgClass: "bg-emerald-950/40" },
  { id: "sage", name: "Sage", bgClass: "bg-green-50", borderClass: "border-green-200", darkBgClass: "bg-green-950/40" },
  { id: "fog", name: "Fog", bgClass: "bg-cyan-50", borderClass: "border-cyan-200", darkBgClass: "bg-cyan-950/40" },
  { id: "storm", name: "Storm", bgClass: "bg-blue-50", borderClass: "border-blue-200", darkBgClass: "bg-blue-950/40" },
  { id: "dusk", name: "Dusk", bgClass: "bg-indigo-50", borderClass: "border-indigo-200", darkBgClass: "bg-indigo-950/40" },
  { id: "blossom", name: "Blossom", bgClass: "bg-purple-50", borderClass: "border-purple-200", darkBgClass: "bg-purple-950/40" },
  { id: "clay", name: "Clay", bgClass: "bg-stone-100", borderClass: "border-stone-200", darkBgClass: "bg-stone-900" },
];
