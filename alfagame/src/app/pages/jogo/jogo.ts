import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../services/toast';
import { JogoCompletarComponent } from '../../components/jogo-completar/jogo-completar';
import { JogoMultiplaEscolhaComponent } from '../../components/jogo-multipla-escolha/jogo-multipla-escolha';
import { JogoVozComponent } from '../../components/jogo-voz/jogo-voz';

export interface PalavraCompletar {
  completa: string; incompleta: string; silaba: string; imagem: string;
}
export interface PalavraMultipla extends PalavraCompletar { opcoes: string[]; }
export interface PalavraVoz { completa: string; imagem: string; }

const ALL_SILABAS = ['LA','ME','SA','TO','RA','TE','LO','NE','BA','GO'];

function gerarOpcoes(correta: string): string[] {
  const opts = [correta];
  while (opts.length < 3) {
    const s = ALL_SILABAS[Math.floor(Math.random() * ALL_SILABAS.length)];
    if (!opts.includes(s)) opts.push(s);
  }
  return opts.sort(() => Math.random() - 0.5);
}

@Component({
  selector: 'app-jogo',
  standalone: true,
  imports: [CommonModule, JogoCompletarComponent, JogoMultiplaEscolhaComponent, JogoVozComponent],
  templateUrl: './jogo.html',
  styles: []
})
export class JogoComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  toast = inject(ToastService);

  tipoJogo = 'completar';
  indiceAtual = 0;
  pontos = 0;

  palavrasCompletar: PalavraCompletar[] = [
    { completa: 'bola', incompleta: 'BO__', silaba: 'LA', imagem: '🎾' },
    { completa: 'nome', incompleta: 'NO__', silaba: 'ME', imagem: '📝' },
    { completa: 'casa', incompleta: 'CA__', silaba: 'SA', imagem: '🏠' },
    { completa: 'gato', incompleta: 'GA__', silaba: 'TO', imagem: '🐱' },
  ];

  palavrasVoz: PalavraVoz[] = [
    { completa: 'bola', imagem: '🎾' },
    { completa: 'nome', imagem: '📝' },
    { completa: 'casa', imagem: '🏠' },
    { completa: 'gato', imagem: '🐱' },
  ];

  get palavrasMultipla(): PalavraMultipla[] {
    return this.palavrasCompletar.map(p => ({ ...p, opcoes: gerarOpcoes(p.silaba) }));
  }

  get total(): number {
    if (this.tipoJogo === 'voz') return this.palavrasVoz.length;
    return this.palavrasCompletar.length;
  }

  get progresso(): number {
    return ((this.indiceAtual + 1) / this.total) * 100;
  }

  get titulo(): string {
    switch (this.tipoJogo) {
      case 'multipla-escolha': return 'Escolher Sílaba';
      case 'voz': return 'Falar a Palavra';
      default: return 'Completar Sílabas';
    }
  }

  get tituloIcon(): string {
    switch (this.tipoJogo) {
      case 'multipla-escolha': return '🎯';
      case 'voz': return '🎤';
      default: return '✏️';
    }
  }

  ngOnInit() {
    this.tipoJogo = this.route.snapshot.queryParams['tipo'] || 'completar';
  }

  proximaPalavra() {
    this.indiceAtual++;
  }

  finalizarJogo() {
    this.toast.show({ title: '🎉 Atividade concluída!', description: `Você fez ${this.pontos} pontos!`, variant: 'success' });
    setTimeout(() => this.router.navigate(['/relatorios']), 2000);
  }

  adicionarPontos(pts: number) {
    this.pontos += pts;
  }
}
