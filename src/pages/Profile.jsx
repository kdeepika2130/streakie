import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Camera, Edit, Save, Award, BarChart2, X } from 'lucide-react';
import useHabits from '../hooks/useHabits.jsx';

function Profile() {
  const { user, updateUser } = useAuth();
  const { habits, streakCount, longestStreak } = useHabits();
  
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    bio: user?.bio || 'Tell us about yourself',
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    updateUser(profileData);
    setEditing(false);
  };
  
  const levelProgress = user ? (user.xp / (user.totalXp || 100)) * 100 : 0;

  const stats = [
    { title: 'Active Habits', value: habits.length },
    { title: 'Current Streak', value: `${streakCount} days` },
    { title: 'Longest Streak', value: `${longestStreak} days` },
    { title: 'Habits Completed', value: user?.completedHabits || 53 },
    { title: 'Completion Rate', value: user?.completionRate || '87%' },
    { title: 'Weekly Goal', value: user?.weeklyGoal || '5/7 days' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-neutral-50 pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900">Profile</h1>
          <p className="text-neutral-600 text-sm">Manage your account and track your progress</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div
            className="col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white rounded-xl shadow-soft border border-neutral-100">
              <div className="relative">
                <div className="h-28 bg-gradient-to-r from-primary-600 to-primary-800 rounded-t-xl" />
                <div className="relative px-4 -mt-12">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 bg-neutral-200 rounded-full border-4 border-white flex items-center justify-center text-neutral-500 text-2xl font-bold">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <button
                      className="absolute bottom-0 right-0 bg-primary-600 text-white p-1.5 rounded-full hover:bg-primary-700 transition-colors"
                      aria-label="Change profile picture"
                    >
                      <Camera size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {editing ? (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="name">
                        Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="bio">
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={profileData.bio}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm resize-none h-20"
                        placeholder="Tell us about yourself"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="px-4 py-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-1 text-sm"
                      >
                        <Save size={16} />
                        <span>Save</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <h2 className="text-lg font-semibold text-neutral-900 mb-1">{user?.name || 'User'}</h2>
                      <p className="text-neutral-600 text-sm mb-2 line-clamp-2">{profileData.bio}</p>
                      <p className="text-xs text-neutral-500">
                        Joined {user?.joinedDate ? format(new Date(user.joinedDate), 'MMM yyyy') : 'Recently'}
                      </p>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-neutral-600">Level {user?.level || 1}</span>
                        <span className="text-xs text-neutral-600">{user?.xp || 0}/{user?.totalXp || 100} XP</span>
                      </div>
                      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${levelProgress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setEditing(true)}
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 flex items-center justify-center gap-1 text-sm"
                      aria-label="Edit profile"
                    >
                      <Edit size={16} />
                      <span>Edit Profile</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Stats and Badges */}
          <motion.div
            className="col-span-1 lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white rounded-xl shadow-soft border border-neutral-100 mb-6">
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <BarChart2 size={20} className="text-primary-600 mr-2" />
                  <h2 className="text-lg font-semibold text-neutral-900">Stats Overview</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-neutral-50 rounded-lg p-4">
                      <p className="text-xs text-neutral-600 mb-1 uppercase tracking-wide">{stat.title}</p>
                      <p className="text-lg font-bold text-neutral-900">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-neutral-100">
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <Award size={20} className="text-amber-500 mr-2" />
                  <h2 className="text-lg font-semibold text-neutral-900">Your Badges</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(user?.badges || ['Newcomer']).map((badge, index) => (
                    <div key={index} className="flex flex-col items-center bg-neutral-50 rounded-lg p-4">
                      <div className="bg-amber-100 p-2 rounded-full mb-2">
                        <Award size={20} className="text-amber-500" />
                      </div>
                      <p className="text-sm font-medium text-neutral-900 text-center">{badge}</p>
                    </div>
                  ))}
                  {['30-Day Master', 'Night Owl', 'Weekend Warrior'].map((badge, index) => (
                    <div key={`locked-${index}`} className="flex flex-col items-center bg-neutral-50 rounded-lg p-4 opacity-60">
                      <div className="bg-neutral-200 p-2 rounded-full mb-2">
                        <Award size={20} className="text-neutral-400" />
                      </div>
                      <p className="text-sm font-medium text-neutral-900 text-center">{badge}</p>
                      <span className="text-xs text-neutral-500 mt-1">Locked</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Profile;