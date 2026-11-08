import { describe, expect, it } from 'vitest';
import { buildLockReport } from '../scripts/lockgraph';

describe('lock reachability graph', () => {
  const r = buildLockReport();
  it('has no quest prerequisite cycles', () => expect(r.cycles).toEqual([]));
  it('has no quest nobody can offer', () => expect(r.noEntry).toEqual([]));
  it('has no requirement on a flag nothing sets', () => expect(r.unsetFlags).toEqual([]));
  it('has no requirement on an item nothing hands out', () => expect(r.unobtainableItems).toEqual([]));
});

import { unreachableZones } from '../scripts/lockgraph';
describe('zone entry rites', () => {
  it('every zone can be reached using only quests from zones already reachable', () => expect(unreachableZones()).toEqual([]));
});
