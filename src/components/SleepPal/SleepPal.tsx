import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Moon, Sun, Lightbulb, Plus, Check } from 'lucide-react';

interface SleepSession {
  id: string;
  sleep_start: string;
  sleep_end: string;
  duration_minutes: number;
  quality_score: number;
  bedtime_routine_followed: boolean;
}

export function SleepPal() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [showNewSession, setShowNewSession] = useState(false);
  const [sleepStart, setSleepStart] = useState('');
  const [sleepEnd, setSleepEnd] = useState('');
  const [quality, setQuality] = useState(7);
  const [routineFollowed, setRoutineFollowed] = useState(false);

  useEffect(() => {
    if (user) {
      loadSessions();
      loadTips();
    }
  }, [user]);

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from('sleep_sessions')
      .select('*')
      .eq('user_id', user!.id)
      .order('sleep_start', { ascending: false })
      .limit(7);

    if (!error && data) {
      setSessions(data);
    }
  };

  const loadTips = async () => {
    const { data, error } = await supabase
      .from('sleep_tips')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!error && data) {
      setTips(data.map(t => t.tip_text));
    } else {
      generateTips();
    }
  };

  const generateTips = async () => {
    const newTips = [
      { text: 'Avoid screens 1 hour before bedtime for better melatonin production', type: 'routine' },
      { text: 'Keep your bedroom cool (60-67°F) for optimal sleep', type: 'environment' },
      { text: 'Try gentle stretching or yoga 30 minutes before bed', type: 'exercise' },
    ];

    for (const tip of newTips) {
      await supabase.from('sleep_tips').insert({
        user_id: user!.id,
        tip_text: tip.text,
        tip_type: tip.type,
      });
    }

    setTips(newTips.map(t => t.text));
  };

  const saveSleepSession = async () => {
    if (!sleepStart || !sleepEnd) return;

    const start = new Date(sleepStart);
    const end = new Date(sleepEnd);
    const durationMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);

    await supabase.from('sleep_sessions').insert({
      user_id: user!.id,
      sleep_start: start.toISOString(),
      sleep_end: end.toISOString(),
      duration_minutes: durationMinutes,
      quality_score: quality,
      bedtime_routine_followed: routineFollowed,
    });

    setShowNewSession(false);
    setSleepStart('');
    setSleepEnd('');
    setQuality(7);
    setRoutineFollowed(false);
    loadSessions();
  };

  const avgSleep = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.duration_minutes, 0) / sessions.length / 60 * 10) / 10
    : 0;

  const avgQuality = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.quality_score, 0) / sessions.length * 10) / 10
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl shadow-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Moon className="w-8 h-8" />
          SleepPal
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="w-5 h-5" />
              <span className="text-sm font-medium">Avg Sleep</span>
            </div>
            <div className="text-3xl font-bold">{avgSleep}h</div>
            <div className="text-xs opacity-90">per night</div>
          </div>

          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-5 h-5" />
              <span className="text-sm font-medium">Quality</span>
            </div>
            <div className="text-3xl font-bold">{avgQuality}/10</div>
            <div className="text-xs opacity-90">average rating</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Bedtime Coaching
          </h3>
        </div>

        <div className="space-y-3 mb-6">
          {tips.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No tips yet. Start tracking sleep!</p>
          ) : (
            tips.map((tip, idx) => (
              <div key={idx} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-purple-900">{tip}</p>
              </div>
            ))
          )}
        </div>

        {!showNewSession ? (
          <button
            onClick={() => setShowNewSession(true)}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Log Sleep Session
          </button>
        ) : (
          <div className="border border-gray-200 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedtime
              </label>
              <input
                type="datetime-local"
                value={sleepStart}
                onChange={(e) => setSleepStart(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wake Time
              </label>
              <input
                type="datetime-local"
                value={sleepEnd}
                onChange={(e) => setSleepEnd(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quality (1-10): {quality}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={routineFollowed}
                onChange={(e) => setRoutineFollowed(e.target.checked)}
                className="w-4 h-4 text-indigo-500 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Followed bedtime routine</span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={saveSleepSession}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all"
              >
                Save
              </button>
              <button
                onClick={() => setShowNewSession(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Sleep History</h3>

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No sleep sessions logged yet</div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">
                    {new Date(session.sleep_start).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    {session.bedtime_routine_followed && (
                      <span className="text-green-600">
                        <Check className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Duration: {Math.floor(session.duration_minutes / 60)}h {session.duration_minutes % 60}m</div>
                  <div>Quality: {session.quality_score}/10</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
