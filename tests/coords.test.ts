import { describe, expect, it } from 'vitest';
import { menuUvToLocal, localToMenuUv, pointInRegion, regionCenter, rayToMenuUv, menuAspect } from '../src/ar/coords';

const aspect = menuAspect(679, 1020); // ≈ 1.5022 (supplied menu image)

describe('menu UV ↔ local conversion', () => {
  it('maps menu centre to local origin', () => {
    const p = menuUvToLocal({ u: 0.5, v: 0.5 }, aspect);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
    expect(p.z).toBe(0);
  });

  it('v = 0 (top of printed menu) is local +Y (image top edge)', () => {
    const p = menuUvToLocal({ u: 0.5, v: 0 }, aspect);
    expect(p.y).toBeCloseTo(aspect / 2);
    const q = menuUvToLocal({ u: 0.5, v: 1 }, aspect);
    expect(q.y).toBeCloseTo(-aspect / 2);
  });

  it('round-trips', () => {
    const uv = { u: 0.317, v: 0.654 };
    const p = menuUvToLocal(uv, aspect);
    const back = localToMenuUv(p, aspect);
    expect(back.u).toBeCloseTo(uv.u, 6);
    expect(back.v).toBeCloseTo(uv.v, 6);
  });
});

describe('region picking', () => {
  const r = { x: 0.1, y: 0.2, w: 0.3, h: 0.4 };
  it('point inside', () => {
    expect(pointInRegion({ u: 0.2, v: 0.3 }, r)).toBe(true);
  });
  it('point outside', () => {
    expect(pointInRegion({ u: 0.8, v: 0.8 }, r)).toBe(false);
  });
  it('centre of region is inside', () => {
    expect(pointInRegion(regionCenter(r), r)).toBe(true);
  });
});

describe('camera ray → menu uv', () => {
  it('resolves a head-on ray from above the centre', () => {
    // "camera" at local (0, 0, 1) looking down -Z at the menu centre
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const uv = rayToMenuUv([0, 0, 1], [0, 0, -1], identity, aspect);
    expect(uv).not.toBeNull();
    expect(uv!.u).toBeCloseTo(0.5);
    expect(uv!.v).toBeCloseTo(0.5);
  });

  it('handles an off-centre ray', () => {
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const uv = rayToMenuUv([0.1, 0.2, 1], [0, 0, -1], identity, aspect);
    expect(uv!.u).toBeCloseTo(0.6);
    expect(uv!.v).toBeCloseTo(0.5 - 0.2 / aspect, 5);
  });

  it('returns null when the plane is behind the ray or parallel', () => {
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    expect(rayToMenuUv([0, 0, 1], [0, 0, 1], identity, aspect)).toBeNull();
    expect(rayToMenuUv([0, 0, 1], [1, 0, 0], identity, aspect)).toBeNull();
  });
});
