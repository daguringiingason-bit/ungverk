import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, FormError, Input, Screen } from '@/components/ui';
import { toUserMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase/client';
import { colors, spacing, typography } from '@/theme';
import { validateEmail, validateOtp } from '@/utils/validation';

/**
 * Passwordless sign-in with an email one-time code. The same flow creates new
 * accounts and signs in existing ones. After a successful code, the root layout
 * routes automatically (onboarding for new users, home for existing ones).
 */
export default function SignInScreen() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sendCode = async () => {
    setFormError(null);
    const parsed = validateEmail(email);
    if (!parsed.ok) return setFieldError(parsed.error);
    setFieldError(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.value,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setEmail(parsed.value);
      setStep('code');
    } catch (e) {
      setFormError(toUserMessage(e, 'signInWithOtp'));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setFormError(null);
    const parsed = validateOtp(code);
    if (!parsed.ok) return setFieldError(parsed.error);
    setFieldError(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: parsed.value, type: 'email' });
      if (error) throw error;
      // Success: AuthProvider picks up the session and the root layout navigates.
    } catch (e) {
      setFormError(toUserMessage(e, 'verifyOtp'));
      setBusy(false);
    }
  };

  return (
    <Screen
      scroll
      footer={
        step === 'email' ? (
          <Button label="Senda kóða" loadingLabel="Sendi..." loading={busy} onPress={sendCode} />
        ) : (
          <>
            <Button label="Staðfesta" loadingLabel="Staðfesti..." loading={busy} onPress={verify} />
            <Button
              label="Nota annað netfang"
              variant="ghost"
              disabled={busy}
              onPress={() => {
                setStep('email');
                setCode('');
                setFormError(null);
              }}
            />
          </>
        )
      }
    >
      <Button label="← Til baka" variant="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <View style={styles.header}>
        <Text style={styles.title}>{step === 'email' ? 'Skráðu þig inn' : 'Sláðu inn kóðann'}</Text>
        <Text style={styles.body}>
          {step === 'email'
            ? 'Við sendum þér innskráningarkóða í tölvupósti. Ekkert lykilorð þarf.'
            : `Við sendum kóða á ${email}. Athugaðu líka ruslpóstinn.`}
        </Text>
      </View>

      <FormError message={formError} />

      {step === 'email' ? (
        <Input
          label="Netfang"
          value={email}
          onChangeText={setEmail}
          error={fieldError}
          placeholder="nafn@dæmi.is"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={sendCode}
          editable={!busy}
        />
      ) : (
        <Input
          label="Kóði"
          value={code}
          onChangeText={setCode}
          error={fieldError}
          placeholder="123456"
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={8}
          returnKeyType="done"
          onSubmitEditing={verify}
          editable={!busy}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  title: { ...typography.title, color: colors.ink },
  body: { ...typography.body, color: colors.textMuted },
});
