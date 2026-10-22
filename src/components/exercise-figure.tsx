import { useEffect, useState } from 'react';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import { BASE, IDLE, PRIMARY, SECONDARY, backShapes, frontShapes } from '@/components/muscle-map';
import type { Equipment, Muscle } from '@/lib/catalog';
import {
  motions,
  type FrontMotion,
  type FrontPose,
  type Joint,
  type MotionId,
  type Point,
  type SideMotion,
  type SidePose,
} from '@/lib/motions';

const LIMB = '#4A505C';
const LIMB_FAR = '#363A43';
const FURNITURE = '#2F333B';
const STEEL = '#8A909B';
const PLATE = '#23262D';

type Colorer = (m: Muscle) => string | null;

// Longueurs des segments (vue de profil, repère 100 × 100).
const L = { shin: 19, thigh: 20, torso: 28, uarm: 15, farm: 14, foot: 6 };

const rad = (deg: number) => (deg * Math.PI) / 180;
const dir = (deg: number): Point => [Math.sin(rad(deg)), Math.cos(rad(deg))];
const add = (p: Point, d: Point, len: number): Point => [p[0] + d[0] * len, p[1] + d[1] * len];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function lerpPose(a: SidePose, b: SidePose, t: number): SidePose {
  const n = (k: 'shin' | 'thigh' | 'torso' | 'uarm' | 'farm') => lerp(a[k], b[k], t);
  return {
    anchor: a.anchor,
    at: [lerp(a.at[0], b.at[0], t), lerp(a.at[1], b.at[1], t)],
    shin: n('shin'),
    thigh: n('thigh'),
    torso: n('torso'),
    uarm: n('uarm'),
    farm: n('farm'),
    foot: lerp(a.foot ?? 90, b.foot ?? 90, t),
    uarmScale: lerp(a.uarmScale ?? 1, b.uarmScale ?? 1, t),
    farmScale: lerp(a.farmScale ?? 1, b.farmScale ?? 1, t),
    leg2:
      a.leg2 && b.leg2
        ? { thigh: lerp(a.leg2.thigh, b.leg2.thigh, t), shin: lerp(a.leg2.shin, b.leg2.shin, t) }
        : undefined,
  };
}

function solve(p: SidePose) {
  // Calcul depuis une cheville en (0, 0), puis translation vers le point d'ancrage.
  const ankle: Point = [0, 0];
  const knee = add(ankle, dir(p.shin), L.shin);
  const hip = add(knee, dir(p.thigh), L.thigh);
  const ref = p.anchor === 'ankle' ? ankle : hip;
  const dx = p.at[0] - ref[0];
  const dy = p.at[1] - ref[1];
  const m = (q: Point): Point => [q[0] + dx, q[1] + dy];
  const j = { ankle: m(ankle), knee: m(knee), hip: m(hip) };
  const shoulder = add(j.hip, dir(p.torso), L.torso);
  const elbow = add(shoulder, dir(p.uarm), L.uarm * (p.uarmScale ?? 1));
  const wrist = add(elbow, dir(p.farm), L.farm * (p.farmScale ?? 1));
  const toe = add(j.ankle, dir(p.foot ?? 90), L.foot);
  const head = add(shoulder, dir(p.torso), 9);
  let knee2: Point | undefined;
  let ankle2: Point | undefined;
  if (p.leg2) {
    knee2 = add(j.hip, dir(p.leg2.thigh), L.thigh);
    ankle2 = add(knee2, dir(p.leg2.shin), L.shin);
  }
  return { ...j, shoulder, elbow, wrist, toe, head, knee2, ankle2 };
}

// Trait décalé d'un côté du segment (avant/arrière) pour colorer un muscle.
function Overlay({ from, to, side, color }: { from: Point; to: Point; side: 1 | -1; color: string }) {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
  // Normale « gauche » du segment, orientée par side.
  const nx = (-(to[1] - from[1]) / len) * side * 1.9;
  const ny = ((to[0] - from[0]) / len) * side * 1.9;
  return (
    <Line
      x1={from[0] + nx}
      y1={from[1] + ny}
      x2={to[0] + nx}
      y2={to[1] + ny}
      stroke={color}
      strokeWidth={3.2}
      strokeLinecap="round"
    />
  );
}

