import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Switch, Text, TextInput, Vibration, View } from 'react-native';

import { Body, Button, Card, Input, Loading, Muted, Row, Screen } from '@/components/ui';
import { useUserId } from '@/lib/auth';
import { formatDuration, parseNumber } from '@/lib/format';
import {
  formatKg,
  suggestNext,
  summarize,
  type SetLog,
  type Suggestion,
  type SuggestionKind,
} from '@/lib/progression';
import { supabase } from '@/lib/supabase';
import { colors, radius, space } from '@/lib/theme';
import type { Exercise, RoutineExercise, Workout, WorkoutSet } from '@/lib/types';
import { Alert } from '@/lib/alert';

const REST_SECONDS = 90;

type DraftSet = { weight: string; reps: string; done: boolean };

type Block = {
  exercise: Exercise;
  suggestion: Suggestion;
  last: SetLog[] | null;
  sets: DraftSet[];
};

const kindColor: Record<SuggestionKind, string> = {
  first: colors.muted,
  increase: colors.success,
  reps: colors.accent,
  repeat: colors.warning,
  deload: colors.danger,
};

const kindLabel: Record<SuggestionKind, string> = {
  first: 'Découverte',
  increase: '📈 On monte',
  reps: '+1 rep',
  repeat: 'On consolide',
  deload: 'Deload',
};

const weightText = (w: number | null) => (w === null ? '' : String(w).replace('.', ','));

