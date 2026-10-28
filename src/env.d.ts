declare module 'mind-ar/dist/mindar-image-three.prod.js' {
  export class MindARThree {
    constructor(options: Record<string, unknown>);
    start(): Promise<void>;
    stop(): void;
    camera: import('three').PerspectiveCamera;
    scene: import('three').Scene;
    renderer: import('three').WebGLRenderer;
    addAnchor(targetIndex: number): {
      group: import('three').Group;
      onTargetFound: (() => void) | null;
      onTargetLost: (() => void) | null;
    };
    controller: { markerDimensions: number[][] };
  }
}
