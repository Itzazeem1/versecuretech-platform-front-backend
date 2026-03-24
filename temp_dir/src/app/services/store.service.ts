import { Injectable, signal, computed } from '@angular/core';

export interface AdminUser {
  email: string;
  isAuthenticated: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  // Cinematic Engine Toggles
  readonly animationSpeed = signal<number>(1.0); // 1.0 = normal, 0.5 = slow, 2.0 = fast
  readonly glowIntensity = signal<number>(1.0);
  readonly enable3D = signal<boolean>(true);
  readonly enableAnimations = signal<boolean>(true);

  // System States
  readonly sceneState = signal<'loading' | 'intro' | 'active' | 'interaction'>('loading');
  readonly liveUserCount = signal<number>(1);
  
  // Auth State
  readonly adminUser = signal<AdminUser | null>(null);

  // Derived
  readonly isAdmin = computed(() => !!this.adminUser()?.isAuthenticated);

  // Actions
  setAnimationSpeed(speed: number) { this.animationSpeed.set(speed); }
  setGlowIntensity(intensity: number) { this.glowIntensity.set(intensity); }
  toggle3D() { this.enable3D.update(v => !v); }
  toggleAnimations() { this.enableAnimations.update(v => !v); }
  setSceneState(state: 'loading' | 'intro' | 'active' | 'interaction') { this.sceneState.set(state); }
  setLiveUserCount(count: number) { this.liveUserCount.set(count); }
  
  loginAdmin(email: string) {
    if (email === 'azeem.makhdum6@gmail.com' || email === 'abbas585@gmail.com') {
      this.adminUser.set({ email, isAuthenticated: true });
      return true;
    }
    return false;
  }

  logoutAdmin() {
    this.adminUser.set(null);
  }
}
