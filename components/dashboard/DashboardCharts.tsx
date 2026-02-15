'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import QuickAddDialog from './QuickAddDialog'
import WeightForm from './forms/WeightForm'
import NutritionForm from './forms/NutritionForm'
import CardioForm from './forms/CardioForm'
import SleepForm from './forms/SleepForm'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import { format, subDays } from 'date-fns'

function CryptoStyleTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: any[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-white/10 bg-black/90 px-3 py-2 text-xs shadow-xl backdrop-blur-md ring-1 ring-white/10">
      <div className="mb-1 text-[10px] font-medium text-gray-400">{label}</div>
      <div className="space-y-1">
        {payload.map((entry, idx) => {
          const color = entry.color || '#000000'
          const name = entry.name === 'in' ? 'In' : entry.name === 'out' ? 'Out' : entry.name
          return (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-300 font-medium capitalize">{name}</span>
              </div>
              <span className="font-bold text-white">{entry.value ?? '—'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  value,
  change,
  changePositive,
  children,
  icon,
  onAdd,
  gradient,
}: {
  title: string
  subtitle?: string
  value: string | number
  change?: string | number
  changePositive?: boolean
  children: React.ReactNode
  icon?: React.ReactNode
  onAdd?: () => void
  gradient?: string
}) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${gradient || 'from-white/5 to-white/0'} p-6 shadow-lg backdrop-blur-2xl transition-all hover:shadow-xl hover:shadow-black/20`}>
      {/* Glow effect sur les bords */}
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]" />

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white shadow-sm ring-1 ring-white/20">
              {icon}
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">{title}</div>
            {subtitle && (
              <div className="mt-0.5 text-[11px] font-medium text-gray-500">{subtitle}</div>
            )}
          </div>
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-400 shadow-sm ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white hover:shadow-md"
            aria-label="Ajouter des données"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 6v12m6-6H6"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Main value */}
      <div className="mb-6 flex items-baseline gap-3">
        <div className="text-4xl font-black tracking-tight text-white">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-bold ${changePositive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
            <span className="text-base">{changePositive ? '▲' : '▼'}</span>
            <span>{change}%</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-[200px] w-full">{children}</div>
    </div>
  )
}

export default function DashboardCharts({ athleteId }: { athleteId: string }) {
  const [weightData, setWeightData] = useState<any[]>([])
  const [caloriesData, setCaloriesData] = useState<any[]>([])
  const [calorieGoal, setCalorieGoal] = useState<number | null>(null)
  const [sleepData, setSleepData] = useState<any[]>([])
  const [period, setPeriod] = useState<'7' | '30' | 'all'>('7')
  const [activeModal, setActiveModal] = useState<'weight' | 'calories' | 'sleep' | null>(null)
  const [caloriesType, setCaloriesType] = useState<'nutrition' | 'cardio'>('nutrition')
  const [currentValues, setCurrentValues] = useState({
    weight: null as number | null,
    caloriesIn: 0,
    caloriesOut: 0,
    sleep: null as number | null,
  })
  const [changes, setChanges] = useState({
    weight: 0,
    calories: 0,
    sleep: 0,
  })

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const days = period === '7' ? 7 : period === '30' ? 30 : null
      const startDate = days ? format(subDays(new Date(), days - 1), 'yyyy-MM-dd') : null
      const today = format(new Date(), 'yyyy-MM-dd')

      // Athlete goal
      const { data: athleteData } = await supabase
        .from('athletes')
        .select('daily_calories_goal')
        .eq('id', athleteId)
        .single()

      if (athleteData) {
        setCalorieGoal(athleteData.daily_calories_goal)
      }

      // Weight data
      let weightQuery = supabase
        .from('weight_logs')
        .select('date, weight_kg')
        .eq('athlete_id', athleteId)
        .order('date', { ascending: true })

      if (startDate) {
        weightQuery = weightQuery.gte('date', startDate)
      }

      const { data: weight } = await weightQuery

      // Calories data
      let nutritionQuery = supabase
        .from('nutrition_logs')
        .select('date, calories')
        .eq('athlete_id', athleteId)

      if (startDate) {
        nutritionQuery = nutritionQuery.gte('date', startDate)
      }

      const { data: nutrition } = await nutritionQuery

      let cardioQuery = supabase
        .from('cardio_logs')
        .select('date, calories_burned')
        .eq('athlete_id', athleteId)

      if (startDate) {
        cardioQuery = cardioQuery.gte('date', startDate)
      }

      const { data: cardio } = await cardioQuery

      // Sleep data
      let sleepQuery = supabase
        .from('sleep_logs')
        .select('date, hours')
        .eq('athlete_id', athleteId)
        .order('date', { ascending: true })

      if (startDate) {
        sleepQuery = sleepQuery.gte('date', startDate)
      }

      const { data: sleep } = await sleepQuery

      // Process weight data
      const weightMap = new Map()
      weight?.forEach((log) => {
        weightMap.set(log.date, log.weight_kg)
      })

      let weightArray
      if (days) {
        weightArray = Array.from({ length: days }, (_, i) => {
          const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd')
          return {
            date: format(new Date(date), 'dd MMM'),
            fullDate: date,
            weight: weightMap.get(date) || null,
          }
        })
      } else {
        // All time - use all data points
        weightArray = weight?.map((log) => ({
          date: format(new Date(log.date), 'dd MMM'),
          fullDate: log.date,
          weight: log.weight_kg,
        })) || []
      }
      setWeightData(weightArray)

      const currentWeight = weightMap.get(today)
      const previousWeight = weightArray
        .filter((d) => d.weight !== null && d.fullDate !== today)
        .slice(-1)[0]?.weight
      if (currentWeight && previousWeight) {
        const change = ((currentWeight - previousWeight) / previousWeight) * 100
        setChanges((c) => ({ ...c, weight: change }))
      }
      setCurrentValues((v) => ({ ...v, weight: currentWeight || null }))

      // Process calories data
      const caloriesInMap = new Map<string, number>()
      const caloriesOutMap = new Map<string, number>()

      nutrition?.forEach((log) => {
        const current = caloriesInMap.get(log.date) || 0
        caloriesInMap.set(log.date, current + log.calories)
      })

      cardio?.forEach((log) => {
        const current = caloriesOutMap.get(log.date) || 0
        caloriesOutMap.set(log.date, current + log.calories_burned)
      })

      let caloriesArray
      if (days) {
        caloriesArray = Array.from({ length: days }, (_, i) => {
          const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd')
          return {
            date: format(new Date(date), 'dd MMM'),
            fullDate: date,
            in: caloriesInMap.get(date) || 0,
            out: caloriesOutMap.get(date) || 0,
          }
        })
      } else {
        // All time - use all unique dates
        const allDates = new Set([...caloriesInMap.keys(), ...caloriesOutMap.keys()])
        caloriesArray = Array.from(allDates).sort().map((date) => ({
          date: format(new Date(date), 'dd MMM'),
          fullDate: date,
          in: caloriesInMap.get(date) || 0,
          out: caloriesOutMap.get(date) || 0,
        }))
      }
      setCaloriesData(caloriesArray)

      const todayCaloriesIn = caloriesInMap.get(today) || 0
      const todayCaloriesOut = caloriesOutMap.get(today) || 0
      const yesterdayCalories = caloriesArray
        .filter((d) => d.fullDate !== today)
        .slice(-1)[0]
      if (yesterdayCalories) {
        const yesterdayTotal = yesterdayCalories.in - yesterdayCalories.out
        const todayTotal = todayCaloriesIn - todayCaloriesOut
        if (yesterdayTotal > 0) {
          const change = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100
          setChanges((c) => ({ ...c, calories: change }))
        }
      }
      setCurrentValues((v) => ({
        ...v,
        caloriesIn: todayCaloriesIn,
        caloriesOut: todayCaloriesOut,
      }))

      // Process sleep data
      const sleepMap = new Map()
      sleep?.forEach((log) => {
        sleepMap.set(log.date, log.hours)
      })

      let sleepArray
      if (days) {
        sleepArray = Array.from({ length: days }, (_, i) => {
          const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd')
          return {
            date: format(new Date(date), 'dd MMM'),
            fullDate: date,
            hours: sleepMap.get(date) || null,
          }
        })
      } else {
        // All time - use all data points
        sleepArray = sleep?.map((log) => ({
          date: format(new Date(log.date), 'dd MMM'),
          fullDate: log.date,
          hours: log.hours,
        })) || []
      }
      setSleepData(sleepArray)

      const currentSleep = sleepMap.get(today)
      const previousSleep = sleepArray
        .filter((d) => d.hours !== null && d.fullDate !== today)
        .slice(-1)[0]?.hours
      if (currentSleep && previousSleep) {
        const change = ((currentSleep - previousSleep) / previousSleep) * 100
        setChanges((c) => ({ ...c, sleep: change }))
      }
      setCurrentValues((v) => ({ ...v, sleep: currentSleep || null }))
    }

    fetchData()
  }, [athleteId, period])

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setPeriod('7')}
          className={`rounded-full px-5 py-2 text-xs font-bold transition-all duration-200 ${period === '7'
            ? 'bg-slate-800 text-white shadow-lg shadow-slate-200'
            : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
        >
          7 jours
        </button>
        <button
          onClick={() => setPeriod('30')}
          className={`rounded-full px-5 py-2 text-xs font-bold transition-all duration-200 ${period === '30'
            ? 'bg-slate-800 text-white shadow-lg shadow-slate-200'
            : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
        >
          30 jours
        </button>
        <button
          onClick={() => setPeriod('all')}
          className={`rounded-full px-5 py-2 text-xs font-bold transition-all duration-200 ${period === 'all'
            ? 'bg-slate-800 text-white shadow-lg shadow-slate-200'
            : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
        >
          Tout
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Poids */}
        <ChartCard
          title="Poids"
          subtitle="kg"
          value={currentValues.weight ? `${currentValues.weight.toFixed(1)} kg` : '—'}
          change={changes.weight !== 0 ? Math.abs(changes.weight).toFixed(2) : undefined}
          changePositive={changes.weight >= 0}
          onAdd={() => setActiveModal('weight')}
          gradient="from-emerald-900/20 via-black/40 to-black/40"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="50%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#1e293b"
              />
              <XAxis
                dataKey="fullDate"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 500 }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })
                }
              />
              <YAxis
                domain={['dataMin - 1', 'dataMax + 1']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                width={30}
              />
              <Tooltip content={<CryptoStyleTooltip />} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#ffffff"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#ffffff', strokeWidth: 2, stroke: '#ffffff', opacity: 1 }}
                strokeDasharray="0"
                style={{ filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.4))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Calories */}
        <ChartCard
          title="Calories"
          subtitle="kcal net"
          value={`${currentValues.caloriesIn - currentValues.caloriesOut}`}
          change={changes.calories !== 0 ? Math.abs(changes.calories).toFixed(2) : undefined}
          changePositive={changes.calories >= 0}
          onAdd={() => setActiveModal('calories')}
          gradient="from-orange-900/20 via-black/40 to-black/40"
        >
          <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg shadow-rose-500/50 ring-2 ring-rose-500/30" />
              <span className="text-gray-300">In</span>
              <span className="ml-1 font-bold text-white">{currentValues.caloriesIn}</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-500/30" />
              <span className="text-gray-300">Out</span>
              <span className="ml-1 font-bold text-white">{currentValues.caloriesOut}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={caloriesData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
              <defs>
                <linearGradient id="caloriesInGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="50%" stopColor="#f43f5e" stopOpacity={0.05} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="caloriesOutGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="50%" stopColor="#10b981" stopOpacity={0.05} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#1e293b"
              />
              <XAxis
                dataKey="fullDate"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 500 }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                  })
                }
              />
              <YAxis
                domain={[0, (dataMax: number) => Math.max(dataMax, (calorieGoal || 2000) * 1.1)]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                width={40}
              />
              <Tooltip content={<CryptoStyleTooltip />} />
              <Tooltip content={<CryptoStyleTooltip />} />
              <Area
                type="monotone"
                dataKey="in"
                stroke="#ff375f"
                strokeWidth={2.5}
                fill="url(#caloriesInGradient)"
                dot={false}
                activeDot={{ r: 6, fill: '#ff375f', strokeWidth: 2, stroke: '#ffffff', opacity: 1 }}
                name="in"
              />
              <Area
                type="monotone"
                dataKey="out"
                stroke="#00d4aa"
                strokeWidth={2.5}
                fill="url(#caloriesOutGradient)"
                dot={false}
                activeDot={{ r: 6, fill: '#00d4aa', strokeWidth: 2, stroke: '#ffffff', opacity: 1 }}
                name="out"
              />
              {calorieGoal && (
                <ReferenceLine
                  y={calorieGoal}
                  stroke="#ffffff"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    position: 'insideTopRight',
                    value: 'Objectif',
                    fill: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Sommeil */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Sommeil"
            subtitle="heures"
            value={currentValues.sleep ? `${currentValues.sleep.toFixed(1)}h` : '—'}
            change={changes.sleep !== 0 ? Math.abs(changes.sleep).toFixed(2) : undefined}
            changePositive={changes.sleep >= 0}
            onAdd={() => setActiveModal('sleep')}
            gradient="from-indigo-900/20 via-black/40 to-black/40"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sleepData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#1e293b"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 500 }}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                    })
                  }
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={false}
                  domain={[0, 12]}
                  hide
                />
                <Tooltip content={<CryptoStyleTooltip />} />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#0a84ff"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#0a84ff', strokeWidth: 2, stroke: '#ffffff', opacity: 1 }}
                  style={{ filter: 'drop-shadow(0 0 4px rgba(10, 132, 255, 0.5))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'weight' && (
        <QuickAddDialog
          title="Ajouter un poids"
          onClose={() => setActiveModal(null)}
        >
          <WeightForm onSuccess={() => setActiveModal(null)} />
        </QuickAddDialog>
      )}

      {activeModal === 'calories' && (
        <QuickAddDialog
          title="Ajouter des calories"
          onClose={() => setActiveModal(null)}
        >
          <div className="mb-6 flex gap-2 rounded-xl bg-white/5 p-1">
            <button
              onClick={() => setCaloriesType('nutrition')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${caloriesType === 'nutrition'
                ? 'bg-white/10 text-white shadow-lg'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
            >
              Nutrition (In)
            </button>
            <button
              onClick={() => setCaloriesType('cardio')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${caloriesType === 'cardio'
                ? 'bg-white/10 text-white shadow-lg'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
            >
              Cardio (Out)
            </button>
          </div>
          {caloriesType === 'nutrition' ? (
            <NutritionForm onSuccess={() => setActiveModal(null)} />
          ) : (
            <CardioForm onSuccess={() => setActiveModal(null)} />
          )}
        </QuickAddDialog>
      )}

      {activeModal === 'sleep' && (
        <QuickAddDialog
          title="Ajouter du sommeil"
          onClose={() => setActiveModal(null)}
        >
          <SleepForm onSuccess={() => setActiveModal(null)} />
        </QuickAddDialog>
      )}
    </div>
  )
}
