// Logique de progression : « double progression ».
// On monte d'abord les répétitions dans la fourchette [repMin, repMax],
// puis quand toutes les séries atteignent repMax on augmente la charge.

export type SetLog = { weight: number; reps: number };

export type ExerciseConfig = {
  sets: number;
  repMin: number;
  repMax: number;
  increment: number;
};

export type SuggestionKind = 'first' | 'increase' | 'reps' | 'repeat' | 'deload';

export type Suggestion = {
  kind: SuggestionKind;
  // null : pas d'historique, l'utilisateur choisit sa charge.
  weight: number | null;
  reps: number;
  sets: number;
  reason: string;
};

export function roundToIncrement(weight: number, increment: number): number {
  if (increment <= 0) return Math.round(weight * 10) / 10;
  return Math.round(Math.round(weight / increment) * increment * 100) / 100;
}

export function formatKg(weight: number): string {
  return `${Number.isInteger(weight) ? weight : weight.toFixed(1).replace('.', ',')} kg`;
}

// Séries de travail : celles faites à la charge la plus lourde de la séance.
export function topSets(session: SetLog[]): SetLog[] {
  if (session.length === 0) return [];
  const max = Math.max(...session.map((s) => s.weight));
  return session.filter((s) => s.weight === max);
}

function failed(session: SetLog[], cfg: ExerciseConfig): boolean {
  return topSets(session).some((s) => s.reps < cfg.repMin);
}

/**
 * Propose la prochaine séance pour un exercice.
 * @param history séances précédentes, la plus récente en premier.
 */
export function suggestNext(cfg: ExerciseConfig, history: SetLog[][]): Suggestion {
  const sessions = history.filter((s) => s.length > 0);
  const last = sessions[0];

  if (!last) {
    return {
      kind: 'first',
      weight: null,
      reps: cfg.repMin,
      sets: cfg.sets,
      reason: `Première fois : choisis une charge que tu peux soulever ${cfg.repMin} à ${cfg.repMax} fois.`,
    };
  }

  const top = topSets(last);
  const weight = top[0].weight;
  const minReps = Math.min(...top.map((s) => s.reps));

  // Toutes les séries prévues faites à repMax ou plus : on monte la charge.
  if (top.length >= cfg.sets && minReps >= cfg.repMax) {
    if (cfg.increment > 0) {
      const next = roundToIncrement(weight + cfg.increment, cfg.increment);
      return {
        kind: 'increase',
        weight: next,
        reps: cfg.repMin,
        sets: cfg.sets,
        reason: `${cfg.sets} séries à ${cfg.repMax} reps validées : +${formatKg(cfg.increment)} !`,
      };
    }
    // Exercice au poids du corps (pas d'incrément) : on continue sur les reps.
    return {
      kind: 'reps',
      weight,
      reps: minReps + 1,
      sets: cfg.sets,
      reason: 'Au poids du corps : vise une répétition de plus.',
    };
  }

  if (failed(last, cfg)) {
    const previous = sessions[1];
    const failedTwice =
      previous !== undefined && topSets(previous)[0].weight === weight && failed(previous, cfg);
    if (failedTwice && weight > 0) {
      return {
        kind: 'deload',
        weight: roundToIncrement(weight * 0.9, cfg.increment),
        reps: cfg.repMin,
        sets: cfg.sets,
        reason: `Deux séances sous ${cfg.repMin} reps : on allège de 10 % pour repartir.`,
      };
    }
    return {
      kind: 'repeat',
      weight,
      reps: cfg.repMin,
      sets: cfg.sets,
      reason: `Même charge, vise au moins ${cfg.repMin} reps sur chaque série.`,
    };
  }

  return {
    kind: 'reps',
    weight,
    reps: Math.min(cfg.repMax, minReps + 1),
    sets: cfg.sets,
    reason: `Même charge, une rep de plus (objectif ${cfg.repMax} reps avant d'augmenter).`,
  };
}

// 1RM estimé (formule d'Epley).
export function estimatedOneRepMax(set: SetLog): number {
  if (set.reps <= 1) return set.weight;
  return Math.round(set.weight * (1 + set.reps / 30) * 10) / 10;
}

export function bestSet(session: SetLog[]): SetLog | null {
  let best: SetLog | null = null;
  for (const s of session) {
    if (!best || estimatedOneRepMax(s) > estimatedOneRepMax(best)) best = s;
  }
  return best;
}

export function volume(sets: SetLog[]): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

export function summarize(session: SetLog[]): string {
  const top = topSets(session);
  if (top.length === 0) return '—';
  const reps = top.map((s) => s.reps);
  const same = reps.every((r) => r === reps[0]);
  return `${top.length}×${same ? reps[0] : reps.join('/')} à ${formatKg(top[0].weight)}`;
}
