import assert from 'node:assert/strict';
import { test } from 'node:test';

import { estimatedOneRepMax, roundToIncrement, suggestNext, summarize } from './progression.ts';

const cfg = { sets: 3, repMin: 8, repMax: 12, increment: 2.5 };
const session = (weight: number, ...reps: number[]) => reps.map((r) => ({ weight, reps: r }));

test('sans historique, on laisse choisir la charge', () => {
  const s = suggestNext(cfg, []);
  assert.equal(s.kind, 'first');
  assert.equal(s.weight, null);
  assert.equal(s.reps, 8);
});

test('toutes les séries à repMax : on augmente la charge', () => {
  const s = suggestNext(cfg, [session(60, 12, 12, 12)]);
  assert.equal(s.kind, 'increase');
  assert.equal(s.weight, 62.5);
  assert.equal(s.reps, 8);
});

test('pas assez de séries à repMax : on ne monte pas', () => {
  const s = suggestNext(cfg, [session(60, 12, 12)]);
  assert.equal(s.kind, 'reps');
  assert.equal(s.weight, 60);
  assert.equal(s.reps, 12);
});

test('dans la fourchette : une rep de plus', () => {
  const s = suggestNext(cfg, [session(60, 10, 9, 9)]);
  assert.equal(s.kind, 'reps');
  assert.equal(s.weight, 60);
  assert.equal(s.reps, 10);
});

test('échec une fois : on garde la charge', () => {
  const s = suggestNext(cfg, [session(60, 9, 7, 6)]);
  assert.equal(s.kind, 'repeat');
  assert.equal(s.weight, 60);
});

test('échec deux fois à la même charge : deload de 10 %', () => {
  const s = suggestNext(cfg, [session(60, 8, 7, 6), session(60, 7, 7, 6)]);
  assert.equal(s.kind, 'deload');
  assert.equal(s.weight, 55);
});

test("les séries d'échauffement plus légères sont ignorées", () => {
  const s = suggestNext(cfg, [[{ weight: 20, reps: 15 }, ...session(60, 12, 12, 12)]]);
  assert.equal(s.kind, 'increase');
  assert.equal(s.weight, 62.5);
});

test('poids du corps : on progresse sur les reps', () => {
  const s = suggestNext({ ...cfg, increment: 0 }, [session(0, 12, 12, 13)]);
  assert.equal(s.kind, 'reps');
  assert.equal(s.reps, 13);
});

test('utilitaires', () => {
  assert.equal(roundToIncrement(54, 2.5), 55);
  assert.equal(estimatedOneRepMax({ weight: 100, reps: 10 }), 133.3);
  assert.equal(summarize(session(60, 10, 10, 10)), '3×10 à 60 kg');
  assert.equal(summarize(session(62.5, 10, 9)), '2×10/9 à 62,5 kg');
});