export default function ActiveWorkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useUserId();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [restEnd, setRestEnd] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    (async () => {
      const w = await supabase.from('workouts').select('*').eq('id', id).single();
      if (!w.data) {
        router.back();
        return;
      }
      if (w.data.finished_at) {
        router.replace(`/seance/${id}`);
        return;
      }
      setWorkout(w.data);
      setIsPublic(w.data.is_public);

      const [re, existing] = await Promise.all([
        supabase
          .from('routine_exercises')
          .select('*, exercises(*)')
          .eq('routine_id', w.data.routine_id ?? '')
          .order('position'),
        supabase.from('workout_sets').select('*').eq('workout_id', id),
      ]);
      const routineExercises = (re.data as RoutineExercise[] | null) ?? [];
      const done = (existing.data as WorkoutSet[] | null) ?? [];
      const exerciseIds = routineExercises.map((r) => r.exercise_id);

      // Historique : séries des séances terminées, les plus récentes d'abord.
      const hist = await supabase
        .from('workout_sets')
        .select('workout_id, exercise_id, set_index, weight, reps, created_at, workouts!inner(finished_at)')
        .eq('user_id', userId)
        .in('exercise_id', exerciseIds.length ? exerciseIds : [''])
        .not('workouts.finished_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(500);

      const byExercise = new Map<string, Map<string, SetLog[]>>();
      for (const s of (hist.data ?? []) as unknown as WorkoutSet[]) {
        if (s.workout_id === id) continue;
        const sessions = byExercise.get(s.exercise_id) ?? new Map<string, SetLog[]>();
        const list = sessions.get(s.workout_id) ?? [];
        list.push({ weight: Number(s.weight), reps: s.reps });
        sessions.set(s.workout_id, list);
        byExercise.set(s.exercise_id, sessions);
      }

      setBlocks(
        routineExercises.map((r) => {
          const history = [...(byExercise.get(r.exercise_id)?.values() ?? [])].slice(0, 3);
          const suggestion = suggestNext(
            {
              sets: r.sets,
              repMin: r.exercises.rep_min,
              repMax: r.exercises.rep_max,
              increment: Number(r.exercises.increment),
            },
            history,
          );
          const mine = done
            .filter((s) => s.exercise_id === r.exercise_id)
            .sort((a, b) => a.set_index - b.set_index);
          const count = Math.max(r.sets, mine.length);
          const sets: DraftSet[] = Array.from({ length: count }, (_, i) => {
            const saved = mine.find((s) => s.set_index === i);
            if (saved) return { weight: weightText(Number(saved.weight)), reps: String(saved.reps), done: true };
            return { weight: weightText(suggestion.weight), reps: String(suggestion.reps), done: false };
          });
          return { exercise: r.exercises, suggestion, last: history[0] ?? null, sets };
        }),
      );
      setLoading(false);
    })();
  }, [id, userId]);

  function editSet(bi: number, si: number, patch: Partial<DraftSet>) {
    setBlocks((list) =>
      list.map((b, i) => {
        if (i !== bi) return b;
        const sets = b.sets.map((s, j) => {
          if (j === si) return { ...s, ...patch };
          // Changer la charge d'une série la reporte sur les séries suivantes pas encore faites.
          if (patch.weight !== undefined && j > si && !s.done && s.weight === b.sets[si].weight) {
            return { ...s, weight: patch.weight };
          }
          return s;
        });
        return { ...b, sets };
      }),
    );
  }

  async function toggleSet(bi: number, si: number) {
    const block = blocks[bi];
    const set = block.sets[si];
    if (set.done) {
      await supabase
        .from('workout_sets')
        .delete()
        .match({ workout_id: id, exercise_id: block.exercise.id, set_index: si });
      editSet(bi, si, { done: false });
      return;
    }
    const weight = set.weight.trim() === '' ? 0 : parseNumber(set.weight);
    const reps = Math.round(parseNumber(set.reps));
    if (!(weight >= 0) || !(reps > 0)) {
      Alert.alert('Série invalide', 'Indique une charge (0 pour le poids du corps) et un nombre de reps.');
      return;
    }
    editSet(bi, si, { done: true });
    const { error } = await supabase.from('workout_sets').upsert(
      { workout_id: id, exercise_id: block.exercise.id, set_index: si, weight, reps },
      { onConflict: 'workout_id,exercise_id,set_index' },
    );
    if (error) {
      editSet(bi, si, { done: false });
      Alert.alert('Erreur', error.message);
      return;
    }
    setRestEnd(Date.now() + REST_SECONDS * 1000);
  }

  function addSet(bi: number) {
    setBlocks((list) =>
      list.map((b, i) => {
        if (i !== bi) return b;
        const prev = b.sets[b.sets.length - 1];
        return { ...b, sets: [...b.sets, { weight: prev?.weight ?? '', reps: prev?.reps ?? '', done: false }] };
      }),
    );
  }

  async function finish() {
    const doneCount = blocks.reduce((n, b) => n + b.sets.filter((s) => s.done).length, 0);
    if (doneCount === 0) {
      Alert.alert('Aucune série validée', 'Valide au moins une série, ou abandonne la séance.');
      return;
    }
    setFinishing(true);
    const { error } = await supabase
      .from('workouts')
      .update({ finished_at: new Date().toISOString(), note: note.trim() || null, is_public: isPublic })
      .eq('id', id);
    setFinishing(false);
    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }
    router.replace(`/seance/${id}`);
  }

  function abandon() {
    Alert.alert('Abandonner la séance ?', 'Les séries de cette séance seront supprimées.', [
      { text: 'Continuer la séance', style: 'cancel' },
      {
        text: 'Abandonner',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('workouts').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  }

  if (loading || !workout) return <Loading />;

  const total = blocks.reduce((n, b) => n + b.sets.length, 0);
  const doneCount = blocks.reduce((n, b) => n + b.sets.filter((s) => s.done).length, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen edges={['bottom']}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body style={{ fontSize: 22, fontWeight: '800' }}>{workout.title}</Body>
          <Muted>
            {doneCount}/{total} séries
          </Muted>
        </Row>
        <ElapsedTime since={workout.started_at} />

        {blocks.map((block, bi) => (
          <Card key={block.exercise.id}>
            <Body style={{ fontSize: 18, fontWeight: '700' }}>{block.exercise.name}</Body>
            <View
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: radius.md,
                padding: space.md,
                gap: 4,
                borderLeftWidth: 3,
                borderLeftColor: kindColor[block.suggestion.kind],
              }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ color: kindColor[block.suggestion.kind], fontWeight: '700' }}>
                  {kindLabel[block.suggestion.kind]}
                </Text>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>
                  {block.suggestion.sets} × {block.suggestion.reps}
                  {block.suggestion.weight !== null ? ` à ${formatKg(block.suggestion.weight)}` : ''}
                </Text>
              </Row>
              <Muted style={{ fontSize: 13 }}>{block.suggestion.reason}</Muted>
              {block.last && <Muted style={{ fontSize: 12 }}>Dernière fois : {summarize(block.last)}</Muted>}
            </View>

            <Row style={{ paddingHorizontal: 4 }}>
              <Muted style={{ width: 28, fontSize: 12 }}>#</Muted>
              <Muted style={{ flex: 1, fontSize: 12, textAlign: 'center' }}>kg</Muted>
              <Muted style={{ flex: 1, fontSize: 12, textAlign: 'center' }}>reps</Muted>
              <View style={{ width: 48 }} />
            </Row>
            {block.sets.map((set, si) => (
              <Row key={si} style={{ opacity: set.done ? 0.85 : 1 }}>
                <Text style={{ width: 28, color: colors.muted, fontWeight: '700' }}>{si + 1}</Text>
                <NumberCell
                  value={set.weight}
                  done={set.done}
                  decimal
                  placeholder="kg"
                  onChange={(t) => editSet(bi, si, { weight: t })}
                />
                <NumberCell
                  value={set.reps}
                  done={set.done}
                  placeholder="reps"
                  onChange={(t) => editSet(bi, si, { reps: t })}
                />
                <Pressable
                  onPress={() => toggleSet(bi, si)}
                  style={{
                    width: 48,
                    height: 44,
                    borderRadius: radius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: set.done ? colors.success : colors.cardAlt,
                  }}>
                  <Text style={{ color: set.done ? '#fff' : colors.muted, fontSize: 20, fontWeight: '800' }}>✓</Text>
                </Pressable>
              </Row>
            ))}
            <Button variant="ghost" title="+ Série" onPress={() => addSet(bi)} />
          </Card>
        ))}

        <Card>
          <Input label="Note (optionnel)" value={note} onChangeText={setNote} placeholder="Comment ça s’est passé ?" multiline />
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Body>Partager avec mes amis</Body>
              <Muted style={{ fontSize: 12 }}>Visible dans le fil des personnes qui te suivent</Muted>
            </View>
            <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: colors.accent }} />
          </Row>
          <Button title="Terminer la séance" onPress={finish} loading={finishing} />
        </Card>
        <Button variant="danger" title="Abandonner la séance" onPress={abandon} />
        {restEnd && <View style={{ height: 80 }} />}
      </Screen>
      {restEnd && <RestTimer end={restEnd} onChange={setRestEnd} />}
    </View>
  );
}

