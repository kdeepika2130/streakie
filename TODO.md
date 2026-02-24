# Task: Fix automatic dashboard refresh after habit deletion and time-based missed status detection

## Current Work Summary
- Analyzed frontend: useHabits hook updates local state on delete/complete, but multiple hook instances (Dashboard + each HabitCard) prevent parent re-render after delete.
- Analyzed backend: habitRoutes.js calculateStatus sets 'missed' only for yesterday non-completion, not for time-passed today without completion.
- Screenshot shows daily habit "Lunch" at 17:28 still 'Pending' at 17:30, confirming missing time check.
- No other files affected; changes isolated to habitRoutes.js (backend logic), Dashboard.jsx (prop passing), HabitCard.jsx (use props).

## Key Technical Concepts
- React hooks: Single source of truth via parent hook instance; pass functions as props to children to avoid multiple states.
- Backend: Mongoose model with status enum; date-fns for time parsing/comparison in calculateStatus.
- API: GET /api/habits updates statuses on fetch; DELETE /api/habits/:id works but needs UI sync.
- No new dependencies; uses existing date-fns.

## Relevant Files and Code
- backend/routes/habitRoutes.js:
  - calculateStatus function: Currently checks yesterday completion for 'missed'; needs addition for today's time check.
  - Example: If daily, parse habit.time as HH:mm, compare to current time; if passed and !completed today, set 'missed'.
- src/pages/Dashboard.jsx:
  - Destructure completeHabit, deleteHabit from useHabits.
  - Pass to HabitCard: <HabitCard ... completeHabit={completeHabit} deleteHabit={deleteHabit} refetch={refetch} />
- src/components/HabitCard.jsx:
  - Remove local useHabits(); use props.completeHabit, props.deleteHabit.
  - In handleCompletion/handleDelete: Call prop function, then props.refetch() for sync.

## Problem Solving
- Delete issue: Centralize state in Dashboard to ensure list re-renders on delete.
- Missed status: Add time logic in backend to set status dynamically on fetch, so frontend sees updates on refetch.
- Edge cases: New habits not marked missed retroactively; weekly habits unchanged (no time check); time parsing handles timeFrom/timeTo ranges.

## Pending Tasks and Next Steps
1. [ ] Edit backend/routes/habitRoutes.js: Update calculateStatus to include time-based missed check for daily habits.
   - Import parse from date-fns.
   - In calculateStatus: If frequency === 'daily' and !todayCompleted, parse current time vs habit.time/timeFrom; if passed, return 'missed'.
   - For ranges: If current time > timeTo or (current time > timeFrom and no completion), 'missed'.
   - Keep existing yesterday check for streak breaks.
   - Quote from conversation: "even the time becomes 17.29 the habit is notadded to the missed streak" – this fixes time-passed detection.

2. [ ] Edit src/pages/Dashboard.jsx: Destructure and pass completeHabit, deleteHabit to all HabitCard instances in activeHabits.map.
   - Also pass to missed habits cards if they get delete buttons (currently they don't, but for consistency).
   - Quote: "when ever i delete a habit the website should get refreshed automatically" – this ensures immediate UI update without full refresh.

3. [ ] Edit src/components/HabitCard.jsx: Remove local useHabits(); use props for functions.
   - Update handleCompletion: props.completeHabit(habit._id, selectedDate); props.refetch();
   - Update handleDelete: props.deleteHabit(habit._id); props.refetch();
   - Keep local states (showConfirm, isDeleting) for UX.

4. [ ] Test changes:
   - Run `npm run dev` in frontend and backend dev server.
   - Create daily habit with time (e.g., 17:28), wait past time, refetch – verify status 'missed' in UI.
   - Delete habit – verify immediate removal from list and stats update.
   - No linter errors expected; existing code clean.

5. [ ] Attempt completion once verified.
