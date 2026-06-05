// ── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'PROFESSOR' | 'TERAPEUTA' | 'ADMIN';

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface AuthResponse {
  token: string;
  tipo: string;
  userId: number;
  nome: string;
  email: string;
  role: UserRole;
  expiresIn: number;
}

// ── Student ──────────────────────────────────────────────────────────────────

export interface StudentDto {
  id: number;
  nome: string;
  nivelAtual: number;
  scoreTotal: number;
  userId: number;
}

export interface CreateStudentRequest {
  nome: string;
  userId: number;
}

// ── Activity ─────────────────────────────────────────────────────────────────

export type ActivityType = 'LEITURA' | 'ESCRITA' | 'FONETICA' | 'VOCABULARIO' | 'SILABAS';

export interface ActivityDto {
  id: number;
  nome: string;
  tipo: ActivityType;
  descricao: string;
  dificuldade: number;
  ativo: boolean;
}

// ── Game ─────────────────────────────────────────────────────────────────────

/** Resultado individual de uma palavra dentro de uma sessão */
export interface PalavraResultado {
  palavra: string;
  acertou: boolean;
  tempoMs: number;
}

export interface PlayGameRequest {
  studentId: number;
  activityId: number;
  acertos: number;
  erros: number;
  tempoMs: number;
  /** Detalhamento por palavra para análise no relatório */
  palavras?: PalavraResultado[];
}

export interface PlayGameResponse {
  gameResultId: number;
  acertos: number;
  erros: number;
  tempoMs: number;
  novoScore: number;
  novoNivel: number;
  feedback: string;
  feedbackTipo: 'POSITIVO' | 'NEUTRO' | 'NEGATIVO' | 'ENCORAJAMENTO';
  proximaAtividade: ActivityDto | null;
}

export interface GameResultDto {
  id: number;
  studentId: number;
  activityId: number;
  activityNome: string;
  acertos: number;
  erros: number;
  tempoMs: number;
  timestamp: string;
  /** JSON com [{palavra, acertou, tempoMs}, ...] — detalhamento por palavra */
  detalhesPalavras?: string;
}
