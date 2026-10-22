import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { MuscleMap } from '@/components/muscle-map';
import { Appear, Body, Button, Card, Input, Loading, Muted, Row, Screen, Subtitle } from '@/components/ui';
import { Alert } from '@/lib/alert';
import { useUserId } from '@/lib/auth';
import {
  catalog,
  findCatalog,
  groups,
  muscleNames,
  sessionTypes,
  suggestionsFor,
  type CatalogExercise,
  type Group,
} from '@/lib/catalog';
import { parseNumber } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { colors, radius, space } from '@/lib/theme';
import type { Exercise, RoutineExercise } from '@/lib/types';

type Item = {
  key: string;
  exerciseId: string | null;
  catalogId: string | null;
  name: string;
  sets: string;
  repMin: string;
  repMax: string;
  increment: string;
};

let keySeq = 0;
const newKey = () => `k${keySeq++}`;

function fromExercise(e: Exercise, sets = 3): Item {
  return {
    key: newKey(),
    exerciseId: e.id,
    catalogId: findCatalog(e.catalog_id, e.name)?.id ?? null,
    name: e.name,
    sets: String(sets),
    repMin: String(e.rep_min),
    repMax: String(e.rep_max),
    increment: String(e.increment).replace('.', ','),
  };
}

function fromCatalog(c: CatalogExercise, library: Exercise[]): Item {
  // Réutilise l'exercice si tu l'as déjà, pour garder ton historique.
  const existing = library.find((e) => findCatalog(e.catalog_id, e.name)?.id === c.id);
  if (existing) return fromExercise(existing);
  return {
    key: newKey(),
    exerciseId: null,
    catalogId: c.id,
    name: c.name,
    sets: '3',
    repMin: String(c.repMin),
    repMax: String(c.repMax),
    increment: String(c.increment).replace('.', ','),
  };
}

