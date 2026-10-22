import type { MotionId } from './motions';

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

export type Equipment = 'Barre' | 'Haltères' | 'Machine' | 'Poulie' | 'Poids du corps';
export const equipments: Equipment[] = ['Machine', 'Poulie', 'Barre', 'Haltères', 'Poids du corps'];

export type CatalogExercise = {
  id: string;
  name: string;
  group: Group;
  equipment: Equipment;
  // Mouvement illustré (voir src/lib/motions.ts).
  motion: MotionId;
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
  equipment: Equipment,
  motion: MotionId,
  primary: Muscle[],
  secondary: Muscle[],
  [repMin, repMax]: [number, number],
  increment: number,
): CatalogExercise => ({ id, name, group, equipment, motion, primary, secondary, repMin, repMax, increment });

export const catalog: CatalogExercise[] = [
  ex('bench-press', 'Développé couché', 'Pecs', 'Barre', 'bench', ['chest'], ['triceps', 'shoulders'], [6, 10], 2.5),
  ex('incline-db-press', 'Développé incliné haltères', 'Pecs', 'Haltères', 'incline', ['chest'], ['shoulders', 'triceps'], [8, 12], 2),
  ex('decline-press', 'Développé décliné', 'Pecs', 'Barre', 'decline', ['chest'], ['triceps'], [8, 12], 2.5),
  ex('smith-bench', 'Développé couché à la Smith machine', 'Pecs', 'Machine', 'bench', ['chest'], ['triceps', 'shoulders'], [8, 12], 2.5),
  ex('chest-press', 'Presse pectoraux (machine)', 'Pecs', 'Machine', 'chestpress', ['chest'], ['triceps', 'shoulders'], [8, 12], 2.5),
  ex('incline-chest-press', 'Développé incliné à la machine', 'Pecs', 'Machine', 'incline', ['chest'], ['shoulders', 'triceps'], [8, 12], 2.5),
  ex('pec-deck', 'Butterfly (pec deck)', 'Pecs', 'Machine', 'fly', ['chest'], ['shoulders'], [10, 15], 2.5),
  ex('cable-fly', 'Écarté à la poulie (vis-à-vis)', 'Pecs', 'Poulie', 'fly', ['chest'], ['shoulders'], [10, 15], 2.5),
  ex('db-fly', 'Écarté haltères', 'Pecs', 'Haltères', 'fly', ['chest'], ['shoulders'], [10, 15], 1),
  ex('dips', 'Dips', 'Pecs', 'Poids du corps', 'dips', ['chest', 'triceps'], ['shoulders'], [6, 12], 0),
  ex('push-ups', 'Pompes', 'Pecs', 'Poids du corps', 'pushup', ['chest'], ['triceps', 'shoulders', 'abs'], [10, 20], 0),

  ex('pull-ups', 'Tractions', 'Dos', 'Poids du corps', 'pulldown', ['lats'], ['biceps', 'forearms'], [6, 12], 0),
  ex('assisted-pull-ups', 'Tractions assistées (machine)', 'Dos', 'Machine', 'pulldown', ['lats'], ['biceps'], [8, 12], 2.5),
  ex('lat-pulldown', 'Tirage vertical', 'Dos', 'Poulie', 'pulldown', ['lats'], ['biceps'], [8, 12], 2.5),
  ex('barbell-row', 'Rowing barre', 'Dos', 'Barre', 'row', ['lats', 'traps'], ['biceps', 'lowerback'], [6, 10], 2.5),
  ex('db-row', 'Rowing haltère', 'Dos', 'Haltères', 'row', ['lats'], ['biceps', 'traps'], [8, 12], 2),
  ex('tbar-row', 'Rowing T-bar', 'Dos', 'Machine', 'row', ['lats', 'traps'], ['biceps', 'lowerback'], [8, 12], 2.5),
  ex('seated-row', 'Tirage horizontal', 'Dos', 'Poulie', 'seatedrow', ['lats', 'traps'], ['biceps'], [10, 12], 2.5),
  ex('machine-row', 'Rowing assis (machine)', 'Dos', 'Machine', 'seatedrow', ['lats', 'traps'], ['biceps'], [8, 12], 2.5),
  ex('pullover', 'Pull-over à la poulie', 'Dos', 'Poulie', 'pullover', ['lats'], ['chest', 'triceps'], [10, 15], 2.5),
  ex('deadlift', 'Soulevé de terre', 'Dos', 'Barre', 'deadlift', ['lowerback', 'hamstrings', 'glutes'], ['traps', 'quads', 'forearms'], [3, 6], 5),
  ex('back-extension', 'Extensions lombaires (banc 45°)', 'Dos', 'Machine', 'backext', ['lowerback'], ['glutes', 'hamstrings'], [10, 15], 2.5),

  ex('ohp', 'Développé militaire', 'Épaules', 'Barre', 'vpress', ['shoulders'], ['triceps', 'traps'], [6, 10], 2.5),
  ex('db-shoulder-press', 'Développé haltères assis', 'Épaules', 'Haltères', 'vpressSeated', ['shoulders'], ['triceps'], [8, 12], 2),
  ex('shoulder-press-machine', 'Développé épaules (machine)', 'Épaules', 'Machine', 'vpressSeated', ['shoulders'], ['triceps'], [8, 12], 2.5),
  ex('lateral-raise', 'Élévations latérales', 'Épaules', 'Haltères', 'lateral', ['shoulders'], ['traps'], [12, 20], 1),
  ex('lateral-raise-machine', 'Élévations latérales (machine)', 'Épaules', 'Machine', 'lateral', ['shoulders'], ['traps'], [12, 15], 2.5),
  ex('cable-lateral-raise', 'Élévation latérale à la poulie', 'Épaules', 'Poulie', 'lateral', ['shoulders'], [], [12, 15], 1.25),
  ex('front-raise', 'Élévations frontales', 'Épaules', 'Haltères', 'frontraise', ['shoulders'], ['chest'], [10, 15], 1),
  ex('rear-delt-fly', 'Oiseau', 'Épaules', 'Haltères', 'rearfly', ['shoulders'], ['traps'], [12, 15], 1),
  ex('reverse-pec-deck', 'Reverse butterfly (machine)', 'Épaules', 'Machine', 'rearfly', ['shoulders'], ['traps'], [12, 15], 2.5),
  ex('face-pull', 'Face pull', 'Épaules', 'Poulie', 'facepull', ['shoulders', 'traps'], [], [12, 15], 2.5),
  ex('shrugs', 'Shrugs', 'Épaules', 'Haltères', 'shrug', ['traps'], ['forearms'], [10, 15], 2.5),

  ex('barbell-curl', 'Curl barre', 'Biceps', 'Barre', 'curl', ['biceps'], ['forearms'], [8, 12], 2.5),
  ex('db-curl', 'Curl haltères', 'Biceps', 'Haltères', 'curl', ['biceps'], ['forearms'], [8, 12], 1),
  ex('hammer-curl', 'Curl marteau', 'Biceps', 'Haltères', 'curl', ['biceps', 'forearms'], [], [10, 12], 1),
  ex('cable-curl', 'Curl à la poulie', 'Biceps', 'Poulie', 'curl', ['biceps'], ['forearms'], [10, 15], 2.5),
  ex('preacher-curl', 'Curl pupitre', 'Biceps', 'Machine', 'preacher', ['biceps'], [], [10, 12], 2.5),

  ex('skull-crusher', 'Barre au front', 'Triceps', 'Barre', 'skull', ['triceps'], [], [8, 12], 2.5),
  ex('pushdown', 'Extension à la poulie', 'Triceps', 'Poulie', 'pushdown', ['triceps'], [], [10, 15], 2.5),
  ex('overhead-ext', 'Extension nuque haltère', 'Triceps', 'Haltères', 'overhead', ['triceps'], [], [10, 12], 2),
  ex('close-grip-bench', 'Développé couché prise serrée', 'Triceps', 'Barre', 'bench', ['triceps', 'chest'], ['shoulders'], [6, 10], 2.5),
  ex('dips-machine', 'Dips assis (machine)', 'Triceps', 'Machine', 'dips', ['triceps'], ['chest', 'shoulders'], [8, 12], 2.5),

  ex('squat', 'Squat', 'Jambes', 'Barre', 'squat', ['quads', 'glutes'], ['hamstrings', 'lowerback'], [5, 8], 2.5),
  ex('smith-squat', 'Squat à la Smith machine', 'Jambes', 'Machine', 'squat', ['quads', 'glutes'], ['hamstrings'], [8, 12], 2.5),
  ex('hack-squat', 'Hack squat (machine)', 'Jambes', 'Machine', 'hacksquat', ['quads', 'glutes'], ['hamstrings'], [8, 12], 5),
  ex('leg-press', 'Presse à cuisses', 'Jambes', 'Machine', 'legpress', ['quads', 'glutes'], ['hamstrings'], [8, 12], 5),
  ex('lunges', 'Fentes', 'Jambes', 'Haltères', 'lunge', ['quads', 'glutes'], ['hamstrings'], [8, 12], 2),
  ex('bulgarian', 'Squat bulgare', 'Jambes', 'Haltères', 'lunge', ['quads', 'glutes'], ['hamstrings'], [8, 12], 2),
  ex('leg-extension', 'Leg extension', 'Jambes', 'Machine', 'legext', ['quads'], [], [10, 15], 2.5),
  ex('rdl', 'Soulevé de terre roumain', 'Jambes', 'Barre', 'rdl', ['hamstrings', 'glutes'], ['lowerback'], [8, 10], 2.5),
  ex('leg-curl', 'Leg curl assis', 'Jambes', 'Machine', 'legcurl', ['hamstrings'], ['calves'], [10, 15], 2.5),
  ex('lying-leg-curl', 'Leg curl allongé', 'Jambes', 'Machine', 'lyingcurl', ['hamstrings'], ['calves'], [10, 15], 2.5),
  ex('hip-thrust', 'Hip thrust', 'Jambes', 'Barre', 'hipthrust', ['glutes'], ['hamstrings'], [8, 12], 5),
  ex('glute-kickback', 'Kickback fessiers (poulie)', 'Jambes', 'Poulie', 'kickback', ['glutes'], ['hamstrings'], [12, 15], 2.5),
  ex('adductor', 'Adducteurs (machine)', 'Jambes', 'Machine', 'adductor', ['quads'], [], [12, 15], 5),
  ex('abductor', 'Abducteurs (machine)', 'Jambes', 'Machine', 'abductor', ['glutes'], [], [12, 15], 5),
  ex('calf-raise', 'Mollets debout', 'Jambes', 'Machine', 'calf', ['calves'], [], [10, 15], 5),
  ex('seated-calf', 'Mollets assis (machine)', 'Jambes', 'Machine', 'seatedcalf', ['calves'], [], [12, 20], 5),

  ex('crunch', 'Crunch', 'Abdos', 'Poids du corps', 'crunch', ['abs'], [], [15, 25], 0),
  ex('cable-crunch', 'Crunch à la poulie', 'Abdos', 'Poulie', 'cablecrunch', ['abs'], ['obliques'], [12, 15], 2.5),
  ex('ab-machine', 'Crunch (machine)', 'Abdos', 'Machine', 'crunch', ['abs'], [], [12, 15], 2.5),
  ex('leg-raise', 'Relevés de jambes', 'Abdos', 'Poids du corps', 'legraise', ['abs'], ['obliques'], [10, 15], 0),
  ex('russian-twist', 'Russian twist', 'Abdos', 'Poids du corps', 'crunch', ['obliques'], ['abs'], [15, 20], 0),
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
