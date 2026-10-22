import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Button, Card, Empty, Muted, Row, styles, Subtitle, Title } from '@/components/ui';
import { useAuth, useUserId } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import type { Workout } from '@/lib/types';

type RoutineRow = {
  id: string;
  name: string;
  routine_exercises: { position: number; exercises: { name: string } | null }[];
};

export default function Today() {
  const userId = useUserId();
  const { profile } = useAuth();
  const [routines, setRoutines] = useState<RoutineRow[]>([]);
  const [lastDone, setLastDone] = useState<Record<string, string>>({});
  const [ongoing, setOngoing] = useState<Workout | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [r, w, o] = await Promise.all([
      supabase
        .from('routines')
        .select('id, name, routine_exercises(position, exercises(name))')
        .eq('user_id', userId)
        .order('created_at'),
      supabase
        .from('workouts')
        .select('routine_id, finished_at')
        .eq('user_id', userId)
        .not('finished_at', 'is', null)
        .order('finished_at', { ascending: false })
        .limit(100),
      supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .is('finished_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setRoutines((r.data as RoutineRow[] | null) ?? []);
    const done: Record<string, string> = {};
    for (const row of w.data ?? []) {
      if (row.routine_id && !done[row.routine_id]) done[row.routine_id] = row.finished_at;
    }
    setLastDone(done);
    setOngoing(o.data);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function start(routine: RoutineRow) {
    if (ongoing) {
      Alert.alert('Séance déjà en cours', 'Termine ou abandonne la séance en cours avant d’en lancer une autre.');
      return;
    }
    if (routine.routine_exercises.length === 0) {
      Alert.alert('Programme vide', 'Ajoute au moins un exercice à ce programme.');
      return;
    }
    setStarting(routine.id);
    const { data, error } = await supabase
      .from('workouts')
      .insert({ routine_id: routine.id, title: routine.name })
      .select('id')
      .single();
    setStarting(null);
    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }
    router.push(`/workout/${data.id}`);
  }

  // Suggère le programme fait le moins récemment.
  const next = [...routines].sort((a, b) => (lastDone[a.id] ?? '').localeCompare(lastDone[b.id] ?? ''))[0];

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
        <Muted>Salut {profile?.display_name ?? profile?.username ?? ''} 👋</Muted>
        <Title>On s’entraîne ?</Title>

        {ongoing && (
          <Card style={{ borderColor: colors.accent, backgroundColor: colors.accentSoft }}>
            <Body style={{ fontWeight: '700' }}>Séance en cours : {ongoing.title}</Body>
            <Muted>Commencée {formatDate(ongoing.started_at).toLowerCase()}</Muted>
            <Button title="Reprendre" onPress={() => router.push(`/workout/${ongoing.id}`)} />
          </Card>
        )}

        <Row style={{ justifyContent: 'space-between' }}>
          <Subtitle>Mes programmes</Subtitle>
          <Button variant="ghost" title="+ Nouveau" onPress={() => router.push('/routine/new')} />
        </Row>

        {routines.length === 0 ? (
          <Empty title="Aucun programme pour l’instant">
            <Muted style={{ textAlign: 'center' }}>
              Crée ton premier programme (ex. « Push », « Pull », « Jambes ») avec ses exercices et
              ta fourchette de répétitions.
            </Muted>
            <Button title="Créer un programme" onPress={() => router.push('/routine/new')} />
          </Empty>
        ) : (
          routines.map((routine) => {
            const names = [...routine.routine_exercises]
              .sort((a, b) => a.position - b.position)
              .map((re) => re.exercises?.name)
              .filter(Boolean);
            const isNext = !ongoing && routine.id === next?.id && routines.length > 1;
            return (
              <Card key={routine.id} style={isNext ? { borderColor: colors.accent } : undefined}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Body style={{ fontWeight: '700', fontSize: 18, flex: 1 }}>{routine.name}</Body>
                  {isNext && <Muted style={{ color: colors.accent }}>À faire</Muted>}
                </Row>
                <Muted numberOfLines={2}>{names.length ? names.join(' · ') : 'Aucun exercice'}</Muted>
                <Muted style={{ fontSize: 12 }}>
                  {lastDone[routine.id] ? `Dernière fois : ${formatDate(lastDone[routine.id])}` : 'Jamais fait'}
                </Muted>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <Button
                    title="Démarrer"
                    style={{ flex: 1 }}
                    loading={starting === routine.id}
                    onPress={() => start(routine)}
                  />
                  <Button
                    variant="secondary"
                    title="Modifier"
                    onPress={() => router.push(`/routine/${routine.id}`)}
                  />
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
