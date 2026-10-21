export const TRASH_RETENTION_DAYS = 15;
export const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Calculates remaining days before an item in trash is automatically deleted.
 * Returns an integer between 0 and 15.
 */
export function getTrashRemainingDays(trashedAt: any): number {
  if (!trashedAt) return TRASH_RETENTION_DAYS;

  let trashedMs = 0;
  if (trashedAt?.toMillis && typeof trashedAt.toMillis === "function") {
    trashedMs = trashedAt.toMillis();
  } else if (trashedAt?.seconds) {
    trashedMs = trashedAt.seconds * 1000;
  } else if (typeof trashedAt === "string" || typeof trashedAt === "number") {
    trashedMs = new Date(trashedAt).getTime();
  } else if (trashedAt instanceof Date) {
    trashedMs = trashedAt.getTime();
  }

  if (!trashedMs || isNaN(trashedMs)) return TRASH_RETENTION_DAYS;

  const diffMs = Date.now() - trashedMs;
  const daysPassed = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(0, TRASH_RETENTION_DAYS - daysPassed);
}

/**
 * Checks if a trashed item is older than 15 days and should be auto-purged.
 */
export function isTrashExpired(trashedAt: any): boolean {
  if (!trashedAt) return false;

  let trashedMs = 0;
  if (trashedAt?.toMillis && typeof trashedAt.toMillis === "function") {
    trashedMs = trashedAt.toMillis();
  } else if (trashedAt?.seconds) {
    trashedMs = trashedAt.seconds * 1000;
  } else if (typeof trashedAt === "string" || typeof trashedAt === "number") {
    trashedMs = new Date(trashedAt).getTime();
  } else if (trashedAt instanceof Date) {
    trashedMs = trashedAt.getTime();
  }

  if (!trashedMs || isNaN(trashedMs)) return false;

  return Date.now() - trashedMs >= TRASH_RETENTION_MS;
}

/**
 * Formats trashed date into a readable string like "Oct 21, 2026"
 */
export function formatTrashedDate(trashedAt: any): string {
  if (!trashedAt) return "Recently";

  let date: Date | null = null;
  if (trashedAt?.toMillis && typeof trashedAt.toMillis === "function") {
    date = new Date(trashedAt.toMillis());
  } else if (trashedAt?.seconds) {
    date = new Date(trashedAt.seconds * 1000);
  } else if (typeof trashedAt === "string" || typeof trashedAt === "number") {
    date = new Date(trashedAt);
  } else if (trashedAt instanceof Date) {
    date = trashedAt;
  }

  if (!date || isNaN(date.getTime())) return "Recently";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
