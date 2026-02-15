import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import HydrationCard from './HydrationCard'
import WellnessCard from './WellnessCard'

export default async function DashboardOverview({ athleteId }: { athleteId: string }) {
  const supabase = await createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  // Get today's data
  const [weightData, sleepData, hydrationData, wellnessData, nutritionData, cardioData] = await Promise.all([
    supabase.from('weight_logs').select('weight_kg').eq('athlete_id', athleteId).eq('date', today).single(),
    supabase.from('sleep_logs').select('hours, quality').eq('athlete_id', athleteId).eq('date', today).single(),
    supabase.from('hydration_logs').select('liters').eq('athlete_id', athleteId).eq('date', today),
    supabase.from('wellness_logs').select('form_score').eq('athlete_id', athleteId).eq('date', today).single(),
    supabase.from('nutrition_logs').select('calories').eq('athlete_id', athleteId).eq('date', today),
    supabase.from('cardio_logs').select('calories_burned').eq('athlete_id', athleteId).eq('date', today),
  ])

  const caloriesIn = nutritionData.data?.reduce((sum, log) => sum + log.calories, 0) || 0
  const caloriesOut = cardioData.data?.reduce((sum, log) => sum + log.calories_burned, 0) || 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Calories (In/Out)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{caloriesIn} / {caloriesOut}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Net: {caloriesIn - caloriesOut} kcal
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Sommeil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {sleepData.data?.hours ? `${sleepData.data.hours}h` : '—'}
          </div>
          {sleepData.data?.quality && (
            <p className="text-xs text-muted-foreground mt-1">
              Qualité: {sleepData.data.quality}/10
            </p>
          )}
        </CardContent>
      </Card>

      <HydrationCard liters={hydrationData.data?.length ? hydrationData.data.reduce((sum, log) => sum + (log.liters || 0), 0) : null} />

      <WellnessCard formScore={wellnessData.data?.form_score || null} />
    </div>
  )
}
