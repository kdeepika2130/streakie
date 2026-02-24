import { useState } from 'react';
import { Heart, MessageCircle, Send } from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CirclePostCard = ({ post, currentUserId, onPostUpdated }) => {
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const isLiked = post.likes?.some(like => {
        if (typeof like === 'object' && like !== null) return like._id === currentUserId;
        return like === currentUserId;
    });

    const handleToggleLike = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');

            const apiURL = `${API_URL}/api/circles/posts/${post._id}/like`;
            console.log(`📡 POST request to: ${apiURL}`);

            await axios.post(
                apiURL,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('✓ Like toggled successfully');
            onPostUpdated();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Error toggling like';
            console.error('❌ Error toggling like:', {
                status: error.response?.status,
                message: errorMsg,
                url: `${API_URL}/api/circles/posts/${post._id}/like`
            });
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');

            const apiURL = `${API_URL}/api/circles/posts/${post._id}/comment`;
            console.log(`📡 POST request to: ${apiURL}`);
            console.log(`📋 Comment:`, newComment);

            await axios.post(
                apiURL,
                { content: newComment },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('✓ Comment posted successfully');
            setNewComment('');
            onPostUpdated();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Error commenting';
            console.error('❌ Error commenting:', {
                status: error.response?.status,
                message: errorMsg,
                url: `${API_URL}/api/circles/posts/${post._id}/comment`
            });
        } finally {
            setSubmitting(false);
        }
    };

    const authorName = post.userId?.name || 'Unknown User';
    const authorInitial = authorName.charAt(0).toUpperCase();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4 md:p-5">
            {/* Post Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold shadow-sm">
                    {authorInitial}
                </div>
                <div>
                    <h4 className="font-semibold text-neutral-900 text-sm md:text-base">{authorName}</h4>
                    <span className="text-xs text-neutral-500">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </span>
                </div>
            </div>

            {/* Post Content */}
            <div className="mb-4 text-neutral-800 whitespace-pre-wrap text-sm md:text-base">
                {post.content}
            </div>

            {/* Post Actions */}
            <div className="flex items-center gap-6 pt-3 border-t border-neutral-100 text-neutral-500">
                <button
                    onClick={handleToggleLike}
                    className={`flex items-center gap-2 hover:text-rose-500 transition-colors ${isLiked ? 'text-rose-500' : ''}`}
                >
                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                    <span className="text-sm font-medium">{post.likes?.length || 0}</span>
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 hover:text-primary-600 transition-colors"
                >
                    <MessageCircle size={18} />
                    <span className="text-sm font-medium">{post.comments?.length || 0}</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-col gap-3">
                    {/* Comments List */}
                    <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2">
                        {post.comments?.length === 0 ? (
                            <p className="text-xs text-center text-neutral-400">No comments yet.</p>
                        ) : (
                            post.comments.map(comment => (
                                <div key={comment._id} className="bg-neutral-50 rounded-lg p-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium text-xs text-neutral-900">{comment.userId?.name || 'Unknown'}</span>
                                        <span className="text-[10px] text-neutral-400">
                                            {formatDistanceToNow(new Date(comment.createdAt || comment.timestamp), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-neutral-700">{comment.content}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add Comment */}
                    <form onSubmit={handleComment} className="flex gap-2 relative mt-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 bg-neutral-100 border-none rounded-full py-2 pl-4 pr-10 text-sm focus:ring-2 focus:ring-primary-300 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={submitting || !newComment.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-600 p-1.5 rounded-full hover:bg-primary-50 disabled:opacity-50 transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CirclePostCard;