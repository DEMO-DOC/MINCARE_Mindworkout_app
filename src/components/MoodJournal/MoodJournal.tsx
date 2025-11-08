import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Smile, Frown, Meh, Heart, TrendingUp, Save, Share2 } from 'lucide-react';

interface MoodEntry {
  id: string;
  mood_type: string;
  entry_text: string;
  sentiment_score: number;
  ai_insights: string;
  created_at: string;
}

const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Happy', value: 'happy', color: 'from-yellow-400 to-orange-400' },
  { emoji: '😔', label: 'Sad', value: 'sad', color: 'from-blue-400 to-cyan-400' },
  { emoji: '😰', label: 'Anxious', value: 'anxious', color: 'from-purple-400 to-pink-400' },
  { emoji: '😌', label: 'Calm', value: 'calm', color: 'from-green-400 to-emerald-400' },
  { emoji: '😤', label: 'Frustrated', value: 'frustrated', color: 'from-red-400 to-orange-400' },
  { emoji: '😴', label: 'Tired', value: 'tired', color: 'from-gray-400 to-slate-400' },
];

export function MoodJournal() {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState('');
  const [entryText, setEntryText] = useState('');
  const [shareToCommunity, setShareToCommunity] = useState(false);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  const loadEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setEntries(data);
    }
    setLoading(false);
  };

  const analyzeSentiment = (text: string): number => {
    const positiveWords = ['happy', 'good', 'great', 'wonderful', 'excellent', 'love', 'joy', 'peace', 'calm', 'grateful'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'stress', 'anxious', 'worried', 'pain'];

    const lowerText = text.toLowerCase();
    let score = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 0.1;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 0.1;
    });

    return Math.max(-1, Math.min(1, score));
  };

  const generateInsights = (mood: string, text: string, sentiment: number): string => {
    const insights: Record<string, string[]> = {
      anxious: [
        'Try the 4-7-8 breathing technique to calm your nervous system.',
        'Consider a 5-minute meditation to ground yourself.',
        'Take a short walk outside to reset your mind.',
      ],
      sad: [
        'Reach out to a friend or loved one for connection.',
        'Practice self-compassion - it\'s okay to feel this way.',
        'Try gentle movement like yoga or stretching.',
      ],
      frustrated: [
        'Take a brief break to reset before continuing.',
        'Journal about what\'s causing frustration to gain clarity.',
        'Try progressive muscle relaxation to release tension.',
      ],
      tired: [
        'Consider your sleep schedule - are you getting 7-9 hours?',
        'A 10-minute power nap might help recharge.',
        'Review your evening routine for better rest tonight.',
      ],
      happy: [
        'Great! Capture this moment in your gratitude journal.',
        'Share your positivity with the CalmCircle community.',
        'Notice what contributed to this feeling.',
      ],
      calm: [
        'Wonderful! You\'re in a great state for meditation or reflection.',
        'This is an ideal time for creative work or planning.',
        'Consider what helped you reach this peaceful state.',
      ],
    };

    const moodInsights = insights[mood] || ['Keep tracking your mood to identify patterns.'];
    const randomInsight = moodInsights[Math.floor(Math.random() * moodInsights.length)];

    if (sentiment < -0.3) {
      return `${randomInsight} Your entry suggests you might benefit from extra self-care today.`;
    } else if (sentiment > 0.3) {
      return `${randomInsight} Your positive energy is wonderful to see!`;
    }

    return randomInsight;
  };

  const handleSave = async () => {
    if (!selectedMood || !entryText.trim()) return;

    setSaving(true);
    const sentiment = analyzeSentiment(entryText);
    const insights = generateInsights(selectedMood, entryText, sentiment);

    const { error } = await supabase.from('mood_entries').insert({
      user_id: user!.id,
      mood_type: selectedMood,
      entry_text: entryText,
      sentiment_score: sentiment,
      ai_insights: insights,
      shared_to_community: shareToCommunity,
    });

    if (!error) {
      setSelectedMood('');
      setEntryText('');
      setShareToCommunity(false);
      loadEntries();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-emerald-500" />
          How are you feeling today?
        </h2>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {MOOD_OPTIONS.map((mood) => (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedMood === mood.value
                  ? `border-emerald-500 bg-gradient-to-br ${mood.color} bg-opacity-10 scale-105`
                  : 'border-gray-200 hover:border-gray-300 hover:scale-102'
              }`}
            >
              <div className="text-4xl mb-2">{mood.emoji}</div>
              <div className="text-sm font-medium text-gray-700">{mood.label}</div>
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tell us more (optional)
          </label>
          <textarea
            value={entryText}
            onChange={(e) => setEntryText(e.target.value)}
            placeholder="What's on your mind? How has your day been?"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
            rows={4}
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={shareToCommunity}
              onChange={(e) => setShareToCommunity(e.target.checked)}
              className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <Share2 className="w-4 h-4" />
              Share anonymously with CalmCircle
            </span>
          </label>

          <button
            onClick={handleSave}
            disabled={!selectedMood || saving}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          Recent Entries
        </h3>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading entries...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No entries yet. Start tracking your mood above!
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const mood = MOOD_OPTIONS.find(m => m.value === entry.mood_type);
              return (
                <div key={entry.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{mood?.emoji || '😊'}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{mood?.label}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {entry.entry_text && (
                        <p className="text-gray-700 mb-2 text-sm">{entry.entry_text}</p>
                      )}
                      {entry.ai_insights && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
                          <strong>AI Insight:</strong> {entry.ai_insights}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
