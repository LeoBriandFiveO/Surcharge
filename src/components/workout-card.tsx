import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Avatar, Body, Card, Muted, Row, Stat } from '@/components/ui';
import { formatDate, formatDuration, formatVolume } from '@/lib/format';
import { bestSet, formatKg, volume } from '@/lib/progression';
import { colors, space } from '@/lib/theme';
import type { FeedWorkout } from '@/lib/types';

// Regroupe les séries d'une séance par exercice, dans l'ordre où elles ont été faites.
export function groupByExercise(sets: FeedWorkout['workout_sets']) {
  const groups = new Map<string, { name: string; sets: { weight: number; reps: number }[] }>();
  for (const s of [...sets].sort((a, b) => a.set_index - b.set_index)) {
    const g = groups.get(s.exercise_id) ?? { name: s.exercises?.name ?? 'Exercice', sets: [] };
    g.sets.push({ weight: Number(s.weight), reps: s.reps });
    groups.set(s.exercise_id, g);
  }
  return [...groups.entries()].map(([exerciseId, g]) => ({ exerciseId, ...g }));
}

export function WorkoutCard({
  workout,
  userId,
  onKudo,
}: {
  workout: FeedWorkout;
  userId: string;
  onKudo?: (workout: FeedWorkout) => void;
}) {
  const author = workout.profiles?.display_name ?? workout.profiles?.username ?? '?';
  const sets = workout.workout_sets.map((s) => ({ weight: Number(s.weight), reps: s.reps }));
  const groups = groupByExercise(workout.workout_sets);
  const liked = workout.kudos.some((k) => k.user_id === userId);
  const commentCount = workout.comments[0]?.count ?? 0;

  return (
    <Card onPress={() => router.push(`/seance/${workout.id}`)}>
      <Row>
        <Avatar name={author} />
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: '700' }}>{workout.user_id === userId ? 'Toi' : author}</Body>
          <Muted style={{ fontSize: 12 }}>
            {formatDate(workout.finished_at ?? workout.started_at)}
            {workout.is_public ? '' : ' · 🔒 privée'}
          </Muted>
        </View>
      </Row>
      <Body style={{ fontSize: 19, fontWeight: '800' }}>{workout.title}</Body>
      {workout.note ? <Body style={{ color: colors.muted }}>{workout.note}</Body> : null}
      <Row style={{ marginVertical: space.xs }}>
        <Stat label="Durée" value={formatDuration(workout.started_at, workout.finished_at)} />
        <Stat label="Volume" value={formatVolume(volume(sets))} />
        <Stat label="Séries" value={String(sets.length)} />
      </Row>
      {groups.slice(0, 4).map((g) => {
        const best = bestSet(g.sets);
        return (
          <Row key={g.exerciseId} style={{ justifyContent: 'space-between' }}>
            <Muted style={{ flex: 1 }} numberOfLines={1}>
              {g.name}
            </Muted>
            <Muted style={{ color: colors.text }}>
              {g.sets.length} × · max {best ? `${formatKg(best.weight)} × ${best.reps}` : '—'}
            </Muted>
          </Row>
        );
      })}
      {groups.length > 4 && <Muted style={{ fontSize: 12 }}>+ {groups.length - 4} autres exercices</Muted>}
      <Row style={{ marginTop: space.xs, gap: space.lg }}>
        <Pressable onPress={() => onKudo?.(workout)} hitSlop={8} disabled={!onKudo}>
          <Text style={{ color: liked ? colors.accent : colors.muted, fontWeight: '700' }}>
            💪 {workout.kudos.length}
          </Text>
        </Pressable>
        <Text style={{ color: colors.muted, fontWeight: '700' }}>💬 {commentCount}</Text>
      </Row>
    </Card>
  );
}
