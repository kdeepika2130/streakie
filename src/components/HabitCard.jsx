import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, isSameDay } from 'date-fns';
import { Flame, Trash2, Check, AlertTriangle, Clock, XCircle } from 'lucide-react';

function HabitCard({ habit, selectedDate, refetch, completeHabit, deleteHabit }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isToday = isSameDay(selectedDate, new Date());
  const isCompleted = habit.completedDates.some(date =>
    isSameDay(new Date(date), selectedDate)
  );

  const weeklyProgress = habit.frequency === 'weekly'
    ? Math.min((habit.completedDates.length / habit.target) * 100, 100)
    : 0;

  const handleCompletion = async () => {
    if (!isToday) return;
    await completeHabit(habit._id, selectedDate);
    refetch();
  };

const handleDelete = async () => {
  setIsDeleting(true);
  setShowConfirm(false);

  try {
    const success = await deleteHabit(habit._id);
    if (success) {
      // State is updated immediately in deleteHabit function
      refetch(); // Refresh to update UI and stats
    }
  } catch (error) {
    console.error('Error during deletion:', error);
  } finally {
    setIsDeleting(false);
  }
};

  return (
    <motion.div
      className={`rounded-2xl p-6 shadow-soft transition-shadow duration-300 ${
        isCompleted ? 'bg-gradient-to-r from-primary-100 to-primary-200 border border-primary-300' : 'bg-white border border-neutral-200'
      } ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, boxShadow: '0 12px 30px rgba(59, 130, 246, 0.3)' }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
              isCompleted ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-600'
            } shadow-md`}
          >
            <span role="img" aria-label="habit emoji" className="text-3xl">{habit.emoji || '🎯'}</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-neutral-900">{habit.name}</h3>
            <p className="text-sm text-neutral-600">
              {habit.frequency === 'daily' ? 'Daily' : `${habit.target}x per week`}
            </p>
            {habit.timeFrom && habit.timeTo ? (
              <p className="text-xs text-neutral-500">Time: {habit.timeFrom} - {habit.timeTo}</p>
            ) : habit.time ? (
              <p className="text-xs text-neutral-500">Time: {habit.time}</p>
            ) : null}
            {habit.description && (
              <p className="text-xs text-neutral-500 italic max-w-[220px] truncate">{habit.description}</p>
            )}
          </div>
        </div>
        <div className="relative">
          <button
            className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100"
            onClick={() => setShowConfirm(true)}
            disabled={isDeleting}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {showConfirm && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-white rounded-xl shadow-elevated p-6 w-full max-w-sm flex flex-col items-center">
            <p className="mb-4 text-center text-neutral-700">
              Are you sure you want to delete <span className="font-bold">{habit.name}</span>?
            </p>
            <p className="mb-4 text-sm text-neutral-500 text-center">
              This action cannot be undone. All progress and streak data will be lost.
            </p>
            <div className="flex gap-2">
              <button
                className="btn bg-neutral-100 text-neutral-700"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn bg-red-500 text-white"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1 text-secondary-500 font-semibold text-sm">
            <Flame size={16} />
            <span>{habit.streak} day streak</span>
          </div>
          {habit.frequency === 'weekly' && (
            <span className="text-xs text-neutral-600">
              {habit.completedDates.length}/{habit.target} this week
            </span>
          )}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 mb-2">
          {habit.status === 'completed' ? (
            <>
              <Check size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-600">Completed</span>
            </>
          ) : habit.status === 'missed' ? (
            <>
              <XCircle size={16} className="text-red-600" />
              <span className="text-sm font-medium text-red-600">Missed</span>
            </>
          ) : (
            <>
              <Clock size={16} className="text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600">Pending</span>
            </>
          )}
        </div>

        {habit.frequency === 'weekly' && (
          <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
            <motion.div
              className="h-2 bg-primary-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${weeklyProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>

      <motion.button
        onClick={handleCompletion}
        disabled={!isToday || isCompleted || isDeleting}
        className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
          isCompleted
            ? 'bg-secondary-100 text-secondary-700 border border-secondary-200 cursor-default'
            : isToday
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
        }`}
        whileHover={isToday && !isCompleted ? { scale: 1.05 } : {}}
        whileTap={isToday && !isCompleted ? { scale: 0.95 } : {}}
        aria-label={isCompleted ? 'Completed' : isToday ? 'Mark as Completed' : 'Only for Today'}
      >
        {isCompleted ? (
          <>
            <Check size={18} className="text-secondary-700" />
            <span className="text-sm font-medium text-secondary-700">Completed</span>
          </>
        ) : isToday ? (
          <span className="text-sm font-medium">Mark as Completed</span>
        ) : (
          <>
            <AlertTriangle size={16} className="text-neutral-400" />
            <span className="text-sm font-medium text-neutral-400">Only for Today</span>
          </>
        )}
      </motion.button>
    </motion.div>
  );
}

export default HabitCard;