export default function RoutineEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const userId = useUserId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [picking, setPicking] = useState(false);
  const [newName, setNewName] = useState('');
  const [sessionType, setSessionType] = useState<string | null>(null);
  const [group, setGroup] = useState<Group>('Pecs');

  useEffect(() => {
    (async () => {
      const lib = await supabase.from('exercises').select('*').eq('user_id', userId).order('name');
      setLibrary(lib.data ?? []);
      if (!isNew) {
        const r = await supabase
          .from('routines')
          .select('name, routine_exercises(*, exercises(*))')
          .eq('id', id)
          .single();
        if (r.data) {
          setName(r.data.name);
          const res = [...(r.data.routine_exercises as RoutineExercise[])].sort(
            (a, b) => a.position - b.position,
          );
          setItems(res.map((re) => fromExercise(re.exercises, re.sets)));
        }
      }
      setLoading(false);
    })();
  }, [id, isNew, userId]);

  function update(key: string, patch: Partial<Item>) {
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function move(index: number, delta: number) {
    setItems((list) => {
      const next = [...list];
      const target = index + delta;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addNew() {
    const n = newName.trim();
    if (!n) return;
    setItems((list) => [
      ...list,
      { key: newKey(), exerciseId: null, catalogId: null, name: n, sets: '3', repMin: '8', repMax: '12', increment: '2,5' },
    ]);
    setNewName('');
    setPicking(false);
  }

  async function save() {
    const routineName = name.trim();
    if (!routineName) {
      Alert.alert('Nom manquant', 'Donne un nom à ton programme.');
      return;
    }
    const parsed = items.map((it) => ({
      ...it,
      setsN: Math.round(parseNumber(it.sets)),
      repMinN: Math.round(parseNumber(it.repMin)),
      repMaxN: Math.round(parseNumber(it.repMax)),
      incrementN: parseNumber(it.increment),
    }));
    const bad = parsed.find(
      (p) =>
        !(p.setsN > 0) || !(p.repMinN > 0) || !(p.repMaxN >= p.repMinN) || !(p.incrementN >= 0) || !p.name.trim(),
    );
    if (bad) {
      Alert.alert('Valeurs invalides', `Vérifie « ${bad.name || 'sans nom'} » : séries > 0, reps min ≤ reps max.`);
      return;
    }

    setSaving(true);
    try {
      const exerciseIds: string[] = [];
      for (const p of parsed) {
        const fields = {
          name: p.name.trim(),
          catalog_id: p.catalogId,
          rep_min: p.repMinN,
          rep_max: p.repMaxN,
          increment: p.incrementN,
        };
        if (p.exerciseId) {
          const { error } = await supabase.from('exercises').update(fields).eq('id', p.exerciseId);
          if (error) throw error;
          exerciseIds.push(p.exerciseId);
        } else {
          const { data, error } = await supabase.from('exercises').insert(fields).select('id').single();
          if (error) throw error;
          exerciseIds.push(data.id);
        }
      }

      let routineId = id;
      if (isNew) {
        const { data, error } = await supabase
          .from('routines')
          .insert({ name: routineName })
          .select('id')
          .single();
        if (error) throw error;
        routineId = data.id;
      } else {
        const { error } = await supabase.from('routines').update({ name: routineName }).eq('id', id);
        if (error) throw error;
        const del = await supabase.from('routine_exercises').delete().eq('routine_id', id);
        if (del.error) throw del.error;
      }

      if (parsed.length > 0) {
        const { error } = await supabase.from('routine_exercises').insert(
          parsed.map((p, i) => ({
            routine_id: routineId,
            exercise_id: exerciseIds[i],
            position: i,
            sets: p.setsN,
          })),
        );
        if (error) throw error;
      }
      router.back();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function remove() {
    Alert.alert('Supprimer ce programme ?', 'Ton historique de séances est conservé.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('routines').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  }

  if (loading) return <Loading />;

  const available = library.filter((e) => !items.some((it) => it.exerciseId === e.id));
  const hasCatalog = (c: CatalogExercise) => items.some((it) => it.catalogId === c.id);
  function toggleCatalog(c: CatalogExercise) {
    if (hasCatalog(c)) setItems((l) => l.filter((it) => it.catalogId !== c.id));
    else setItems((l) => [...l, fromCatalog(c, library)]);
  }
  const type = sessionTypes.find((t) => t.label === sessionType);

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: isNew ? 'Nouveau programme' : 'Modifier le programme' }} />
      <Input label="Nom du programme" value={name} onChangeText={setName} placeholder="Ex. Push, Haut du corps…" />

      <Subtitle>Quel type de séance ?</Subtitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {sessionTypes.map((t) => (
          <Chip
            key={t.label}
            label={t.label}
            active={sessionType === t.label}
            onPress={() => {
              setSessionType(sessionType === t.label ? null : t.label);
              if (!name.trim()) setName(t.label);
            }}
          />
        ))}
      </ScrollView>
      {type && (
        <View style={{ gap: space.sm }}>
          <Muted>Exercices adaptés à une séance {type.label.toLowerCase()} : touche pour ajouter ou retirer.</Muted>
          {suggestionsFor(type.muscles).map((c, i) => (
            <Appear key={c.id} index={i}>
              <CatalogRow exercise={c} added={hasCatalog(c)} onPress={() => toggleCatalog(c)} />
            </Appear>
          ))}
        </View>
      )}

      <Subtitle>Exercices du programme ({items.length})</Subtitle>
      <Muted>
        L’app te fera progresser dans la fourchette de reps, puis ajoutera l’incrément de charge
        quand toutes tes séries atteignent le max. Mets un incrément de 0 pour le poids du corps.
      </Muted>

      {items.map((it, index) => {
        const c = findCatalog(it.catalogId, it.name);
        return (
        <Card key={it.key}>
          <Row>
            {c && <MuscleMap primary={c.primary} secondary={c.secondary} width={56} />}
            <TextInput
              value={it.name}
              onChangeText={(t) => update(it.key, { name: t })}
              style={{ flex: 1, color: colors.text, fontSize: 17, fontWeight: '700' }}
            />
            <SmallButton label="↑" onPress={() => move(index, -1)} />
            <SmallButton label="↓" onPress={() => move(index, 1)} />
            <SmallButton
              label="✕"
              color={colors.danger}
              onPress={() => setItems((l) => l.filter((x) => x.key !== it.key))}
            />
          </Row>
          <Row style={{ gap: space.sm }}>
            <Field label="Séries" value={it.sets} onChange={(t) => update(it.key, { sets: t })} />
            <Field label="Reps min" value={it.repMin} onChange={(t) => update(it.key, { repMin: t })} />
            <Field label="Reps max" value={it.repMax} onChange={(t) => update(it.key, { repMax: t })} />
            <Field label="+ kg" value={it.increment} onChange={(t) => update(it.key, { increment: t })} decimal />
          </Row>
        </Card>
        );
      })}

      {picking ? (
        <Card>
          <Body style={{ fontWeight: '700' }}>Ajouter un exercice</Body>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {groups.map((g) => (
              <Chip key={g} label={g} active={group === g} onPress={() => setGroup(g)} />
            ))}
          </ScrollView>
          {catalog
            .filter((c) => c.group === group)
            .map((c) => (
              <CatalogRow key={c.id} exercise={c} added={hasCatalog(c)} onPress={() => toggleCatalog(c)} />
            ))}
          <Muted>Ou crée ton propre exercice :</Muted>
          <Row>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Nouvel exercice (ex. Développé couché)"
              placeholderTextColor={colors.muted}
              onSubmitEditing={addNew}
              style={{
                flex: 1,
                color: colors.text,
                backgroundColor: colors.cardAlt,
                borderRadius: radius.md,
                padding: space.md,
                fontSize: 16,
              }}
            />
            <Button title="OK" onPress={addNew} disabled={!newName.trim()} />
          </Row>
          {available.length > 0 && <Muted>Ou choisis dans tes exercices :</Muted>}
          {available.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => {
                setItems((l) => [...l, fromExercise(e)]);
                setPicking(false);
              }}
              style={{ paddingVertical: space.sm }}>
              <Body>{e.name}</Body>
              <Muted style={{ fontSize: 12 }}>
                {e.rep_min}–{e.rep_max} reps · +{String(e.increment).replace('.', ',')} kg
              </Muted>
            </Pressable>
          ))}
          <Button variant="ghost" title="Annuler" onPress={() => setPicking(false)} />
        </Card>
      ) : (
        <Button variant="secondary" title="+ Ajouter un exercice" onPress={() => setPicking(true)} />
      )}

      <Button title="Enregistrer" onPress={save} loading={saving} style={{ marginTop: space.md }} />
      {!isNew && <Button variant="danger" title="Supprimer le programme" onPress={remove} />}
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        borderRadius: 999,
        backgroundColor: active ? colors.accent : colors.cardAlt,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.border,
      }}>
      <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function CatalogRow({
  exercise,
  added,
  onPress,
}: {
  exercise: CatalogExercise;
  added: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        padding: space.sm,
        borderRadius: radius.md,
        backgroundColor: added ? colors.accentSoft : colors.cardAlt,
        borderWidth: 1,
        borderColor: added ? colors.accent : 'transparent',
        opacity: pressed ? 0.8 : 1,
      })}>
      <MuscleMap primary={exercise.primary} secondary={exercise.secondary} width={84} />
      <View style={{ flex: 1, gap: 2 }}>
        <Body style={{ fontWeight: '700' }}>{exercise.name}</Body>
        <Muted style={{ fontSize: 12 }}>{exercise.primary.map((m) => muscleNames[m]).join(', ')}</Muted>
        <Muted style={{ fontSize: 12 }}>
          {exercise.repMin}–{exercise.repMax} reps
          {exercise.increment > 0 ? ` · +${String(exercise.increment).replace('.', ',')} kg` : ' · poids du corps'}
        </Muted>
      </View>
      <Text style={{ color: added ? colors.accent : colors.muted, fontSize: 22, fontWeight: '800' }}>
        {added ? '✓' : '+'}
      </Text>
    </Pressable>
  );
}

function SmallButton({ label, onPress, color = colors.muted }: { label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
      <Text style={{ color, fontSize: 18 }}>{label}</Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChange,
  decimal,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  decimal?: boolean;
}) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Muted style={{ fontSize: 11 }}>{label}</Muted>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        selectTextOnFocus
        style={{
          color: colors.text,
          backgroundColor: colors.cardAlt,
          borderRadius: radius.sm,
          paddingVertical: space.sm,
          textAlign: 'center',
          fontSize: 16,
          fontWeight: '600',
        }}
      />
    </View>
  );
}
