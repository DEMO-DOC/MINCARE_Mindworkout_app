import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Brain, Flame, Trophy, Play, Check } from 'lucide-react';
import { Card } from '@/components/ui/card'; // ✅ assuming you’re using shadcn/ui

interface Exercise {
  id: string;
  name: string;
  type: string;
  difficulty_level: number;
  description: string;
  duration_seconds: number;
  premium_only: boolean;
}

interface UserProgress {
  streak_count: number;
  fitness_level: number;
  total_completed: number;
}

export function MindGym() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [progress, setProgress] = useState<UserProgress>({ streak_count: 0, fitness_level: 1, total_completed: 0 });
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    if (user) {
      loadExercises();
      loadProgress();
    }
  }, [user]);

  const loadExercises = async () => {
    const { data, error } = await supabase
      .from('mindgym_exercises')
      .select('*')
      .order('difficulty_level');

    if (!error && data) setExercises(data);
    setLoading(false);
  };

  const loadProgress = async () => {
    const { data, error } = await supabase
      .from('mindgym_progress')
      .select('*')
      .eq('user_id', user!.id)
      .order('completed_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const latest = data[0];
      setProgress({
        streak_count: latest.streak_count,
        fitness_level: latest.fitness_level,
        total_completed: data.length,
      });
    }
  };

  const completeExercise = async (exerciseId: string, score: number) => {
    const newFitnessLevel = Math.min(100, progress.fitness_level + 1);
    const newStreak = progress.streak_count + 1;

    await supabase.from('mindgym_progress').insert({
      user_id: user!.id,
      exercise_id: exerciseId,
      score,
      streak_count: newStreak,
      fitness_level: newFitnessLevel,
    });

    setProgress({
      streak_count: newStreak,
      fitness_level: newFitnessLevel,
      total_completed: progress.total_completed + 1,
    });

    setActiveExercise(null); // close the exercise view
  };

  const filteredExercises =
    selectedType === 'all'
      ? exercises
      : exercises.filter((e) => e.type === selectedType);

  const exerciseTypes = [
    { value: 'all', label: 'All', icon: Brain },
    { value: 'breathing', label: 'Breathing', icon: Brain },
    { value: 'meditation', label: 'Meditation', icon: Brain },
    { value: 'focus', label: 'Focus', icon: Brain },
    { value: 'challenge', label: 'Challenge', icon: Trophy },
  ];

  // ✅ Breathing Timer Component
  const BreathingTimer = ({ duration, onComplete }: { duration: number; onComplete: () => void }) => {
    const [seconds, setSeconds] = useState(duration);
    const [isActive, setIsActive] = useState(false);
    const totalSeconds = duration;

    useEffect(() => {
      let interval: NodeJS.Timeout | null = null;

      if (isActive && seconds > 0) {
        interval = setInterval(() => {
          setSeconds((s) => s - 1);
        }, 1000);
      } else if (seconds === 0) {
        setIsActive(false);
        onComplete();
      }

      return () => {
        if (interval) clearInterval(interval);
      };
    }, [isActive, seconds]);

    const toggle = () => {
      setIsActive(!isActive);
      console.log(isActive ? 'Timer paused' : 'Timer started');
    };

    const reset = () => {
      setSeconds(duration);
      setIsActive(false);
      console.log('Timer reset');
    };

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const progress = ((totalSeconds - seconds) / totalSeconds) * 100;

    return (
      <Card className="p-8 mt-6 text-center">
        <h2 className="text-xl font-semibold mb-6" data-testid="text-timer-title">
          Breathing Exercise
        </h2>

        <div className="flex flex-col items-center space-y-6">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                className="text-primary transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-semibold tabular-nums" data-testid="text-timer-display">
                {minutes}:{remainingSeconds.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={toggle}
              className="px-6 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
            >
              {isActive ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={reset}
              className="px-6 py-2 bg-gray-200 rounded-xl font-medium hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* --- Header / Stats --- */}
      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Brain className="w-8 h-8" />
          MindGym
        </h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5" />
              <span className="text-sm font-medium">Streak</span>
            </div>
            <div className="text-3xl font-bold">{progress.streak_count}</div>
            <div className="text-xs opacity-90">days in a row</div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium">Level</span>
            </div>
            <div className="text-3xl font-bold">{progress.fitness_level}</div>
            <div className="text-xs opacity-90">mental fitness</div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <div className="text-3xl font-bold">{progress.total_completed}</div>
            <div className="text-xs opacity-90">total exercises</div>
          </div>
        </div>
      </div>

      {/* --- Exercise Type Filters --- */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {exerciseTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedType === type.value
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* --- Exercise List or Active Exercise --- */}
      <div className="grid gap-4">
        {activeExercise ? (
          <BreathingTimer
            duration={activeExercise.duration_seconds}
            onComplete={() => completeExercise(activeExercise.id, Math.floor(Math.random() * 40) + 60)}
          />
        ) : loading ? (
          <div className="text-center py-12 text-gray-500">Loading exercises...</div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No exercises found</div>
        ) : (
          filteredExercises.map((exercise) => (
            <div key={exercise.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-900">{exercise.name}</h3>
                    {exercise.premium_only && (
                      <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full">
                        PREMIUM
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="capitalize">{exercise.type}</span>
                    <span>•</span>
                    <span>{Math.floor(exercise.duration_seconds / 60)} min</span>
                    <span>•</span>
                    <span>Level {exercise.difficulty_level}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[...Array(exercise.difficulty_level)].map((_, i) => (
                    <div key={i} className="w-2 h-8 bg-gradient-to-t from-blue-500 to-cyan-500 rounded-full" />
                  ))}
                </div>
              </div>

              <p className="text-gray-700 mb-4">{exercise.description}</p>

              <button
                onClick={() => setActiveExercise(exercise)}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Exercise
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
