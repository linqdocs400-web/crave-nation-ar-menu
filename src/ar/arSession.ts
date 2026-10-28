/// <reference types="vite/client" />
import * as THREE from 'three';
import { menuAspect, menuUvToLocal, rayToMenuUv } from './coords';
import { IMAGE_PATHS } from '../data/menu';

/**
 * Wraps MindAR image tracking + the three.js scene for the Crave Nation menu.
 *
 * Everything that touches MindAR's internal coordinate conventions goes
 * through helpers in coords.ts, so tap mapping and AR placement stay
 * consistent and testable.
 */

export type TrackingState = 'starting' | 'camera-denied' | 'unsupported' | 'failed' | 'searching' | 'found';

export interface ArSessionOptions {
  container: HTMLElement;
  onStateChange: (state: TrackingState) => void;
}

interface MindARThreeLike {
  start(): Promise<void>;
  stop(): void;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  addAnchor(targetIndex: number): { group: THREE.Group; onTargetFound: (() => void) | null; onTargetLost: (() => void) | null };
  controller: { markerDimensions: number[][] };
}

let mindarModule: { MindARThree: new (opts: Record<string, unknown>) => MindARThreeLike } | null = null;

export class ArSession {
  private container: HTMLElement;
  private onStateChange: (s: TrackingState) => void;
  private mindar: MindARThreeLike | null = null;
  private anchorGroup: THREE.Group | null = null;
  private menuPlane: THREE.Mesh | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private dims: [number, number] = [679, 1020];
  private running = false;
  private renderLoop = 0;
  private ticker: ((dt: number) => void) | null = null;

  constructor(opts: ArSessionOptions) {
    this.container = opts.container;
    this.onStateChange = opts.onStateChange;
  }

  get aspect(): number {
    return menuAspect(this.dims[0], this.dims[1]);
  }

