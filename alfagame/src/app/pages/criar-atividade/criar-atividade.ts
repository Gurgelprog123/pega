import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast';
import { GameIntegrationService } from '../../services/game-integration.service';
import { ActivityType } from '../../models/api.models';

@Component({
  selector: 'app-criar-atividade',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './criar-atividade.html',
  styles: []
})
export class CriarAtividadeComponent {
  router   = inject(Router);
  toast    = inject(ToastService);
  gameSvc  = inject(GameIntegrationService);

  habilidade  = '';
  nivel       = '';
  palavras: string[] = [];
  novaPalavra = '';
  salvando    = signal(false);

  // Valores alinhados com o enum ActivityType do backend
  habilidades: { value: ActivityType; label: string }[] = [
    { value: 'SILABAS',     label: 'Silabação'              },
    { value: 'FONETICA',    label: 'Consciência Fonológica' },
    { value: 'LEITURA',     label: 'Leitura de Palavras'    },
    { value: 'ESCRITA',     label: 'Escrita'                },
    { value: 'VOCABULARIO', label: 'Vocabulário'            },
  ];

  // Níveis mapeados para dificuldade numérica (1-5) do backend
  niveis: { value: number; label: string }[] = [
    { value: 1, label: 'Iniciante'     },
    { value: 3, label: 'Intermediário' },
    { value: 5, label: 'Avançado'      },
  ];

  get nivelSelecionado(): number {
    return Number(this.nivel) || 0;
  }

  get labelHabilidade(): string {
    return this.habilidades.find(h => h.value === this.habilidade)?.label ?? '';
  }

  get labelNivel(): string {
    return this.niveis.find(n => n.value === this.nivelSelecionado)?.label ?? '';
  }

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
      this.toast.show({
        title: 'Campos obrigatórios',
        description: 'Preencha habilidade, nível e adicione ao menos uma palavra.',
        variant: 'destructive'
      });
      return;
    }

    this.salvando.set(true);

    const nome      = `${this.labelHabilidade} — ${this.labelNivel}`;
    // Palavras salvas como JSON para o jogo conseguir carregar dinamicamente
    const descricao = JSON.stringify({ palavras: this.palavras });

    this.gameSvc.createActivity({
      nome,
      tipo:       this.habilidade as ActivityType,
      descricao,
      dificuldade: this.nivelSelecionado,
      ativo:       true,
    }).subscribe({
      next: atividade => {
        this.salvando.set(false);
        this.toast.show({
          title: '✅ Atividade criada!',
          description: `"${atividade.nome}" salva com ${this.palavras.length} palavras.`,
          variant: 'success'
        });
        setTimeout(() => this.router.navigate(['/dashboard']), 800);
      },
      error: () => {
        this.salvando.set(false);
        this.toast.show({
          title: 'Erro ao salvar',
          description: 'Não foi possível criar a atividade. Verifique a conexão.',
          variant: 'destructive'
        });
      }
    });
  }
}
