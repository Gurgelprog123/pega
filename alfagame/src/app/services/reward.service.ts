import { Injectable, signal, computed } from '@angular/core';
import { StudentDto } from '../models/api.models';

interface SessionState {
  acertos: number;
  erros: number;
  tempoInicioMs: number;
}

const STUDENT_KEY = 'pega_student';

@Injectable({ providedIn: 'root' })
export class RewardService {
  private _student  = signal<StudentDto | null>(this.loadStudent());
  private _session  = signal<SessionState>({ acertos: 0, erros: 0, tempoInicioMs: 0 });

  readonly student  = this._student.asReadonly();
  readonly acertos  = computed(() => this._session().acertos);
  readonly erros    = computed(() => this._session().erros);
  readonly score    = computed(() => this._session().acertos * 10);

  setStudent(s: StudentDto) {
    this._student.set(s);
    localStorage.setItem(STUDENT_KEY, JSON.stringify(s));
  }

  clearStudent() {
    this._student.set(null);
    localStorage.removeItem(STUDENT_KEY);
  }

  iniciarSessao() {
    this._session.set({ acertos: 0, erros: 0, tempoInicioMs: Date.now() });
  }

  registrarAcerto() {
    this._session.update(s => ({ ...s, acertos: s.acertos + 1 }));
  }

  registrarErro() {
    this._session.update(s => ({ ...s, erros: s.erros + 1 }));
  }

  getTempoMs(): number {
    const inicio = this._session().tempoInicioMs;
    return inicio ? Date.now() - inicio : 0;
  }

  reset() {
    this._session.set({ acertos: 0, erros: 0, tempoInicioMs: 0 });
    // Não limpa o aluno — apenas a sessão de jogo
  }

  private loadStudent(): StudentDto | null {
    try {
      const raw = localStorage.getItem(STUDENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
