import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorios.html',
  styles: []
})
export class RelatoriosComponent {
  router = inject(Router);

  dadosGerais = { totalAtividades: 15, taxaAcerto: 82, tempoMedio: 45, evolucao: 12 };

  habilidades = [
    { nome: 'Consciência Fonológica', tentativas: 120, acertos: 98, taxaAcerto: 82, tempoMedio: 42, evolucao: 15 },
    { nome: 'Silabação', tentativas: 95, acertos: 80, taxaAcerto: 84, tempoMedio: 38, evolucao: 18 },
    { nome: 'Leitura de Palavras', tentativas: 78, acertos: 62, taxaAcerto: 79, tempoMedio: 52, evolucao: 8 },
    { nome: 'Vocabulário', tentativas: 64, acertos: 55, taxaAcerto: 86, tempoMedio: 40, evolucao: 10 },
  ];

  getBarColor(taxa: number): string {
    if (taxa >= 80) return 'hsl(142,76%,36%)';
    if (taxa >= 60) return 'hsl(38,92%,50%)';
    return 'hsl(0,84%,60%)';
  }
}
