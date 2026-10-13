export type ProgressMotivationStatus = "reached" | "overdue" | "deadline" | "ahead" | "onTrack" | "start";

export function getProgressMotivationStatus(percent: number, days: number | null): ProgressMotivationStatus {
  if (percent >= 100) return "reached";
  if (days != null && days < 0) return "overdue";
  if (days != null && days <= 7 && percent < 80) return "deadline";
  if (percent >= 75) return "ahead";
  if (percent >= 35) return "onTrack";
  return "start";
}
