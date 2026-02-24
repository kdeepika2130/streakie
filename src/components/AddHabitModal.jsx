import React, { useState } from 'react';
import { Flame, Book, Dumbbell, Coffee, FileText, Brain } from 'lucide-react';

const iconOptions = [
  { icon: '💪', label: 'Gym', value: '💪' },
  { icon: '📚', label: 'Study', value: '📚' },
  { icon: '🧘', label: 'Meditation', value: '🧘' },
  { icon: '☕', label: 'Coffee', value: '☕' },
  { icon: '📝', label: 'Notes', value: '📝' },
  { icon: '🧠', label: 'Focus', value: '🧠' },
];

const AddHabitModal = ({ open, onClose, onAdd }) => {
  const [habitData, setHabitData] = useState({
    name: '',
    description: '',
    frequency: 'daily',
    timeFrom: '',
    timeTo: '',
    icon: iconOptions[0].icon,
    emoji: iconOptions[0].value,
  });
  const [timeError, setTimeError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHabitData((prev) => ({ ...prev, [name]: value }));
    if (name === 'timeFrom' || name === 'timeTo') {
      // clear previous error when user updates times
      setTimeError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newHabit = {
      name: habitData.name,
      description: habitData.description,
      frequency: habitData.frequency,
      timeFrom: habitData.timeFrom,
      timeTo: habitData.timeTo,
      icon: habitData.icon || '💪',
      emoji: habitData.emoji || '💪',
      streak: 0,
      completedDates: [],
    };

    console.log('Submitting new habit:', newHabit); // Debugging line
    if (!newHabit.name || !newHabit.frequency) {
        throw new Error('Missing required fields: name, frequency');
    }

    // validate time range if both provided
    if (habitData.timeFrom && habitData.timeTo) {
      const [fh, fm] = habitData.timeFrom.split(':').map(Number);
      const [th, tm] = habitData.timeTo.split(':').map(Number);
      if (isNaN(fh) || isNaN(fm) || isNaN(th) || isNaN(tm)) {
        setTimeError('Invalid time format');
        return;
      }
      if (fh > th || (fh === th && fm > tm)) {
        setTimeError('Start time must be before or equal to end time');
        return;
      }
    }

    try {
      // Delegate the server POST to the parent handler (Dashboard.handleAddHabit)
      await onAdd(newHabit);
      setHabitData({
        name: '',
        description: '',
        frequency: 'daily',
        timeFrom: '',
        timeTo: '',
        icon: iconOptions[0].icon,
        emoji: iconOptions[0].value,
      });
      setTimeError('');
      onClose();
    } catch (err) {
      console.error('Error adding habit (parent handler):', err);
      alert(err.message || 'Failed to add habit. Please try again.');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-lg shadow-elevated">
        <h2 className="text-3xl font-semibold mb-6 text-center text-primary-800">
          Add New Habit
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            name="name"
            placeholder="Habit name"
            value={habitData.name}
            onChange={handleChange}
            required
            className="w-full p-4 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary-300 transition"
          />

          <textarea
            name="description"
            placeholder="Description"
            value={habitData.description}
            onChange={handleChange}
            className="w-full p-4 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary-300 transition"
            rows="4"
          />

          <div className="flex gap-3 flex-wrap justify-center">
            {iconOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                className={`text-3xl p-4 border rounded-lg flex items-center justify-center transition ${
                  habitData.emoji === option.value
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
                onClick={() => setHabitData((prev) => ({ ...prev, icon: option.icon, emoji: option.value }))}
                aria-label={`Select icon ${option.label}`}
              >
                {option.icon}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="time"
                name="timeFrom"
                placeholder="Start time"
                value={habitData.timeFrom}
                onChange={handleChange}
                className="w-1/2 p-4 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary-300 transition"
              />

              <input
                type="time"
                name="timeTo"
                placeholder="End time (optional)"
                value={habitData.timeTo}
                onChange={handleChange}
                className="w-1/2 p-4 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary-300 transition"
              />
            </div>
            {timeError && (
              <p className="text-sm text-danger-600 mt-1">{timeError}</p>
            )}
            <p className="text-xs text-gray-500">Set specific start and end times for automatic status tracking</p>
          </div>

          <div className="mt-4">
            <select
              name="frequency"
              value={habitData.frequency}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary-300 transition"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-primary-600 text-white p-4 rounded-lg hover:bg-primary-700 transition-shadow shadow-md"
          >
            Add Habit
          </button>
        </form>

        <button
          onClick={onClose}
          className="mt-6 block w-full text-center text-sm text-primary-700 hover:text-primary-900 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AddHabitModal;