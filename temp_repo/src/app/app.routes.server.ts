import {RenderMode, ServerRoute} from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'services/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return [
        { id: 'web-development' },
        { id: 'app-development' },
        { id: 'cyber-security' },
        { id: 'seo-optimization' }
      ];
    }
  },
  {
    path: 'work/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return [
        { id: 'project-alpha' },
        { id: 'nexus-security' },
        { id: 'quantum-app' }
      ];
    }
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
