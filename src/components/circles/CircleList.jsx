import { motion } from 'framer-motion';
import { Users, Lock, Globe } from 'lucide-react';

const CircleCard = ({ circle, onJoin, onOpen, isMember }) => {
    return (
        <motion.div
            className="bg-white rounded-xl shadow-soft overflow-hidden flex flex-col cursor-pointer border border-transparent hover:border-primary-100"
            whileHover={{ y: -4, boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)' }}
            transition={{ duration: 0.3 }}
            onClick={() => onOpen(circle)}
        >
            <div className="h-24 bg-gradient-to-r from-primary-400 to-primary-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute bottom-3 left-4 text-white font-display font-semibold flex items-center gap-2">
                    {circle.category}
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col pt-3">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-semibold text-lg text-neutral-900 truncate">{circle.name}</h3>
                    {circle.visibility === 'private' ? (
                        <Lock size={14} className="text-neutral-500" title="Private circle" />
                    ) : (
                        <Globe size={14} className="text-neutral-500" title="Public circle" />
                    )}
                </div>

                <div className="flex items-center text-neutral-500 mb-2">
                    <Users size={14} className="mr-1" />
                    <span className="text-xs">{circle.members?.length || 0} members</span>
                </div>

                <p className="text-sm text-neutral-600 mb-4 line-clamp-2 min-h-[40px]">
                    {circle.description || 'No description provided.'}
                </p>

                <div className="mt-auto">
                    {isMember ? (
                        <div className="w-full text-center py-2 px-3 rounded-lg bg-neutral-100 text-neutral-700 text-sm font-medium">
                            View Circle
                        </div>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent parent onClick
                                onJoin(circle);
                            }}
                            className="w-full py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm font-medium transition-colors"
                        >
                            {circle.visibility === 'private' ? 'Request to Join' : 'Join Circle'}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const CircleList = ({ circles, activeTab, onJoin, onOpen, currentUserId }) => {
    if (!circles || circles.length === 0) {
        return (
            <motion.div
                className="text-center py-12 bg-white rounded-xl border border-neutral-200 shadow-soft"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Users size={40} className="mx-auto text-neutral-400 mb-3" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    {activeTab === 'discover' ? 'No circles found' : 'No circles yet'}
                </h3>
                <p className="text-neutral-600 text-sm">
                    {activeTab === 'discover' ? 'Try adjusting your filters or location.' : 'Join or create your first habit circle!'}
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {circles.map((circle) => {
                const isMember = Array.isArray(circle.members) && circle.members.some((m) => {
                    if (typeof m === 'object' && m !== null) return m._id === currentUserId;
                    return m === currentUserId;
                });

                return (
                    <CircleCard
                        key={circle._id}
                        circle={circle}
                        isMember={isMember}
                        onJoin={onJoin}
                        onOpen={onOpen}
                    />
                );
            })}
        </motion.div>
    );
};

export default CircleList;