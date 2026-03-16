import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styles: []
})
export class DashboardComponent {
  router = inject(Router);

  grupos = [
    { id: 1, nome: 'Turma A – Manhã', alunos: 12, atividades: 5, progresso: 78 },
    { id: 2, nome: 'Turma B – Tarde', alunos: 15, atividades: 8, progresso: 65 },
    { id: 3, nome: 'Grupo Terapêutico 1', alunos: 6, atividades: 12, progresso: 82 },
  ];

  atividades = [
    { tipo: 'completar', icon: '✏️', titulo: 'Completar Sílabas', descricao: 'Digite as letras que completam a palavra', cor: 'hsl(217,91%,60%)' },
    { tipo: 'multipla-escolha', icon: '🎯', titulo: 'Escolher Sílaba', descricao: 'Selecione a sílaba correta entre 3 opções', cor: 'hsl(142,76%,36%)' },
    { tipo: 'voz', icon: '🎤', titulo: 'Falar a Palavra', descricao: 'Veja a imagem e diga o nome em voz alta', cor: 'hsl(38,92%,50%)' },
  ];

  jogar(tipo: string) {
    this.router.navigate(['/jogo'], { queryParams: { tipo } });
  }

  logout() {
    this.router.navigate(['/']);
  }
}
