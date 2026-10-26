import test from 'node:test';
import assert from 'node:assert/strict';

const MAX_TROOPS = 250;
function applyGate(troops, gate) {
  if (gate.kind === 'add') return Math.min(MAX_TROOPS, troops + gate.n);
  if (gate.kind === 'mult') return Math.min(MAX_TROOPS, troops * gate.n);
  return troops;
}
test('add gate adds the displayed number', () => assert.equal(applyGate(10,{kind:'add',n:5}),15));
test('multiplier gate multiplies troop count', () => assert.equal(applyGate(10,{kind:'mult',n:3}),30));
test('troop count is capped to avoid runaway values', () => assert.equal(applyGate(200,{kind:'mult',n:3}),250));
test('unknown gate leaves troops unchanged', () => assert.equal(applyGate(10,{kind:'other',n:3}),10));
