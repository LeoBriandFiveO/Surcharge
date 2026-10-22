import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { ExerciseFigure } from '@/components/exercise-figure';
import { MuscleMap } from '@/components/muscle-map';
import { Body, Button, Muted, Row } from '@/components/ui';
import { muscleNames, type CatalogExercise } from '@/lib/catalog';
import { colors, radius, space } from '@/lib/theme';

/** Fiche d'un exercice : mouvement animé et muscles travaillés. */
export function ExerciseSheet({
  exercise,
  onClose,
}: {
  exercise: CatalogExercise | null;
  onClose: () => void;
}) {
  return (
    <Modal visible={exercise !== null} transparent animationType="none" onRequestClose={onClose}>
      {exercise && (
        <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <Animated.View
            entering={SlideInDown.springify().damping(18)}
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: radius.lg * 1.5,
              borderTopRightRadius: radius.lg * 1.5,
              padding: space.lg,
              paddingBottom: space.xl * 1.5,
              gap: space.md,
            }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            <Body style={{ fontSize: 22, fontWeight: '800' }}>{exercise.name}</Body>
            <Muted>
              {exercise.equipment} · {exercise.repMin}–{exercise.repMax} reps
              {exercise.increment > 0 ? ` · +${String(exercise.increment).replace('.', ',')} kg` : ''}
            </Muted>
            <Row style={{ justifyContent: 'center', gap: space.lg }}>
              <View style={{ backgroundColor: colors.bg, borderRadius: radius.lg, padding: space.sm }}>
                <ExerciseFigure
                  motion={exercise.motion}
                  primary={exercise.primary}
                  secondary={exercise.secondary}
                  equipment={exercise.equipment}
                  size={170}
                  animated
                />
              </View>
              <MuscleMap primary={exercise.primary} secondary={exercise.secondary} width={110} labels />
            </Row>
            <View style={{ gap: 4 }}>
              <Text style={{ color: colors.text }}>
                <Text style={{ color: '#FF3B3B', fontWeight: '800' }}>● </Text>
                {exercise.primary.map((m) => muscleNames[m]).join(', ')}
              </Text>
              {exercise.secondary.length > 0 && (
                <Text style={{ color: colors.muted }}>
                  <Text style={{ color: '#93303A', fontWeight: '800' }}>● </Text>
                  Aussi : {exercise.secondary.map((m) => muscleNames[m]).join(', ')}
                </Text>
              )}
            </View>
            <Button variant="secondary" title="Fermer" onPress={onClose} />
          </Animated.View>
        </Animated.View>
      )}
    </Modal>
  );
}
