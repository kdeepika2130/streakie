import { useState, useEffect } from 'react';
import axios from 'axios';
import CirclePostCard from './CirclePostCard';
import { Image, Send } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CircleFeed = ({ circleId, currentUserId }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, [circleId]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('❌ No token for fetching posts');
                throw new Error('Authentication required');
            }

            const apiURL = `${API_URL}/api/circles/${circleId}/posts`;
            console.log(`📡 GET request to: ${apiURL}`);

            const res = await axios.get(apiURL, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success && Array.isArray(res.data.posts)) {
                console.log(`✓ Fetched ${res.data.posts.length} posts`);
                setPosts(res.data.posts);
            } else {
                console.warn('⚠️ Unexpected response structure:', res.data);
                setPosts([]);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch posts';
            console.error('❌ Error fetching posts:', {
                status: error.response?.status,
                message: errorMsg,
                url: `${API_URL}/api/circles/${circleId}/posts`
            });
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('❌ No token for creating post');
                throw new Error('Authentication required');
            }

            const apiURL = `${API_URL}/api/circles/${circleId}/post`;
            console.log(`📡 POST request to: ${apiURL}`);
            console.log(`📋 Content:`, newPostContent);

            const res = await axios.post(
                apiURL,
                { content: newPostContent },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success && res.data.post) {
                console.log('✓ Post created successfully');
                setPosts(prev => [res.data.post, ...prev]);
                setNewPostContent('');
            } else {
                console.warn('⚠️ Unexpected response:', res.data);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Error creating post';
            console.error('❌ Error creating post:', {
                status: error.response?.status,
                message: errorMsg,
                url: `${API_URL}/api/circles/${circleId}/post`
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-neutral-500">Loading feed...</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Create Post Input */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
                <form onSubmit={handleCreatePost} className="flex flex-col gap-3">
                    <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Share your progress or ask a question..."
                        className="w-full bg-neutral-50 border-none focus:ring-0 rounded-lg p-3 resize-none h-20 text-sm md:text-base outline-none"
                    />
                    <div className="flex justify-between items-center border-t border-neutral-100 pt-3">
                        <button
                            type="button"
                            className="text-neutral-500 hover:text-primary-600 p-2 rounded-full transition-colors"
                            title="Attach Image (Coming Soon)"
                        >
                            <Image size={20} />
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !newPostContent.trim()}
                            className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            <Send size={16} />
                            {submitting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Feed */}
            <div className="flex flex-col gap-4">
                {posts.length === 0 ? (
                    <div className="text-center py-10 text-neutral-500 bg-white rounded-xl border border-neutral-100">
                        No posts yet. Be the first to share!
                    </div>
                ) : (
                    posts.map(post => (
                        <CirclePostCard
                            key={post._id}
                            post={post}
                            currentUserId={currentUserId}
                            onPostUpdated={fetchPosts}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default CircleFeed;