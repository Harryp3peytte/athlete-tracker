const MET_VALUES: Record<string, number> = {
  walking: 3.5,
  running: 9.8,
  cycling: 7.5,
  swimming: 6.0,
  hiit: 8.0,
  other: 5.0,
  musculation: 5.0,
  musculation_light: 3.5,
  musculation_heavy: 6.5,
};

export function estimateCalories(
  activityType: string,
  durationMinutes: number,
  weightKg: number
): number {
  const met = MET_VALUES[activityType] || 5.0;
  const durationHours = durationMinutes / 60;
  return Math.round(met * weightKg * durationHours);
}

export function getMET(activityType: string): number {
  return MET_VALUES[activityType] || 5.0;
}