function NumberCell({
  value,
  done,
  decimal,
  placeholder,
  onChange,
}: {
  value: string;
  done: boolean;
  decimal?: boolean;
  placeholder: string;
  onChange: (t: string) => void;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      editable={!done}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      selectTextOnFocus
      style={{
        flex: 1,
        flexBasis: 0,
        minWidth: 0,
        height: 44,
        color: colors.text,
        backgroundColor: done ? colors.successSoft : colors.cardAlt,
        borderRadius: radius.md,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
      }}
    />
  );
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function ElapsedTime({ since }: { since: string }) {
  const now = useNow(30000);
  return <Muted>⏱ {formatDuration(since, new Date(now).toISOString())}</Muted>;
}

function RestTimer({ end, onChange }: { end: number; onChange: (end: number | null) => void }) {
  const now = useNow();
  const remaining = Math.max(0, Math.round((end - now) / 1000));
  const buzzed = useRef(false);

  useEffect(() => {
    buzzed.current = false;
  }, [end]);

  useEffect(() => {
    if (remaining === 0 && !buzzed.current) {
      buzzed.current = true;
      Vibration.vibrate([0, 300, 150, 300]);
    }
  }, [remaining]);

  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, '0');
  return (
    <View
      style={{
        position: 'absolute',
        left: space.lg,
        right: space.lg,
        bottom: space.xl,
        backgroundColor: remaining === 0 ? colors.success : colors.card,
        borderColor: colors.accent,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: space.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
      }}>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', flex: 1 }}>
        {remaining === 0 ? 'C’est reparti ! 💪' : `Repos ${mm}:${ss}`}
      </Text>
      {remaining > 0 && <Button variant="secondary" title="+30 s" onPress={() => onChange(end + 30000)} />}
      <Button variant="ghost" title={remaining === 0 ? 'OK' : 'Passer'} onPress={() => onChange(null)} />
    </View>
  );
}
