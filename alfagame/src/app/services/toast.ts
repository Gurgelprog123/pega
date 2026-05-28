import { Injectable, signal } from '@angular/core';

export interface ToastOptions {
  title: string;
  description: string;
  variant?: 'success' | 'destructive' | 'default';
  duration?: number;
  position?: 'top' | 'bottom';
}

export interface Toast {
  id: number;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private counter = 0;

  show(toast: Omit<Toast, 'id'>) {
    const id = ++this.counter;
    this.toasts.update(t => [...t, { ...toast, id }]);
    setTimeout(() => this.remove(id), 3500);
  }

  remove(id: number) {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }
}
