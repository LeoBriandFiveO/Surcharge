export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
};

export type Exercise = {
  id: string;
  user_id: string;
  name: string;
  rep_min: number;
  rep_max: number;
  increment: number;
};

export type Routine = {
  id: string;
  name: string;
  created_at: string;
};

export type RoutineExercise = {
  id: string;
  routine_id: string;
  exercise_id: string;
  position: number;
  sets: number;
  exercises: Exercise;
};

export type Workout = {
  id: string;
  user_id: string;
  routine_id: string | null;
  title: string;
  note: string | null;
  is_public: boolean;
  started_at: string;
  finished_at: string | null;
};

export type WorkoutSet = {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_index: number;
  weight: number;
  reps: number;
  created_at: string;
};

export type Comment = {
  id: string;
  workout_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles: Pick<Profile, 'username' | 'display_name'> | null;
};

// Séance telle qu'affichée dans le fil.
export type FeedWorkout = Workout & {
  profiles: Pick<Profile, 'username' | 'display_name'> | null;
  workout_sets: (Pick<WorkoutSet, 'exercise_id' | 'set_index' | 'weight' | 'reps'> & {
    exercises: Pick<Exercise, 'name'> | null;
  })[];
  kudos: { user_id: string }[];
  comments: { count: number }[];
};

export const FEED_SELECT =
  '*, profiles(username, display_name), workout_sets(exercise_id, set_index, weight, reps, exercises(name)), kudos(user_id), comments(count)';
