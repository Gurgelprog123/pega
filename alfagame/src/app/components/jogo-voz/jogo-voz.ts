import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  @Output() finalizar = new EventEmitter<void>();
  @Output() pontos = new EventEmitter<number>();

  toast = inject(ToastService);
  gravando = false;
  processando = false;
  feedback: { tipo: 'correto' | 'incorreto'; mensagem: string } | null = null;

  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  get palavraAtual() { return this.palavras[this.indiceAtual]; }

  async iniciarGravacao() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) this.chunks.push(e.data); };
      this.mediaRecorder.onstop = () => this.processarAudio();
      this.mediaRecorder.start();
      this.gravando = true;
      this.toast.show({ title: '🎙️ Gravando...', description: 'Fale o nome do objeto na imagem' });
    } catch {
      this.toast.show({ title: 'Erro', description: 'Não foi possível acessar o microfone.', variant: 'destructive' });
    }
  }

  pararGravacao() {
    if (this.mediaRecorder && this.gravando) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
      this.gravando = false;
    }
  }

  private async processarAudio() {
    this.processando = true;
    await new Promise(r => setTimeout(r, 1500)); // Simula API

    const acertou = true; // simulado
    this.processando = false;

    if (acertou) {
      this.pontos.emit(15);
      this.feedback = { tipo: 'correto', mensagem: `Perfeito! Você disse "${this.palavraAtual.completa}" corretamente! 🎉` };
      setTimeout(() => {
        this.feedback = null;
        if (this.indiceAtual < this.palavras.length - 1) this.proximaPalavra.emit();
        else this.finalizar.emit();
      }, 2500);
    } else {
      this.feedback = { tipo: 'incorreto', mensagem: `Tente novamente. A palavra é "${this.palavraAtual.completa}".` };
      setTimeout(() => { this.feedback = null; }, 3000);
    }
  }
}