  async start(): Promise<'full' | 'demo'> {
    const mediaOk =
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices != null &&
      typeof navigator.mediaDevices.getUserMedia === 'function';
    if (!mediaOk) {
      this.onStateChange('unsupported');
      return 'demo';
    }

    // Verify the compiled tracking target is present; otherwise fall back to
    // demo mode with a visible indicator (set up by the UI layer).
    try {
      const res = await fetch(IMAGE_PATHS.target, { method: 'HEAD' });
      if (!res.ok) throw new Error(`target unavailable (${res.status})`);
    } catch {
      this.onStateChange('failed');
      return 'demo';
    }

    this.onStateChange('starting');
    let mindar: { MindARThree: new (opts: Record<string, unknown>) => MindARThreeLike } | null = null;
    if (!mindarModule) {
      mindarModule = (await import('mind-ar/dist/mindar-image-three.prod.js')) as unknown as typeof mindarModule;
    }
    mindar = mindarModule;
    if (!mindar) return 'demo';

    try {
      const mindarThree = new mindar.MindARThree({
        container: this.container,
        imageTargetSrc: IMAGE_PATHS.target,
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no',
        maxTrack: 1,
      });
      this.mindar = mindarThree;
      const anchor = mindarThree.addAnchor(0);
      anchor.onTargetFound = () => this.onStateChange('found');
      anchor.onTargetLost = () => this.onStateChange('searching');
      this.anchorGroup = anchor.group;
      await mindarThree.start();

      const dims = mindarThree.controller?.markerDimensions?.[0];
      if (dims && dims.length === 2) this.dims = [dims[0], dims[1]];

      // Full-menu plane: used for tap→menu-coordinate raycasting and for the
      // calibration ghost preview. Invisible during normal tracking
      // (raycasting ignores Object3D.visible in three.js).
      const planeGeo = new THREE.PlaneGeometry(1, this.aspect);
      const planeMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.999, visible: true });
      await new Promise<void>((resolve) => {
        new THREE.TextureLoader().load(IMAGE_PATHS.menu, (tex: THREE.Texture) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          planeMat.map = tex;
          planeMat.needsUpdate = true;
          resolve();
        });
      });
      this.menuPlane = new THREE.Mesh(planeGeo, planeMat);
      this.menuPlane.visible = false; // raycastable but not rendered
      this.anchorGroup.add(this.menuPlane);

      this.running = true;
      this.lastTime = 0;
      this.renderer = mindarThree.renderer;
      this.renderLoop = requestAnimationFrame(this.tick);
      this.onStateChange('searching');
      return 'full';
    } catch (err) {
      console.error('[arSession] failed to start', err);
      const name = (err as { name?: string })?.name ?? '';
      if (name === 'NotAllowedError') this.onStateChange('camera-denied');
      else this.onStateChange('failed');
      return 'demo';
    }
  }

  private tick = (now: number) => {
    if (!this.running) return;
    const last = this.lastTime;
    this.lastTime = now;
    const dt = last === 0 ? 0 : Math.min((now - last) / 1000, 0.05);
    this.ticker?.(dt);
    // MindAR only manages tracking; rendering the three.js scene is ours.
    const m = this.mindar!;
    if (m.camera) m.camera.updateMatrixWorld();
    if (this.renderer) this.renderer.render(m.scene, m.camera);
    this.renderLoop = requestAnimationFrame(this.tick);
  };
  private lastTime = 0;

  setTicker(t: (dt: number) => void) {
    this.ticker = t;
  }

  /**
   * Calibration flag: when enabled, the ghost menu preview (and the tap
   * mapping together with it) is flipped vertically so that the previewed
   * menu photo aligns with the physical printed menu. This is persisted by
   * the AR screen and applied consistently everywhere.
   */
  private flipV = false;

  setFlipV(flip: boolean) {
    this.flipV = flip;
    this.flipGhostTexture(flip);
  }

  getFlipV(): boolean {
    return this.flipV;
  }

  private applyFlip({ u, v }: { u: number; v: number }): { u: number; v: number } {
    return this.flipV ? { u, v: 1 - v } : { u, v };
  }

  /** Render the menu ghost preview for calibration (or hide it). */
  showGhost(show: boolean) {
    if (this.menuPlane) this.menuPlane.visible = show;
  }

  flipGhostTexture(flip: boolean) {
    const tex = this.menuPlane?.material as THREE.MeshBasicMaterial | undefined;
    const map = tex?.map;
    if (!map) return;
    map.center.set(0.5, 0.5);
    map.matrixAutoUpdate = true;
    map.repeat.set(1, flip ? -1 : 1);
    map.offset.set(0, flip ? 1 : 0);
    map.needsUpdate = true;
  }

  /**
   * Convert a container-relative tap point to menu UV (v measured from the
   * top of the printed menu). Returns null if the ray misses the menu plane.
   */
  tapToMenuUv(clientX: number, clientY: number): { u: number; v: number } | null {
    if (!this.anchorGroup || !this.mindar) return null;
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -(((clientY - rect.top) / rect.height) * 2 - 1)
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, this.mindar.camera);
    this.anchorGroup.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(this.anchorGroup.matrixWorld).invert();
    const el = inv.elements;
    const uv = rayToMenuUv(
      [raycaster.ray.origin.x, raycaster.ray.origin.y, raycaster.ray.origin.z],
      [raycaster.ray.direction.x, raycaster.ray.direction.y, raycaster.ray.direction.z],
      el,
      this.aspect
    );
    return uv ? this.applyFlip(uv) : null;
  }

  /** menu UV → anchor-local point (flip-aware). */
  menuUvToLocalPoint(u: number, v: number): { x: number; y: number; z: number } {
    const p = this.applyFlip({ u, v });
    return menuUvToLocal(p, this.aspect);
  }

  /** Project a menu UV point (v from top) to container-relative screen pixels. */
  menuUvToScreen(u: number, v: number): { x: number; y: number } | null {
    if (!this.anchorGroup || !this.mindar) return null;
    this.anchorGroup.updateMatrixWorld(true);
    const local = this.menuUvToLocalPoint(u, v);
    const world = new THREE.Vector3(local.x, local.y, local.z).applyMatrix4(this.anchorGroup.matrixWorld);
    const ndc = world.clone().project(this.mindar.camera);
    const rect = this.container.getBoundingClientRect();
    return {
      x: (ndc.x / 2 + 0.5) * rect.width,
      y: (-ndc.y / 2 + 0.5) * rect.height,
    };
  }

  /** The anchor group that AR dish content should be added to. */
  get contentRoot(): THREE.Group | null {
    return this.anchorGroup;
  }

  async stop() {
    this.running = false;
    cancelAnimationFrame(this.renderLoop);
    this.lastTime = 0;
    try {
      this.mindar?.stop();
    } catch {
      /* ignore */
    }
    this.container.innerHTML = '';
    this.mindar = null;
    this.anchorGroup = null;
    this.menuPlane = null;
    this.renderer = null;
  }
}
