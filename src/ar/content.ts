import * as THREE from 'three';
import type { Dish } from '../data/menu';

/**
 * Builds and animates the 3D-style dish content that floats above the tracked
 * printed menu.
 *
 * Chicken Nuggets (the featured dish) is a 2.5D presentation: the supplied
 * nuggets/fries/dips photo is cut out onto a rounded plane that gently sways,
 * bobs above the menu and casts a soft fake shadow. It is deliberately NOT a
 * real 3D model — it is a 2.5D cutout of the supplied photograph.
 * Other demo dishes use a rounded crop of their menu photo as a placeholder
 * card until proper GLB/GLTF assets are available.
 */

const CROP_SOURCE: Record<string, string> = {
  nuggets: '/images/nuggets-fries-dips.jpg',
  menu: '/images/menu.jpg',
};

const texCache = new Map<string, Promise<THREE.Texture>>();

/** Load a texture cropped from a source image, with rounded corners. */
async function makeCutoutTexture(
  srcUrl: string,
  crop: { x: number; y: number; w: number; h: number },
  rounded = 0.08
): Promise<THREE.Texture> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = srcUrl;
  await img.decode();

  const target = 640;
  const cropAspect = (crop.w * img.width) / (crop.h * img.height);
  const cw = cropAspect >= 1 ? target : Math.round(target * cropAspect);
  const ch = cropAspect >= 1 ? Math.round(target / cropAspect) : target;

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    img,
    crop.x * img.width,
    crop.y * img.height,
    crop.w * img.width,
    crop.h * img.height,
    0, 0, cw, ch
  );

  // rounded-corner alpha mask (slightly feathered)
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = cw;
  maskCanvas.height = ch;
  const mctx = maskCanvas.getContext('2d')!;
  const r = Math.min(cw, ch) * rounded;
  mctx.beginPath();
  mctx.roundRect(3, 3, cw - 6, ch - 6, r);
  mctx.fillStyle = '#000';
  mctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function cachedCutout(dish: Dish) {
  const crop = dish.crop;
  if (!crop) return null;
  const key = `${crop.image}:${dish.id}`;
  let p = texCache.get(key);
  if (!p) {
    p = makeCutoutTexture(CROP_SOURCE[crop.image], crop, dish.featured ? 0.07 : 0.5);
    texCache.set(key, p);
  }
  return p;
}

