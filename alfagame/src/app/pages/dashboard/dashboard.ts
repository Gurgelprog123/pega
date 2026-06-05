import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GameIntegrationService } from '../../services/game-integration.service';
import { RewardService } from '../../services/reward.service';
import { ToastService } from '../../services/toast';
import { ActivityDto, StudentDto } from '../../models/api.models';

const STUDENTS_CACHE_KEY = 'pega_students_cache';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styles: []
})
export class DashboardComponent implements OnInit {
  router    = inject(Router);
  authSvc   = inject(AuthService);
  gameSvc   = inject(GameIntegrationService);
  rewardSvc = inject(RewardService);
  toast     = inject(ToastService);

  students        = signal<StudentDto[]>(this.loadCachedStudents());
  loadingStudents = signal(false);
  syncError       = signal(false);
  syncAcordando   = signal(false);  // true enquanto aguarda retry após falha
  private syncTentativa = 0;

  totalScore = computed(() => this.students().reduce((acc, s) => acc + s.scoreTotal, 0));

  // Atividades
  atividades_lista  = signal<ActivityDto[]>([]);
  excluindoAtivId   = signal<number | null>(null);

  // Form de aluno
  novoNome         = '';
  criando          = signal(false);
  mostrarFormAluno = signal(false);
  excluindoId      = signal<number | null>(null);

  atividades = [
    { tipo: 'completar',        icon: '✏️', titulo: 'Completar Sílabas',  descricao: 'Digite as letras que completam a palavra',  cor: 'hsl(217,91%,60%)' },
    { tipo: 'multipla-escolha', icon: '🎯', titulo: 'Escolher Sílaba',    descricao: 'Selecione a sílaba correta entre 3 opções', cor: 'hsl(142,76%,36%)' },
    { tipo: 'voz',              icon: '🎤', titulo: 'Falar a Palavra',    descricao: 'Veja a imagem e diga o nome em voz alta',   cor: 'hsl(38,92%,50%)'  },
  ];

  ngOnInit() {
    this.syncStudents();
    this.carregarAtividades();
  }

  carregarAtividades() {
    this.gameSvc.getActivities().subscribe({
      next: list => this.atividades_lista.set(list),
      error: () => {}
    });
  }

  syncStudents() {
    const userId = this.authSvc.userId();
    if (!userId) return;

    this.syncTentativa++;
    this.loadingStudents.set(true);
    this.syncError.set(false);
    this.syncAcordando.set(false);

    this.gameSvc.getStudentsByUser(userId).subscribe({
      next: list => {
        this.students.set(list);
        this.saveStudentsCache(list);
        this.loadingStudents.set(false);
        this.syncTentativa = 0;
      },
      error: () => {
        this.loadingStudents.set(false);
        if (this.syncTentativa === 1) {
          // Primeira falha: servidor provavelmente dormindo — tenta de novo em 35s
          this.syncAcordando.set(true);
          setTimeout(() => {
            this.syncAcordando.set(false);
            this.syncStudents();
          }, 35000);
        } else {
          // Segunda falha: mostra erro real
          this.syncError.set(true);
          this.syncTentativa = 0;
        }
      }
    });
  }

  get nomeUsuario(): string {
    return this.authSvc.user()?.nome ?? 'Usuário';
  }

  /** Cards de atividade no topo — navega direto sem modal */
  jogar(tipo: string) {
    this.rewardSvc.iniciarSessao();
    this.router.navigate(['/jogo'], { queryParams: { tipo } });
  }

  /** Botões ✏️🎯🎤 nos cards de aluno — define o aluno e navega direto */
  iniciarJogoDireto(aluno: StudentDto, tipo: string) {
    this.rewardSvc.setStudent(aluno);
    this.rewardSvc.iniciarSessao();
    this.router.navigate(['/jogo'], { queryParams: { tipo } });
  }

  criarAluno() {
    const nome = this.novoNome.trim();
    if (!nome) return;
    const userId = this.authSvc.userId();
    if (!userId) return;

    this.criando.set(true);
    this.gameSvc.createStudent({ nome, userId }).subscribe({
      next: aluno => {
        const updated = [...this.students(), aluno];
        this.students.set(updated);
        this.saveStudentsCache(updated);
        this.novoNome = '';
        this.criando.set(false);
        this.mostrarFormAluno.set(false);
        this.toast.show({ title: '✅ Aluno cadastrado!', description: `${nome} foi adicionado com sucesso.`, variant: 'success' });
      },
      error: () => {
        this.criando.set(false);
        this.toast.show({ title: 'Erro ao cadastrar', description: 'Não foi possível salvar o aluno.', variant: 'destructive' });
      }
    });
  }

  excluirAtividade(ativ: ActivityDto) {
    if (!confirm(`Excluir a atividade "${ativ.nome}"?`)) return;
    this.excluindoAtivId.set(ativ.id);
    this.gameSvc.deleteActivity(ativ.id).subscribe({
      next: () => {
        this.atividades_lista.set(this.atividades_lista().filter(a => a.id !== ativ.id));
        this.excluindoAtivId.set(null);
        this.toast.show({ title: '🗑️ Atividade removida', description: `"${ativ.nome}" foi excluída.`, variant: 'success' });
      },
      error: () => {
        this.excluindoAtivId.set(null);
        this.toast.show({ title: 'Erro ao excluir', description: 'Não foi possível remover a atividade.', variant: 'destructive' });
      }
    });
  }

  labelPalavras(ativ: ActivityDto): string {
    try {
      const obj = JSON.parse(ativ.descricao ?? '{}');
      if (Array.isArray(obj.palavras)) return obj.palavras.join(', ');
    } catch {}
    const match = (ativ.descricao ?? '').match(/Palavras?:\s*(.+)/i);
    return match ? match[1] : '—';
  }

  excluirAluno(aluno: StudentDto) {
    if (!confirm(`Excluir "${aluno.nome}"? Todos os resultados serão perdidos.`)) return;
    this.excluindoId.set(aluno.id);
    this.gameSvc.deleteStudent(aluno.id).subscribe({
      next: () => {
        const updated = this.students().filter(s => s.id !== aluno.id);
        this.students.set(updated);
        this.saveStudentsCache(updated);
        this.excluindoId.set(null);
        this.toast.show({ title: '🗑️ Aluno removido', description: `${aluno.nome} foi excluído.`, variant: 'success' });
      },
      error: () => {
        this.excluindoId.set(null);
        this.toast.show({ title: 'Erro ao excluir', description: 'Não foi possível remover o aluno.', variant: 'destructive' });
      }
    });
  }

  irParaRelatorio(aluno: StudentDto) {
    this.rewardSvc.setStudent(aluno);
    this.router.navigate(['/relatorios']);
  }

  logout() {
    this.rewardSvc.clearStudent();
    localStorage.removeItem(STUDENTS_CACHE_KEY);
    this.authSvc.logout();
  }

  private saveStudentsCache(list: StudentDto[]) {
    localStorage.setItem(STUDENTS_CACHE_KEY, JSON.stringify(list));
  }

  private loadCachedStudents(): StudentDto[] {
    try {
      const raw = localStorage.getItem(STUDENTS_CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
