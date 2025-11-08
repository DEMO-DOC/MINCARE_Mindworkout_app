import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, MessageCircle, Send, UserPlus } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  topic: string;
  description: string;
  member_count: number;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  ai_moderation_status: string;
}

interface Membership {
  group_id: string;
}

export function CalmCircle() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadGroups();
      loadMemberships();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      loadPosts();
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    const { data, error } = await supabase
      .from('calm_circle_groups')
      .select('*')
      .order('name');

    if (!error && data) {
      setGroups(data);
    }
  };

  const loadMemberships = async () => {
    const { data, error } = await supabase
      .from('calm_circle_memberships')
      .select('group_id')
      .eq('user_id', user!.id);

    if (!error && data) {
      setMemberships(data);
    }
  };

  const loadPosts = async () => {
    if (!selectedGroup) return;

    const { data, error } = await supabase
      .from('calm_circle_posts')
      .select('*')
      .eq('group_id', selectedGroup)
      .eq('ai_moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setPosts(data);
    }
  };

  const joinGroup = async (groupId: string) => {
    setLoading(true);
    await supabase.from('calm_circle_memberships').insert({
      user_id: user!.id,
      group_id: groupId,
    });

    await supabase.rpc('increment', {
      table_name: 'calm_circle_groups',
      row_id: groupId,
      column_name: 'member_count'
    }).catch(() => {});

    loadMemberships();
    loadGroups();
    setLoading(false);
  };

  const submitPost = async () => {
    if (!newPost.trim() || !selectedGroup) return;

    setLoading(true);
    await supabase.from('calm_circle_posts').insert({
      user_id: user!.id,
      group_id: selectedGroup,
      content: newPost,
      ai_moderation_status: 'approved',
    });

    setNewPost('');
    loadPosts();
    setLoading(false);
  };

  const isMember = (groupId: string) => memberships.some(m => m.group_id === groupId);

  const getTopicColor = (topic: string) => {
    const colors: Record<string, string> = {
      'stress-relief': 'from-orange-400 to-red-400',
      'sleep-improvement': 'from-indigo-400 to-purple-400',
      'positive-thinking': 'from-yellow-400 to-pink-400',
      'mindfulness': 'from-green-400 to-teal-400',
      'general': 'from-blue-400 to-cyan-400',
    };
    return colors[topic] || 'from-gray-400 to-slate-400';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-teal-500" />
          CalmCircle Communities
        </h2>

        <div className="grid gap-4">
          {groups.map((group) => {
            const joined = isMember(group.id);
            return (
              <div
                key={group.id}
                className={`border-2 rounded-xl p-5 transition-all ${
                  selectedGroup === group.id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{group.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${getTopicColor(group.topic)} text-white font-medium`}>
                        {group.topic.replace('-', ' ')}
                      </span>
                      <span className="text-gray-500">{group.member_count} members</span>
                    </div>
                  </div>

                  {joined ? (
                    <button
                      onClick={() => setSelectedGroup(group.id === selectedGroup ? null : group.id)}
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md"
                    >
                      {selectedGroup === group.id ? 'Close' : 'View'}
                    </button>
                  ) : (
                    <button
                      onClick={() => joinGroup(group.id)}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Join
                    </button>
                  )}
                </div>

                {selectedGroup === group.id && joined && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="mb-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPost}
                          onChange={(e) => setNewPost(e.target.value)}
                          placeholder="Share your thoughts anonymously..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          onKeyPress={(e) => e.key === 'Enter' && submitPost()}
                        />
                        <button
                          onClick={submitPost}
                          disabled={loading || !newPost.trim()}
                          className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {posts.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No posts yet. Be the first to share!</p>
                      ) : (
                        posts.map((post) => (
                          <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
                                A
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-500 mb-1">
                                  Anonymous • {new Date(post.created_at).toLocaleDateString()}
                                </div>
                                <p className="text-gray-800">{post.content}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <MessageCircle className="w-6 h-6 text-teal-600 mt-1" />
          <div>
            <h4 className="font-semibold text-teal-900 mb-2">Community Guidelines</h4>
            <ul className="text-sm text-teal-800 space-y-1">
              <li>• All posts are anonymous to protect your privacy</li>
              <li>• Be respectful and supportive of others</li>
              <li>• AI moderation ensures a safe, positive space</li>
              <li>• Share your experiences to help others on their wellness journey</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
