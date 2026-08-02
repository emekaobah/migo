import { Stack } from 'expo-router';

/** Enrolment. Gesture-back is disabled on `enrol` — it is the entry point. */
export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="enrol" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
