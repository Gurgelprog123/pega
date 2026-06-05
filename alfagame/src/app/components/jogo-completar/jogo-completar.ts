import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AudioService } from '../../services/audio.service';
import { RewardService } from '../../services/reward.service';
import { PalavraResultado } from '../../models/api.models';
import { PalavraCompletar } from '../../pages/jogo/jogo';

@Component({
  selector: 'app-jogo-completar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jogo-completar.html',
  styles: []
})
export class JogoCompletarComponent implements OnChanges {
  @Input() palavras: PalavraCompletar[] = [];
  @Input() indiceAtual = 0;
  @Output() proximaPalavra   = new EventEmitter<void>();
  @Output() finalizar        = new EventEmitter<void>();
  @Output() pontos           = new EventEmitter<number>();
  @Output() palavraResultado = new EventEmitter<PalavraResultado>();

  audio     = inject(AudioService);
  rewardSvc = inject(RewardService);

  resposta = '';
  feedback: 'correto' | 'incorreto' | null = null;
  imgError = false;

  /** Marca o instante em que a palavra atual foi exibida */
  private tempoInicioPalavraMs = Date.now();

  get palavraAtual() { return this.palavras[this.indiceAtual]; }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['indiceAtual']) {
      this.tempoInicioPalavraMs = Date.now();
      this.resposta  = '';
      this.feedback  = null;
      this.imgError  = false;  // reseta erro de imagem para a nova palavra
    }
  }

  verificar() {
    if (!this.resposta || this.feedback) return;
    const correto = this.resposta.toUpperCase() === this.palavraAtual.silaba;
    this.feedback = correto ? 'correto' : 'incorreto';

    const tempoMsPalavra = Date.now() - this.tempoInicioPalavraMs;

    // Emite resultado individual da palavra
    this.palavraResultado.emit({
      palavra: this.palavraAtual.completa,
      acertou: correto,
      tempoMs: tempoMsPalavra,
    });

    if (correto) {
      this.audio.sucesso();
      this.rewardSvc.registrarAcerto();
      this.pontos.emit(10);
      setTimeout(() => {
        this.resposta = '';
        this.feedback = null;
        if (this.indiceAtual < this.palavras.length - 1) this.proximaPalavra.emit();
        else this.finalizar.emit();
      }, 1800);
    } else {
      this.audio.erro();
      this.rewardSvc.registrarErro();
      setTimeout(() => {
        this.feedback = null;
        // Reinicia o cronômetro após tentativa errada (nova tentativa)
        this.tempoInicioPalavraMs = Date.now();
      }, 1000);
    }
  }
}
