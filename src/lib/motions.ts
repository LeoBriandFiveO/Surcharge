// Mouvements illustrés : deux positions clés (début / fin) par type de mouvement.
//
// Vue de profil (personnage tourné vers la droite). Angles en degrés, mesurés pour chaque segment :
// 0 = vers le bas, 90 = vers l'avant (droite), 180 = vers le haut, -90 = vers l'arrière.
//   shin : cheville → genou, thigh : genou → hanche, torso : hanche → épaule,
//   uarm : épaule → coude, farm : coude → poignet, foot : cheville → orteils.
//   leg2 (jambe arrière, optionnelle) : hanche → genou, genou → cheville.
// Le point `anchor` (cheville ou hanche) est placé en `at` ; le reste du corps en découle.
//
// Vue de face / de dos : bras décrits en 3D simplifiée (abduction depuis le bas, puis
// flexion horizontale vers l'avant), jambes par leur écartement.

export type Point = [number, number];

export type SidePose = {
  anchor: 'ankle' | 'hip';
  at: Point;
  shin: number;
  thigh: number;
  torso: number;
  uarm: number;
  farm: number;
  foot?: number;
  // Raccourci de perspective quand le bras sort du plan (ex. développé couché).
  uarmScale?: number;
  farmScale?: number;
  leg2?: { thigh: number; shin: number };
};

export type Joint = 'wrist' | 'ankle' | 'ankle2' | 'knee' | 'hip' | 'shoulder';

export type SideMotion = {
  view: 'side';
  a: SidePose;
  b: SidePose;
  // Bancs, sièges, barres fixes : [x1, y1, x2, y2, épaisseur].
  furniture?: [number, number, number, number, number][];
  // Câble (poulie) ou levier (machine) reliant une articulation à un point fixe ou une autre articulation.
  link?: { from: Joint; to: Point | Joint };
  // Où se trouve la charge libre (barre / haltère) : aux mains par défaut.
  loadAt?: Joint | 'none';
  // Plateau de presse sous les pieds.
  platform?: boolean;
};

export type FrontPose = {
  arm: { abd: number; flex: number; fAbd: number; fFlex: number };
  legAbd?: number;
  shrug?: number;
};

export type FrontMotion = {
  view: 'front' | 'back';
  a: FrontPose;
  b: FrontPose;
  // Point d'ancrage des câbles pour la main gauche de l'image (la droite est en miroir).
  cableTo?: Point;
  // Barre tenue à deux mains (tirage vertical).
  bar?: boolean;
};

export type Motion = SideMotion | FrontMotion;

const stand = (p: Partial<SidePose> = {}): SidePose => ({
  anchor: 'ankle',
  at: [50, 93],
  shin: 180,
  thigh: 180,
  torso: 180,
  uarm: 0,
  farm: 0,
  ...p,
});

const lying = (p: Partial<SidePose> = {}): SidePose => ({
  anchor: 'hip',
  at: [62, 64],
  shin: 180,
  thigh: -120,
  torso: -90,
  uarm: 180,
  farm: 180,
  ...p,
});

const seated = (p: Partial<SidePose> = {}): SidePose => ({
  anchor: 'hip',
  at: [42, 72],
  shin: 180,
  thigh: -90,
  torso: 180,
  uarm: 0,
  farm: 0,
  ...p,
});

const flatBench: [number, number, number, number, number][] = [
  [22, 68, 72, 68, 5],
  [28, 70, 28, 95, 3],
  [66, 70, 66, 95, 3],
];
const seat: [number, number, number, number, number][] = [
  [32, 75, 52, 75, 5],
  [42, 77, 42, 95, 3],
];
const seatWithBack: [number, number, number, number, number][] = [...seat, [33, 75, 31, 42, 4]];

const front = (abd: number, fAbd = abd, flex = 0, fFlex = flex): FrontPose['arm'] => ({ abd, flex, fAbd, fFlex });

