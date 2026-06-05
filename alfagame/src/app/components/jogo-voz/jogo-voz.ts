import { Component, Input, Output, EventEmitter, inject, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../services/audio.service';
import { RewardService } from '../../services/reward.service';
import { ToastService } from '../../services/toast';
import { PalavraResultado } from '../../models/api.models';
import { PalavraVoz } from '../../pages/jogo/jogo';

export interface Gravacao {
  palavra: string;
  url: string;
  acertou: boolean | null;
}

@Component({
  selector: 'app-jogo-voz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jogo-voz.html',
  styles: []
})
export class JogoVozComponent implements OnChanges, OnDestroy {
  @Input() palavras: PalavraVoz[] = [];
  @Input() indiceAtual = 0;
  @Output() proximaPalavra   = new EventEmitter<void>();
  @Output() finalizar        = new EventEmitter<void>();
  @Output() pontos           = new EventEmitter<number>();
  @Output() palavraResultado = new EventEmitter<PalavraResultado>();

  audio     = inject(AudioService);
  rewardSvc = inject(RewardService);
  toast     = inject(ToastService);

  gravando    = false;
  processando = false;
  feedback: { tipo: 'correto' | 'incorreto'; mensagem: string } | null = null;
  gravacoes: Gravacao[] = [];

  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private micStream: MediaStream | null = null;
  private tempoInicioPalavraMs = Date.now();

  /** ID incremental para ignorar callbacks de sessões antigas */
  private sessaoId = 0;

  get palavraAtual() { return this.palavras[this.indiceAtual]; }

  get suportado(): boolean {
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['indiceAtual'] && !changes['indiceAtual'].firstChange) {
      // Nova palavra: limpa todo o estado e invalida sessão anterior
      this.sessaoId++;
      this.tempoInicioPalavraMs = Date.now();
      this.feedback = null;
      this.gravando = false;
      this.processando = false;
      this.limparRecognition();
    }
  }

  ngOnDestroy() {
    this.sessaoId++;
    this.gravacoes.forEach(g => URL.revokeObjectURL(g.url));
    this.gravacoes = [];
    this.limparRecognition();
    this.pararMediaRecorderInterno();
    this.micStream?.getTracks().forEach(t => t.stop());
  }

  async iniciarGravacao() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      this.toast.show({ title: 'Navegador não suportado', description: 'Use Chrome ou Safari.', variant: 'destructive' });
      return;
    }

    // Incrementa o ID de sessão: callbacks com ID antigo serão ignorados
    const minhaSessao = ++this.sessaoId;

    this.gravando = true;
    this.feedback = null;
    this.tempoInicioPalavraMs = Date.now();
    this.audioChunks = [];

    // ── MediaRecorder (gravação para playback) ────────────────────────────
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.micStream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        // Ignora se sessão mudou
        if (minhaSessao !== this.sessaoId && this.sessaoId !== minhaSessao) return;
        if (this.audioChunks.length > 0) {
          const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const url  = URL.createObjectURL(blob);
          const palavraAtualCompleta = this.palavras[this.indiceAtual]?.completa ?? '';
          const idx = this.gravacoes.findIndex(g => g.palavra === palavraAtualCompleta && g.acertou === null);
          if (idx !== -1) {
            this.gravacoes[idx].url = url;
          } else {
            this.gravacoes.push({ palavra: palavraAtualCompleta, url, acertou: null });
          }
        }
        this.micStream?.getTracks().forEach(t => t.stop());
        this.micStream = null;
      };
      this.mediaRecorder.start();
    } catch {
      // Sem permissão — recognition continua normalmente
    }

    // ── SpeechRecognition (reconhecimento) ────────────────────────────────
    this.limparRecognition();
    this.recognition = new SR();
    this.recognition.lang = 'pt-BR';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 5;
    this.recognition.continuous = false;

    this.recognition.onresult = (event: any) => {
      if (minhaSessao !== this.sessaoId) return; // sessão desatualizada
      this.gravando = false;
      this.processando = true;
      this.pararMediaRecorderInterno();

      const alternativas: string[] = [];
      for (let i = 0; i < event.results[0].length; i++) {
        alternativas.push(event.results[0][i].transcript.toLowerCase().trim());
      }
      const alvo    = this.palavraAtual.completa.toLowerCase();
      const acertou = alternativas.some(t => t === alvo || t.includes(alvo));
      const tempoMs = Date.now() - this.tempoInicioPalavraMs;

      setTimeout(() => {
        if (minhaSessao !== this.sessaoId) return; // sessão desatualizada
        this.processarResultado(acertou, alternativas[0] ?? '', tempoMs);
      }, 300);
    };

    this.recognition.onerror = (event: any) => {
      if (minhaSessao !== this.sessaoId) return;
      this.gravando    = false;
      this.processando = false;
      this.pararMediaRecorderInterno();

      const msgs: Record<string, string> = {
        'no-speech':           '🔇 Nenhuma fala detectada. Fale mais alto.',
        'not-allowed':         '🎙️ Microfone bloqueado. Permita nas configurações.',
        'service-not-allowed': '🎙️ Microfone bloqueado. Permita nas configurações.',
        'network':             '🌐 Sem conexão. O reconhecimento requer internet.',
      };
      this.toast.show({ title: 'Erro ao reconhecer', description: msgs[event.error] ?? 'Tente novamente.', variant: 'destructive' });
    };

    this.recognition.onend = () => {
      if (minhaSessao !== this.sessaoId) return; // ignora onend de sessão anterior
      if (this.gravando) this.gravando = false;
      this.pararMediaRecorderInterno();
    };

    this.recognition.start();
    this.toast.show({ title: '🎙️ Ouvindo...', description: `Fale: "${this.palavraAtual.completa}"` });
  }

  pararGravacao() {
    this.sessaoId++; // invalida a sessão atual
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
    }
    this.gravando = false;
    this.pararMediaRecorderInterno();
  }

  private limparRecognition() {
    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onerror  = null;
      this.recognition.onend    = null;
      try { this.recognition.abort(); } catch {}
      this.recognition = null;
    }
  }

  private pararMediaRecorderInterno() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try { this.mediaRecorder.stop(); } catch {}
    }
  }

  private processarResultado(acertou: boolean, transcricao: string, tempoMs: number) {
    this.processando = false;

    const palavraAtualCompleta = this.palavraAtual.completa;

    // Marca resultado na gravação
    const idx = this.gravacoes.findIndex(g => g.palavra === palavraAtualCompleta && g.acertou === null);
    if (idx !== -1) this.gravacoes[idx].acertou = acertou;

    this.palavraResultado.emit({ palavra: palavraAtualCompleta, acertou, tempoMs });

    if (acertou) {
      this.audio.sucesso();
      this.rewardSvc.registrarAcerto();
      this.pontos.emit(15);
      this.feedback = {
        tipo: 'correto',
        mensagem: transcricao
          ? `Você disse "${transcricao}" — perfeito! 🎉`
          : `"${palavraAtualCompleta}" — correto! 🎉`
      };
      setTimeout(() => {
        this.feedback = null;
        if (this.indiceAtual < this.palavras.length - 1) {
          this.proximaPalavra.emit();
        } else {
          this.finalizar.emit();
        }
      }, 1800);
    } else {
      this.audio.erro();
      this.rewardSvc.registrarErro();
      this.feedback = {
        tipo: 'incorreto',
        mensagem: transcricao
          ? `Você disse "${transcricao}", mas a palavra é "${palavraAtualCompleta}".`
          : `A palavra correta é "${palavraAtualCompleta}".`
      };
      setTimeout(() => { this.feedback = null; }, 3000);
    }
  }
}
