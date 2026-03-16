import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-criar-atividade',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './criar-atividade.html',
  styles: []
})
export class CriarAtividadeComponent {
  router = inject(Router);
  toast = inject(ToastService);

  habilidade = '';
  nivel = '';
  palavras: string[] = ['bola', 'nome'];
  novaPalavra = '';

  habilidades = [
    { value: 'consciencia-fonologica', label: 'Consciência Fonológica' },
    { value: 'silabacao', label: 'Silabação' },
    { value: 'leitura-palavras', label: 'Leitura de Palavras' },
    { value: 'vocabulario', label: 'Vocabulário' },
  ];

  niveis = [
    { value: 'iniciante', label: 'Iniciante' },
    { value: 'intermediario', label: 'Intermediário' },
    { value: 'avancado', label: 'Avançado' },
  ];

  adicionarPalavra() {
    const p = this.novaPalavra.trim().toLowerCase();
    if (p && !this.palavras.includes(p)) {
      this.palavras = [...this.palavras, p];
      this.novaPalavra = '';
    }
  }

  removerPalavra(i: number) {
    this.palavras = this.palavras.filter((_, idx) => idx !== i);
  }

  salvar() {
    if (!this.habilidade || !this.nivel || this.palavras.length === 0) {
      this.toast.show({ title: 'Campos obrigatórios', description: 'Preencha todos os campos e adicione palavras.', variant: 'destructive' });
      return;
    }
    this.toast.show({ title: 'Atividade criada! 🎉', description: `${this.palavras.length} palavras adicionadas.`, variant: 'success' });
    setTimeout(() => this.router.navigate(['/dashboard']), 800);
  }
}
