import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GameIntegrationService } from '../../services/game-integration.service';
import { RewardService } from '../../services/reward.service';
import { ToastService } from '../../services/toast';
import { StudentDto } from '../../models/api.models';

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

  totalScore = computed(() => this.students().reduce((acc, s) => acc + s.scoreTotal, 0));

  // Modal
  showModal           = signal(false);
  tipoJogoSelecionado = signal('completar');
  selectedStudent     = signal<StudentDto | null>(null);

  // Form de aluno
  novoNome         = '';
  criando          = signal(false);
  mostrarFormAluno = signal(false);

  atividades = [
    { tipo: 'completar',        icon: '✏️', titulo: 'Completar Sílabas',  descricao: 'Digite as letras que completam a palavra',  cor: 'hsl(217,91%,60%)' },
    { tipo: 'multipla-escolha', icon: '🎯', titulo: 'Escolher Sílaba',    descricao: 'Selecione a sílaba correta entre 3 opções', cor: 'hsl(142,76%,36%)' },
    { tipo: 'voz',              icon: '🎤', titulo: 'Falar a Palavra',    descricao: 'Veja a imagem e diga o nome em voz alta',   cor: 'hsl(38,92%,50%)'  },
  ];

  ngOnInit() {
    this.syncStudents();
  }

  syncStudents() {
    const userId = this.authSvc.userId();
    if (!userId) return;

    this.loadingStudents.set(true);
    this.syncError.set(false);

    this.gameSvc.getStudentsByUser(userId).subscribe({
      next: list => {
        this.students.set(list);
        this.saveStudentsCache(list);
        this.loadingStudents.set(false);
      },
      error: () => {
        // Mantém cache local — não perde dados visíveis
        this.loadingStudents.set(false);
        this.syncError.set(true);
      }
    });
  }

  get nomeUsuario(): string {
    return this.authSvc.user()?.nome ?? 'Usuário';
  }

  jogar(tipo: string) {
    this.tipoJogoSelecionado.set(tipo);
    this.selectedStudent.set(null);
    this.showModal.set(true);
  }

  jogarComAluno(aluno: StudentDto) {
    // Botão no card do aluno: escolhe atividade no modal antes de ir pro jogo
    this.selectedStudent.set(aluno);
    this.tipoJogoSelecionado.set('completar');
    this.showModal.set(true);
  }

  confirmarJogo() {
    const student = this.selectedStudent();
    if (!student) return;
    this.rewardSvc.setStudent(student);
    this.rewardSvc.iniciarSessao();
    this.showModal.set(false);
    // Usa um pequeno delay para garantir que o modal feche antes de navegar
    setTimeout(() => {
      this.router.navigate(['/jogo'], { queryParams: { tipo: this.tipoJogoSelecionado() } });
    }, 50);
  }

  iniciarJogoDireto(aluno: StudentDto, tipo: string) {
    // Navega direto sem modal (chamado pelos mini-botões de atividade no card)
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
