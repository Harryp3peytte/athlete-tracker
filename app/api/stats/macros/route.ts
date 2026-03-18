import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAthleteId } from '@/lib/getAthlete';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dateStr = request.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('athlete_id', auth.athleteId)
    .eq('date', dateStr);

  const meals = data || [];
  const totals = {
    proteins: meals.reduce((s: number, m: { proteins: number }) => s + (m.proteins || 0), 0),
    carbs: meals.reduce((s: number, m: { carbs: number }) => s + (m.carbs || 0), 0),
    fats: meals.reduce((s: number, m: { fats: number }) => s + (m.fats || 0), 0),
    calories: meals.reduce((s: number, m: { calories: number }) => s + (m.calories || 0), 0),
  };

  const total = totals.proteins + totals.carbs + totals.fats;
  const ratios = total > 0 ? {
    proteins: Math.round((totals.proteins / total) * 100),
    carbs: Math.round((totals.carbs / total) * 100),
    fats: Math.round((totals.fats / total) * 100),
  } : { proteins: 0, carbs: 0, fats: 0 };

  return NextResponse.json({ totals, ratios, byMeal: meals });
}