const mid = (a: Point, b: Point, t = 0.5): Point => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

function SideFigure({
  motion,
  pose,
  color,
  equipment,
  ghost,
}: {
  motion: SideMotion;
  pose: SidePose;
  color: Colorer;
  equipment: Equipment;
  ghost?: boolean;
}) {
  const j = solve(pose);
  const limb = (a: Point, b: Point, w = 7, c = LIMB) => (
    <Line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" />
  );
  // Côté « avant » d'un segment : la normale gauche pointe vers l'avant du corps
  // pour un segment orienté vers le haut (cuisse, tronc, tibia) et vers l'arrière sinon.
  const frontOf = (a: Point, b: Point, facingUp: boolean): 1 | -1 => {
    void a;
    void b;
    return facingUp ? 1 : -1;
  };
  const ov = (a: Point, b: Point, m: Muscle, side: 1 | -1) => {
    const c = color(m);
    return c ? <Overlay from={a} to={b} side={side} color={c} /> : null;
  };
  const point = (name: Joint): Point =>
    name === 'ankle2' ? (j.ankle2 ?? j.ankle) : (j as unknown as Record<string, Point>)[name];

  if (ghost) {
    return (
      <G opacity={0.18}>
        {j.knee2 && j.ankle2 && limb(j.hip, j.knee2)}
        {j.knee2 && j.ankle2 && limb(j.knee2, j.ankle2)}
        {limb(j.ankle, j.knee)}
        {limb(j.knee, j.hip)}
        {limb(j.hip, j.shoulder, 9)}
        {limb(j.shoulder, j.elbow, 6)}
        {limb(j.elbow, j.wrist, 5)}
        <Circle cx={j.head[0]} cy={j.head[1]} r={5.5} fill={LIMB} />
      </G>
    );
  }

  const chestTop = mid(j.hip, j.shoulder, 0.55);
  const link = motion.link;
  const linkTo = link ? (Array.isArray(link.to) ? link.to : point(link.to)) : undefined;
  const loadAt = motion.loadAt ?? 'wrist';
  const load = loadAt === 'none' ? undefined : point(loadAt);

  return (
    <G>
      {/* Câble ou levier, derrière le corps */}
      {link && linkTo && (equipment === 'Poulie' || equipment === 'Machine') && (
        <G>
          <Line
            x1={point(link.from)[0]}
            y1={point(link.from)[1]}
            x2={linkTo[0]}
            y2={linkTo[1]}
            stroke={STEEL}
            strokeWidth={equipment === 'Machine' ? 2.6 : 0.9}
            strokeLinecap="round"
          />
          <Circle cx={linkTo[0]} cy={linkTo[1]} r={equipment === 'Machine' ? 2.6 : 2.2} fill={STEEL} />
          <Circle cx={point(link.from)[0]} cy={point(link.from)[1]} r={2.6} fill={STEEL} />
        </G>
      )}

      {/* Jambe arrière */}
      {j.knee2 && j.ankle2 && (
        <G>
          {limb(j.hip, j.knee2, 7, LIMB_FAR)}
          {limb(j.knee2, j.ankle2, 6, LIMB_FAR)}
          {ov(j.hip, j.knee2, 'quads', -1)}
          {ov(j.hip, j.knee2, 'hamstrings', 1)}
          {ov(j.knee2, j.ankle2, 'calves', 1)}
        </G>
      )}

      {/* Jambe, tronc, tête */}
      {limb(j.ankle, j.toe, 4)}
      {limb(j.ankle, j.knee, 6)}
      {limb(j.knee, j.hip, 8)}
      {limb(j.hip, j.shoulder, 10)}
      {limb(j.shoulder, j.head, 4)}
      <Circle cx={j.head[0]} cy={j.head[1]} r={5.5} fill={LIMB} />

      {ov(j.knee, j.hip, 'quads', frontOf(j.knee, j.hip, true))}
      {ov(j.knee, j.hip, 'hamstrings', (-frontOf(j.knee, j.hip, true)) as 1 | -1)}
      {ov(j.ankle, j.knee, 'calves', -1)}
      {ov(chestTop, j.shoulder, 'chest', 1)}
      {ov(j.hip, chestTop, 'abs', 1)}
      {ov(j.hip, chestTop, 'obliques', 1)}
      {ov(chestTop, j.shoulder, 'lats', -1)}
      {ov(j.hip, chestTop, 'lowerback', -1)}
      {ov(j.shoulder, mid(j.shoulder, j.head, 0.9), 'traps', -1)}
      {color('glutes') && (
        <Overlay from={j.hip} to={mid(j.hip, j.knee, 0.35)} side={1} color={color('glutes')!} />
      )}
      {color('glutes') && <Overlay from={mid(j.hip, j.shoulder, 0.15)} to={j.hip} side={1} color={color('glutes')!} />}

      {/* Bras */}
      {limb(j.shoulder, j.elbow, 6)}
      {limb(j.elbow, j.wrist, 5)}
      {color('shoulders') && <Circle cx={j.shoulder[0]} cy={j.shoulder[1]} r={4} fill={color('shoulders')!} />}
      {ov(j.shoulder, j.elbow, 'biceps', -1)}
      {ov(j.shoulder, j.elbow, 'triceps', 1)}
      {color('forearms') && limb(j.elbow, j.wrist, 3.2, color('forearms')!)}

      {/* Plateau de presse */}
      {motion.platform && (() => {
        const d = dir((pose.foot ?? 90) + 90);
        const c = mid(j.ankle, j.toe, 0.6);
        return (
          <Line
            x1={c[0] - d[0] * 9}
            y1={c[1] - d[1] * 9}
            x2={c[0] + d[0] * 9}
            y2={c[1] + d[1] * 9}
            stroke={STEEL}
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      })()}

      {/* Charge */}
      {load && equipment === 'Barre' && (
        <G>
          <Circle cx={load[0]} cy={load[1]} r={7} fill={PLATE} stroke={STEEL} strokeWidth={1.4} />
          <Circle cx={load[0]} cy={load[1]} r={1.6} fill={STEEL} />
        </G>
      )}
      {load && equipment === 'Haltères' && (
        <G>
          <Circle cx={load[0]} cy={load[1]} r={3.6} fill={PLATE} stroke={STEEL} strokeWidth={1.2} />
        </G>
      )}
      {load && (equipment === 'Machine' || equipment === 'Poulie') && !link && (
        <Circle cx={load[0]} cy={load[1]} r={2.4} fill={STEEL} />
      )}
    </G>
  );
}

// ---------- Vue de face / de dos ----------

const FRONT = { shoulderX: 30, shoulderY: 39, uarm: 25, farm: 24, hipX: 44, hipY: 95, thigh: 40, shin: 38 };

function armPoints(pose: FrontPose, side: 1 | -1) {
  const s = pose.shrug ?? 0;
  const shoulder: Point = [side === 1 ? 100 - FRONT.shoulderX : FRONT.shoulderX, FRONT.shoulderY - s];
  const v = (abd: number, flex: number): Point => [
    Math.sin(rad(abd)) * Math.cos(rad(flex)) * side,
    Math.cos(rad(abd)),
  ];
  const elbow = add(shoulder, v(pose.arm.abd, pose.arm.flex), FRONT.uarm);
  const hand = add(elbow, v(pose.arm.fAbd, pose.arm.fFlex), FRONT.farm);
  return { shoulder, elbow, hand };
}

function lerpFront(a: FrontPose, b: FrontPose, t: number): FrontPose {
  return {
    arm: {
      abd: lerp(a.arm.abd, b.arm.abd, t),
      flex: lerp(a.arm.flex, b.arm.flex, t),
      fAbd: lerp(a.arm.fAbd, b.arm.fAbd, t),
      fFlex: lerp(a.arm.fFlex, b.arm.fFlex, t),
    },
    legAbd: lerp(a.legAbd ?? 4, b.legAbd ?? 4, t),
    shrug: lerp(a.shrug ?? 0, b.shrug ?? 0, t),
  };
}

const TORSO_FRONT: Muscle[] = ['traps', 'shoulders', 'chest', 'obliques'];
const TORSO_BACK: Muscle[] = ['traps', 'shoulders', 'lats', 'lowerback', 'glutes'];

function FrontFigure({
  motion,
  pose,
  color,
  equipment,
  ghost,
}: {
  motion: FrontMotion;
  pose: FrontPose;
  color: Colorer;
  equipment: Equipment;
  ghost?: boolean;
}) {
  const back = motion.view === 'back';
  const fill = (m: Muscle) => color(m) ?? IDLE;
  const shapes = (back ? backShapes : frontShapes).filter(([m]) => (back ? TORSO_BACK : TORSO_FRONT).includes(m));
  const s = pose.shrug ?? 0;
  const arms = [armPoints(pose, -1), armPoints(pose, 1)];
  const legAbd = pose.legAbd ?? 4;
  const legs = ([-1, 1] as const).map((side) => {
    const hip: Point = [50 + (FRONT.hipX - 50) * -side, FRONT.hipY];
    const d: Point = [Math.sin(rad(legAbd)) * side, Math.cos(rad(legAbd))];
    const knee = add(hip, d, FRONT.thigh);
    const ankle = add(knee, d, FRONT.shin);
    return { hip, knee, ankle };
  });
  const armColor = color(back ? 'triceps' : 'biceps');
  const thighColor = color(back ? 'hamstrings' : 'quads');
  const shinColor = back ? color('calves') : null;

  if (ghost) {
    return (
      <G opacity={0.18}>
        {arms.map((a, i) => (
          <G key={i}>
            <Line x1={a.shoulder[0]} y1={a.shoulder[1]} x2={a.elbow[0]} y2={a.elbow[1]} stroke={LIMB} strokeWidth={9} strokeLinecap="round" />
            <Line x1={a.elbow[0]} y1={a.elbow[1]} x2={a.hand[0]} y2={a.hand[1]} stroke={LIMB} strokeWidth={7} strokeLinecap="round" />
          </G>
        ))}
        {legAbd > 5 &&
          legs.map((l, i) => (
            <Line key={i} x1={l.hip[0]} y1={l.hip[1]} x2={l.ankle[0]} y2={l.ankle[1]} stroke={LIMB} strokeWidth={12} strokeLinecap="round" />
          ))}
      </G>
    );
  }

  return (
    <G>
      {/* Câbles */}
      {motion.cableTo && equipment === 'Poulie' &&
        arms.map((a, i) => {
          const to: Point = i === 0 ? motion.cableTo! : [100 - motion.cableTo![0], motion.cableTo![1]];
          return <Line key={i} x1={a.hand[0]} y1={a.hand[1]} x2={to[0]} y2={to[1]} stroke={STEEL} strokeWidth={1.2} />;
        })}
      {motion.bar && (
        <G>
          {equipment !== 'Poids du corps' && (
            <Line x1={50} y1={0} x2={50} y2={(arms[0].hand[1] + arms[1].hand[1]) / 2} stroke={STEEL} strokeWidth={1.2} />
          )}
          <Line
            x1={arms[0].hand[0] - 8}
            y1={arms[0].hand[1]}
            x2={arms[1].hand[0] + 8}
            y2={arms[1].hand[1]}
            stroke={STEEL}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </G>
      )}

      {/* Jambes */}
      {legs.map((l, i) => (
        <G key={i}>
          <Line x1={l.hip[0]} y1={l.hip[1]} x2={l.knee[0]} y2={l.knee[1]} stroke={thighColor ?? LIMB} strokeWidth={13} strokeLinecap="round" />
          <Line x1={l.knee[0]} y1={l.knee[1]} x2={l.ankle[0]} y2={l.ankle[1]} stroke={shinColor ?? LIMB} strokeWidth={9} strokeLinecap="round" />
          <Circle cx={l.ankle[0]} cy={l.ankle[1] + 3} r={4} fill={BASE} />
        </G>
      ))}

      {/* Tronc */}
      <Path d="M37 89 L63 89 L61 101 L50 106 L39 101 Z" fill={back ? fill('glutes') : BASE} />
      <G transform={`translate(0,${-s})`}>
        <Circle cx={50} cy={15} r={9} fill={BASE} />
        <Path d="M45 22 L55 22 L55 30 L45 30 Z" fill={BASE} />
      </G>
      {[0, 1].map((side) => (
        <G key={side} transform={side ? 'translate(100,0) scale(-1,1)' : undefined}>
          {shapes.map(([m, d]) => (
            <Path
              key={m}
              d={d}
              fill={fill(m)}
              transform={m === 'traps' || m === 'shoulders' ? `translate(0,${-s})` : undefined}
            />
          ))}
        </G>
      ))}
      {!back && <Path d="M42 55 h16 v33 h-16 Z" fill={fill('abs')} />}

      {/* Bras */}
      {arms.map((a, i) => (
        <G key={i}>
          <Line x1={a.shoulder[0]} y1={a.shoulder[1]} x2={a.elbow[0]} y2={a.elbow[1]} stroke={armColor ?? LIMB} strokeWidth={9} strokeLinecap="round" />
          <Line x1={a.elbow[0]} y1={a.elbow[1]} x2={a.hand[0]} y2={a.hand[1]} stroke={color('forearms') ?? LIMB} strokeWidth={7} strokeLinecap="round" />
          {color('shoulders') && <Circle cx={a.shoulder[0]} cy={a.shoulder[1]} r={6} fill={color('shoulders')!} />}
          {equipment === 'Haltères' && <Circle cx={a.hand[0]} cy={a.hand[1]} r={4.5} fill={PLATE} stroke={STEEL} strokeWidth={1.4} />}
          {(equipment === 'Machine' || equipment === 'Poulie') && !motion.bar && (
            <Circle cx={a.hand[0]} cy={a.hand[1]} r={3.2} fill={STEEL} />
          )}
        </G>
      ))}
    </G>
  );
}

// ---------- Composant public ----------

// Va-et-vient doux entre 0 et 1.
function usePhase(enabled: boolean, period = 2600) {
  const [t, setT] = useState(1);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    let last = 0;
    const start = Date.now();
    const loop = () => {
      const now = Date.now();
      // ~30 images/s suffisent et ménagent la batterie.
      if (now - last > 33) {
        last = now;
        const x = ((now - start) % period) / period;
        const tri = x < 0.5 ? x * 2 : 2 - x * 2;
        setT(0.5 - Math.cos(tri * Math.PI) / 2);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [enabled, period]);
  return t;
}

/** Silhouette qui exécute le mouvement, muscles principaux en rouge vif, secondaires en rouge sombre. */
export function ExerciseFigure({
  motion: motionId,
  primary,
  secondary = [],
  equipment,
  size = 120,
  animated = false,
}: {
  motion: MotionId;
  primary: Muscle[];
  secondary?: Muscle[];
  equipment: Equipment;
  size?: number;
  animated?: boolean;
}) {
  const t = usePhase(animated);
  const motion = motions[motionId] as SideMotion | FrontMotion;
  const color: Colorer = (m) => (primary.includes(m) ? PRIMARY : secondary.includes(m) ? SECONDARY : null);

  if (motion.view === 'side') {
    return (
      <Svg width={size} height={size} viewBox="-4 -10 108 108">
        <Line x1={-4} y1={95.5} x2={104} y2={95.5} stroke={FURNITURE} strokeWidth={1} />
        {motion.furniture?.map(([x1, y1, x2, y2, w], i) => (
          <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={FURNITURE} strokeWidth={w} strokeLinecap="round" />
        ))}
        {!animated && <SideFigure motion={motion} pose={motion.a} color={color} equipment={equipment} ghost />}
        <SideFigure motion={motion} pose={lerpPose(motion.a, motion.b, t)} color={color} equipment={equipment} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="-40 -4 180 180">
      {!animated && <FrontFigure motion={motion} pose={motion.a} color={color} equipment={equipment} ghost />}
      <FrontFigure motion={motion} pose={lerpFront(motion.a, motion.b, t)} color={color} equipment={equipment} />
    </Svg>
  );
}
