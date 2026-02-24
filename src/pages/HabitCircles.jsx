import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Search, Users } from 'lucide-react';
import axios from 'axios';
import CircleList from '../components/circles/CircleList';
import CreateCircleModal from '../components/circles/CreateCircleModal';
import CircleDetails from '../components/circles/CircleDetails';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function HabitCircles() {
  const [activeTab, setActiveTab] = useState('myCircles'); // 'myCircles' or 'discover'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCircleId, setSelectedCircleId] = useState(null);

  const [myCircles, setMyCircles] = useState([]);
  const [discoverCircles, setDiscoverCircles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    fetchUserDataAndCircles();
  }, []);

  const fetchUserDataAndCircles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token');
        return;
      }

      // fetching user data and circles

      // 1. Get current user's ID
      const userRes = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userId = userRes.data.user._id;
      setCurrentUserId(userId);

      // 2. Fetch all public circles
      const circlesRes = await axios.get(`${API_URL}/api/circles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allCircles = circlesRes.data.circles;
      // received circles

      // 3. Separate into Discover vs My Circles
      // If the user's ID is in the members array, it's "myCircle"
      const my = allCircles.filter(c => c.members.some(m => m._id === userId));
      const discover = allCircles.filter(c => !c.members.some(m => m._id === userId));

      setMyCircles(my);
      setDiscoverCircles(discover);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Error fetching circles';
      console.error('❌ Error fetching data:', {
        status: error.response?.status,
        message: errorMsg,
        url: `${API_URL}/api/circles`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCircleCreated = (newCircle) => {
    setMyCircles(prev => [newCircle, ...prev]);
    setShowCreateModal(false);
  };

  const handleJoinCircle = async (circle) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const apiURL = `${API_URL}/api/circles/${circle._id}/join`;
      // posting join request

      const res = await axios.post(apiURL, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(res.data.message);

      // Re-fetch to update lists
      fetchUserDataAndCircles();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Error joining circle';
      console.error('❌ Error joining circle:', {
        status: error.response?.status,
        message: errorMsg,
        circleId: circle._id
      });
      alert(errorMsg);
    }
  };

  // Filter lists based on search and category
  const filterList = (list) => {
    return list.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter ? c.category === categoryFilter : true;
      return matchesSearch && matchesCategory;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-neutral-50 pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        <AnimatePresence mode="wait">
          {selectedCircleId ? (
            <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CircleDetails
                circleId={selectedCircleId}
                currentUserId={currentUserId}
                onBack={() => {
                  setSelectedCircleId(null);
                  fetchUserDataAndCircles(); // refresh counts
                }}
              />
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 pt-4">
                <div className="text-center sm:text-left">
                  <h1 className="text-3xl font-display font-bold text-neutral-900">
                    Habit Circles
                  </h1>
                  <p className="text-neutral-600">Connect and grow with accountability groups</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-700 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  <PlusCircle size={20} />
                  <span>Create Circle</span>
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex flex-col sm:flex-row gap-3 mb-8">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search circles by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-none bg-neutral-50 rounded-lg focus:ring-2 focus:ring-primary-300 outline-none transition-shadow"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border-none bg-neutral-50 rounded-lg focus:ring-2 focus:ring-primary-300 outline-none transition-shadow"
                >
                  <option value="">All Categories</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Study">Study</option>
                  <option value="Meditation">Meditation</option>
                  <option value="Coding">Coding</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Tabs */}
              <div className="flex gap-6 border-b border-neutral-200 mb-6">
                <button
                  className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'myCircles' ? 'text-primary-600' : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  onClick={() => setActiveTab('myCircles')}
                >
                  My Circles ({myCircles.length})
                  {activeTab === 'myCircles' && <motion.div layoutId="TabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
                </button>
                <button
                  className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'discover' ? 'text-primary-600' : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  onClick={() => setActiveTab('discover')}
                >
                  Discover ({discoverCircles.length})
                  {activeTab === 'discover' && <motion.div layoutId="TabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
                </button>
              </div>

              {/* Lists */}
              {loading ? (
                <div className="text-center py-12 text-neutral-500">Loading circles...</div>
              ) : (
                <CircleList
                  circles={filterList(activeTab === 'myCircles' ? myCircles : discoverCircles)}
                  activeTab={activeTab}
                  onJoin={handleJoinCircle}
                  onOpen={(circle) => setSelectedCircleId(circle._id)}
                  currentUserId={currentUserId}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <AnimatePresence>
          {showCreateModal && (
            <CreateCircleModal
              onClose={() => setShowCreateModal(false)}
              onCircleCreated={handleCircleCreated}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default HabitCircles;