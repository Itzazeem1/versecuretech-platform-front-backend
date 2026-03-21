import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
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
      this.socket.on('globalStateUpdate', (state: any) => {
        if (state.animationSpeed !== undefined) this.store.setAnimationSpeed(state.animationSpeed);
        if (state.glowIntensity !== undefined) this.store.setGlowIntensity(state.glowIntensity);
        if (state.enable3D !== undefined) {
           if (state.enable3D !== this.store.enable3D()) this.store.toggle3D();
        }
        if (state.enableAnimations !== undefined) {
           if (state.enableAnimations !== this.store.enableAnimations()) this.store.toggleAnimations();
        }
      });
    }
  }

  // Admin methods
  updateGlobalState(state: any) {
    if (this.socket && this.store.isAdmin()) {
      this.socket.emit('adminUpdateState', state);
    }
  }
}
