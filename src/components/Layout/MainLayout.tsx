import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Dashboard } from '../Dashboard/Dashboard';
import { MoodJournal } from '../MoodJournal/MoodJournal';
import { MindGym } from '../MindGym/MindGym';
import { StressSnap } from '../StressSnap/StressSnap';
import { SleepPal } from '../SleepPal/SleepPal';
import { CalmCircle } from '../CalmCircle/CalmCircle';
import {
  LayoutDashboard,
  Heart,
  Brain,
  Activity,
  Moon,
  Users,
  LogOut,
  Menu,
  X,
  Crown,
} from 'lucide-react';

type Tab = 'dashboard' | 'mood' | 'mindgym' | 'stress' | 'sleep' | 'community';

export function MainLayout() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard, color: 'emerald' },
    { id: 'mood' as Tab, label: 'Mood Journal', icon: Heart, color: 'pink' },
    { id: 'mindgym' as Tab, label: 'MindGym', icon: Brain, color: 'blue' },
    { id: 'stress' as Tab, label: 'StressSnap', icon: Activity, color: 'red' },
    { id: 'sleep' as Tab, label: 'SleepPal', icon: Moon, color: 'indigo' },
    { id: 'community' as Tab, label: 'CalmCircle', icon: Users, color: 'teal' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'mood':
        return <MoodJournal />;
      case 'mindgym':
        return <MindGym />;
      case 'stress':
        return <StressSnap />;
      case 'sleep':
        return <SleepPal />;
      case 'community':
        return <CalmCircle />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-teal-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  MINCARE
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Your Wellness Companion</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg font-medium hover:from-yellow-500 hover:to-orange-500 transition-all shadow-md">
                <Crown className="w-4 h-4" />
                Upgrade to Premium
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              <button className="w-full flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg font-medium">
                <Crown className="w-4 h-4" />
                Upgrade to Premium
              </button>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-24">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                        isActive
                          ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white shadow-md`
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
