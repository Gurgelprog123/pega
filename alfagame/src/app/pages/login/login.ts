import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styles: [`
    .hero-bg {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.25;
      pointer-events: none;
    }
  `]
})
export class LoginComponent {
  router = inject(Router);
  toast = inject(ToastService);

  email = '';
  password = '';
  loading = false;

  handleLogin() {
    if (!this.email || !this.password) {
      this.toast.show({ title: 'Campos obrigatórios', description: 'Preencha e-mail e senha.', variant: 'destructive' });
      return;
    }
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.toast.show({ title: 'Bem-vindo de volta! 👋', description: 'Login realizado com sucesso.', variant: 'success' });
      this.router.navigate(['/dashboard']);
    }, 800);
  }
}
