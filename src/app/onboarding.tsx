import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, ChoiceChip, ErrorState, FormError, Input, LoadingState, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getPendingRole, setPendingRole } from '@/lib/auth/pendingRole';
import { toUserMessage } from '@/lib/errors';
import {
  completeOnboarding,
  fetchMunicipalities,
  fetchPlatformSettings,
  type Municipality,
  type PlatformSettings,
  type SelfServiceRole,
} from '@/lib/profiles/api';
import { colors, spacing, typography } from '@/theme';
import { ageInYears, todayInIceland } from '@/utils/age';
import { parseDateOfBirth, validateFirstName } from '@/utils/validation';

type Errors = Partial<Record<'role' | 'firstName' | 'dob' | 'municipality', string>>;

export default function OnboardingScreen() {
  const { setProfile, signOut } = useAuth();

  const [municipalities, setMunicipalities] = useState<Municipality[] | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [role, setRole] = useState<SelfServiceRole | null>(getPendingRole());
  const [firstName, setFirstName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [municipalityId, setMunicipalityId] = useState<number | null>(null);

  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const [loadKey, setLoadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMunicipalities(), fetchPlatformSettings()]).then(
      ([m, s]) => {
        if (cancelled) return;
        setMunicipalities(m);
        setSettings(s);
      },
      (e: unknown) => {
        if (!cancelled) setLoadError(toUserMessage(e, 'onboarding load'));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [loadKey]);

  const retryLoad = () => {
    setLoadError(null);
    setLoadKey((k) => k + 1);
  };

  const submit = async () => {
    setFormError(null);
    const next: Errors = {};
    const name = validateFirstName(firstName);
    const dob = parseDateOfBirth(day, month, year, todayInIceland());

    if (!role) next.role = 'Veldu annað hvort.';
    if (!name.ok) next.firstName = name.error;
    if (!dob.ok) next.dob = dob.error;
    if (municipalityId === null) next.municipality = 'Veldu sveitarfélag.';

    // Early, friendly feedback only. The database re-checks age and role.
    if (dob.ok && role && settings) {
      const age = ageInYears(dob.value);
      if (role === 'WORKER' && (age < settings.worker_min_age || age > settings.worker_max_age)) {
        next.dob = `Í ungVERK geta ${settings.worker_min_age}–${settings.worker_max_age} ára tekið að sér verkefni.`;
      }
      if (role === 'CUSTOMER' && age < settings.customer_min_age) {
        next.dob = `Til að óska eftir aðstoð þarftu að vera ${settings.customer_min_age} ára eða eldri.`;
      }
    }

    setErrors(next);
    if (Object.keys(next).length > 0 || !role || !name.ok || !dob.ok || municipalityId === null) return;

    setBusy(true);
    try {
      const profile = await completeOnboarding({
        role,
        firstName: name.value,
        dateOfBirth: dob.value,
        municipalityId,
      });
      setPendingRole(null);
      setProfile(profile); // root layout now routes to the role's home
    } catch (e) {
      setFormError(toUserMessage(e, 'completeOnboarding'));
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <Screen>
        <ErrorState message={loadError} onRetry={retryLoad} />
      </Screen>
    );
  }
  if (!municipalities) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <>
          <Button label="Halda áfram" loadingLabel="Vista..." loading={busy} onPress={submit} />
          <Button label="Hætta við og skrá út" variant="ghost" disabled={busy} onPress={signOut} />
        </>
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Segðu okkur aðeins frá þér</Text>
        <Text style={styles.body}>Þetta tekur innan við mínútu.</Text>
      </View>

      <FormError message={formError} />

      <Section label="Ég ætla að..." error={errors.role}>
        <View style={styles.row} accessibilityRole="radiogroup">
          <ChoiceChip label="Fá aðstoð" selected={role === 'CUSTOMER'} onPress={() => setRole('CUSTOMER')} />
          <ChoiceChip label="Vinna verkefni" selected={role === 'WORKER'} onPress={() => setRole('WORKER')} />
        </View>
      </Section>

      <Input
        label="Fornafn"
        value={firstName}
        onChangeText={setFirstName}
        error={errors.firstName}
        hint="Aðrir notendur sjá aðeins fornafnið þitt."
        autoComplete="given-name"
        textContentType="givenName"
        maxLength={40}
        editable={!busy}
      />

      <Section
        label="Fæðingardagur"
        error={errors.dob}
        hint="Notaður til að reikna aldur. Fæðingardagurinn sjálfur er aldrei sýndur öðrum."
      >
        <View style={styles.row}>
          <View style={styles.dobSmall}>
            <Input
              label="Dagur"
              value={day}
              onChangeText={(t) => {
                setDay(t);
                if (t.length === 2) monthRef.current?.focus();
              }}
              placeholder="dd"
              keyboardType="number-pad"
              maxLength={2}
              editable={!busy}
            />
          </View>
          <View style={styles.dobSmall}>
            <Input
              ref={monthRef}
              label="Mánuður"
              value={month}
              onChangeText={(t) => {
                setMonth(t);
                if (t.length === 2) yearRef.current?.focus();
              }}
              placeholder="mm"
              keyboardType="number-pad"
              maxLength={2}
              editable={!busy}
            />
          </View>
          <View style={styles.dobLarge}>
            <Input
              ref={yearRef}
              label="Ár"
              value={year}
              onChangeText={setYear}
              placeholder="áááá"
              keyboardType="number-pad"
              maxLength={4}
              editable={!busy}
            />
          </View>
        </View>
      </Section>

      <Section label="Sveitarfélag" error={errors.municipality}>
        <View style={[styles.row, styles.wrap]} accessibilityRole="radiogroup">
          {municipalities.map((m) => (
            <ChoiceChip
              key={m.id}
              label={m.name}
              selected={municipalityId === m.id}
              onPress={() => setMunicipalityId(m.id)}
            />
          ))}
        </View>
      </Section>
    </Screen>
  );
}

function Section({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, paddingTop: spacing.lg },
  title: { ...typography.title, color: colors.ink },
  body: { ...typography.body, color: colors.textMuted },
  section: { gap: spacing.sm },
  sectionLabel: { ...typography.label, color: colors.ink },
  row: { flexDirection: 'row', gap: spacing.sm },
  wrap: { flexWrap: 'wrap' },
  dobSmall: { flex: 1 },
  dobLarge: { flex: 1.5 },
  error: { ...typography.meta, color: colors.danger },
  hint: { ...typography.meta, color: colors.textMuted },
});
