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
  userId: string;   // UUID
  nome: string;
  email: string;
  role: UserRole;
  expiresIn: number;
}

// ── Student ──────────────────────────────────────────────────────────────────

export interface StudentDto {
  id: string;             // UUID
  nome: string;
  nivelAtual: number;
  scoreTotal: number;
  responsavelId: string;  // UUID (professor/terapeuta responsável)
}

export interface CreateStudentRequest {
  nome: string;
  responsavelId: string;  // UUID
}

// ── Activity ─────────────────────────────────────────────────────────────────

export type ActivityType = 'LEITURA' | 'ESCRITA' | 'FONETICA' | 'VOCABULARIO' | 'SILABAS';

export interface ActivityDto {
  id: string;   // UUID
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
  studentId: string;    // UUID
  activityId: string;   // UUID
  acertos: number;
  erros: number;
  tempoMs: number;
  /** Detalhamento por palavra para análise no relatório */
  palavras?: PalavraResultado[];
}

export interface PlayGameResponse {
  gameResultId: string;  // UUID
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
  id: string;           // UUID
  studentId: string;    // UUID
  activityId: string;   // UUID
  activityNome: string;
  acertos: number;
  erros: number;
  tempoMs: number;
  timestamp: string;
  /** JSON com [{palavra, acertou, tempoMs}, ...] — detalhamento por palavra */
  detalhesPalavras?: string;
}
