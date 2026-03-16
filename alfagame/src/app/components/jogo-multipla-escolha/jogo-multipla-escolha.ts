import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast';
import { PalavraMultipla } from '../../pages/jogo/jogo';

@Component({
  selector: 'app-jogo-multipla-escolha',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jogo-multipla-escolha.html',
  styles: []
})
export class JogoMultiplaEscolhaComponent {
  @Input() palavras: PalavraMultipla[] = [];
  @Input() indiceAtual = 0;
  @Output() proximaPalavra = new EventEmitter<void>();
  @Output() finalizar = new EventEmitter<void>();
  @Output() pontos = new EventEmitter<number>();

  toast = inject(ToastService);
  selecionada: string | null = null;
  feedback: 'correto' | 'incorreto' | null = null;

  get palavraAtual() { return this.palavras[this.indiceAtual]; }

  selecionar(opcao: string) {
    if (this.feedback) return;
    this.selecionada = opcao;
    const correto = opcao === this.palavraAtual.silaba;
    this.feedback = correto ? 'correto' : 'incorreto';

    if (correto) {
      this.pontos.emit(10);
      this.toast.show({ title: 'Muito bem! 🎉', description: `"${this.palavraAtual.completa}" está correto!`, variant: 'success' });
      setTimeout(() => {
        this.selecionada = null; this.feedback = null;
        if (this.indiceAtual < this.palavras.length - 1) this.proximaPalavra.emit();
        else this.finalizar.emit();
      }, 1400);
    } else {
      this.toast.show({ title: 'Ops! Tente outra opção', description: 'Escolha outra sílaba.', variant: 'destructive' });
      setTimeout(() => { this.selecionada = null; this.feedback = null; }, 1000);
    }
  }

  getBtnStyle(opcao: string) {
    if (this.selecionada === opcao && this.feedback === 'correto')
      return { 'border-color': 'hsl(142,76%,36%)', background: 'hsl(142 76% 36% / 0.1)', color: 'hsl(142,76%,30%)' };
    if (this.selecionada === opcao && this.feedback === 'incorreto')
      return { 'border-color': 'hsl(0,84%,60%)', background: 'hsl(0 84% 60% / 0.1)', color: 'hsl(0,84%,45%)' };
    return {};
  }
}
