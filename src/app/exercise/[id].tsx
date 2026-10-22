import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { ExerciseFigure } from '@/components/exercise-figure';
import { MuscleMap } from '@/components/muscle-map';
import { Body, Card, Loading, Muted, Row, Screen, Stat, Subtitle } from '@/components/ui';
import { findCatalog, muscleNames } from '@/lib/catalog';
import { formatDate, formatShortDate } from '@/lib/format';
import { bestSet, estimatedOneRepMax, formatKg, summarize, type SetLog } from '@/lib/progression';
import { supabase } from '@/lib/supabase';
import { colors, radius, space } from '@/lib/theme';
import type { Exercise } from '@/lib/types';

type Session = { workoutId: string; date: string; sets: SetLog[] };

type Row_ = {
  workout_id: string;
  set_index: number;
  weight: number;
  reps: number;
  workouts: { finished_at: string | null } | null;
};

export default function ExerciseProgress() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    (async () => {
      const [e, s] = await Promise.all([
        supabase.from('exercises').select('*').eq('id', id).single(),
        supabase
          .from('workout_sets')
          .select('workout_id, set_index, weight, reps, workouts!inner(finished_at)')
          .eq('exercise_id', id)
          .not('workouts.finished_at', 'is', null)
          .order('created_at', { ascending: true })
          .limit(1000),
      ]);
      setExercise(e.data);
      const map = new Map<string, Session>();
      for (const row of (s.data ?? []) as unknown as Row_[]) {
        const session = map.get(row.workout_id) ?? {
          workoutId: row.workout_id,
          date: row.workouts?.finished_at ?? '',
          sets: [],
        };
        session.sets.push({ weight: Number(row.weight), reps: row.reps });
        map.set(row.workout_id, session);
      }
      setSessions([...map.values()].sort((a, b) => a.date.localeCompare(b.date)));
    })();
  }, [id]);

  if (!exercise) return <Loading />;
  const catalogEntry = findCatalog(exercise.catalog_id, exercise.name);

  const points = sessions.map((s) => ({ ...s, e1rm: estimatedOneRepMax(bestSet(s.sets)!) }));
  const recent = points.slice(-12);
  const max = Math.max(1, ...recent.map((p) => p.e1rm));
  const min = Math.min(...recent.map((p) => p.e1rm));
  const record = points.reduce((m, p) => Math.max(m, p.e1rm), 0);
  const heaviest = sessions.reduce((m, s) => Math.max(m, ...s.sets.map((x) => x.weight)), 0);
  const first = points[0]?.e1rm ?? 0;
  const last = points[points.length - 1]?.e1rm ?? 0;

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: exercise.name }} />
      {catalogEntry && (
        <Card index={0} style={{ alignItems: 'center' }}>
          <Row style={{ gap: 16 }}>
            <ExerciseFigure
              motion={catalogEntry.motion}
              primary={catalogEntry.primary}
              secondary={catalogEntry.secondary}
              equipment={catalogEntry.equipment}
              size={150}
              animated
            />
            <MuscleMap primary={catalogEntry.primary} secondary={catalogEntry.secondary} width={120} labels />
          </Row>
          <Muted style={{ textAlign: 'center' }}>
            {catalogEntry.primary.map((m) => muscleNames[m]).join(', ')}
            {catalogEntry.secondary.length > 0 && ` · aussi : ${catalogEntry.secondary.map((m) => muscleNames[m]).join(', ')}`}
          </Muted>
        </Card>
      )}
      <Muted>
        Fourchette {exercise.rep_min}–{exercise.rep_max} reps · +{formatKg(Number(exercise.increment))} quand c’est validé
      </Muted>

      <Card>
        <Row>
          <Stat label="1RM estimé record" value={record ? formatKg(record) : '—'} />
          <Stat label="Charge max" value={heaviest ? formatKg(heaviest) : '—'} />
          <Stat
            label="Évolution"
            value={first ? `${last >= first ? '+' : ''}${Math.round(((last - first) / first) * 100)} %` : '—'}
          />
        </Row>
      </Card>

      {recent.length > 1 && (
        <Card>
          <Muted>1RM estimé (12 dernières séances)</Muted>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 6, marginTop: space.sm }}>
            {recent.map((p) => {
              // Échelle resserrée autour des valeurs pour rendre la progression visible.
              const floor = Math.max(0, min - (max - min) * 0.5 - 1);
              const h = 20 + ((p.e1rm - floor) / (max - floor)) * 110;
              return (
                <View key={p.workoutId} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: colors.muted, fontSize: 9 }}>{Math.round(p.e1rm)}</Text>
                  <View
                    style={{
                      width: '100%',
                      height: h,
                      borderRadius: radius.sm,
                      backgroundColor: p.e1rm === record ? colors.accent : colors.accentSoft,
                    }}
                  />
                </View>
              );
            })}
          </View>
          <Row style={{ justifyContent: 'space-between' }}>
            <Muted style={{ fontSize: 11 }}>{formatShortDate(recent[0].date)}</Muted>
            <Muted style={{ fontSize: 11 }}>{formatShortDate(recent[recent.length - 1].date)}</Muted>
          </Row>
        </Card>
      )}

      <Subtitle>Séances</Subtitle>
      {points.length === 0 && <Muted>Pas encore d’historique pour cet exercice.</Muted>}
      {[...points].reverse().map((p, i) => (
        <Card key={p.workoutId} index={i} onPress={() => router.push(`/seance/${p.workoutId}`)}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body style={{ fontWeight: '600' }}>{summarize(p.sets)}</Body>
            <Muted>1RM ≈ {formatKg(p.e1rm)}</Muted>
          </Row>
          <Muted style={{ fontSize: 12 }}>
            {formatDate(p.date)} · {p.sets.map((s) => `${s.weight}×${s.reps}`).join('  ')}
          </Muted>
        </Card>
      ))}
    </Screen>
  );
}
