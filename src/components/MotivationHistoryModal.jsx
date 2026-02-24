import React from 'react';

const MotivationHistoryModal = ({ open, onClose, history }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button onClick={onClose} className="close-btn">Close</button>
        <h2>Motivation History</h2>
        {history.length === 0 ? (
          <p>No motivation history yet.</p>
        ) : (
          <ul>
            {history.map(entry => (
              <li key={entry._id} className="history-entry">
                <div><strong>Date:</strong> {new Date(entry.date).toLocaleString()}</div>
                <div><strong>Habit:</strong> {entry.habitName}</div>
                <div><strong>Your Reason:</strong> {entry.userExplanation}</div>
                <div><strong>AI Reply:</strong> {entry.aiReply}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MotivationHistoryModal;
