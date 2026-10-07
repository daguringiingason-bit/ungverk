import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button, ErrorState, LoadingState, Screen, Wordmark } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth/AuthProvider';
import { NETWORK_ERROR } from '@/lib/errors';
import { colors, spacing, typography } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

/**
 * Which part of the app is reachable is decided by the auth status and the role
 * stored in the DATABASE. This is only navigation — every permission is also
 * enforced server-side by RLS.
 */
function RootNavigator() {
  const { status, profile, refreshProfile, signOut } = useAuth();

  if (status === 'loading') {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen>
        <ErrorState message={NETWORK_ERROR} onRetry={refreshProfile} />
        <Button label="Skrá út" variant="ghost" onPress={signOut} />
      </Screen>
    );
  }

  if (status === 'suspended') {
    return (
      <Screen>
        <View style={styles.center}>
          <Wordmark size={28} />
          <Text style={styles.title}>Aðgangurinn þinn er í biðstöðu</Text>
          <Text style={styles.body}>
            ungVERK teymið hefur lokað tímabundið fyrir aðganginn. Hafðu samband við okkur ef þú hefur spurningar.
          </Text>
          <Button label="Skrá út" variant="secondary" onPress={signOut} />
        </View>
      </Screen>
    );
  }

  const role = status === 'ready' ? profile?.role : undefined;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'needsProfile'}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'WORKER'}>
        <Stack.Screen name="worker" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'CUSTOMER'}>
        <Stack.Screen name="customer" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'ADMIN'}>
        <Stack.Screen name="admin" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  title: { ...typography.title, color: colors.ink },
  body: { ...typography.body, color: colors.textMuted },
});
