export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  priority?: TaskPriority;
  labels?: string[];
  createdAt?: any;
  updatedAt?: any;
  isArchived?: boolean;
  archivedAt?: any;
  isTrashed?: boolean;
  trashedAt?: any;
  boardId?: string;
  boardTitle?: string;
  columnId?: string;
  columnTitle?: string;
}

export interface BoardColumn {
  id: string;
  title: string;
  position: number;
  tasks: Task[];
}

export type BoardColor =
  | "default"
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "purple"
  | "indigo"
  | "pink"
  | "teal";

export interface Board {
  id: string;
  title: string;
  description?: string;
  color?: BoardColor | string;
  order?: number;
  columns: BoardColumn[];
  createdAt: any;
  updatedAt: any;
  isArchived?: boolean;
  archivedAt?: any;
  isTrashed?: boolean;
  trashedAt?: any;
}

export const BOARD_COLORS: {
  id: BoardColor;
  name: string;
  dotColor: string;
  activeBorder: string;
  badgeBg: string;
}[] = [
  { id: "default", name: "Default", dotColor: "bg-slate-400 dark:bg-slate-500", activeBorder: "border-slate-500", badgeBg: "bg-slate-100 dark:bg-slate-800" },
  { id: "blue", name: "Blue", dotColor: "bg-blue-500", activeBorder: "border-blue-500", badgeBg: "bg-blue-50 dark:bg-blue-950/50" },
  { id: "emerald", name: "Green", dotColor: "bg-emerald-500", activeBorder: "border-emerald-500", badgeBg: "bg-emerald-50 dark:bg-emerald-950/50" },
  { id: "amber", name: "Yellow", dotColor: "bg-amber-500", activeBorder: "border-amber-500", badgeBg: "bg-amber-50 dark:bg-amber-950/50" },
  { id: "rose", name: "Red", dotColor: "bg-rose-500", activeBorder: "border-rose-500", badgeBg: "bg-rose-50 dark:bg-rose-950/50" },
  { id: "purple", name: "Purple", dotColor: "bg-purple-500", activeBorder: "border-purple-500", badgeBg: "bg-purple-50 dark:bg-purple-950/50" },
  { id: "indigo", name: "Indigo", dotColor: "bg-indigo-500", activeBorder: "border-indigo-500", badgeBg: "bg-indigo-50 dark:bg-indigo-950/50" },
  { id: "pink", name: "Pink", dotColor: "bg-pink-500", activeBorder: "border-pink-500", badgeBg: "bg-pink-50 dark:bg-pink-950/50" },
  { id: "teal", name: "Teal", dotColor: "bg-teal-500", activeBorder: "border-teal-500", badgeBg: "bg-teal-50 dark:bg-teal-950/50" },
];

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  low: {
    label: "Low",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
    borderClass: "border-blue-200",
  },
  medium: {
    label: "Medium",
    bgClass: "bg-yellow-50",
    textClass: "text-yellow-700",
    borderClass: "border-yellow-200",
  },
  high: {
    label: "High",
    bgClass: "bg-orange-50",
    textClass: "text-orange-700",
    borderClass: "border-orange-200",
  },
  urgent: {
    label: "Urgent",
    bgClass: "bg-red-50",
    textClass: "text-red-700",
    borderClass: "border-red-200",
  },
};

export const PRESET_LABELS = [
  { name: "Feature", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { name: "Bug", color: "bg-red-100 text-red-700 border-red-200" },
  { name: "Design", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { name: "Research", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { name: "Urgent", color: "bg-rose-100 text-rose-700 border-rose-200" },
  { name: "Personal", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
];
