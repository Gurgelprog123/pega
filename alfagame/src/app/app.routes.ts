import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'criar-atividade',
    loadComponent: () => import('./pages/criar-atividade/criar-atividade').then(m => m.CriarAtividadeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'jogo',
    loadComponent: () => import('./pages/jogo/jogo').then(m => m.JogoComponent),
    canActivate: [authGuard]
  },
  {
    path: 'relatorios',
    loadComponent: () => import('./pages/relatorios/relatorios').then(m => m.RelatoriosComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '' }
];
