import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/api.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styles: [`
    .login-bg {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: #121212;
    }

    @media (max-width: 600px) {
      .login-bg {
        padding: 1rem;
      }
    }

    @media (max-width: 480px) {
      .login-bg {
        padding: 0.75rem;
      }
    }
  `]
})
export class LoginComponent {
  router    = inject(Router);
  toast     = inject(ToastService);
  authSvc   = inject(AuthService);

  isRegister = signal(false);
  loading    = signal(false);

  // Login fields
  email    = '';
  password = '';

  // Register fields
  nome     = '';
  regEmail = '';
  regPass  = '';
  role: UserRole = 'PROFESSOR';

  readonly roleOptions: { value: UserRole; label: string }[] = [
    { value: 'PROFESSOR',  label: 'Professor(a)' },
    { value: 'TERAPEUTA',  label: 'Terapeuta'    },
  ];

  toggleMode() {
    this.isRegister.update(v => !v);
  }

  handleLogin() {
    if (!this.email || !this.password) {
      this.toast.show({ title: 'Campos obrigatórios', description: 'Preencha e-mail e senha.', variant: 'destructive' });
      return;
    }
    this.loading.set(true);
    this.authSvc.login({ email: this.email, senha: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.show({ title: 'Bem-vindo de volta! 👋', description: 'Login realizado com sucesso.', variant: 'success' });
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.loading.set(false);
        const msg = err.error?.message ?? 'Credenciais inválidas.';
        this.toast.show({ title: 'Erro ao entrar', description: msg, variant: 'destructive' });
      }
    });
  }

  handleRegister() {
    if (!this.nome || !this.regEmail || !this.regPass) {
      this.toast.show({ title: 'Campos obrigatórios', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }
    this.loading.set(true);
    this.authSvc.register({ nome: this.nome, email: this.regEmail, senha: this.regPass, role: this.role }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.show({ title: 'Conta criada! 🎉', description: 'Bem-vindo ao PEGA.', variant: 'success' });
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.loading.set(false);
        const msg = err.error?.message ?? 'Erro ao criar conta.';
        this.toast.show({ title: 'Erro no cadastro', description: msg, variant: 'destructive' });
      }
    });
  }
}
