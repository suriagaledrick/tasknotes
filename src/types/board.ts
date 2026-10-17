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
}

export interface BoardColumn {
  id: string;
  title: string;
  position: number;
  tasks: Task[];
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  columns: BoardColumn[];
  createdAt: any;
  updatedAt: any;
}

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
