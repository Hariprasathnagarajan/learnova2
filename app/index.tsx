import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
    if (user.role === 'admin') return <Redirect href="/(admin)/dashboard" />;
    if (user.role === 'staff') return <Redirect href="/(staff)/dashboard" />;
    return <Redirect href="/(student)/home" />;
  }
  return <Redirect href="/(auth)/login" />;
}
