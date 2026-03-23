import { Component, signal, inject, afterNextRender, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../services/store.service';
import { SupabaseService } from '../services/supabase.service';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import { ThreeBackgroundComponent } from '../components/three-bg';
import gsap from 'gsap';

@Component({
  selector: 'app-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, ThreeBackgroundComponent],
  template: `
    <app-three-bg></app-three-bg>
    <app-header></app-header>
    
    <div class="min-h-screen pt-40 pb-20 text-[var(--text-primary)] flex flex-col items-center justify-center p-6 relative z-10">
      
      @if (!supabase.isAdmin()) {
        <div class="w-full max-w-md glass-panel p-10 rounded-[2rem] border border-[var(--text-primary)]/10 relative overflow-hidden glow-hover">
          <div class="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-main)] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
          
          <div class="text-center mb-10 relative z-10">
            <h1 class="text-3xl font-display font-medium mb-2">Supabase Auth</h1>
            <p class="text-[var(--text-muted)] text-sm">Secure admin gateway</p>
          </div>

          @if (supabase.isLoggedIn() && !supabase.isAdmin()) {
            <div class="text-center py-8 relative z-10">
              <span class="material-icons text-5xl text-red-500 mb-4">gavel</span>
              <h2 class="text-xl font-bold mb-2">Access Denied</h2>
              <p class="text-sm text-[var(--text-muted)] mb-6">Your account does not have administrator privileges.</p>
              <button (click)="logout()" class="w-full py-3 rounded-xl border border-[var(--text-primary)]/20 hover:bg-[var(--text-primary)]/10 transition-colors text-xs font-bold uppercase tracking-widest">
                Sign Out
              </button>
            </div>
          } @else {
            <form (ngSubmit)="loginWithEmail()" class="relative z-10 flex flex-col gap-6">
              <div>
                <label for="admin-email" class="block text-xs uppercase tracking-widest font-mono text-[var(--text-muted)] mb-2">Admin Email</label>
                <input id="admin-email" type="email" [ngModel]="email()" (ngModelChange)="email.set($event)" name="email" required class="w-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)] transition-colors" placeholder="Admin email">
              </div>
              <div>
                <label for="admin-password" class="block text-xs uppercase tracking-widest font-mono text-[var(--text-muted)] mb-2">Password</label>
                <input id="admin-password" type="password" [ngModel]="password()" (ngModelChange)="password.set($event)" name="password" required class="w-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)] transition-colors" placeholder="••••••••">
              </div>
              
              <button type="submit" [disabled]="loading()" class="w-full py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] font-bold tracking-widest uppercase text-xs hover:bg-[var(--accent-main)] transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                {{ loading() ? 'Authenticating...' : 'Sign In with Email' }}
              </button>
              
              <div class="flex items-center gap-4 my-2">
                <div class="h-px bg-[var(--text-primary)]/10 flex-1"></div>
                <span class="text-xs text-[var(--text-muted)] uppercase tracking-widest">OR</span>
                <div class="h-px bg-[var(--text-primary)]/10 flex-1"></div>
              </div>

              <div class="flex gap-4">
                <button type="button" (click)="loginWithGoogle()" class="flex-1 py-3 rounded-xl border border-[var(--text-primary)]/10 hover:border-[var(--text-primary)]/30 hover:bg-[var(--bg-secondary)] transition-all flex justify-center items-center gap-2">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="w-5 h-5">
                  <span class="text-xs font-bold tracking-wider">Google</span>
                </button>
                <button type="button" (click)="loginWithGithub()" class="flex-1 py-3 rounded-xl border border-[var(--text-primary)]/10 hover:border-[var(--text-primary)]/30 hover:bg-[var(--bg-secondary)] transition-all flex justify-center items-center gap-2">
                  <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" class="w-5 h-5 invert">
                  <span class="text-xs font-bold tracking-wider">GitHub</span>
                </button>
              </div>

              @if (error()) {
                <p class="text-red-400 text-sm mt-2 text-center font-light">{{ error() }}</p>
              }
            </form>
          }
        </div>
      } @else {
        <!-- Dashboard -->
        <div class="w-full max-w-7xl relative z-10 admin-dashboard-anim">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <h2 class="text-4xl font-display font-medium mb-2">Command Center</h2>
              <p class="text-[var(--text-muted)] text-sm font-mono flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 
                {{ supabase.isConnected() ? 'Supabase Connected' : 'Connecting to DB...' }}
              </p>
            </div>
            <button (click)="logout()" class="px-6 py-2 rounded-full border border-[var(--text-primary)]/20 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-all text-xs uppercase tracking-widest font-mono">
              Disconnect
            </button>
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <!-- Left Panel: Graphic Content Form CMS -->
            <div class="lg:col-span-8 flex flex-col gap-8">
              <div class="glass-panel p-8 rounded-[2rem] border border-[var(--text-primary)]/10 flex flex-col h-full overflow-hidden">
                <div class="flex items-center justify-between mb-10 border-b border-[var(--text-primary)]/5 pb-6">
                  <div class="flex items-center gap-3">
                    <span class="material-icons text-[var(--accent-main)]">web</span>
                    <h3 class="font-medium text-xl">Graphical Page Builder</h3>
                  </div>
                  
                  <select [ngModel]="selectedSection()" (ngModelChange)="loadSection($event)" class="bg-[var(--bg-secondary)] border border-[var(--text-primary)]/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent-main)] text-[var(--text-primary)]">
                    <option value="home">Home Page</option>
                    <option value="about">About Page</option>
                  </select>
                </div>
                
                <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  
                  @if (selectedSection() === 'home') {
                    <!-- Home Form Fields -->
                     <div class="space-y-8">
                       <!-- Hero Group -->
                       <div class="bg-[var(--bg-main)]/50 p-6 rounded-2xl border border-[var(--text-primary)]/5">
                          <h4 class="text-[var(--accent-main)] text-sm font-bold uppercase tracking-widest mb-4">Hero Configuration</h4>
                          <div class="space-y-4">
                             <div>
                               <label for="hero-title" class="block text-xs text-[var(--text-muted)] mb-2">Primary Title</label>
                               <input id="hero-title" type="text" [(ngModel)]="pageData().heroTitle" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-2xl font-display focus:border-[var(--accent-main)] outline-none" />
                             </div>
                             <div>
                               <label for="hero-subtitle" class="block text-xs text-[var(--text-muted)] mb-2">Subtitle Tagline</label>
                               <input id="hero-subtitle" type="text" [(ngModel)]="pageData().heroSubtitle" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-sm focus:border-[var(--accent-main)] outline-none" />
                             </div>
                          </div>
                       </div>

                       <!-- Philosophy Group -->
                       <div class="bg-[var(--bg-main)]/50 p-6 rounded-2xl border border-[var(--text-primary)]/5">
                          <h4 class="text-[var(--accent-main)] text-sm font-bold uppercase tracking-widest mb-4">Philosophy Section</h4>
                          <div class="space-y-4">
                             <div>
                               <label for="philosophy-title" class="block text-xs text-[var(--text-muted)] mb-2">Philosophy Title</label>
                               <input id="philosophy-title" type="text" [(ngModel)]="pageData().philosophyTitle" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-xl font-display focus:border-[var(--accent-main)] outline-none" />
                             </div>
                             <div>
                               <label for="philosophy-body" class="block text-xs text-[var(--text-muted)] mb-2">Philosophy Body</label>
                               <textarea id="philosophy-body" [(ngModel)]="pageData().philosophyBody" class="w-full bg-transparent border border-[var(--text-primary)]/20 rounded-lg p-4 py-2 text-sm focus:border-[var(--accent-main)] outline-none min-h-[120px] resize-none"></textarea>
                             </div>
                          </div>
                       </div>

                       <!-- Services Header Group -->
                       <div class="bg-[var(--bg-main)]/50 p-6 rounded-2xl border border-[var(--text-primary)]/5">
                          <h4 class="text-[var(--accent-main)] text-sm font-bold uppercase tracking-widest mb-4">Services Header</h4>
                          <div class="space-y-4">
                             <div>
                               <label for="services-title" class="block text-xs text-[var(--text-muted)] mb-2">Services Title</label>
                               <input id="services-title" type="text" [(ngModel)]="pageData().servicesTitle" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-xl font-display focus:border-[var(--accent-main)] outline-none" />
                             </div>
                             <div>
                               <label for="services-subtitle" class="block text-xs text-[var(--text-muted)] mb-2">Services Subtitle</label>
                               <input id="services-subtitle" type="text" [(ngModel)]="pageData().servicesSubtitle" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-sm focus:border-[var(--accent-main)] outline-none" />
                             </div>
                          </div>
                       </div>

                       <!-- Dynamic Services Grid Array -->
                       <div class="bg-[var(--bg-main)]/50 p-6 rounded-2xl border border-[var(--text-primary)]/5">
                          <div class="flex justify-between items-center mb-6">
                            <h4 class="text-[var(--accent-main)] text-sm font-bold uppercase tracking-widest">Services Grid Integration</h4>
                            <button (click)="addServiceItem()" class="px-4 py-2 bg-[var(--text-primary)]/10 rounded-full hover:bg-[var(--text-primary)] hover:text-black transition-colors text-xs font-bold">+ Attach Service</button>
                          </div>
                          
                          <div class="space-y-6">
                            @for (svc of pageData().servicesList; track $index) {
                              <div class="relative bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--text-primary)]/10 group">
                                <button (click)="removeServiceItem($index)" class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500/20 text-red-500 border border-red-500/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span class="material-icons text-[16px]">close</span>
                                </button>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                     <label [for]="'svc-title-' + $index" class="block text-xs text-[var(--text-muted)] mb-2">Service Header ({{ $index + 1 }})</label>
                                     <input [id]="'svc-title-' + $index" type="text" [(ngModel)]="svc.title" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-xl font-display focus:border-[var(--accent-main)] outline-none" />
                                  </div>
                                  <div>
                                    <label [for]="'svc-category-' + $index" class="block text-xs text-[var(--text-muted)] mb-2">Category Badge</label>
                                    <input [id]="'svc-category-' + $index" type="text" [(ngModel)]="svc.category" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-sm focus:border-[var(--accent-main)] outline-none uppercase font-mono tracking-widest text-[var(--accent-main)]" />
                                  </div>
                                  <div class="md:col-span-2">
                                     <label [for]="'svc-desc-' + $index" class="block text-xs text-[var(--text-muted)] mb-2">Detailed Description</label>
                                     <textarea [id]="'svc-desc-' + $index" [(ngModel)]="svc.description" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-sm focus:border-[var(--accent-main)] outline-none min-h-[80px] resize-none"></textarea>
                                  </div>
                                </div>
                              </div>
                            } @empty {
                              <p class="text-sm text-[var(--text-muted)] text-center py-4">No services mapped yet. Click "Attach Service" to begin.</p>
                            }
                          </div>
                       </div>
                     </div>
                  } @else if (selectedSection() === 'about') {
                    <!-- About Form Fields -->
                    <div class="space-y-8">
                       <div class="bg-[var(--bg-main)]/50 p-6 rounded-2xl border border-[var(--text-primary)]/5">
                          <h4 class="text-[var(--accent-main)] text-sm font-bold uppercase tracking-widest mb-4">Hero Configuration</h4>
                          <div class="space-y-4">
                             <div>
                               <label for="about-hero-title" class="block text-xs text-[var(--text-muted)] mb-2">Hero Title</label>
                               <input id="about-hero-title" type="text" [(ngModel)]="pageData().heroTitle" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-2xl font-display focus:border-[var(--accent-main)] outline-none" />
                             </div>
                             <div>
                               <label for="about-hero-subtitle" class="block text-xs text-[var(--text-muted)] mb-2">Hero Subtitle</label>
                               <input id="about-hero-subtitle" type="text" [(ngModel)]="pageData().heroSubtitle" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-sm focus:border-[var(--accent-main)] outline-none" />
                             </div>
                          </div>
                       </div>

                       <div class="bg-[var(--bg-main)]/50 p-6 rounded-2xl border border-[var(--text-primary)]/5">
                          <h4 class="text-[var(--accent-main)] text-sm font-bold uppercase tracking-widest mb-4">Core Philosophy Header</h4>
                          <div class="space-y-4">
                             <div>
                               <label for="about-title" class="block text-xs text-[var(--text-muted)] mb-2">Title</label>
                               <input id="about-title" type="text" [(ngModel)]="pageData().title" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-2xl font-display focus:border-[var(--accent-main)] outline-none" />
                             </div>
                             <div>
                               <label for="about-content" class="block text-xs text-[var(--text-muted)] mb-2">Brand Identity Paragraph</label>
                               <textarea id="about-content" [(ngModel)]="pageData().content" class="w-full bg-transparent border border-[var(--text-primary)]/20 rounded-lg p-4 py-2 text-sm focus:border-[var(--accent-main)] outline-none min-h-[300px] resize-none"></textarea>
                             </div>
                          </div>
                       </div>
                    </div>
                  }
                  
                </div>
                
                <div class="flex items-center justify-between mt-8 pt-6 border-t border-[var(--text-primary)]/5">
                  <span class="text-xs text-[var(--text-muted)]"><span class="material-icons text-[14px] align-text-bottom text-green-400">cloud_done</span> Live sync to DB enabled</span>
                  <button (click)="saveContent()" [disabled]="saving()" class="tesla-btn px-10 py-4 rounded-full bg-[var(--accent-main)] text-[var(--bg-main)] font-bold text-sm uppercase tracking-widest inline-flex items-center gap-3 disabled:opacity-50">
                    <span class="material-icons text-[18px]">{{ saveSuccess() ? 'check' : 'cloud_upload' }}</span>
                    {{ saving() ? 'Syncing Pipeline...' : (saveSuccess() ? 'Sync Complete' : 'Deploy Configuration') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Right Panel: Visual Control & Settings -->
            <div class="lg:col-span-4 flex flex-col gap-8">
              
              <!-- Cinematic Engine -->
              <div class="glass-panel p-8 rounded-[2rem] border border-[var(--text-primary)]/10">
                <div class="flex items-center gap-3 mb-8">
                  <span class="material-icons text-[var(--accent-main)]">tune</span>
                  <h3 class="font-medium text-xl">Visual Engine</h3>
                </div>
                
                <div class="space-y-8">
                  <div>
                    <div class="flex justify-between text-xs font-mono tracking-widest uppercase mb-4 text-[var(--text-muted)]">
                      <span>Engine Speed</span>
                      <span class="text-[var(--text-primary)]">{{ store.animationSpeed() | number:'1.1-1' }}x</span>
                    </div>
                    <input type="range" min="0.1" max="3" step="0.1" [ngModel]="store.animationSpeed()" (ngModelChange)="updateVisuals('speed', $event)" class="w-full accent-[var(--accent-main)]">
                  </div>

                  <div>
                    <div class="flex justify-between text-xs font-mono tracking-widest uppercase mb-4 text-[var(--text-muted)]">
                      <span>Glow Bloom</span>
                      <span class="text-[var(--text-primary)]">{{ store.glowIntensity() | number:'1.1-1' }}</span>
                    </div>
                    <input type="range" min="0" max="2" step="0.1" [ngModel]="store.glowIntensity()" (ngModelChange)="updateVisuals('glow', $event)" class="w-full accent-[var(--accent-main)]">
                  </div>

                  <div class="flex justify-between items-center py-4 border-t border-[var(--text-primary)]/10">
                    <span class="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">Immersive Shaders</span>
                    <button (click)="toggleFeature('3d')" class="w-12 h-6 rounded-full relative transition-colors duration-300" [class.bg-[var(--accent-main)]]="store.enable3D()" [class.bg-[var(--bg-secondary)]]="!store.enable3D()">
                      <span class="absolute top-1 left-1 w-4 h-4 bg-[var(--text-primary)] rounded-full transition-transform duration-300" [class.translate-x-6]="store.enable3D()"></span>
                    </button>
                  </div>

                  <div class="flex justify-between items-center py-4 border-t border-[var(--text-primary)]/10">
                    <span class="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">Motion Physics</span>
                    <button (click)="toggleFeature('anim')" class="w-12 h-6 rounded-full relative transition-colors duration-300" [class.bg-[var(--accent-main)]]="store.enableAnimations()" [class.bg-[var(--bg-secondary)]]="!store.enableAnimations()">
                      <span class="absolute top-1 left-1 w-4 h-4 bg-[var(--text-primary)] rounded-full transition-transform duration-300" [class.translate-x-6]="store.enableAnimations()"></span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Media Status Widget -->
              <div class="glass-panel p-6 rounded-[2rem] border border-[var(--text-primary)]/10 text-center flex justify-center items-center flex-col min-h-[200px] relative overflow-hidden">
                <div class="absolute inset-0 bg-[url('/assets/images/abstract_violet_glass_1774035496290.png')] bg-cover bg-center opacity-20 pointer-events-none mix-blend-screen"></div>
                <span class="material-icons text-4xl text-green-400 mb-4 relative z-10">photo_library</span>
                <p class="text-xs text-[var(--text-muted)] uppercase font-mono tracking-widest relative z-10 block mb-2">Media Assets Deployed</p>
                <p class="text-[10px] text-[var(--text-primary)] relative z-10 opacity-70">Awwwards 3D Renders Online</p>
              </div>

              <!-- Security Settings -->
              <div class="glass-panel p-8 rounded-[2rem] border border-[var(--text-primary)]/10">
                <div class="flex items-center gap-3 mb-6">
                  <span class="material-icons text-[var(--accent-main)]">security</span>
                  <h3 class="font-medium text-xl">Security Settings</h3>
                </div>
                <div class="space-y-4">
                  <div>
                    <label for="new-password" class="block text-xs text-[var(--text-muted)] mb-2">Update Password</label>
                    <input id="new-password" type="password" [ngModel]="newPassword()" (ngModelChange)="newPassword.set($event)" class="w-full bg-transparent border border-[var(--text-primary)]/20 rounded-lg px-4 py-3 text-sm focus:border-[var(--accent-main)] outline-none" placeholder="Enter new password" />
                  </div>
                  <button (click)="updatePassword()" [disabled]="!newPassword() || updatingPassword()" class="w-full py-3 rounded-xl border border-[var(--text-primary)]/20 hover:bg-[var(--text-primary)]/10 transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50">
                    {{ updatingPassword() ? 'Updating...' : 'Save New Password' }}
                  </button>
                  @if (passwordMsg()) {
                    <p class="text-xs text-center mt-2" [class.text-green-400]="passwordSuccess()" [class.text-red-400]="!passwordSuccess()">{{ passwordMsg() }}</p>
                  }
                </div>
              </div>

            </div>
          </div>
        </div>
      }
    </div>
    
    <app-footer></app-footer>
  `
})
export class AdminComponent {
  email = signal('');
  password = signal('');
  loading = signal(false);
  saving = signal(false);
  saveSuccess = signal(false);
  error = signal('');
  
  newPassword = signal('');
  updatingPassword = signal(false);
  passwordMsg = signal('');
  passwordSuccess = signal(false);

  selectedSection = signal('home');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pageData = signal<any>({});

  public store = inject(StoreService);
  public supabase = inject(SupabaseService);

  private defaultBrandIdentity = "At the core of our software house lies a simple yet powerful purpose: to transform ideas into impactful digital solutions that drive growth, efficiency, and innovation. Our platform exists to bridge the gap between vision and execution—empowering businesses, startups, and individuals to bring their concepts to life through technology that is not only functional, but meaningful. We are committed to delivering high-quality software solutions tailored to the unique needs of each client. Whether it’s building scalable web applications, crafting intuitive mobile experiences, or developing robust backend systems, our goal is to create products that solve real-world problems and deliver long-term value. We don’t just build software—we build systems that enhance productivity, elevate user experience, and create opportunities for success in a rapidly evolving digital landscape. Our approach is rooted in creativity, precision, and collaboration. We believe that great products are born from a deep understanding of user needs combined with technical excellence. That’s why we focus on clean design, efficient performance, and reliable architecture in every project we undertake. Transparency, trust, and continuous improvement are at the heart of everything we do. This platform serves as a gateway to our expertise, showcasing our capabilities, our work, and our commitment to innovation. It is a space where ideas are nurtured, challenges are solved, and digital transformation becomes achievable. Our mission is not just to deliver software—but to empower our clients to grow, compete, and thrive in the modern world.";

  constructor() {
    afterNextRender(() => {
      this.supabase.checkSession();
      if (this.supabase.isAdmin()) {
        this.loadSection(this.selectedSection());
        this.animateDashboard();
      }

      const buttons = document.querySelectorAll('.tesla-btn');
      buttons.forEach((btn: Element) => {
        btn.addEventListener('mouseenter', () => gsap.to(btn, { scale: 1.05, duration: 0.3, ease: 'power2.out', boxShadow: '0 0 30px rgba(108,140,255,0.4)' }));
        btn.addEventListener('mouseleave', () => gsap.to(btn, { scale: 1, duration: 0.3, ease: 'power2.out', boxShadow: 'none' }));
      });
    });

    effect(() => {
      if (this.supabase.isAdmin()) {
        this.loadSection(this.selectedSection());
      }
    });
  }

  async loginWithEmail() {
    if (!this.email() || !this.password()) return;
    this.loading.set(true);
    this.error.set('');
    
    const { error } = await this.supabase.loginWithEmail(this.email(), this.password());
    if (!error) {
      setTimeout(() => this.animateDashboard(), 100);
    } else {
      this.error.set((error as Error).message || 'Access Denied: Invalid credentials.');
    }
    this.loading.set(false);
  }

  async loginWithGoogle() {
    await this.supabase.loginWithGoogle(window.location.origin + '/admin');
  }

  async loginWithGithub() {
    await this.supabase.loginWithGithub(window.location.origin + '/admin');
  }

  logout() {
    this.supabase.logout();
    this.email.set('');
    this.password.set('');
  }

  async loadSection(section: string) {
    this.selectedSection.set(section);
    let data = await this.supabase.getContent(section);
    
    if (!data) {
      // Setup Defaults for Graphic UI
      if (section === 'about') {
         data = { title: "Brand Identity", content: this.defaultBrandIdentity };
      } else if (section === 'home') {
         data = {
           heroTitle: "We build systems that scale.",
           heroSubtitle: "Transform ideas into impactful digital solutions. Bridge vision and execution.",
           servicesList: [
             { category: "01 / Cyber Security", title: "Uncompromising Defense", description: "Secure infrastructure design and penetration testing that fortifies your digital presence." },
             { category: "02 / Engineering", title: "Future-Proof Stacks", description: "We orchestrate clean codebases utilizing optimal rendering paths ensuring flawless 60 FPS." }
           ]
         };
      }
    } else {
      // Ensure specific arrays exist even on old payloads
      if (section === 'home' && !data.servicesList) data.servicesList = [];
    }
    
    // Create new object reference for Angular signals to trigger deeply
    this.pageData.set(JSON.parse(JSON.stringify(data)));
  }

  // Graphical Array Controls
  addServiceItem() {
    const p = this.pageData();
    p.servicesList.push({ category: "0X / Custom Header", title: "New Service Architecture", description: "Describe the new technical offering here." });
    this.pageData.set({...p});
  }

  removeServiceItem(index: number) {
    const p = this.pageData();
    p.servicesList.splice(index, 1);
    this.pageData.set({...p});
  }

  async saveContent() {
    this.saving.set(true);
    try {
      const payload = this.pageData();
      const success = await this.supabase.saveContent(this.selectedSection(), payload);
      if (success) {
         this.saveSuccess.set(true);
         setTimeout(() => this.saveSuccess.set(false), 2000);
      } else {
         this.error.set('Failed to save to Supabase. Check network or keys.');
         setTimeout(() => this.error.set(''), 4000);
      }
    } catch (e) {
      console.error(e);
      this.error.set('Network instability detected.');
      setTimeout(() => this.error.set(''), 4000);
    }
    this.saving.set(false);
  }

  async updateVisuals(type: 'speed' | 'glow', val: number) {
    if (type === 'speed') this.store.setAnimationSpeed(val);
    if (type === 'glow') this.store.setGlowIntensity(val);
    await this.supabase.saveContent(`settings_${type}`, { value: val });
  }

  async toggleFeature(type: '3d' | 'anim') {
    if (type === '3d') {
      this.store.toggle3D();
      await this.supabase.saveContent('settings_3d', { value: this.store.enable3D() });
    }
    if (type === 'anim') {
      this.store.toggleAnimations();
      await this.supabase.saveContent('settings_anim', { value: this.store.enableAnimations() });
    }
  }

  async updatePassword() {
    if (!this.newPassword()) return;
    this.updatingPassword.set(true);
    this.passwordMsg.set('');
    
    const { error } = await this.supabase.updatePassword(this.newPassword());
    
    if (error) {
      this.passwordSuccess.set(false);
      this.passwordMsg.set('Failed to update password.');
    } else {
      this.passwordSuccess.set(true);
      this.passwordMsg.set('Password updated successfully!');
      this.newPassword.set('');
    }
    
    this.updatingPassword.set(false);
    setTimeout(() => this.passwordMsg.set(''), 4000);
  }

  private animateDashboard() {
    gsap.from('.admin-dashboard-anim', { y: 50, opacity: 0, duration: 0.8, ease: 'power3.out' });
  }
}
