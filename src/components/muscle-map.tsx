import { Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { Muscle } from '@/lib/catalog';
import { colors } from '@/lib/theme';

const BASE = '#2A2E36';
const IDLE = '#3B404A';
const PRIMARY = '#FF3B3B';
const SECONDARY = '#93303A';

// Formes d'une moitié du corps (côté gauche de l'image, x < 50) ; l'autre moitié est un miroir.
const front: [Muscle, string][] = [
  ['traps', 'M45 29 L37 33 L45 33 Z'],
  ['shoulders', 'M36 32 Q26 31 24 42 Q25 47 29 48 L35 40 Z'],
  ['chest', 'M49 34 L37 34 Q33 40 34 50 Q41 55 49 52 Z'],
  ['biceps', 'M24 48 Q21 56 22 66 L28 66 Q30 57 29 49 Z'],
  ['forearms', 'M21 68 Q17 78 18 90 L23 90 Q27 79 28 68 Z'],
  ['obliques', 'M41 54 L35 53 Q33 70 37 88 L41 88 Z'],
  ['quads', 'M37 96 Q31 110 33 134 L46 134 Q49 116 48 103 L39 97 Z'],
  ['calves', 'M35 143 Q33 157 37 172 L43 172 Q46 157 44 143 Z'],
];

const back: [Muscle, string][] = [
  ['traps', 'M50 24 L44 28 L35 33 L43 40 L50 46 Z'],
  ['shoulders', 'M36 32 Q26 31 24 42 Q25 47 29 48 L35 40 Z'],
  ['lats', 'M49 47 L42 41 L35 38 Q33 52 38 66 L49 72 Z'],
  ['lowerback', 'M49 73 L39 68 Q38 80 40 88 L49 88 Z'],
  ['triceps', 'M24 48 Q21 56 22 66 L28 66 Q30 57 29 49 Z'],
  ['forearms', 'M21 68 Q17 78 18 90 L23 90 Q27 79 28 68 Z'],
  ['glutes', 'M50 89 L38 89 Q34 98 37 106 Q44 110 50 106 Z'],
  ['hamstrings', 'M37 108 Q32 120 34 134 L46 134 Q48 120 49 110 Z'],
  ['calves', 'M34 141 Q31 152 36 166 L43 166 Q46 152 44 141 Z'],
];

function Half({ shapes, fill }: { shapes: [Muscle, string][]; fill: (m: Muscle) => string }) {
  return (
    <>
      {shapes.map(([m, d]) => (
        <Path key={m} d={d} fill={fill(m)} />
      ))}
    </>
  );
}

function Figure({
  shapes,
  fill,
  view,
}: {
  shapes: [Muscle, string][];
  fill: (m: Muscle) => string;
  view: 'front' | 'back';
}) {
  return (
    <>
      <Circle cx={50} cy={15} r={9} fill={BASE} />
      <Rect x={45} y={23} width={10} height={7} fill={BASE} />
      <Path d="M37 89 L63 89 L61 101 L50 106 L39 101 Z" fill={BASE} />
      {[0, 1].map((side) => (
        <G key={side} transform={side ? 'translate(100,0) scale(-1,1)' : undefined}>
          <Ellipse cx={20.5} cy={95} rx={3.5} ry={5} fill={BASE} />
          <Ellipse cx={40} cy={138.5} rx={5.5} ry={4} fill={BASE} />
          <Ellipse cx={40} cy={177} rx={6} ry={3} fill={BASE} />
          {view === 'back' && <Path d="M36 166 L43 166 L42 173 L37 173 Z" fill={BASE} />}
          <Half shapes={shapes} fill={fill} />
        </G>
      ))}
      {view === 'front' && <Rect x={42} y={55} width={16} height={33} rx={5} fill={fill('abs')} />}
    </>
  );
}

/** Silhouette de face et de dos, muscles principaux en rouge vif, secondaires en rouge sombre. */
export function MuscleMap({
  primary,
  secondary = [],
  width = 120,
  labels = false,
}: {
  primary: Muscle[];
  secondary?: Muscle[];
  width?: number;
  labels?: boolean;
}) {
  const fill = (m: Muscle) => (primary.includes(m) ? PRIMARY : secondary.includes(m) ? SECONDARY : IDLE);
  const height = (width * 185) / 210;
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={width} height={height} viewBox="0 0 210 185">
        <Figure shapes={front} fill={fill} view="front" />
        <G transform="translate(110,0)">
          <Figure shapes={back} fill={fill} view="back" />
        </G>
      </Svg>
      {labels && (
        <View style={{ flexDirection: 'row', width, justifyContent: 'space-around' }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>Face</Text>
          <Text style={{ color: colors.muted, fontSize: 11 }}>Dos</Text>
        </View>
      )}
    </View>
  );
}
