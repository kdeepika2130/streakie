import { HabitsProvider } from '../hooks/useHabits';
import { AuthProvider } from '../context/AuthContext';

function AppProvider({ children }) {
  return (
    <AuthProvider>
      <HabitsProvider>
        {children}
      </HabitsProvider>
    </AuthProvider>
  );
}

export default AppProvider;
