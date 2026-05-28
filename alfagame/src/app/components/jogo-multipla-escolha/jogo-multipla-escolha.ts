import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../services/audio.service';
import { RewardService } from '../../services/reward.service';
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
  @Output() finalizar      = new EventEmitter<void>();
  @Output() pontos         = new EventEmitter<number>();

  audio     = inject(AudioService);
  rewardSvc = inject(RewardService);

  selecionada: string | null = null;
  feedback: 'correto' | 'incorreto' | null = null;

  get palavraAtual() { return this.palavras[this.indiceAtual]; }

  selecionar(opcao: string) {
    if (this.feedback) return;
    this.selecionada = opcao;
    const correto = opcao === this.palavraAtual.silaba;
    this.feedback = correto ? 'correto' : 'incorreto';

    if (correto) {
      this.audio.sucesso();
      this.rewardSvc.registrarAcerto();
      this.pontos.emit(10);
      setTimeout(() => {
        this.selecionada = null; this.feedback = null;
        if (this.indiceAtual < this.palavras.length - 1) this.proximaPalavra.emit();
        else this.finalizar.emit();
      }, 1400);
    } else {
      this.audio.erro();
      this.rewardSvc.registrarErro();
      setTimeout(() => { this.selecionada = null; this.feedback = null; }, 1000);
    }
  }

  getBtnClass(opcao: string): string {
    if (this.selecionada === opcao && this.feedback === 'correto')  return 'option-btn opcao-correta';
    if (this.selecionada === opcao && this.feedback === 'incorreto') return 'option-btn opcao-errada';
    return 'option-btn';
  }
}