function makeShadowTexture(): THREE.Texture {
  const s = 128;
  const canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(8, 16, 30, 0.5)');
  g.addColorStop(0.55, 'rgba(8, 16, 30, 0.25)');
  g.addColorStop(1, 'rgba(8, 16, 30, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeNameSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 120;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(11, 34, 61, 0.92)';
  ctx.beginPath();
  ctx.roundRect(4, 4, 504, 112, 56);
  ctx.fill();
  ctx.strokeStyle = '#f5efe2';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = '#fff8ec';
  ctx.font = '600 46px Poppins, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64, 460);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  return sprite;
}

export type ContentStatus = 'loading' | 'entering' | 'idle' | 'exiting' | 'gone';

/**
 * Floating dish experience anchored to one point of the tracked menu.
 * One instance per scene, reused across dishes via show()/beginExit().
 */
export class DishExperience {
  private root: THREE.Group;
  content = new THREE.Group();
  shadow = new THREE.Group();
  private foodMesh: THREE.Mesh | null = null;
  private shadowMesh: THREE.Mesh | null = null;
  private nameSprite: THREE.Sprite | null = null;
  private status: ContentStatus = 'gone';
  private basePos = new THREE.Vector3();
  private t = 0;
  private phaseT = 0;
  private floatSeed = 0;
  private dragRot = 0;
  private dragPitch = 0;
  private shadowScale = { x: 0.6, y: 0.45 };

  constructor(anchorGroup: THREE.Group) {
    this.root = anchorGroup;
    this.root.add(this.content);
    this.root.add(this.shadow);
    this.content.visible = false;
    this.shadow.visible = false;
  }

  /** Place the experience at a menu-UV anchor point (content builds below it in local Z). */
  anchorAt(localPos: { x: number; y: number; z: number }) {
    this.basePos.set(localPos.x, localPos.y, localPos.z);
    this.content.position.copy(this.basePos);
    this.shadow.position.set(localPos.x, localPos.y, 0.012);
  }

  async show(dish: Dish) {
    if (this.status !== 'gone') return;
    this.status = 'loading';
    const featured = dish.featured === true;
    let tex: THREE.Texture | null = null;
    const cached = cachedCutout(dish);
    if (cached) {
      tex = await cached;
    }
    if (this.status !== 'loading') return; // cancelled while loading

    this.clearAssets();

    if (tex) {
      const img = tex.image as { width: number; height: number };
      const aspect = img.width / img.height;
      // Big and unmissable: ~62% of the tracked menu width for the featured
      // dish, ~44% for the placeholder dishes.
      const w = featured ? 0.62 : 0.44;
      const h = w / aspect;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
      this.foodMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    } else {
      // pure fallback: soft cream disc
      this.foodMesh = new THREE.Mesh(
        new THREE.CircleGeometry(0.2, 32),
        new THREE.MeshBasicMaterial({ color: 0xf5efe2, transparent: true, opacity: 0.95, depthWrite: false })
      );
    }
    this.foodMesh.position.z = 0.12;
    this.foodMesh.renderOrder = 10; // food always draws above shadow
    this.content.add(this.foodMesh);

    this.shadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false })
    );
    this.shadowScale = featured ? { x: 0.95, y: 0.6 } : { x: 0.62, y: 0.42 };
    this.shadowMesh.scale.set(this.shadowScale.x, this.shadowScale.y, 1);
    this.shadow.add(this.shadowMesh);

    this.nameSprite = makeNameSprite(dish.name);
    const labelW = featured ? 0.52 : 0.4;
    this.nameSprite.scale.set(labelW, (labelW * 120) / 512, 1);
    const hLabel = this.foodMesh.geometry as THREE.PlaneGeometry;
    const halfH = ((hLabel.parameters?.height) ?? 0.3) / 2;
    this.nameSprite.position.set(0, -halfH - 0.075, 0.12);
    this.content.add(this.nameSprite);

    this.content.visible = true;
    this.shadow.visible = true;
    this.status = 'entering';
    this.t = 0;
    this.phaseT = 0;
    this.dragRot = 0;
    this.dragPitch = 0;
    this.floatSeed = Math.random() * Math.PI * 2;
  }

  /** Stop everything and remove content from the scene graph. */
  clearAssets() {
    this.content.visible = false;
    this.shadow.visible = false;
    const disposeTree = (obj: THREE.Object3D | null) => {
      if (!obj) return;
      obj.traverse((o: THREE.Object3D) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = (mesh as THREE.Mesh).material as THREE.Material | undefined;
        if (mat) mat.dispose();
      });
      obj.clear();
    };
    disposeTree(this.content);
    disposeTree(this.shadow);
    this.foodMesh = null;
    this.shadowMesh = null;
    this.nameSprite = null;
    this.status = 'gone';
  }

  beginExit() {
    if (this.status === 'entering' || this.status === 'idle') {
      this.status = 'exiting';
      this.phaseT = 0;
    }
  }

  /** Drag-to-turn interaction (deltas from pointer events, css px). */
  onDrag(dx: number, dy: number) {
    this.dragActive = true;
    this.dragRot = THREE.MathUtils.clamp(this.dragRot - dx * 0.01, -0.7, 0.7);
    this.dragPitch = THREE.MathUtils.clamp(this.dragPitch + dy * 0.005, -0.3, 0.3);
  }

  /** release → ease the manual rotation back to 0 */
  onDragEnd() {
    this.dragActive = false;
  }

  private dragActive = false;

  getStatus(): ContentStatus {
    return this.status;
  }

  update(dt: number) {
    this.t += dt;
    if (this.status === 'gone' || this.status === 'loading') return;

    if (this.status === 'entering') {
      this.phaseT += dt;
      const k = Math.min(this.phaseT / 0.55, 1);
      const e = 1 - Math.pow(1 - k, 3);
      const overshoot = 1 + 0.12 * Math.sin(Math.min(k, 1) * Math.PI);
      this.content.scale.setScalar(Math.max(0.001, e * overshoot));
      this.content.position.z = 0.02 + (this.basePos.z - 0.02) * e;
      if (k >= 1) {
        this.content.scale.setScalar(1);
        this.status = 'idle';
      }
    } else if (this.status === 'exiting') {
      this.phaseT += dt;
      const k = Math.min(this.phaseT / 0.3, 1);
      const e = 1 - k;
      this.content.scale.setScalar(Math.max(0.001, e));
      this.content.position.z = 0.02 + (this.basePos.z - 0.02) * e;
      if (this.shadowMesh) {
        (this.shadowMesh.material as THREE.MeshBasicMaterial).opacity = 1 - k;
      }
      if (this.foodMesh) (this.foodMesh.material as THREE.MeshBasicMaterial).opacity = e;
      if (this.nameSprite) (this.nameSprite.material as THREE.SpriteMaterial).opacity = e;
      if (k >= 1) {
        this.clearAssets();
      }
      return;
    }

    if (!this.content.visible) return;

    // idle: gentle bob above the menu + slow sway, drag adds manual turn
    if (!this.dragActive) {
      this.dragRot *= 0.92;
      this.dragPitch *= 0.9;
    }
    const bob = Math.sin((this.t * 1.9) + this.floatSeed) * 0.014 + Math.sin((this.t * 3.1) + this.floatSeed * 2) * 0.004;
    this.content.position.z = this.basePos.z + 0.06 + bob;
    const swing = Math.sin(this.t * 0.85) * 0.1;
    this.content.rotation.z = swing + this.dragRot;
    this.content.rotation.x = this.dragPitch;
    // shadow breathes opposite to the bob
    const lift = 0.6 + 0.4 * (1 - (bob + 0.018) / 0.036);
    if (this.shadowMesh) {
      this.shadowMesh.scale.set(this.shadowScale.x * lift, this.shadowScale.y * lift, 1);
      (this.shadowMesh.material as THREE.MeshBasicMaterial).opacity = Math.min(1, 0.85 * lift);
    }
  }
}

