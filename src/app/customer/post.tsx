import { router } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/PageHeader';
import { Button, Checkbox, ChoiceChip, ErrorState, FormError, Input, LoadingState, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthProvider';
import { toUserMessage } from '@/lib/errors';
import { createJob, fetchCategories, type JobCategory } from '@/lib/jobs/api';
import { eligibleAges, timeToMinutes } from '@/lib/jobs/eligibility';
import {
  fetchMunicipalities,
  fetchPlatformSettings,
  type Municipality,
  type PlatformSettings,
} from '@/lib/profiles/api';
import { colors, radius, spacing, typography } from '@/theme';
import { todayInIceland } from '@/utils/age';
import { formatDayShort, formatDuration, formatIsk } from '@/utils/formatting';

const DURATIONS = [30, 60, 90, 120, 180, 240];
const DAYS_SHOWN = 21;

type Errors = Partial<Record<'category' | 'title' | 'price' | 'day' | 'time' | 'area' | 'address' | 'safety', string>>;

function upcomingDays(): Date[] {
  const [y, m, d] = todayInIceland().split('-').map(Number) as [number, number, number];
  return Array.from({ length: DAYS_SHOWN }, (_, i) => new Date(Date.UTC(y, m - 1, d + i)));
}

function timeSlots(s: PlatformSettings): number[] {
  const slots: number[] = [];
  const first = timeToMinutes(s.earliest_start);
  const last = timeToMinutes(s.adolescent_latest_end) - 30;
  for (let t = first; t <= last; t += 30) slots.push(t);
  return slots;
}

const fmtSlot = (t: number) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;

function describeAges(ages: number[]): string {
  if (ages.length === 0) return 'Enginn getur tekið verkefnið á þessum tíma.';
  const first = ages[0];
  const last = ages[ages.length - 1];
  return first === last ? `${first} ára` : `${first}–${last} ára`;
}

export default function PostJob() {
  const { profile } = useAuth();

  const [categories, setCategories] = useState<JobCategory[] | null>(null);
  const [municipalities, setMunicipalities] = useState<Municipality[] | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [day, setDay] = useState<Date | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [duration, setDuration] = useState(60);
  const [municipalityId, setMunicipalityId] = useState<number | null>(profile?.municipality_id ?? null);
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [minAge, setMinAge] = useState<number | null>(null);
  const [safety, setSafety] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [posted, setPosted] = useState<{ title: string; needsApproval: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCategories(), fetchMunicipalities(), fetchPlatformSettings()]).then(
      ([c, m, s]) => {
        if (cancelled) return;
        setCategories(c);
        setMunicipalities(m);
        setSettings(s);
      },
      (e: unknown) => {
        if (!cancelled) setLoadError(toUserMessage(e, 'post job load'));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [loadKey]);

  const days = useMemo(() => upcomingDays(), []);
  const category = categories?.find((c) => c.id === categoryId) ?? null;

  const ages = useMemo(() => {
    if (!category || !settings || time === null) return null;
    return eligibleAges(minAge ?? category.minimum_age, category, time, duration, settings);
  }, [category, settings, time, duration, minAge]);

  const timeLimitsChildren =
    !!category &&
    !!settings &&
    !!ages &&
    Math.max(minAge ?? 0, category.minimum_age) <= settings.child_max_age &&
    (ages[0] ?? 99) > settings.child_max_age;

  const reset = () => {
    setCategoryId(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setDay(null);
    setTime(null);
    setDuration(60);
    setArea('');
    setAddress('');
    setMinAge(null);
    setSafety(false);
    setErrors({});
  };

  const submit = async () => {
    setFormError(null);
    const next: Errors = {};
    const priceNum = Number(price.replace(/\D/g, ''));
    if (!category) next.category = 'Veldu flokk.';
    if (title.trim().length < 3) next.title = 'Skrifaðu stutt heiti (a.m.k. 3 stafir).';
    if (!priceNum || priceNum < 500 || priceNum > 200000) next.price = 'Verð þarf að vera á bilinu 500–200.000 kr.';
    if (!day) next.day = 'Veldu dag.';
    if (time === null) next.time = 'Veldu tíma.';
    if (area.trim().length === 0) next.area = 'Skráðu hverfi eða gróft svæði.';
    if (address.trim().length < 3) next.address = 'Skráðu heimilisfang.';
    if (!safety) next.safety = 'Þú þarft að staðfesta þetta.';
    setErrors(next);
    if (Object.keys(next).length > 0 || !category || !day || time === null || municipalityId === null) return;
    if (ages && ages.length === 0) {
      setFormError('Enginn getur tekið verkefnið á þessum tíma. Veldu fyrri tíma eða styttri lengd.');
      return;
    }

    const startsAt = new Date(day.getTime() + time * 60_000); // Iceland = UTC
    setBusy(true);
    try {
      const job = await createJob({
        categoryId: category.id,
        title: title.trim(),
        description: description.trim(),
        priceIsk: priceNum,
        municipalityId,
        areaLabel: area.trim(),
        address: address.trim(),
        startsAt,
        durationMinutes: duration,
        minAge,
        safetyConfirmed: safety,
      });
      setPosted({ title: job.title, needsApproval: job.requires_approval });
      reset();
    } catch (e) {
      setFormError(toUserMessage(e, 'createJob'));
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <Screen edges={['top']}>
        <ErrorState
          message={loadError}
          onRetry={() => {
            setLoadError(null);
            setLoadKey((k) => k + 1);
          }}
        />
      </Screen>
    );
  }
  if (!categories || !municipalities || !settings) {
    return (
      <Screen edges={['top']}>
        <LoadingState />
      </Screen>
    );
  }

  if (posted) {
    return (
      <Screen edges={['top']}>
        <View style={styles.success}>
          <Text style={styles.successTitle}>Verkefnið er komið inn</Text>
          <Text style={styles.body}>
            {posted.needsApproval
              ? `„${posted.title}“ birtist um leið og ungVERK teymið hefur farið yfir það.`
              : `„${posted.title}“ er nú opið og ungt fólk í nágrenninu getur sótt um.`}
          </Text>
          <Button label="Sjá mín verkefni" onPress={() => router.navigate('/customer/my-jobs')} />
          <Button label="Posta annað verkefni" variant="secondary" onPress={() => setPosted(null)} />
        </View>
      </Screen>
    );
  }

  const minAgeOptions = category
    ? Array.from(
        { length: Math.min(category.maximum_age, settings.worker_max_age) - category.minimum_age },
        (_, i) => category.minimum_age + 1 + i,
      )
    : [];

  return (
    <Screen
      scroll
      edges={['top']}
      footer={<Button label="Posta verkefni" loadingLabel="Birti..." loading={busy} onPress={submit} />}
    >
      <PageHeader title="Posta verkefni" />
      <FormError message={formError} />

      <Field label="Flokkur" error={errors.category}>
        <View style={styles.wrapRow} accessibilityRole="radiogroup">
          {categories.map((c) => (
            <ChoiceChip
              key={c.id}
              label={c.name}
              selected={categoryId === c.id}
              onPress={() => {
                setCategoryId(c.id);
                setMinAge(null);
              }}
            />
          ))}
        </View>
        {category ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{category.description}</Text>
            <Text style={styles.infoStrong}>{category.safety_rules}</Text>
            <Text style={styles.infoText}>Aldurstakmark: {category.minimum_age} ára og eldri.</Text>
          </View>
        ) : null}
      </Field>

      <Input
        label="Heiti verkefnis"
        value={title}
        onChangeText={setTitle}
        placeholder="T.d. Raka lauf í garðinum"
        maxLength={80}
        error={errors.title}
        editable={!busy}
      />
      <Input
        label="Lýsing"
        value={description}
        onChangeText={setDescription}
        placeholder="T.d. Lítill garður. Hrífa og pokar á staðnum."
        multiline
        maxLength={1000}
        style={styles.multiline}
        editable={!busy}
      />
      <Input
        label="Verð (kr.)"
        value={price}
        onChangeText={setPrice}
        placeholder="8000"
        keyboardType="number-pad"
        maxLength={7}
        error={errors.price}
        hint={
          Number(price) > 0
            ? `${formatIsk(Number(price))} — greiðist beint til verkamanns, ungVERK sér ekki um greiðslur enn.`
            : 'Greiðsla fer fram beint á milli ykkar. ungVERK sér ekki um greiðslur enn.'
        }
        editable={!busy}
      />

      <Field label="Dagur" error={errors.day}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {days.map((d) => (
            <ChoiceChip
              key={d.toISOString()}
              label={formatDayShort(d)}
              selected={day?.getTime() === d.getTime()}
              onPress={() => setDay(d)}
            />
          ))}
        </ScrollView>
      </Field>

      <Field label="Tími" error={errors.time}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {timeSlots(settings).map((t) => (
            <ChoiceChip key={t} label={fmtSlot(t)} selected={time === t} onPress={() => setTime(t)} />
          ))}
        </ScrollView>
      </Field>

      <Field label="Áætluð lengd">
        <View style={styles.wrapRow} accessibilityRole="radiogroup">
          {DURATIONS.map((m) => (
            <ChoiceChip
              key={m}
              label={formatDuration(m)}
              selected={duration === m}
              onPress={() => setDuration(m)}
            />
          ))}
        </View>
      </Field>

      {category ? (
        <Field label="Óskir um aldur" hint="Þú getur beðið um eldri verkamann. Aldurstakmark flokksins gildir alltaf.">
          <View style={styles.wrapRow} accessibilityRole="radiogroup">
            <ChoiceChip label="Engin sérstök ósk" selected={minAge === null} onPress={() => setMinAge(null)} />
            {minAgeOptions.map((a) => (
              <ChoiceChip key={a} label={`${a}+`} selected={minAge === a} onPress={() => setMinAge(a)} />
            ))}
          </View>
        </Field>
      ) : null}

      {ages ? (
        <View style={[styles.infoBox, ages.length === 0 && styles.warnBox]}>
          <Text style={styles.infoStrong}>Hverjir geta tekið verkefnið: {describeAges(ages)}</Text>
          {timeLimitsChildren ? (
            <Text style={styles.infoText}>
              Yngri en 16 ára mega ekki vinna eftir kl. {settings.child_latest_end.slice(0, 5)} né lengur en{' '}
              {settings.school_term_active
                ? `${settings.child_max_minutes_school_term / 60} klst. á skóladegi`
                : `${settings.child_max_minutes_holiday / 60} klst. á dag`}
              .
            </Text>
          ) : null}
        </View>
      ) : null}

      <Field label="Sveitarfélag">
        <View style={styles.wrapRow} accessibilityRole="radiogroup">
          {municipalities.map((m) => (
            <ChoiceChip key={m.id} label={m.name} selected={municipalityId === m.id} onPress={() => setMunicipalityId(m.id)} />
          ))}
        </View>
      </Field>

      <Input
        label="Gróft svæði"
        value={area}
        onChangeText={setArea}
        placeholder="T.d. Arnarnes"
        hint="Þetta sjá allir sem skoða verkefnið."
        maxLength={60}
        error={errors.area}
        editable={!busy}
      />
      <Input
        label="Nákvæmt heimilisfang"
        value={address}
        onChangeText={setAddress}
        placeholder="T.d. Dæmigata 12"
        hint="Aðeins sá sem þú velur fær að sjá heimilisfangið."
        maxLength={120}
        autoComplete="street-address"
        error={errors.address}
        editable={!busy}
      />

      <Checkbox
        label="Ég staðfesti að verkið krefst ekki véla, hættulegra efna eða byrða yfir 8 kg, og að fullorðinn einstaklingur verði til taks á meðan verkið er unnið."
        checked={safety}
        onChange={setSafety}
        error={errors.safety}
      />
    </Screen>
  );
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { ...typography.label, color: colors.ink },
  row: { gap: spacing.sm, paddingRight: spacing.xl },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  multiline: { minHeight: 96, paddingTop: spacing.md, textAlignVertical: 'top' },
  infoBox: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.lg, gap: spacing.xs },
  warnBox: { backgroundColor: colors.dangerSoft },
  infoText: { ...typography.meta, color: colors.ink },
  infoStrong: { ...typography.label, color: colors.ink },
  error: { ...typography.meta, color: colors.danger },
  hint: { ...typography.meta, color: colors.textMuted },
  success: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  successTitle: { ...typography.title, color: colors.ink },
  body: { ...typography.body, color: colors.textMuted },
});
