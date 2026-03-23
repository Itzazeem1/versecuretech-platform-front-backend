import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { StoreService } from './store.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket?: Socket;
  private platformId = inject(PLATFORM_ID);
  private store = inject(StoreService);

  init() {
    if (isPlatformBrowser(this.platformId)) {
      this.socket = io();

      this.socket.on('connect', () => {
        console.log('Connected to Cinematic Engine Backend');
      });

      this.socket.on('liveUserCount', (count: number) => {
        this.store.setLiveUserCount(count);
      });

      // Admin specific events could be added here
      this.socket.on('globalStateUpdate', (state: Record<string, unknown>) => {
        if (typeof state['animationSpeed'] === 'number') this.store.setAnimationSpeed(state['animationSpeed']);
        if (typeof state['glowIntensity'] === 'number') this.store.setGlowIntensity(state['glowIntensity']);
        if (typeof state['enable3D'] === 'boolean') {
           if (state['enable3D'] !== this.store.enable3D()) this.store.toggle3D();
        }
        if (typeof state['enableAnimations'] === 'boolean') {
           if (state['enableAnimations'] !== this.store.enableAnimations()) this.store.toggleAnimations();
        }
      });
    }
  }

  // Admin methods
  updateGlobalState(state: Record<string, unknown>) {
    if (this.socket && this.store.isAdmin()) {
      this.socket.emit('adminUpdateState', state);
    }
  }
}
