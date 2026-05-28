import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  template: `
    <div class="toast-wrapper">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-container" [class]="getClass(toast.variant)">
          <div style="flex:1;">
            <div class="toast-title">{{ toast.title }}</div>
            @if (toast.description) {
              <div class="toast-description">{{ toast.description }}</div>
            }
          </div>
          <button class="toast-close" (click)="toastService.remove(toast.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-wrapper {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 360px;
      width: calc(100vw - 40px);
    }

    .toast-container {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.9rem 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      animation: slideDown 0.3s ease-out;
    }

    .toast-error {
      background: #f44336;
      color: white;
      border-left: 4px solid #c62828;
    }

    .toast-success {
      background: #4caf50;
      color: white;
      border-left: 4px solid #2e7d32;
    }

    .toast-default {
      background: #2a2a2a;
      color: white;
      border-left: 4px solid #1a1a1a;
    }

    .toast-title {
      font-weight: 700;
      font-size: 0.9rem;
      margin-bottom: 0.15rem;
    }

    .toast-description {
      font-size: 0.82rem;
      opacity: 0.9;
    }

    .toast-close {
      background: none;
      border: none;
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      opacity: 0.7;
      line-height: 1;
      padding: 0;
      flex-shrink: 0;
    }

    .toast-close:hover { opacity: 1; }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);

  getClass(variant?: string): string {
    if (variant === 'destructive') return 'toast-error';
    if (variant === 'success')     return 'toast-success';
    return 'toast-default';
  }
}
