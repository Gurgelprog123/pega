import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../services/audio.service';
import { RewardService } from '../../services/reward.service';
import { ToastService } from '../../services/toast';
import { PalavraVoz } from '../../pages/jogo/jogo';

@Component({
  selector: 'app-jogo-voz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jogo-voz.html',
  styles: []
})
export class JogoVozComponent {
  @Input() palavras: PalavraVoz[] = [];
  @Input() indiceAtual = 0;
  @Output() proximaPalavra = new EventEmitter<void>();
  @Output() finalizar      = new EventEmitter<void>();
  @Output() pontos         = new EventEmitter<number>();

  audio     = inject(AudioService);
  rewardSvc = inject(RewardService);
  toast     = inject(ToastService);

  gravando    = false;
  processando = false;
  feedback: { tipo: 'correto' | 'incorreto'; mensagem: string } | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;

  get palavraAtual() { return this.palavras[this.indiceAtual]; }

  /** Verifica se o browser suporta Web Speech API */
  get suportado(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  iniciarGravacao() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SR) {
      this.toast.show({
        title: 'Navegador não suportado',
        description: 'Use o Chrome ou Safari para o modo de voz.',
        variant: 'destructive'
      });
      return;
    }

    this.recognition = new SR();
    this.recognition.lang = 'pt-BR';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 5;
    this.recognition.continuous = false;

    this.gravando = true;
    this.feedback = null;

    // ── Resultado recebido ──────────────────────────────────────────────────
    this.recognition.onresult = (event: any) => {
      this.gravando = false;
      this.processando = true;

      // Coleta todas as alternativas retornadas pelo engine
      const alternativas: string[] = [];
      for (let i = 0; i < event.results[0].length; i++) {
        alternativas.push(
          event.results[0][i].transcript.toLowerCase().trim()
        );
      }

      const alvo = this.palavraAtual.completa.toLowerCase();

      // Aceita se qualquer alternativa bate exatamente ou contém a palavra-alvo
      const acertou = alternativas.some(
        t => t === alvo || t.includes(alvo)
      );

      // Pequeno delay para o usuário ver "Analisando..."
      setTimeout(() => this.processarResultado(acertou, alternativas[0] ?? ''), 300);
    };

    // ── Erros de reconhecimento ─────────────────────────────────────────────
    this.recognition.onerror = (event: any) => {
      this.gravando    = false;
      this.processando = false;

      if (event.error === 'no-speech') {
        this.toast.show({ title: '🔇 Sem fala detectada', description: 'Fale mais alto e tente novamente.', variant: 'destructive' });
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.toast.show({ title: '🎙️ Microfone bloqueado', description: 'Permita o acesso ao microfone nas configurações do navegador.', variant: 'destructive' });
      } else if (event.error === 'network') {
        this.toast.show({ title: '🌐 Sem conexão', description: 'O reconhecimento de voz precisa de internet.', variant: 'destructive' });
      } else {
        this.toast.show({ title: 'Erro ao reconhecer', description: 'Tente novamente.', variant: 'destructive' });
      }
    };

    // ── Fim automático (silêncio detectado) ─────────────────────────────────
    this.recognition.onend = () => {
      if (this.gravando) this.gravando = false;
    };

    this.recognition.start();
    this.toast.show({
      title: '🎙️ Ouvindo...',
      description: `Fale: "${this.palavraAtual.completa}"`
    });
  }

  pararGravacao() {
    if (this.recognition && this.gravando) {
      this.recognition.stop();
      this.gravando = false;
    }
  }

  private processarResultado(acertou: boolean, transcricao: string) {
    this.processando = false;

    if (acertou) {
      this.audio.sucesso();
      this.rewardSvc.registrarAcerto();
      this.pontos.emit(15);
      this.feedback = {
        tipo: 'correto',
        mensagem: transcricao
          ? `Você disse "${transcricao}" — perfeito! 🎉`
          : `"${this.palavraAtual.completa}" — correto! 🎉`
      };
      setTimeout(() => {
        this.feedback = null;
        if (this.indiceAtual < this.palavras.length - 1) this.proximaPalavra.emit();
        else this.finalizar.emit();
      }, 2500);
    } else {
      this.audio.erro();
      this.rewardSvc.registrarErro();
      this.feedback = {
        tipo: 'incorreto',
        mensagem: transcricao
          ? `Você disse "${transcricao}", mas a palavra é "${this.palavraAtual.completa}".`
          : `A palavra correta é "${this.palavraAtual.completa}".`
      };
      setTimeout(() => { this.feedback = null; }, 3500);
    }
  }
}
