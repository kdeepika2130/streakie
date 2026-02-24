import { useState, useEffect, useRef } from 'react';
import { format, isSameDay, subDays } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

const useHabits = () => {
  const [habits, setHabits] = useState([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scheduledTimeouts = useRef([]);
  const { socket } = useSocket() || {};

  const fetchHabits = async () => {
    // fetchHabits: start
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/habits`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        // try to extract a useful message from the response body
        let serverMsg = `HTTP error! Status: ${response.status}`;
        try {
          const errBody = await response.json();
          if (errBody && errBody.message) serverMsg = errBody.message;
        } catch (e) {
          // ignore json parse errors
        }
        throw new Error(serverMsg);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch habits');
      }

      // habit list received (debug logs removed)

      // Calculate stats and update state properly
      const updatedHabits = calculateStats(data.habits);
      setLoading(false);
      return data.habits; // Return the habits for external use
    } catch (err) {
      console.error('useHabits: Error in fetchHabits:', err.message);
      // Only set a global error for auth issues; otherwise keep it local to the hook
      if (/(token|auth|unauthorize|unauthorized|please log in)/i.test(err.message)) {
        setError(err.message);
      } else {
        // non-fatal fetch error: keep habits empty but don't trigger global modal
        console.warn('Non-fatal fetchHabits error:', err.message);
      }
      setLoading(false);
      setHabits([]);
      throw err; // Re-throw the error so calling code can handle it
    }
  };

  // Notification helpers
  const clearScheduled = () => {
    scheduledTimeouts.current.forEach(id => clearTimeout(id));
    scheduledTimeouts.current = [];
  };

  const ensurePermission = async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const p = await Notification.requestPermission();
      return p === 'granted';
    }
    return false;
  };

  const showNotification = (title, body) => {
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    } catch (err) {
      console.error('Notification failed:', err);
    }
  };

  const markHabitAsMissed = async (habitId) => {
    // marking habit as missed
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/habits/${habitId}/miss`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to mark habit as missed');
      }

      console.log(`useHabits: Habit ${habitId} marked as missed successfully.`);

      // Dispatch a notification for the missed habit
      const detail = {
        habitId: habitId,
        habitName: data.habit.name,
        body: `You missed your scheduled time for "${data.habit.name}".`,
        date: new Date().toISOString(),
      };
      window.dispatchEvent(new CustomEvent('habitNotification', { detail }));
      toast.error(`You missed: ${data.habit.name}`);

      await fetchHabits(); // Refetch to update the UI
    } catch (err) {
      console.error('Error marking habit as missed:', err);
    }
  };

  const scheduleForHabit = (habit) => {
    if (!habit) return;
    // prefer timeFrom (range) then fallback to single time
    const timeToUse = habit.timeFrom || habit.time;
    if (!timeToUse) return;
    // timeToUse assumed 'HH:mm'
    const [hh, mm] = timeToUse.split(':').map(Number);
    if (isNaN(hh) || isNaN(mm)) return;
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
    // if target already passed today, schedule for tomorrow
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    const delay = target.getTime() - now.getTime();
    const id = setTimeout(async () => {
      // Check if habit still exists in current habits list before showing notification
      const currentHabits = await fetchHabits().catch(() => []);
      const habitStillExists = currentHabits.some(h => h._id === habit._id);

      if (!habitStillExists) {
        console.log(`Notification skipped: Habit "${habit.name}" no longer exists`);
        return;
      }

      // Check if habit is already completed today
      const currentHabit = currentHabits.find(h => h._id === habit._id);
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const isCompletedToday = currentHabit && currentHabit.completedDates && currentHabit.completedDates.some(date => format(new Date(date), 'yyyy-MM-dd') === todayStr);

      if (isCompletedToday) {
        console.log(`Notification skipped: Habit "${habit.name}" already completed today`);
        return;
      }

      const title = `Time for: ${habit.name}`;
      const body = habit.description || `It's time to do ${habit.name}`;

      // prepare notification detail
      const detail = {
        habitId: habit._id || habit.id || null,
        habitName: habit.name,
        body,
        // include both the raw fields and the computed time used
        timeFrom: habit.timeFrom || '',
        timeTo: habit.timeTo || '',
        time: timeToUse,
        date: new Date().toISOString(),
      };

      // dedupe: allow only one notification per habit/time per day
      let alreadyShown = false;
      try {
        const dayKey = format(new Date(), 'yyyy-MM-dd');
        const dedupeKey = `sm_notif_dedupe::${detail.habitId || detail.habitName}::${dayKey}::${timeToUse}`;
        alreadyShown = !!localStorage.getItem(dedupeKey);
        if (!alreadyShown) {
          try { localStorage.setItem(dedupeKey, new Date().toISOString()); } catch (e) { /* ignore */ }
        }
      } catch (e) {
        console.warn('Notif dedupe check failed', e);
      }

      if (!alreadyShown) {
        // show native notification if permission
        try {
          const ok = await ensurePermission();
          if (ok) {
            showNotification(title, body);
          }
        } catch (e) {
          console.warn('Permission check failed', e);
        }

        // dispatch in-app event so UI can record/store the notification
        try {
          window.dispatchEvent(new CustomEvent('habitNotification', { detail }));
          // persist to server (non-blocking)
          try {
            const token = localStorage.getItem('token');
            if (token) {
              fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(detail),
              }).catch(e => console.warn('Failed to persist notification to server', e));
            }
          } catch (e) {
            console.warn('Notification persist skipped', e);
          }

          // show an in-app toast so user sees an immediate popup
          try { toast.success(`Reminder: ${habit.name}`); } catch (e) { /* ignore */ }
        } catch (err) {
          console.error('Failed to dispatch habitNotification', err);
        }
      } else {
        // already shown today; skip native dispatch but still log
        console.log('Notification deduped for', detail.habitId || detail.habitName, timeToUse);
      }

      // schedule next occurrence in 24h only if habit still exists
      const nextId = setTimeout(async () => {
        const stillCurrentHabits = await fetchHabits().catch(() => []);
        const stillExists = stillCurrentHabits.some(h => h._id === habit._id);
        if (stillExists) {
          scheduleForHabit(habit);
        }
      }, 24 * 60 * 60 * 1000);
      scheduledTimeouts.current.push(nextId);
    }, delay);
    scheduledTimeouts.current.push(id);

    // --- NEW: Schedule a check for the END time to mark as missed ---
    const timeForMissedCheck = habit.timeTo || habit.time;
    if (!timeForMissedCheck) return;

    const [endHh, endMm] = timeForMissedCheck.split(':').map(Number);
    if (isNaN(endHh) || isNaN(endMm)) return;

    const missTarget = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHh, endMm, 0, 0);
    missTarget.setMinutes(missTarget.getMinutes() + 1); // Trigger 1 minute after end time

    if (missTarget.getTime() <= now.getTime()) {
      // Already past the missed check time for today, do nothing.
      return;
    }

    const missDelay = missTarget.getTime() - now.getTime();
    const missCheckId = setTimeout(async () => {
      // Refetch to get the latest habit status
      const currentHabits = await fetchHabits().catch(() => []);
      const currentHabit = currentHabits.find(h => h._id === habit._id);

      if (!currentHabit) return; // Habit was deleted

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const isCompletedToday = currentHabit.completedDates && currentHabit.completedDates.some(date => format(new Date(date), 'yyyy-MM-dd') === todayStr);

      if (!isCompletedToday) {
        // If not completed by the end time, mark it as missed
        await markHabitAsMissed(habit._id);
      }
    }, missDelay);
    scheduledTimeouts.current.push(missCheckId);
  };

  const scheduleNotifications = async (habitsList) => {
    clearScheduled();
    if (!habitsList || habitsList.length === 0) return;
    // Request permission proactively if possible
    try { await ensurePermission(); } catch (e) { /* ignore */ }
    habitsList.forEach(h => scheduleForHabit(h));
  };

  const completeHabit = async (id, date) => {
    console.log(`useHabits: Attempting to complete habit with id: ${id} for date: ${date}`);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/habits/${id}/complete`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: format(new Date(date), 'yyyy-MM-dd'), completed: true }),
      });
      const data = await response.json();
      console.log('useHabits: Complete response:', data);
      if (!data.success) {
        throw new Error(data.message || 'Failed to complete habit');
      }

      // Show success toast immediately
      toast.success('Habit completed successfully!');

      // Refetch habits after completion
      await fetchHabits();
    } catch (err) {
      console.error('Error completing habit:', err);
      toast.error(`Failed to complete habit: ${err.message}`);
      setError(err.message);
    }
  };

  const addHabit = async (habitData) => {
    console.log('useHabits: Attempting to add new habit:', habitData);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/habits`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(habitData),
      });

      const data = await response.json();
      console.log('useHabits: Add habit response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add habit');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to add habit');
      }

      console.log('useHabits: Habit added successfully:', data.habit);
      toast.success('Habit added successfully!');

      // Refetch habits to get the updated list
      await fetchHabits();
      return data.habit;
    } catch (err) {
      console.error('useHabits: Error adding habit:', err.message);
      toast.error(`Failed to add habit: ${err.message}`);
      throw err;
    }
  };

  const deleteHabit = async (id) => {
    // attempting to delete habit
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/habits/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // delete response received

      if (!response.ok) {
        let errorMessage = `HTTP error! Status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          console.warn('useHabits: Could not parse error response as JSON');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete habit');
      }

      // habit deleted successfully

      // Show success toast
      toast.success('Habit deleted successfully!');

      // Update local state immediately by filtering the habit and recalculating stats
      setHabits(prevHabits => {
        const updatedHabits = prevHabits.filter(habit => habit._id !== id);
        calculateStats(updatedHabits); // Reuse the existing stats calculation logic
        return updatedHabits; // This will be the new habits array without the deleted one
      });

      return true;
    } catch (err) {
      console.error('useHabits: Error deleting habit:', err.message);
      toast.error(`Failed to delete habit: ${err.message}`);
      return false;
    }
  };

  const calculateStats = (habits) => {
    // calculating stats for habits
    const today = format(new Date(), 'yyyy-MM-dd');
    let todayCount = 0;
    let currentStreak = 0;
    let maxStreak = 0;

    const updatedHabits = [];
    habits.forEach((habit) => {
      // Normalize completed dates into a set of yyyy-MM-dd strings for reliable checks
      const completedSet = new Set((habit.completedDates || []).map(d => format(new Date(d), 'yyyy-MM-dd')));

      // Count habits completed today
      if (completedSet.has(today)) {
        todayCount++;
      }

      // Calculate streaks
      let streak = 0;

      if (habit.frequency === 'daily') {
        // For daily habits, check if the habit was missed today
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const isMissedToday = habit.status === 'missed' && !completedSet.has(todayStr);

        if (isMissedToday) {
          // If missed today, streak is 0
          streak = 0;
        } else {
          // Start checking from today; if today not completed, start from yesterday
          let checkDate = new Date();
          let checkStr = format(checkDate, 'yyyy-MM-dd');
          if (!completedSet.has(checkStr)) {
            checkDate = subDays(checkDate, 1);
            checkStr = format(checkDate, 'yyyy-MM-dd');
          }
          // Count consecutive days backwards while dates exist in the set
          while (completedSet.has(checkStr)) {
            streak++;
            checkDate = subDays(checkDate, 1);
            checkStr = format(checkDate, 'yyyy-MM-dd');
          }
        }
      } else if (habit.frequency === 'weekly') {
        // weekly logic unchanged but use completedSet-derived dates array
        const dates = [...(habit.completedDates || [])].map(d => format(new Date(d), 'yyyy-MM-dd')).sort((a, b) => new Date(b) - new Date(a));
        const weeks = {};
        dates.forEach((date) => {
          const weekStart = format(new Date(date), 'yyyy-WW');
          weeks[weekStart] = (weeks[weekStart] || 0) + 1;
        });
        // weekly completions computed

        let currentWeek = format(new Date(), 'yyyy-WW');
        while (weeks[currentWeek] && weeks[currentWeek] >= (habit.target || 1)) {
          streak++;
          currentWeek = format(subDays(new Date(currentWeek), 7), 'yyyy-WW');
        }
      }

      // computed streak for habit
      // attach per-habit streak so UI cards can display it
      updatedHabits.push({ ...habit, streak });
      if (streak > maxStreak) maxStreak = streak;
      if (completedSet.has(today)) {
        currentStreak = Math.max(currentStreak, streak);
      }
    });

    // update state with enriched habits array
    setHabits(updatedHabits);
    setCompletedToday(todayCount);
    setStreakCount(currentStreak);
    setLongestStreak(maxStreak);
    // stats updated
    // schedule notifications for habits with times
    try { scheduleNotifications(updatedHabits); } catch (err) { console.error('Failed to schedule notifications', err); }

    // Return the updated habits array for external use
    return updatedHabits;
  };

  useEffect(() => {
    console.log('useHabits: useEffect triggered, calling fetchHabits');
    fetchHabits();

    return () => {
      clearScheduled();
    };
  }, []);

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleLiveUpdate = () => {
      // Re-fetch habits safely without breaking local state immediately
      fetchHabits();
    };

    socket.on("habit_updated", handleLiveUpdate);
    socket.on("habit_deleted", handleLiveUpdate);
    socket.on("habit_added", handleLiveUpdate);

    return () => {
      socket.off("habit_updated", handleLiveUpdate);
      socket.off("habit_deleted", handleLiveUpdate);
      socket.off("habit_added", handleLiveUpdate);
    };
  }, [socket]);

  return { habits, completedToday, streakCount, longestStreak, loading, error, refetch: fetchHabits, deleteHabit, completeHabit, addHabit };
};

export default useHabits;
