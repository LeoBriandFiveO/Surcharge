import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { WorkoutCard, groupByExercise } from '@/components/workout-card';
import { Avatar, Body, Button, Card, Input, Loading, Muted, Row, Screen, Subtitle } from '@/components/ui';
import { Alert } from '@/lib/alert';
import { useUserId } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { estimatedOneRepMax, formatKg } from '@/lib/progression';
import { toggleKudo } from '@/lib/social';
import { supabase } from '@/lib/supabase';
import { colors, space } from '@/lib/theme';
import { FEED_SELECT, type Comment, type FeedWorkout } from '@/lib/types';

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useUserId();
  const [workout, setWorkout] = useState<FeedWorkout | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    const [w, c] = await Promise.all([
      supabase.from('workouts').select(FEED_SELECT).eq('id', id).maybeSingle(),
      supabase
        .from('comments')
        .select('*, profiles(username, display_name)')
        .eq('workout_id', id)
        .order('created_at'),
    ]);
    if (!w.data) setMissing(true);
    setWorkout(w.data as FeedWorkout | null);
    setComments((c.data as Comment[] | null) ?? []);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    const { error } = await supabase.from('comments').insert({ workout_id: id, body });
    setSending(false);
    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }
    setDraft('');
    load();
  }

  function remove() {
    Alert.alert('Supprimer cette séance ?', 'Elle disparaîtra de ton historique et du fil.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('workouts').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  }

  if (missing) {
    return (
      <Screen edges={['bottom']}>
        <Muted>Cette séance n’existe plus ou n’est pas visible.</Muted>
      </Screen>
    );
  }
  if (!workout) return <Loading />;
  const mine = workout.user_id === userId;

  return (
    <Screen edges={['bottom']}>
      <WorkoutCard
        workout={workout}
        userId={userId}
        onKudo={async (w) => setWorkout(await toggleKudo(w, userId))}
      />

      <Subtitle>Détail</Subtitle>
      {groupByExercise(workout.workout_sets).map((g) => (
        <Card
          key={g.exerciseId}
          onPress={mine ? () => router.push(`/exercise/${g.exerciseId}`) : undefined}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body style={{ fontWeight: '700', flex: 1 }}>{g.name}</Body>
            {mine && <Muted style={{ color: colors.accent }}>Progression ›</Muted>}
          </Row>
          {g.sets.map((s, i) => (
            <Row key={i} style={{ justifyContent: 'space-between' }}>
              <Muted>Série {i + 1}</Muted>
              <Body>
                {formatKg(s.weight)} × {s.reps}
              </Body>
              <Muted style={{ fontSize: 12, width: 90, textAlign: 'right' }}>
                1RM ≈ {formatKg(estimatedOneRepMax(s))}
              </Muted>
            </Row>
          ))}
        </Card>
      ))}

      <Subtitle>Commentaires</Subtitle>
      {comments.length === 0 && <Muted>Sois le premier à encourager !</Muted>}
      {comments.map((c) => {
        const name = c.profiles?.display_name ?? c.profiles?.username ?? '?';
        return (
          <Row key={c.id} style={{ alignItems: 'flex-start' }}>
            <Avatar name={name} size={32} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {name} <Text style={{ color: colors.muted, fontWeight: '400', fontSize: 12 }}>{formatDate(c.created_at)}</Text>
              </Text>
              <Body>{c.body}</Body>
            </View>
            {c.user_id === userId && (
              <Pressable
                hitSlop={8}
                onPress={async () => {
                  await supabase.from('comments').delete().eq('id', c.id);
                  load();
                }}>
                <Text style={{ color: colors.muted }}>✕</Text>
              </Pressable>
            )}
          </Row>
        );
      })}
      <Row style={{ marginTop: space.sm }}>
        <View style={{ flex: 1 }}>
          <Input value={draft} onChangeText={setDraft} placeholder="Ajouter un commentaire…" onSubmitEditing={send} />
        </View>
        <Button title="Envoyer" onPress={send} loading={sending} disabled={!draft.trim()} />
      </Row>

      {mine && <Button variant="danger" title="Supprimer la séance" onPress={remove} style={{ marginTop: space.xl }} />}
    </Screen>
  );
}
