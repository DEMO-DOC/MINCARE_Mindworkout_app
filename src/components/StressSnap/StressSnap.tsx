import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, AlertCircle, Wind, TrendingDown } from 'lucide-react';

interface StressReading {
  id: string;
  heart_rate: number;
  stress_level: number;
  data_source: string;
  recorded_at: string;
}

export function StressSnap() {
  const { user } = useAuth();
  const [readings, setReadings] = useState<StressReading[]>([]);
  const [heartRate, setHeartRate] = useState(72);
  const [dataSource, setDataSource] = useState('manual');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadReadings();
    }
  }, [user]);

  const loadReadings = async () => {
    const { data, error } = await supabase
      .from('stress_readings')
      .select('*')
      .eq('user_id', user!.id)
      .order('recorded_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setReadings(data);
    }
  };

  const calculateStressLevel = (hr: number): number => {
    if (hr < 60) return 2;
    if (hr < 70) return 3;
    if (hr < 80) return 5;
    if (hr < 90) return 7;
    if (hr < 100) return 8;
    return 9;
  };

  const recordReading = async () => {
    setLoading(true);
    const stressLevel = calculateStressLevel(heartRate);
    const shouldTrigger = stressLevel >= 7;

    await supabase.from('stress_readings').insert({
      user_id: user!.id,
      heart_rate: heartRate,
      stress_level: stressLevel,
      data_source: dataSource,
      intervention_triggered: shouldTrigger,
    });

    loadReadings();
    setLoading(false);

    if (shouldTrigger) {
      alert('🌟 Stress detected! Take a moment for the Box Breathing exercise: Breathe in for 4, hold for 4, out for 4, hold for 4.');
    }
  };

  const getStressColor = (level: number) => {
    if (level <= 3) return 'from-green-400 to-emerald-400';
    if (level <= 6) return 'from-yellow-400 to-orange-400';
    return 'from-red-400 to-pink-400';
  };

  const getStressLabel = (level: number) => {
    if (level <= 3) return 'Low';
    if (level <= 6) return 'Moderate';
    return 'High';
  };

  const avgStress = readings.length > 0
    ? Math.round(readings.reduce((acc, r) => acc + r.stress_level, 0) / readings.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-red-500" />
          StressSnap
        </h2>

        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Record Stress Reading</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heart Rate (BPM)
              </label>
              <input
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                min="40"
                max="200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Source
              </label>
              <select
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="manual">Manual Entry</option>
                <option value="watch">Smartwatch</option>
                <option value="camera">Camera Scan</option>
                <option value="sensor">External Sensor</option>
              </select>
            </div>

            <button
              onClick={recordReading}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Reading'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Current Stress</div>
            <div className={`text-3xl font-bold bg-gradient-to-r ${getStressColor(calculateStressLevel(heartRate))} bg-clip-text text-transparent`}>
              {getStressLabel(calculateStressLevel(heartRate))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Average This Week</div>
            <div className={`text-3xl font-bold bg-gradient-to-r ${getStressColor(avgStress)} bg-clip-text text-transparent`}>
              {getStressLabel(avgStress)}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Wind className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Quick Relief Techniques</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Box Breathing: 4 seconds in, hold 4, out 4, hold 4</li>
                <li>• Progressive muscle relaxation</li>
                <li>• 5-minute mindful walk</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-500" />
          Recent Readings
        </h3>

        {readings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No readings yet</div>
        ) : (
          <div className="space-y-3">
            {readings.map((reading) => (
              <div key={reading.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                <div>
                  <div className="font-medium text-gray-900">
                    {reading.heart_rate} BPM
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(reading.recorded_at).toLocaleString()}
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${getStressColor(reading.stress_level)} text-white font-semibold`}>
                  {getStressLabel(reading.stress_level)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
