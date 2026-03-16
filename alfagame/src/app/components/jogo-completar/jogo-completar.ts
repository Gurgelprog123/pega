import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast';
import { PalavraCompletar } from '../../pages/jogo/jogo';

@Component({
  selector: 'app-jogo-completar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jogo-completar.html',
  styles: []
})
export class JogoCompletarComponent {
  @Input() palavras: PalavraCompletar[] = [];
  @Input() indiceAtual = 0;
  @Output() proximaPalavra = new EventEmitter<void>();
  @Output() finalizar = new EventEmitter<void>();
  @Output() pontos = new EventEmitter<number>();

  toast = inject(ToastService);
  resposta = '';
  feedback: 'correto' | 'incorreto' | null = null;

  get palavraAtual() { return this.palavras[this.indiceAtual]; }

  get inputClass() {
    if (this.feedback === 'correto') return 'input-correto';
    if (this.feedback === 'incorreto') return 'input-incorreto';
    return '';
  }

  verificar() {
    if (!this.resposta || this.feedback) return;
    const correto = this.resposta.toUpperCase() === this.palavraAtual.silaba;
    this.feedback = correto ? 'correto' : 'incorreto';

    if (correto) {
      this.pontos.emit(10);
      this.toast.show({ title: 'Muito bem! 🎉', description: `Você completou "${this.palavraAtual.completa}" corretamente!`, variant: 'success' });
      setTimeout(() => {
        this.resposta = '';
        this.feedback = null;
        if (this.indiceAtual < this.palavras.length - 1) this.proximaPalavra.emit();
        else this.finalizar.emit();
      }, 1400);
    } else {
      this.toast.show({ title: 'Ops! Tente novamente', description: 'A sílaba não está correta.', variant: 'destructive' });
      setTimeout(() => { this.feedback = null; }, 1000);
    }
  }
}
