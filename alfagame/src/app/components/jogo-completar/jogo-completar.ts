import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AudioService } from '../../services/audio.service';
import { RewardService } from '../../services/reward.service';
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
  @Output() finalizar      = new EventEmitter<void>();
  @Output() pontos         = new EventEmitter<number>();

  audio     = inject(AudioService);
  rewardSvc = inject(RewardService);

  resposta = '';
  feedback: 'correto' | 'incorreto' | null = null;

  get palavraAtual() { return this.palavras[this.indiceAtual]; }

  get inputClass(): string {
    if (this.feedback === 'correto')   return 'input-correto';
    if (this.feedback === 'incorreto') return 'input-incorreto';
    return '';
  }

  verificar() {
    if (!this.resposta || this.feedback) return;
    const correto = this.resposta.toUpperCase() === this.palavraAtual.silaba;
    this.feedback = correto ? 'correto' : 'incorreto';

    if (correto) {
      this.audio.sucesso();
      this.rewardSvc.registrarAcerto();
      this.pontos.emit(10);
      setTimeout(() => {
        this.resposta = ''; this.feedback = null;
        if (this.indiceAtual < this.palavras.length - 1) this.proximaPalavra.emit();
        else this.finalizar.emit();
      }, 1400);
    } else {
      this.audio.erro();
      this.rewardSvc.registrarErro();
      setTimeout(() => { this.feedback = null; }, 1000);
    }
  }
}
