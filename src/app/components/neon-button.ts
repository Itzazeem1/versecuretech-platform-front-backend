import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-neon-button',
  standalone: true,
  template: `
    <button type="button" class="neon-btn" [class.neon-btn--compact]="compact">
      {{ text }}
    </button>
  `,
  styles: [`
    .neon-btn {
      appearance: none;
      -webkit-appearance: none;

      border-radius: 14px;
      padding: 16px 42px;

      border: 2px solid transparent;
      background:
        linear-gradient(var(--bg-main), var(--bg-main)) padding-box,
        linear-gradient(90deg, rgba(230, 234, 242, 0.95) 10%, var(--accent-main) 50%, rgba(230, 234, 242, 0.95) 90%) border-box;

      color: var(--text-primary);
      font-family: var(--font-button);
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      line-height: 1;

      box-shadow:
        0 0 10px 1px rgba(108, 140, 255, 0.8),
        0 0 25px 5px rgba(108, 140, 255, 0.4),
        0 0 50px 10px rgba(108, 140, 255, 0.2),
        inset 0 0 12px 1px rgba(108, 140, 255, 0.9),
        inset 0 0 24px 6px rgba(108, 140, 255, 0.4);

      text-shadow: 0 0 6px rgba(255, 255, 255, 0.4);

      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      outline: none;
      white-space: nowrap;

      transition:
        transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1),
        text-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1);

      position: relative;
      z-index: 1;
    }

    .neon-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 12px;
      background: radial-gradient(circle at center, rgba(108, 140, 255, 0.5) 0%, transparent 80%);
      opacity: 0;
      z-index: -1;
      transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    }

    .neon-btn:hover {
      box-shadow:
        0 0 20px 3px rgba(108, 140, 255, 0.9),
        0 0 50px 12px rgba(108, 140, 255, 0.6),
        0 0 90px 20px rgba(108, 140, 255, 0.3),
        inset 0 0 24px 4px rgba(108, 140, 255, 0.9),
        inset 0 0 50px 15px rgba(108, 140, 255, 0.4);
      transform: translateY(-2px) scale(1.02);
      text-shadow:
        0 0 12px rgba(255, 255, 255, 0.9),
        0 0 24px rgba(255, 255, 255, 0.6);
    }

    .neon-btn:hover::before {
      opacity: 1;
    }

    .neon-btn:active {
      transform: translateY(1px) scale(0.98);
      box-shadow:
        0 0 10px 1px rgba(108, 140, 255, 0.7),
        inset 0 0 10px 1px rgba(108, 140, 255, 0.6);
      transition: all 0.1s ease;
    }

    .neon-btn:active::before {
      opacity: 0.3;
      transition: all 0.1s ease;
    }

    .neon-btn--compact {
      border-radius: 12px;
      padding: 12px 32px;
      min-height: 44px;
      font-size: 12px;
      letter-spacing: 0.12em;
      line-height: 1.3;
      box-shadow:
        0 0 8px 1px rgba(108, 140, 255, 0.7),
        0 0 20px 4px rgba(108, 140, 255, 0.35),
        0 0 40px 8px rgba(108, 140, 255, 0.15),
        inset 0 0 10px 1px rgba(108, 140, 255, 0.85),
        inset 0 0 20px 5px rgba(108, 140, 255, 0.35);
    }

    .neon-btn--compact::before {
      border-radius: 10px;
    }

    .neon-btn--compact:hover {
      box-shadow:
        0 0 14px 2px rgba(108, 140, 255, 0.85),
        0 0 32px 8px rgba(108, 140, 255, 0.5),
        0 0 56px 14px rgba(108, 140, 255, 0.25),
        inset 0 0 16px 3px rgba(108, 140, 255, 0.85),
        inset 0 0 32px 10px rgba(108, 140, 255, 0.35);
      transform: translateY(-1px) scale(1.02);
    }
  `]
})
export class NeonButtonComponent {
  @Input() text = 'Initialize';
  @Input() compact = false;
}
