import { Component, ElementRef, ViewChild, inject, afterNextRender, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { StoreService } from '../services/store.service';

@Component({
  selector: 'app-three-bg',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      #canvasContainer 
      class="fixed inset-0 z-[-1] pointer-events-none transition-opacity duration-1000 bg-[var(--bg-main)]"
      [style.opacity]="store.enable3D() ? store.glowIntensity() : 0"
    >
      <!-- CSS SVG Noise Overlay applied directly on top of the WebGL canvas -->
      <div class="absolute inset-0 pointer-events-none mix-blend-overlay opacity-5 flex items-center justify-center">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width: 100vw; height: 100vh;">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
        </svg>
      </div>
    </div>
  `
})
export class ThreeBackgroundComponent implements OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;

  public store = inject(StoreService);
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private renderer!: THREE.WebGLRenderer;
  private material!: THREE.ShaderMaterial;
  private animationFrameId: number | null = null;
  private startTime = Date.now();

  private mouseX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
  private mouseY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;
  private currentX = this.mouseX;
  private currentY = this.mouseY;

  constructor() {
    afterNextRender(() => {
      this.initImmersiveShader();
    });
  }

  private initImmersiveShader() {
    const container = this.canvasContainer.nativeElement;

    this.scene = new THREE.Scene();
    
    // Orthographic camera for full screen 2D render
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Optimize pixel ratio
    container.insertBefore(this.renderer.domElement, container.firstChild);

    // Full screen plane geometry
    const geometry = new THREE.PlaneGeometry(2, 2);

    // Advanced Awwwards-level Fluid Light Shader
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uSpeed: { value: this.store.animationSpeed() },
        uBgMain: { value: new THREE.Color('#0B0F1A') },      // --bg-main
        uBgSec: { value: new THREE.Color('#121826') },       // --bg-secondary
        uAccentMain: { value: new THREE.Color('#6C8CFF') },  // --accent-main
        uAccentGlow: { value: new THREE.Color('#8A6CFF') },  // --accent-glow
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform float uSpeed;
        
        uniform vec3 uBgMain;
        uniform vec3 uBgSec;
        uniform vec3 uAccentMain;
        uniform vec3 uAccentGlow;

        varying vec2 vUv;

        // Simplex 2D noise
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v){
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod(i, 289.0);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m ;
          m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          // Normalize coordinates and account for aspect ratio
          vec2 uv = gl_FragCoord.xy / uResolution.xy;
          vec2 p = uv;
          p.x *= uResolution.x / uResolution.y;
          
          vec2 mouse = uMouse;
          mouse.x *= uResolution.x / uResolution.y;

          // Cinematic, slow, sweeping fluid noise fields
          float n1 = snoise(p * 1.2 + uTime * 0.05 * uSpeed);
          float n2 = snoise(p * 0.8 - uTime * 0.03 * uSpeed + mouse * 0.2);
          float n3 = snoise(p * 2.5 + vec2(sin(uTime * 0.04), cos(uTime * 0.03)) * uSpeed);

          // Base darkness with subtle secondary shifts
          vec3 color = mix(uBgMain, uBgSec, n1 * 0.5 + 0.5);

          // Add glowing cinematic light blooms
          float glow1 = smoothstep(0.1, 0.9, n2 * 0.5 + 0.5);
          float glow2 = smoothstep(0.4, 0.8, n3 * n1);

          // Mouse interaction light source
          float distToMouse = distance(p, mouse);
          float mouseGlow = exp(-distToMouse * 2.5) * 0.8;
          
          // Composite the Tesla glowing accents seamlessly into the bg
          color = mix(color, uAccentMain, glow1 * 0.25);
          color = mix(color, uAccentGlow, glow2 * 0.20 + mouseGlow * 0.35);

          // Subtle vignette for cinematic depth
          float vignette = length(uv - vec2(0.5));
          color *= 1.0 - vignette * 0.6;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: true
    });

    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);

    this.setupEventListeners();
    this.animate();
  }

  private setupEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this), { passive: true });
  }

  private onWindowResize() {
    if (!this.renderer) return;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.material.uniforms['uResolution'].value.set(window.innerWidth, window.innerHeight);
  }

  private onMouseMove(event: MouseEvent) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    if (!this.store.enable3D()) return; 

    // Smooth mouse coordinates interpolation
    this.currentX += (this.mouseX - this.currentX) * 0.05;
    this.currentY += (this.mouseY - this.currentY) * 0.05;

    const elapsedTime = (Date.now() - this.startTime) / 1000;
    this.material.uniforms['uTime'].value = elapsedTime;
    this.material.uniforms['uSpeed'].value = this.store.animationSpeed();
    
    // Normalized Mouse coordinates
    this.material.uniforms['uMouse'].value.set(
      this.currentX / window.innerWidth,
      1.0 - (this.currentY / window.innerHeight)
    );

    this.renderer.render(this.scene, this.camera);
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      window.removeEventListener('resize', this.onWindowResize.bind(this));
      window.removeEventListener('mousemove', this.onMouseMove.bind(this));
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      const container = this.canvasContainer.nativeElement;
      if (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
  }
}