export const motions = {
  bench: {
    view: 'side',
    a: lying({ uarm: 75, uarmScale: 0.55, farm: 180 }),
    b: lying(),
    furniture: flatBench,
  },
  incline: {
    view: 'side',
    a: lying({ at: [64, 68], torso: -125, uarm: 80, uarmScale: 0.55, farm: 172 }),
    b: lying({ at: [64, 68], torso: -125, uarm: 150, farm: 150 }),
    furniture: [
      [66, 72, 38, 52, 5],
      [60, 72, 76, 72, 5],
      [44, 60, 44, 95, 3],
      [70, 74, 70, 95, 3],
    ],
  },
  decline: {
    view: 'side',
    a: lying({ at: [62, 60], torso: -75, thigh: -110, uarm: 70, uarmScale: 0.55, farm: 175 }),
    b: lying({ at: [62, 60], torso: -75, thigh: -110, uarm: 178, farm: 178 }),
    furniture: [
      [66, 63, 30, 73, 5],
      [36, 74, 36, 95, 3],
      [62, 65, 62, 95, 3],
    ],
  },
  chestpress: {
    view: 'side',
    a: seated({ torso: -174, uarm: -70, uarmScale: 0.7, farm: 90 }),
    b: seated({ torso: -174, uarm: 88, farm: 90 }),
    furniture: seatWithBack,
    link: { from: 'wrist', to: [82, 14] },
  },
  fly: {
    view: 'front',
    a: { arm: front(88, 100) },
    b: { arm: front(88, 92, 80, 95) },
    cableTo: [2, 14],
  },
  dips: {
    view: 'side',
    a: { anchor: 'hip', at: [50, 62], shin: 120, thigh: -170, torso: 172, uarm: 0, farm: 0 },
    b: { anchor: 'hip', at: [50, 72.5], shin: 120, thigh: -170, torso: 168, uarm: -60, farm: 40 },
    furniture: [
      [40, 64, 68, 64, 3],
      [64, 64, 64, 95, 3],
    ],
    loadAt: 'none',
  },
  pushup: {
    view: 'side',
    a: { anchor: 'ankle', at: [14, 92], shin: 100, thigh: 100, torso: 100, uarm: -45, farm: 75, foot: 30 },
    b: { anchor: 'ankle', at: [14, 92], shin: 115, thigh: 115, torso: 115, uarm: 0, farm: 0, foot: 30 },
    loadAt: 'none',
  },
  vpress: {
    view: 'side',
    a: stand({ uarm: 30, uarmScale: 0.8, farm: 175 }),
    b: stand({ uarm: 178, farm: 178 }),
  },
  vpressSeated: {
    view: 'side',
    a: seated({ uarm: 30, uarmScale: 0.8, farm: 175 }),
    b: seated({ uarm: 178, farm: 178 }),
    furniture: seatWithBack,
    link: { from: 'wrist', to: [70, 4] },
  },
  lateral: {
    view: 'front',
    a: { arm: front(12, 16) },
    b: { arm: front(85, 90) },
    cableTo: [62, 95],
  },
  rearfly: {
    view: 'back',
    a: { arm: front(14, 18) },
    b: { arm: front(85, 90) },
  },
  frontraise: {
    view: 'side',
    a: stand({ uarm: 5, farm: 5 }),
    b: stand({ uarm: 92, farm: 92 }),
  },
  facepull: {
    view: 'side',
    a: stand({ uarm: 85, farm: 88 }),
    b: stand({ uarm: -95, uarmScale: 0.6, farm: 160 }),
    link: { from: 'wrist', to: [96, 28] },
  },
  shrug: {
    view: 'front',
    a: { arm: front(6, 6), shrug: 0 },
    b: { arm: front(6, 6), shrug: 6 },
  },
  pulldown: {
    view: 'back',
    a: { arm: front(165, 172) },
    b: { arm: front(70, 178) },
    bar: true,
  },
  row: {
    view: 'side',
    a: stand({ at: [52, 93], shin: 170, thigh: -160, torso: 125 }),
    b: stand({ at: [52, 93], shin: 170, thigh: -160, torso: 125, uarm: -60, farm: 10 }),
  },
  seatedrow: {
    view: 'side',
    a: { anchor: 'hip', at: [36, 76], shin: -100, thigh: -100, torso: 175, uarm: 85, farm: 88, foot: 180 },
    b: { anchor: 'hip', at: [36, 76], shin: -100, thigh: -100, torso: -178, uarm: -35, uarmScale: 0.8, farm: 85, foot: 180 },
    furniture: [
      [24, 79, 46, 79, 5],
      [80, 60, 80, 95, 3],
    ],
    link: { from: 'wrist', to: [98, 66] },
  },
  pullover: {
    view: 'side',
    a: stand({ torso: 165, uarm: 145, farm: 145 }),
    b: stand({ torso: 165, uarm: 12, farm: 12 }),
    link: { from: 'wrist', to: [92, 6] },
  },
  deadlift: {
    view: 'side',
    a: stand({ shin: 152, thigh: -112, torso: 118 }),
    b: stand(),
  },
  rdl: {
    view: 'side',
    a: stand({ shin: 172, thigh: -150, torso: 100 }),
    b: stand(),
  },
  backext: {
    view: 'side',
    a: { anchor: 'ankle', at: [80, 84], shin: -135, thigh: -135, torso: 10, uarm: 90, uarmScale: 0.5, farm: -90, farmScale: 0.5, foot: 45 },
    b: { anchor: 'ankle', at: [80, 84], shin: -135, thigh: -135, torso: -135, uarm: 45, uarmScale: 0.5, farm: -135, farmScale: 0.5, foot: 45 },
    furniture: [
      [55, 66, 64, 57, 5],
      [80, 87, 88, 79, 4],
      [62, 62, 62, 95, 3],
      [84, 84, 84, 95, 3],
    ],
    loadAt: 'none',
  },
  curl: {
    view: 'side',
    a: stand({ uarm: 0, farm: 6 }),
    b: stand({ uarm: 8, farm: 160 }),
    link: { from: 'wrist', to: [66, 94] },
  },
  preacher: {
    view: 'side',
    a: seated({ torso: 170, uarm: 45, farm: 50 }),
    b: seated({ torso: 170, uarm: 45, farm: 165 }),
    furniture: [...seat, [52, 52, 64, 64, 5], [60, 62, 60, 95, 3]],
  },
  skull: {
    view: 'side',
    a: lying({ uarm: 195, farm: 265 }),
    b: lying({ uarm: 190, farm: 190 }),
    furniture: flatBench,
  },
  pushdown: {
    view: 'side',
    a: stand({ torso: 172, uarm: 0, farm: 130 }),
    b: stand({ torso: 172, uarm: 0, farm: 2 }),
    link: { from: 'wrist', to: [64, 4] },
  },
  overhead: {
    view: 'side',
    a: stand({ uarm: 182, farm: -20 }),
    b: stand({ uarm: 182, farm: 182 }),
  },
  squat: {
    view: 'side',
    a: stand({ uarm: -40, uarmScale: 0.6, farm: 150 }),
    b: stand({ shin: 145, thigh: -100, torso: 140, uarm: -10, uarmScale: 0.6, farm: 120 }),
  },
  hacksquat: {
    view: 'side',
    a: stand({ torso: 165, uarm: -20, uarmScale: 0.6, farm: 150 }),
    b: stand({ shin: 140, thigh: -105, torso: 155, uarm: -20, uarmScale: 0.6, farm: 150 }),
    furniture: [[30, 95, 46, 18, 4]],
    loadAt: 'none',
  },
  legpress: {
    view: 'side',
    a: { anchor: 'hip', at: [36, 74], shin: -110, thigh: -30, torso: -125, uarm: 60, farm: 90, foot: 150 },
    b: { anchor: 'hip', at: [36, 74], shin: -60, thigh: -60, torso: -125, uarm: 60, farm: 90, foot: 150 },
    furniture: [
      [40, 78, 14, 60, 5],
      [30, 80, 30, 95, 3],
    ],
    platform: true,
    loadAt: 'none',
  },
  lunge: {
    view: 'side',
    a: { ...stand({ at: [60, 93], shin: 176, thigh: -176 }), leg2: { thigh: -18, shin: -14 } },
    b: { ...stand({ at: [60, 93], shin: 160, thigh: -98 }), leg2: { thigh: -12, shin: -88 } },
  },
  legext: {
    view: 'side',
    a: seated({ at: [40, 64], torso: -175, shin: 180, uarm: 20, farm: 60 }),
    b: seated({ at: [40, 64], torso: -175, shin: -90, uarm: 20, farm: 60 }),
    furniture: [
      [30, 67, 50, 67, 5],
      [31, 67, 29, 34, 4],
      [40, 69, 40, 95, 3],
    ],
    link: { from: 'ankle', to: 'knee' },
    loadAt: 'none',
  },
  legcurl: {
    view: 'side',
    a: seated({ at: [38, 62], torso: -172, shin: -95, uarm: 20, farm: 60 }),
    b: seated({ at: [38, 62], torso: -172, shin: 160, uarm: 20, farm: 60 }),
    furniture: [
      [28, 65, 48, 65, 5],
      [29, 65, 27, 32, 4],
      [38, 67, 38, 95, 3],
    ],
    link: { from: 'ankle', to: 'knee' },
    loadAt: 'none',
  },
  lyingcurl: {
    view: 'side',
    a: { anchor: 'hip', at: [52, 70], shin: 90, thigh: 90, torso: 90, uarm: 30, farm: 60, foot: 0 },
    b: { anchor: 'hip', at: [52, 70], shin: 10, thigh: 90, torso: 90, uarm: 30, farm: 60, foot: 0 },
    furniture: [
      [20, 74, 84, 74, 5],
      [30, 76, 30, 95, 3],
      [76, 76, 76, 95, 3],
    ],
    link: { from: 'ankle', to: 'knee' },
    loadAt: 'none',
  },
  hipthrust: {
    view: 'side',
    a: { anchor: 'ankle', at: [70, 93], shin: 172, thigh: -128, torso: -78, uarm: 60, uarmScale: 0.7, farm: 120 },
    b: { anchor: 'ankle', at: [70, 93], shin: 165, thigh: -95, torso: -96, uarm: 75, uarmScale: 0.7, farm: 110 },
    furniture: [
      [14, 70, 36, 70, 5],
      [20, 72, 20, 95, 3],
    ],
    loadAt: 'hip',
  },
  kickback: {
    view: 'side',
    a: { ...stand({ at: [56, 93], torso: 160, uarm: 30, farm: 60 }), leg2: { thigh: 6, shin: -4 } },
    b: { ...stand({ at: [56, 93], torso: 160, uarm: 30, farm: 60 }), leg2: { thigh: -50, shin: -70 } },
    furniture: [[80, 30, 80, 95, 3]],
    link: { from: 'ankle2', to: [6, 92] },
    loadAt: 'none',
  },
  adductor: {
    view: 'front',
    a: { arm: front(14, 16), legAbd: 26 },
    b: { arm: front(14, 16), legAbd: 4 },
  },
  abductor: {
    view: 'back',
    a: { arm: front(14, 16), legAbd: 4 },
    b: { arm: front(14, 16), legAbd: 26 },
  },
  calf: {
    view: 'side',
    a: stand({ uarm: -30, uarmScale: 0.6, farm: 160 }),
    b: stand({ at: [50, 86], uarm: -30, uarmScale: 0.6, farm: 160, foot: 42 }),
    furniture: [[52, 96, 66, 96, 3]],
    loadAt: 'shoulder',
  },
  seatedcalf: {
    view: 'side',
    a: seated({ at: [44, 64], uarm: 30, farm: 90 }),
    b: seated({ at: [44, 59], uarm: 30, farm: 90, foot: 48 }),
    furniture: [
      [34, 67, 54, 67, 5],
      [44, 69, 44, 95, 3],
    ],
    link: { from: 'knee', to: [86, 60] },
    loadAt: 'none',
  },
  crunch: {
    view: 'side',
    a: { anchor: 'hip', at: [54, 87], shin: -160, thigh: -50, torso: -92, uarm: -92, uarmScale: 0.45, farm: 40, farmScale: 0.6 },
    b: { anchor: 'hip', at: [54, 87], shin: -160, thigh: -50, torso: -128, uarm: -128, uarmScale: 0.45, farm: 10, farmScale: 0.6 },
    loadAt: 'none',
  },
  cablecrunch: {
    view: 'side',
    a: { anchor: 'ankle', at: [26, 92], shin: 90, thigh: 180, torso: 176, uarm: 175, uarmScale: 0.5, farm: 10, farmScale: 0.7, foot: 270 },
    b: { anchor: 'ankle', at: [26, 92], shin: 90, thigh: 170, torso: 108, uarm: 110, uarmScale: 0.5, farm: -40, farmScale: 0.7, foot: 270 },
    link: { from: 'wrist', to: [58, 4] },
  },
  legraise: {
    view: 'side',
    a: { anchor: 'hip', at: [52, 87], shin: -90, thigh: -90, torso: -90, uarm: 90, farm: 90, foot: 180 },
    b: { anchor: 'hip', at: [52, 87], shin: 0, thigh: 0, torso: -90, uarm: 90, farm: 90, foot: 90 },
    loadAt: 'none',
  },
} satisfies Record<string, Motion>;

export type MotionId = keyof typeof motions;
