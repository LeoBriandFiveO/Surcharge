import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WorkoutCard } from '@/components/workout-card';
import { Body, Card, Empty, Muted, Row, Stat, styles, Subtitle, Title } from '@/components/ui';
import { useUserId } from '@/lib/auth';
import { formatVolume } from '@/lib/format';
import { estimatedOneRepMax, formatKg, volume } from '@/lib/progression';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { FEED_SELECT, type Exercise, type FeedWorkout } from '@/lib/types';

export default function History() {
  const userId = useUserId();
  const [workouts, setWorkouts] = useState<FeedWorkout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [w, e] = await Promise.all([
      supabase
        .from('workouts')
        .select(FEED_SELECT)
        .eq('user_id', userId)
        .not('finished_at', 'is', null)
        .order('finished_at', { ascending: false })
        .limit(60),
      supabase.from('exercises').select('*').eq('user_id', userId).order('name'),
    ]);
    setWorkouts((w.data as FeedWorkout[] | null) ?? []);
    setExercises(e.data ?? []);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = workouts.filter((w) => Date.parse(w.finished_at ?? '') >= monthStart.getTime());
  const monthVolume = volume(
    thisMonth.flatMap((w) => w.workout_sets.map((s) => ({ weight: Number(s.weight), reps: s.reps }))),
  );

  // Meilleur 1RM estimé par exercice sur les séances chargées.
  const best = new Map<string, number>();
  for (const w of workouts) {
    for (const s of w.workout_sets) {
      const e1rm = estimatedOneRepMax({ weight: Number(s.weight), reps: s.reps });
      best.set(s.exercise_id, Math.max(best.get(s.exercise_id) ?? 0, e1rm));
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            tintColor={colors.accent}
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }>
        <Title>Mes progrès</Title>
        <Card index={0}>
          <Muted>Ce mois-ci</Muted>
          <Row>
            <Stat label="Séances" value={String(thisMonth.length)} />
            <Stat label="Volume" value={formatVolume(monthVolume)} />
            <Stat label="Total séances" value={String(workouts.length)} />
          </Row>
        </Card>

        <Subtitle>Exercices</Subtitle>
        {exercises.length === 0 ? (
          <Muted>Tes exercices apparaîtront ici après avoir créé un programme.</Muted>
        ) : (
          exercises.map((e, i) => (
            <Card key={e.id} index={i + 1} onPress={() => router.push(`/exercise/${e.id}`)}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Body style={{ fontWeight: '600', flex: 1 }}>{e.name}</Body>
                <Muted>{best.has(e.id) ? `1RM ≈ ${formatKg(best.get(e.id)!)}` : 'Pas encore fait'} ›</Muted>
              </Row>
            </Card>
          ))
        )}

        <Subtitle>Historique</Subtitle>
        {workouts.length === 0 ? (
          <Empty title="Aucune séance terminée">
            <Muted>Lance ta première séance depuis l’onglet Séance.</Muted>
          </Empty>
        ) : (
          workouts.map((w, i) => <WorkoutCard key={w.id} workout={w} userId={userId} index={i} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
