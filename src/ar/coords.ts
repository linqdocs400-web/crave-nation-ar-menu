/**
 * Menu-image coordinate space for the Crave Nation AR menu.
 *
 * The tracked menu target is the supplied printed-menu image
 * (public/images/menu.jpg, 679 x 1020). MindAR anchors that image so that its
 * local coordinate frame spans:
 *   - local X:   -0.5 .. +0.5 across the image width
 *   - local Y:   -a/2 .. +a/2 down the image height, a = height / width
 *   - +Y points to the image TOP edge (see calibrate flow in arSession)
 *   - +Z points out of the menu, toward the camera
 *
 * Dish tap regions are defined in *menu UV* space (u: 0..1 left→right,
 * v: 0..1 top→bottom) because that is how the printed menu reads naturally.
 * All conversions between the two live in this module so the mapping is
 * unit-testable and reviewed in one place.
 */

export interface MenuUv {
  u: number;
  v: number;
}

export interface LocalPoint {
  x: number;
  y: number;
  z: number;
}

export const menuAspect = (w: number, h: number): number => h / w;

/** menu UV (v from top) → anchor-local point on the menu plane (z = 0). */
export function menuUvToLocal({ u, v }: MenuUv, aspect: number): LocalPoint {
  return { x: u - 0.5, y: (0.5 - v) * aspect, z: 0 };
}

/** anchor-local point on the menu plane → menu UV. */
export function localToMenuUv(p: LocalPoint, aspect: number): MenuUv {
  return { u: p.x + 0.5, v: 0.5 - p.y / aspect };
}

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Is a menu-UV point inside a region (regions given in menu UV space)? */
export function pointInRegion(p: MenuUv, r: Region, pad = 0.01): boolean {
  return (
    p.u >= r.x - pad &&
    p.u <= r.x + r.w + pad &&
    p.v >= r.y - pad &&
    p.v <= r.y + r.h + pad
  );
}

/** Region centre in menu UV space. */
export function regionCenter(r: Region): MenuUv {
  return { u: r.x + r.w / 2, v: r.y + r.h / 2 };
}

/** Screen-space NDC point → camera ray, resolved on the menu plane in local space. */
export interface RayLike {
  origin: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
}

/**
 * Intersect a world-space camera ray with the menu plane z = 0 of the anchor
 * local frame. `inverseMatrixWorld` is the inverse of the anchor's matrixWorld.
 * Pure function so it can be tested without three.js.
 */
export function rayToMenuUv(origin: [number, number, number], direction: [number, number, number], inverseMatrixWorld: number[], aspect: number): MenuUv | null {
  // local origin = M^-1 · [o, 1]
  const [m] = [inverseMatrixWorld];
  const ox = m[0] * origin[0] + m[4] * origin[1] + m[8] * origin[2] + m[12];
  const oy = m[1] * origin[0] + m[5] * origin[1] + m[9] * origin[2] + m[13];
  const oz = m[2] * origin[0] + m[6] * origin[1] + m[10] * origin[2] + m[14];
  // local direction = M^-1 · [d, 0]
  const dx = m[0] * direction[0] + m[4] * direction[1] + m[8] * direction[2];
  const dy = m[1] * direction[0] + m[5] * direction[1] + m[9] * direction[2];
  const dz = m[2] * direction[0] + m[6] * direction[1] + m[10] * direction[2];
  if (Math.abs(dz) < 1e-9) return null;
  const t = -oz / dz;
  if (t <= 0) return null; // plane is behind the camera ray
  return localToMenuUv({ x: ox + dx * t, y: oy + dy * t, z: 0 }, aspect);
}
