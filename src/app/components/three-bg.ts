import { Component, ElementRef, ViewChild, inject, afterNextRender, ChangeDetectionStrategy, OnDestroy, signal } from '@angular/core';
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
      class="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000"
      [style.opacity]="store.enable3D() ? store.glowIntensity() : 0"
      aria-hidden="true"
    >
      @if (useStaticFallback()) {
        <div class="absolute inset-0 three-static-bg"></div>
      }
      @if (!isMobile()) {
        <div class="absolute inset-0 pointer-events-none mix-blend-overlay opacity-5 flex items-center justify-center">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width: 100vw; height: 100vh;">
            <filter id="noiseFilter">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
          </svg>
        </div>
      }
    </div>
  `,
  styles: [`
    .three-static-bg {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 20% 10%, rgba(108, 140, 255, 0.22), transparent 55%),
        radial-gradient(ellipse 70% 50% at 85% 20%, rgba(138, 108, 255, 0.16), transparent 50%),
        radial-gradient(ellipse 60% 40% at 60% 90%, rgba(108, 140, 255, 0.10), transparent 55%),
        linear-gradient(160deg, #0B0F1A 0%, #121826 45%, #0B0F1A 100%);
    }
  `]
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

  private targetFPS = 60;
  private lastFrameTime = 0;
  isMobile = signal(false);
  useStaticFallback = signal(false);

  private boundResize = () => this.onWindowResize();
  private boundMouseMove = (e: MouseEvent) => this.onMouseMove(e);
  private boundVisibility = () => this.onVisibilityChange();

  constructor() {
    afterNextRender(() => {
      const narrow = window.matchMedia('(max-width: 767px)').matches;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const touchPrimary = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
      const mobile = narrow || touchPrimary || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      this.isMobile.set(mobile);

      // Mobile/tablet: same brand look via CSS — no continuous WebGL (major perf win)
      if (mobile || reduceMotion) {
        this.useStaticFallback.set(true);
        return;
      }

      this.targetFPS = 45;
      this.initImmersiveShader();
      document.addEventListener('visibilitychange', this.boundVisibility);
    });
  }

  private onVisibilityChange() {
    if (document.hidden) {
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    } else if (!this.animationFrameId && this.renderer) {
      this.animate();
    }
  }

  private initImmersiveShader() {
    const container = this.canvasContainer.nativeElement;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: false,
      powerPreference: 'high-performance' 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25)); 
    container.insertBefore(this.renderer.domElement, container.firstChild);

    const geometry = new THREE.PlaneGeometry(2, 2);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uSpeed: { value: this.store.animationSpeed() },
        uBgMain: { value: new THREE.Color('#0B0F1A') },
        uBgSec: { value: new THREE.Color('#121826') },
        uAccentMain: { value: new THREE.Color('#6C8CFF') },
        uAccentGlow: { value: new THREE.Color('#8A6CFF') },
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
          vec2 uv = gl_FragCoord.xy / uResolution.xy;
          vec2 p = uv;
          p.x *= uResolution.x / uResolution.y;
          
          vec2 mouse = uMouse;
          mouse.x *= uResolution.x / uResolution.y;

          float n1 = snoise(p * 1.2 + uTime * 0.05 * uSpeed);
          float n2 = snoise(p * 0.8 - uTime * 0.03 * uSpeed + mouse * 0.2);
          float n3 = snoise(p * 2.5 + vec2(sin(uTime * 0.04), cos(uTime * 0.03)) * uSpeed);

          vec3 color = mix(uBgMain, uBgSec, n1 * 0.5 + 0.5);

          float glow1 = smoothstep(0.1, 0.9, n2 * 0.5 + 0.5);
          float glow2 = smoothstep(0.4, 0.8, n3 * n1);

          float distToMouse = distance(p, mouse);
          float mouseGlow = exp(-distToMouse * 2.5) * 0.8;
          
          color = mix(color, uAccentMain, glow1 * 0.25);
          color = mix(color, uAccentGlow, glow2 * 0.20 + mouseGlow * 0.35);

          float vignette = length(uv - vec2(0.5));
          color *= 1.0 - vignette * 0.6;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: true
    });

    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);

    window.addEventListener('resize', this.boundResize);
    window.addEventListener('mousemove', this.boundMouseMove, { passive: true });
    this.animate();
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
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    if (!this.store.enable3D()) return; 

    const now = Date.now();
    const elapsed = now - this.lastFrameTime;
    if (elapsed < (1000 / this.targetFPS)) return;
    this.lastFrameTime = now;

    this.currentX += (this.mouseX - this.currentX) * 0.05;
    this.currentY += (this.mouseY - this.currentY) * 0.05;

    const elapsedTime = (Date.now() - this.startTime) / 1000;
    this.material.uniforms['uTime'].value = elapsedTime;
    this.material.uniforms['uSpeed'].value = this.store.animationSpeed();
    
    this.material.uniforms['uMouse'].value.set(
      this.currentX / window.innerWidth,
      1.0 - (this.currentY / window.innerHeight)
    );

    this.renderer.render(this.scene, this.camera);
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      window.removeEventListener('resize', this.boundResize);
      window.removeEventListener('mousemove', this.boundMouseMove);
      document.removeEventListener('visibilitychange', this.boundVisibility);
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      this.material?.dispose();
      const container = this.canvasContainer?.nativeElement;
      if (container?.contains(this.renderer.domElement)) {
        container.removeChild(this.renderer.domElement);
      }
    }
  }
}
