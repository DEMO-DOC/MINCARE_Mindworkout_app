import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp, Activity, Moon, Heart, Brain, Zap } from 'lucide-react';

interface DashboardData {
  wellnessScore: number;
  moodCount: number;
  exercisesCompleted: number;
  avgStress: number;
  avgSleep: number;
  streakDays: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    wellnessScore: 50,
    moodCount: 0,
    exercisesCompleted: 0,
    avgStress: 0,
    avgSleep: 0,
    streakDays: 0,
  });
  const [dailyFlow, setDailyFlow] = useState<{ completed: boolean; tasks: string[] }>({
    completed: false,
    tasks: [],
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadDailyFlow();
    }
  }, [user]);

  const loadDashboardData = async () => {
    const [profile, moodEntries, mindgymProgress, stressReadings, sleepSessions] = await Promise.all([
      supabase.from('profiles').select('wellness_score').eq('id', user!.id).maybeSingle(),
      supabase.from('mood_entries').select('id').eq('user_id', user!.id),
      supabase.from('mindgym_progress').select('*').eq('user_id', user!.id).order('completed_at', { ascending: false }).limit(1),
      supabase.from('stress_readings').select('stress_level').eq('user_id', user!.id).order('recorded_at', { ascending: false }).limit(7),
      supabase.from('sleep_sessions').select('duration_minutes').eq('user_id', user!.id).order('sleep_start', { ascending: false }).limit(7),
    ]);

    const wellnessScore = profile.data?.wellness_score || 50;
    const moodCount = moodEntries.data?.length || 0;
    const exercisesCompleted = mindgymProgress.data?.[0]?.fitness_level || 0;
    const avgStress = stressReadings.data && stressReadings.data.length > 0
      ? Math.round(stressReadings.data.reduce((acc, r) => acc + r.stress_level, 0) / stressReadings.data.length)
      : 0;
    const avgSleep = sleepSessions.data && sleepSessions.data.length > 0
      ? Math.round(sleepSessions.data.reduce((acc, s) => acc + s.duration_minutes, 0) / sleepSessions.data.length / 60 * 10) / 10
      : 0;
    const streakDays = mindgymProgress.data?.[0]?.streak_count || 0;

    setData({
      wellnessScore,
      moodCount,
      exercisesCompleted,
      avgStress,
      avgSleep,
      streakDays,
    });

    const calculatedScore = Math.min(100, Math.round(
      (moodCount > 0 ? 20 : 0) +
      (exercisesCompleted > 0 ? 25 : 0) +
      (avgStress > 0 && avgStress <= 5 ? 20 : avgStress > 5 ? 10 : 0) +
      (avgSleep >= 7 && avgSleep <= 9 ? 25 : avgSleep > 0 ? 15 : 0) +
      (streakDays * 2)
    ));

    if (calculatedScore !== wellnessScore) {
      await supabase.from('profiles').update({ wellness_score: calculatedScore }).eq('id', user!.id);
      setData(prev => ({ ...prev, wellnessScore: calculatedScore }));
    }
  };

  const loadDailyFlow = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: routine } = await supabase
      .from('daily_routines')
      .select('*')
      .eq('user_id', user!.id)
      .eq('routine_date', today)
      .maybeSingle();

    if (routine) {
      setDailyFlow({
        completed: routine.completed,
        tasks: routine.routine_data.tasks || [],
      });
    } else {
      const defaultTasks = [
        'Morning mood check-in',
        'Complete one MindGym exercise',
        'Check stress levels',
        'Evening reflection',
      ];

      await supabase.from('daily_routines').insert({
        user_id: user!.id,
        routine_date: today,
        routine_data: { tasks: defaultTasks },
        completed: false,
      });

      setDailyFlow({ completed: false, tasks: defaultTasks });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'from-green-400 to-emerald-400';
    if (score >= 50) return 'from-yellow-400 to-orange-400';
    return 'from-red-400 to-pink-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 25) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <div className="space-y-6">
      <div className={`bg-gradient-to-br ${getScoreColor(data.wellnessScore)} rounded-2xl shadow-xl p-8 text-white`}>
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Zap className="w-8 h-8" />
          Your Wellness Dashboard
        </h2>

        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6 mb-6">
          <div className="text-sm font-medium mb-2">Overall Wellness Score</div>
          <div className="flex items-end gap-3">
            <div className="text-6xl font-bold">{data.wellnessScore}</div>
            <div className="text-2xl mb-2">/100</div>
          </div>
          <div className="mt-2 text-lg font-medium">{getScoreLabel(data.wellnessScore)}</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
            <Heart className="w-6 h-6 mb-2" />
            <div className="text-2xl font-bold">{data.moodCount}</div>
            <div className="text-sm opacity-90">Mood Entries</div>
          </div>

          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
            <Brain className="w-6 h-6 mb-2" />
            <div className="text-2xl font-bold">{data.exercisesCompleted}</div>
            <div className="text-sm opacity-90">Fitness Level</div>
          </div>

          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
            <Activity className="w-6 h-6 mb-2" />
            <div className="text-2xl font-bold">{data.avgStress || '-'}</div>
            <div className="text-sm opacity-90">Avg Stress</div>
          </div>

          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
            <Moon className="w-6 h-6 mb-2" />
            <div className="text-2xl font-bold">{data.avgSleep || '-'}h</div>
            <div className="text-sm opacity-90">Avg Sleep</div>
          </div>

          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
            <TrendingUp className="w-6 h-6 mb-2" />
            <div className="text-2xl font-bold">{data.streakDays}</div>
            <div className="text-sm opacity-90">Day Streak</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-emerald-500" />
          Today's Daily Flow
        </h3>

        <div className="space-y-3">
          {dailyFlow.tasks.map((task, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
              <div className="w-6 h-6 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
              <span className="text-gray-800">{task}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <h4 className="font-semibold text-emerald-900 mb-2">Daily Balance Report</h4>
          <p className="text-sm text-emerald-800">
            {data.wellnessScore >= 75
              ? "You're doing great! Your wellness routine is balanced and consistent."
              : data.wellnessScore >= 50
              ? "Good progress! Consider adding more consistency to your routine."
              : "Let's work on building healthy habits. Start with one feature today!"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Insights</h3>
        <div className="space-y-3">
          {data.moodCount === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              Start tracking your mood to unlock personalized insights!
            </div>
          )}
          {data.avgStress >= 7 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
              Your stress levels are elevated. Try a breathing exercise from MindGym.
            </div>
          )}
          {data.avgSleep > 0 && data.avgSleep < 7 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
              You're averaging {data.avgSleep}h of sleep. Aim for 7-9 hours for optimal wellness.
            </div>
          )}
          {data.streakDays >= 7 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              Amazing! You've maintained a {data.streakDays}-day streak. Keep it up!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
