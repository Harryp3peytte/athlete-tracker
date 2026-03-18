export function todayDate(): Date {
  return new Date(new Date().toISOString().split('T')[0]);
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function periodToDays(period: string): number {
  const map: Record<string, number> = {
    '7d': 7, '30d': 30, '90d': 90, '6m': 180, '1y': 365,
  };
  return map[period] || 30;
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
