import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="animate-slide-up rounded-2xl shadow-xl p-4 border flex items-start gap-3"
          [class]="getClass(toast.variant)">
          <div class="flex-1">
            <p class="font-bold text-sm">{{ toast.title }}</p>
            @if (toast.description) {
              <p class="text-xs mt-1 opacity-80">{{ toast.description }}</p>
            }
          </div>
          <button (click)="toastService.remove(toast.id)" class="opacity-60 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      }
    </div>
  `,
  styles: []
})
export class ToastComponent {
  toastService = inject(ToastService);

  getClass(variant?: string) {
    if (variant === 'destructive') return 'bg-red-50 border-red-200 text-red-800';
    if (variant === 'success') return 'bg-green-50 border-green-200 text-green-800';
    return 'bg-white border-gray-200 text-gray-800';
  }
}
