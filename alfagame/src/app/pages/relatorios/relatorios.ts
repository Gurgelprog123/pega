import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GameIntegrationService } from '../../services/game-integration.service';
import { RewardService } from '../../services/reward.service';
import { GameResultDto, PalavraResultado, StudentDto } from '../../models/api.models';

const STUDENTS_CACHE_KEY = 'pega_students_cache';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorios.html',
  styles: []
})
export class RelatoriosComponent implements OnInit {
  router    = inject(Router);
  authSvc   = inject(AuthService);
  gameSvc   = inject(GameIntegrationService);
  rewardSvc = inject(RewardService);

  students         = signal<StudentDto[]>([]);
  alunoSelecionado = signal<StudentDto | null>(null);
  resultados       = signal<GameResultDto[]>([]);
  loadingResults   = signal(false);
  loadingStudents  = signal(false);

  /** ID da sessão com detalhamento de palavras expandido (null = nenhuma) */
  sessaoExpandida = signal<string | null>(null);

  // ── Stats derivados dos resultados reais ───────────────────────────────────
  dadosGerais = computed(() => {
    const list = this.resultados();
    if (!list.length) return { totalAtividades: 0, taxaAcerto: 0, tempoMedio: 0 };
    const total      = list.length;
    const acertos    = list.reduce((s, r) => s + r.acertos, 0);
    const questoes   = list.reduce((s, r) => s + r.acertos + r.erros, 0);
    const taxaAcerto = questoes ? Math.round((acertos / questoes) * 100) : 0;
    const tempoMedio = Math.round(list.reduce((s, r) => s + r.tempoMs, 0) / total / 1000);
    return { totalAtividades: total, taxaAcerto, tempoMedio };
  });

  // ── Habilidades agrupadas por tipo de atividade ────────────────────────────
  habilidades = computed(() => {
    const list = this.resultados();
    if (!list.length) return [];

    const byActivity: Record<string, { acertos: number; erros: number; tempoTotal: number; count: number }> = {};
    for (const r of list) {
      if (!byActivity[r.activityNome]) {
        byActivity[r.activityNome] = { acertos: 0, erros: 0, tempoTotal: 0, count: 0 };
      }
      byActivity[r.activityNome].acertos    += r.acertos;
      byActivity[r.activityNome].erros      += r.erros;
      byActivity[r.activityNome].tempoTotal += r.tempoMs;
      byActivity[r.activityNome].count      += 1;
    }

    return Object.entries(byActivity).map(([nome, s]) => {
      const tentativas = s.acertos + s.erros;
      const taxaAcerto = tentativas ? Math.round((s.acertos / tentativas) * 100) : 0;
      const tempoMedio = s.count ? Math.round(s.tempoTotal / s.count / 1000) : 0;
      return { nome, tentativas, acertos: s.acertos, taxaAcerto, tempoMedio };
    });
  });

  // ── Tempo médio por palavra (agrega todas as sessões do aluno) ─────────────
  tempoPorPalavra = computed(() => {
    const list = this.resultados();
    if (!list.length) return [];

    const mapa: Record<string, { acertos: number; erros: number; tempoTotal: number; count: number }> = {};

    for (const r of list) {
      const palavras = this.parsePalavras(r.detalhesPalavras);
      for (const p of palavras) {
        if (!mapa[p.palavra]) mapa[p.palavra] = { acertos: 0, erros: 0, tempoTotal: 0, count: 0 };
        mapa[p.palavra].count++;
        mapa[p.palavra].tempoTotal += p.tempoMs;
        if (p.acertou) mapa[p.palavra].acertos++;
        else           mapa[p.palavra].erros++;
      }
    }

    return Object.entries(mapa)
      .map(([palavra, s]) => ({
        palavra,
        tentativas:  s.count,
        taxaAcerto:  s.count ? Math.round((s.acertos / s.count) * 100) : 0,
        tempoMedioMs: s.count ? Math.round(s.tempoTotal / s.count) : 0,
      }))
      .sort((a, b) => a.taxaAcerto - b.taxaAcerto); // mais difíceis primeiro
  });

  ngOnInit() {
    const cached = localStorage.getItem(STUDENTS_CACHE_KEY);
    if (cached) {
      try { this.students.set(JSON.parse(cached)); } catch {}
    }

    const userId = this.authSvc.userId();
    if (userId) {
      this.loadingStudents.set(true);
      this.gameSvc.getStudentsByUser(userId).subscribe({
        next: list => {
          this.students.set(list);
          localStorage.setItem(STUDENTS_CACHE_KEY, JSON.stringify(list));
          this.loadingStudents.set(false);
        },
        error: () => this.loadingStudents.set(false)
      });
    }

    const student = this.rewardSvc.student();
    if (student) this.selecionarAluno(student);
  }

  selecionarAluno(aluno: StudentDto) {
    this.alunoSelecionado.set(aluno);
    this.rewardSvc.setStudent(aluno);
    this.resultados.set([]);
    this.sessaoExpandida.set(null);
    this.loadingResults.set(true);

    this.gameSvc.getResultsByStudent(aluno.id).subscribe({
      next: list => { this.resultados.set(list); this.loadingResults.set(false); },
      error: ()  => this.loadingResults.set(false)
    });
  }

  toggleSessao(id: string) {
    this.sessaoExpandida.update(atual => atual === id ? null : id);
  }

  /** Parseia o JSON de detalhesPalavras com segurança */
  parsePalavras(json?: string): PalavraResultado[] {
    if (!json) return [];
    try { return JSON.parse(json) as PalavraResultado[]; }
    catch { return []; }
  }

  getBarColor(taxa: number): string {
    if (taxa >= 80) return 'hsl(142,76%,36%)';
    if (taxa >= 60) return 'hsl(38,92%,50%)';
    return 'hsl(0,84%,60%)';
  }
}
