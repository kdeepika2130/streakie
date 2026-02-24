import { useState } from 'react';
import { motion } from 'framer-motion';

function MissedStreakModal({ open, onClose, habitId, habitName, onMotivation, onRestore, restoreChances }) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivation, setMotivation] = useState('');
  const [showRestoreButton, setShowRestoreButton] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await onMotivation(habitId, habitName, explanation);
      if (result && result.aiReply) {
        setMotivation(result.aiReply);
        if (result.showRestoreButton !== undefined) {
          setShowRestoreButton(result.showRestoreButton);
        }
        setShowMotivation(true);
        setExplanation('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    setError('');
    try {
      const result = await onRestore(habitId);
      console.log('Restore result:', result);
      // The modal will be closed by the parent component (Dashboard)
    } catch (err) {
      console.error('Restore error:', err);
      setError(err.message);
    } finally {
      setRestoring(false);
    }
  };

  const handleClose = () => {
    setShowMotivation(false);
    setMotivation('');
    setShowRestoreButton(true);
    setExplanation('');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <motion.div
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {!showMotivation ? (
          <>
            <h2 className="text-xl font-bold mb-4">Missed Streak Explanation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                rows={4}
                placeholder="Explain why you missed your streak..."
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
                required
              />

              {error && <div className="text-red-500 text-sm">{error}</div>}
              {success && <div className="text-green-500 text-sm">{success}</div>}

              <div className="flex gap-2 justify-end">
                <button type="button" className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200" onClick={handleClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-300" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-4">🤖 StreakBuddy Says:</h2>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-5 rounded-2xl shadow-lg border border-blue-400 text-white">
                  <p className="leading-relaxed text-sm">{motivation}</p>
                </div>

                {error && <div className="text-red-500 text-sm">{error}</div>}
                {success && <div className="text-green-500 text-sm">{success}</div>}
              </div>
            </div>

            {/* Buttons at bottom */}
            <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-200">
              {showRestoreButton && (
                <button
                  type="button"
                  className={`px-4 py-2 rounded font-medium transition-all duration-200 ${restoring || restoreChances === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                    }`}
                  onClick={handleRestore}
                  disabled={restoring || restoreChances === 0}
                >
                  {restoring
                    ? '⏳ Restoring...'
                    : restoreChances > 0
                      ? '✅ Restore Streak'
                      : '❌ No Chances Left'
                  }
                </button>
              )}
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                onClick={handleClose}
                disabled={restoring}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default MissedStreakModal;
