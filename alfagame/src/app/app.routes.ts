import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { CriarAtividadeComponent } from './pages/criar-atividade/criar-atividade';
import { JogoComponent } from './pages/jogo/jogo';
import { RelatoriosComponent } from './pages/relatorios/relatorios';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'criar-atividade', component: CriarAtividadeComponent },
  { path: 'jogo', component: JogoComponent },
  { path: 'relatorios', component: RelatoriosComponent },
  { path: '**', redirectTo: '' }
];
