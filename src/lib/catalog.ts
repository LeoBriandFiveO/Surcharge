// Catalogue d'exercices proposés à la création d'un programme.

export type Muscle =
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'traps'
  | 'lats'
  | 'lowerback';

export const muscleNames: Record<Muscle, string> = {
  chest: 'Pectoraux',
  shoulders: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Avant-bras',
  abs: 'Abdos',
  obliques: 'Obliques',
  quads: 'Quadriceps',
  hamstrings: 'Ischio-jambiers',
  glutes: 'Fessiers',
  calves: 'Mollets',
  traps: 'Trapèzes',
  lats: 'Dorsaux',
  lowerback: 'Lombaires',
};

export type Group = 'Pecs' | 'Dos' | 'Épaules' | 'Biceps' | 'Triceps' | 'Jambes' | 'Abdos';
export const groups: Group[] = ['Pecs', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Jambes', 'Abdos'];

export type CatalogExercise = {
  id: string;
  name: string;
  group: Group;
  primary: Muscle[];
  secondary: Muscle[];
  repMin: number;
  repMax: number;
  // Charge ajoutée quand la fourchette est validée (0 = poids du corps).
  increment: number;
};

const ex = (
  id: string,
  name: string,
  group: Group,
  primary: Muscle[],
  secondary: Muscle[],
  repMin: number,
  repMax: number,
  increment: number,
): CatalogExercise => ({ id, name, group, primary, secondary, repMin, repMax, increment });

export const catalog: CatalogExercise[] = [
  ex('bench-press', 'Développé couché', 'Pecs', ['chest'], ['triceps', 'shoulders'], 6, 10, 2.5),
  ex('incline-db-press', 'Développé incliné haltères', 'Pecs', ['chest'], ['shoulders', 'triceps'], 8, 12, 2),
  ex('decline-press', 'Développé décliné', 'Pecs', ['chest'], ['triceps'], 8, 12, 2.5),
  ex('cable-fly', 'Écarté à la poulie', 'Pecs', ['chest'], ['shoulders'], 10, 15, 2.5),
  ex('pec-deck', 'Pec deck', 'Pecs', ['chest'], [], 10, 15, 2.5),
  ex('dips', 'Dips', 'Pecs', ['chest', 'triceps'], ['shoulders'], 6, 12, 0),
  ex('push-ups', 'Pompes', 'Pecs', ['chest'], ['triceps', 'shoulders', 'abs'], 10, 20, 0),

  ex('pull-ups', 'Tractions', 'Dos', ['lats'], ['biceps', 'forearms'], 6, 12, 0),
  ex('lat-pulldown', 'Tirage vertical', 'Dos', ['lats'], ['biceps'], 8, 12, 2.5),
  ex('barbell-row', 'Rowing barre', 'Dos', ['lats', 'traps'], ['biceps', 'lowerback'], 6, 10, 2.5),
  ex('db-row', 'Rowing haltère', 'Dos', ['lats'], ['biceps', 'traps'], 8, 12, 2),
  ex('seated-row', 'Tirage horizontal', 'Dos', ['lats', 'traps'], ['biceps'], 10, 12, 2.5),
  ex('pullover', 'Pull-over à la poulie', 'Dos', ['lats'], ['chest'], 10, 15, 2.5),
  ex('deadlift', 'Soulevé de terre', 'Dos', ['lowerback', 'hamstrings', 'glutes'], ['traps', 'quads', 'forearms'], 3, 6, 5),

  ex('ohp', 'Développé militaire', 'Épaules', ['shoulders'], ['triceps', 'traps'], 6, 10, 2.5),
  ex('db-shoulder-press', 'Développé haltères assis', 'Épaules', ['shoulders'], ['triceps'], 8, 12, 2),
  ex('lateral-raise', 'Élévations latérales', 'Épaules', ['shoulders'], ['traps'], 12, 20, 1),
  ex('rear-delt-fly', 'Oiseau', 'Épaules', ['shoulders'], ['traps'], 12, 15, 1),
  ex('face-pull', 'Face pull', 'Épaules', ['shoulders', 'traps'], [], 12, 15, 2.5),
  ex('shrugs', 'Shrugs', 'Épaules', ['traps'], ['forearms'], 10, 15, 2.5),

  ex('barbell-curl', 'Curl barre', 'Biceps', ['biceps'], ['forearms'], 8, 12, 2.5),
  ex('db-curl', 'Curl haltères', 'Biceps', ['biceps'], ['forearms'], 8, 12, 1),
  ex('hammer-curl', 'Curl marteau', 'Biceps', ['biceps', 'forearms'], [], 10, 12, 1),
  ex('preacher-curl', 'Curl pupitre', 'Biceps', ['biceps'], [], 10, 12, 2.5),

  ex('skull-crusher', 'Barre au front', 'Triceps', ['triceps'], [], 8, 12, 2.5),
  ex('pushdown', 'Extension à la poulie', 'Triceps', ['triceps'], [], 10, 15, 2.5),
  ex('overhead-ext', 'Extension nuque haltère', 'Triceps', ['triceps'], [], 10, 12, 2),
  ex('close-grip-bench', 'Développé couché prise serrée', 'Triceps', ['triceps', 'chest'], ['shoulders'], 6, 10, 2.5),

  ex('squat', 'Squat', 'Jambes', ['quads', 'glutes'], ['hamstrings', 'lowerback'], 5, 8, 2.5),
  ex('leg-press', 'Presse à cuisses', 'Jambes', ['quads', 'glutes'], ['hamstrings'], 8, 12, 5),
  ex('lunges', 'Fentes', 'Jambes', ['quads', 'glutes'], ['hamstrings'], 8, 12, 2),
  ex('bulgarian', 'Squat bulgare', 'Jambes', ['quads', 'glutes'], ['hamstrings'], 8, 12, 2),
  ex('leg-extension', 'Leg extension', 'Jambes', ['quads'], [], 10, 15, 2.5),
  ex('rdl', 'Soulevé de terre roumain', 'Jambes', ['hamstrings', 'glutes'], ['lowerback'], 8, 10, 2.5),
  ex('leg-curl', 'Leg curl', 'Jambes', ['hamstrings'], ['calves'], 10, 15, 2.5),
  ex('hip-thrust', 'Hip thrust', 'Jambes', ['glutes'], ['hamstrings'], 8, 12, 5),
  ex('calf-raise', 'Mollets debout', 'Jambes', ['calves'], [], 10, 15, 5),

  ex('crunch', 'Crunch', 'Abdos', ['abs'], [], 15, 25, 0),
  ex('cable-crunch', 'Crunch à la poulie', 'Abdos', ['abs'], ['obliques'], 12, 15, 2.5),
  ex('leg-raise', 'Relevés de jambes', 'Abdos', ['abs'], ['obliques'], 10, 15, 0),
  ex('russian-twist', 'Russian twist', 'Abdos', ['obliques'], ['abs'], 15, 20, 0),
];

// Types de séance : les groupes musculaires visés et le nom proposé.
export const sessionTypes: { label: string; muscles: Muscle[] }[] = [
  { label: 'Pecs', muscles: ['chest'] },
  { label: 'Dos', muscles: ['lats', 'traps', 'lowerback'] },
  { label: 'Épaules', muscles: ['shoulders', 'traps'] },
  { label: 'Bras', muscles: ['biceps', 'triceps', 'forearms'] },
  { label: 'Jambes', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  { label: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
  { label: 'Pull', muscles: ['lats', 'traps', 'biceps'] },
  { label: 'Haut du corps', muscles: ['chest', 'lats', 'shoulders', 'biceps', 'triceps'] },
  { label: 'Full body', muscles: ['chest', 'lats', 'quads', 'hamstrings', 'glutes', 'shoulders'] },
  { label: 'Abdos', muscles: ['abs', 'obliques'] },
];

export function suggestionsFor(muscles: Muscle[]): CatalogExercise[] {
  return catalog.filter((e) => e.primary.some((m) => muscles.includes(m)));
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');

// Retrouve l'exercice du catalogue par son identifiant, ou à défaut par son nom.
export function findCatalog(catalogId: string | null | undefined, name?: string): CatalogExercise | undefined {
  if (catalogId) {
    const byId = catalog.find((e) => e.id === catalogId);
    if (byId) return byId;
  }
  if (!name) return undefined;
  const n = normalize(name);
  return catalog.find((e) => normalize(e.name) === n);
}
