import { supabase } from './supabase';
import type { FeedWorkout } from './types';

// Ajoute ou retire un « bravo » et renvoie la séance mise à jour (optimiste).
export async function toggleKudo(workout: FeedWorkout, userId: string): Promise<FeedWorkout> {
  const liked = workout.kudos.some((k) => k.user_id === userId);
  if (liked) {
    await supabase.from('kudos').delete().match({ workout_id: workout.id, user_id: userId });
    return { ...workout, kudos: workout.kudos.filter((k) => k.user_id !== userId) };
  }
  await supabase.from('kudos').insert({ workout_id: workout.id });
  return { ...workout, kudos: [...workout.kudos, { user_id: userId }] };
}
