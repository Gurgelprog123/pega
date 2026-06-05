import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../services/audio.service';
import { RewardService } from '../../services/reward.service';
import { PalavraResultado } from '../../models/api.models';
import { PalavraMultipla } from '../../pages/jogo/jogo';

@Component({
  selector: 'app-jogo-multipla-escolha',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jogo-multipla-escolha.html',
  styles: []
})
export class JogoMultiplaEscolhaComponent implements OnChanges {
  @Input() palavras: PalavraMultipla[] = [];
  @Input() indiceAtual = 0;
  @Output() proximaPalavra   = new EventEmitter<void>();
  @Output() finalizar        = new EventEmitter<void>();
  @Output() pontos           = new EventEmitter<number>();
  @Output() palavraResultado = new EventEmitter<PalavraResultado>();

  audio     = inject(AudioService);
  rewardSvc = inject(RewardService);

  selecionada: string | null = null;
  feedback: 'correto' | 'incorreto' | null = null;
  imgError = false;

  private tempoInicioPalavraMs = Date.now();

  get palavraAtual() { return this.palavras[this.indiceAtual]; }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['indiceAtual']) {
      this.tempoInicioPalavraMs = Date.now();
      this.selecionada = null;
      this.feedback    = null;
      this.imgError    = false;
    }
  }

  selecionar(opcao: string) {
    if (this.feedback) return;
    this.selecionada = opcao;
    const correto = opcao === this.palavraAtual.silaba;
    this.feedback = correto ? 'correto' : 'incorreto';

    const tempoMsPalavra = Date.now() - this.tempoInicioPalavraMs;

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
        this.selecionada = null;
        this.feedback = null;
        if (this.indiceAtual < this.palavras.length - 1) this.proximaPalavra.emit();
        else this.finalizar.emit();
      }, 1400);
    } else {
      this.audio.erro();
      this.rewardSvc.registrarErro();
      setTimeout(() => {
        this.selecionada = null;
        this.feedback = null;
        this.tempoInicioPalavraMs = Date.now();
      }, 1000);
    }
  }

  getBtnClass(opcao: string): string {
    if (this.selecionada === opcao && this.feedback === 'correto')   return 'option-btn opcao-correta';
    if (this.selecionada === opcao && this.feedback === 'incorreto') return 'option-btn opcao-errada';
    return 'option-btn';
  }
}
