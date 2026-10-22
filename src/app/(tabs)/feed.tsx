import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WorkoutCard } from '@/components/workout-card';
import { Button, Empty, Muted, styles, Title } from '@/components/ui';
import { useUserId } from '@/lib/auth';
import { toggleKudo } from '@/lib/social';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { FEED_SELECT, type FeedWorkout } from '@/lib/types';

export default function Feed() {
  const userId = useUserId();
  const [items, setItems] = useState<FeedWorkout[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Les règles de sécurité de la base ne renvoient que mes séances et celles des gens que je suis.
  const load = useCallback(async () => {
    const { data } = await supabase
      .from('workouts')
      .select(FEED_SELECT)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false })
      .limit(40);
    setItems((data as FeedWorkout[] | null) ?? []);
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function kudo(w: FeedWorkout) {
    const next = await toggleKudo(w, userId);
    setItems((list) => list.map((x) => (x.id === w.id ? next : x)));
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(w) => w.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<Title>Fil d’actu</Title>}
        renderItem={({ item, index }) => <WorkoutCard workout={item} userId={userId} onKudo={kudo} index={index} />}
        ListEmptyComponent={
          loaded ? (
            <Empty title="Rien à voir pour l’instant">
              <Muted style={{ textAlign: 'center' }}>
                Termine une séance ou suis tes amis pour voir leurs entraînements ici.
              </Muted>
              <Button title="Trouver des amis" onPress={() => router.push('/profile')} />
            </Empty>
          ) : undefined
        }
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
        }
      />
    </SafeAreaView>
  );
}
