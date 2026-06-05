import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../services/toast';
import { GameIntegrationService } from '../../services/game-integration.service';
import { RewardService } from '../../services/reward.service';
import { ActivityDto, ActivityType, PalavraResultado, PlayGameResponse } from '../../models/api.models';
import { JogoCompletarComponent } from '../../components/jogo-completar/jogo-completar';
import { JogoMultiplaEscolhaComponent } from '../../components/jogo-multipla-escolha/jogo-multipla-escolha';
import { JogoVozComponent } from '../../components/jogo-voz/jogo-voz';

export interface PalavraCompletar {
  completa: string; incompleta: string; silaba: string; imagem: string; emoji: string;
}
export interface PalavraMultipla extends PalavraCompletar { opcoes: string[]; }
export interface PalavraVoz { completa: string; imagem: string; emoji: string; }

// ── Dicionário de sílabas para palavras do português ─────────────────────────
// Estrutura: palavra → { primeira sílaba (upper), segunda sílaba (upper), emoji }
const DICT_SILABAS: Record<string, { s1: string; s2: string; emoji: string }> = {
  bola:  { s1: 'BO', s2: 'LA', emoji: '⚽' },
  casa:  { s1: 'CA', s2: 'SA', emoji: '🏠' },
  gato:  { s1: 'GA', s2: 'TO', emoji: '🐱' },
  pato:  { s1: 'PA', s2: 'TO', emoji: '🐥' },
  sapo:  { s1: 'SA', s2: 'PO', emoji: '🐸' },
  bolo:  { s1: 'BO', s2: 'LO', emoji: '🎂' },
  mala:  { s1: 'MA', s2: 'LA', emoji: '🧳' },
  foca:  { s1: 'FO', s2: 'CA', emoji: '🦭' },
  lupa:  { s1: 'LU', s2: 'PA', emoji: '🔍' },
  mesa:  { s1: 'ME', s2: 'SA', emoji: '🪑' },
  vaca:  { s1: 'VA', s2: 'CA', emoji: '🐄' },
  moto:  { s1: 'MO', s2: 'TO', emoji: '🏍️' },
  pipa:  { s1: 'PI', s2: 'PA', emoji: '🪁' },
  roda:  { s1: 'RO', s2: 'DA', emoji: '⚙️' },
  saco:  { s1: 'SA', s2: 'CO', emoji: '🛍️' },
  tela:  { s1: 'TE', s2: 'LA', emoji: '📺' },
  boca:  { s1: 'BO', s2: 'CA', emoji: '👄' },
  dedo:  { s1: 'DE', s2: 'DO', emoji: '☝️' },
  fada:  { s1: 'FA', s2: 'DA', emoji: '🧚' },
  loba:  { s1: 'LO', s2: 'BA', emoji: '🐺' },
  navio: { s1: 'NA', s2: 'VIO', emoji: '🚢' },
  rato:  { s1: 'RA', s2: 'TO', emoji: '🐭' },
  lobo:  { s1: 'LO', s2: 'BO', emoji: '🐺' },
  cola:  { s1: 'CO', s2: 'LA', emoji: '🖊️' },
  cabo:  { s1: 'CA', s2: 'BO', emoji: '🔌' },
  figo:  { s1: 'FI', s2: 'GO', emoji: '🍑' },
  mapa:  { s1: 'MA', s2: 'PA', emoji: '🗺️' },
  lago:  { s1: 'LA', s2: 'GO', emoji: '🏞️' },
  lobo2: { s1: 'LO', s2: 'BO', emoji: '🐺' },
  sumo:  { s1: 'SU', s2: 'MO', emoji: '🥤' },
  tubo:  { s1: 'TU', s2: 'BO', emoji: '🔧' },
};

/** Tenta separar uma palavra em duas sílabas (fallback simples para palavras não no dicionário) */
function separarSilabas(palavra: string): { s1: string; s2: string } {
  const p = palavra.toLowerCase();
  if (DICT_SILABAS[p]) {
    return { s1: DICT_SILABAS[p].s1, s2: DICT_SILABAS[p].s2 };
  }
  // Fallback: divide ao meio
  const metade = Math.ceil(p.length / 2);
  return {
    s1: p.slice(0, metade).toUpperCase(),
    s2: p.slice(metade).toUpperCase(),
  };
}

/** Constrói uma PalavraCompletar a partir do nome simples da palavra */
function palavraParaCompletar(nome: string): PalavraCompletar {
  const p = nome.toLowerCase();
  const { s1, s2 } = separarSilabas(p);
  const emoji = DICT_SILABAS[p]?.emoji ?? '📝';
  return {
    completa: p,
    incompleta: `${s1}__`,
    silaba: s2,
    imagem: `/images/jogos/${p}.png`,
    emoji,
  };
}

/** Parseia a descrição da atividade e retorna a lista de palavras */
function parsePalavrasAtividade(descricao?: string | null): string[] {
  if (!descricao) return [];
  try {
    // Formato JSON: {"palavras": ["bola", "casa"]}
    const obj = JSON.parse(descricao);
    if (Array.isArray(obj.palavras)) return obj.palavras.map((p: string) => p.toLowerCase().trim());
  } catch {
    // Formato legado: "Palavras: bola, casa, gato"
    const match = descricao.match(/Palavras?:\s*(.+)/i);
    if (match) return match[1].split(',').map(p => p.toLowerCase().trim());
  }
  return [];
}

const ALL_SILABAS = ['LA','SA','TO','PO','LO','MA','PE','RA','TE','BA','DA','CO','NA'];

function gerarOpcoes(correta: string): string[] {
  const opts = [correta];
  while (opts.length < 3) {
    const s = ALL_SILABAS[Math.floor(Math.random() * ALL_SILABAS.length)];
    if (!opts.includes(s)) opts.push(s);
  }
  return opts.sort(() => Math.random() - 0.5);
}

@Component({
  selector: 'app-jogo',
  standalone: true,
  imports: [CommonModule, JogoCompletarComponent, JogoMultiplaEscolhaComponent, JogoVozComponent],
  templateUrl: './jogo.html',
  styles: [`
    /* Fundo totalmente preto — sem distinção de card */
    :host {
      display: block;
      min-height: 100vh;
      background: #000000;
    }

    .jogo-container {
      min-height: 100vh;
      background: #000000;
      padding: 1.5rem 1rem 3rem;
      max-width: 560px;
      margin: 0 auto;
    }

    .jogo-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.75rem;
      gap: 1rem;
    }

    .btn-voltar {
      background: rgba(255,255,255,0.07);
      color: #f0f0f0;
      border: 1px solid rgba(255,255,255,0.12);
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      white-space: nowrap;
      transition: background 0.2s;
    }
    .btn-voltar:hover { background: rgba(255,255,255,0.12); }

    .jogo-titulo {
      font-weight: 800;
      font-size: 1rem;
      color: #f0f0f0;
    }

    .jogo-pontos {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 9999px;
      padding: 0.35rem 0.9rem;
      font-weight: 800;
      color: #f0f0f0;
      font-size: 0.875rem;
      white-space: nowrap;
    }

    .progresso-wrapper {
      margin-bottom: 2rem;
    }

    .progresso-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: #555;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .progresso-barra {
      height: 6px;
      background: rgba(255,255,255,0.08);
      border-radius: 9999px;
      overflow: hidden;
    }

    .progresso-fill {
      height: 100%;
      background: #ffffff;
      border-radius: 9999px;
      transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
    }

    /* Sem card — conteúdo diretamente no fundo preto */
    .jogo-card {
      background: transparent;
      border: none;
      padding: 0;
    }

    @media (max-width: 480px) {
      .jogo-container { padding: 1rem 1rem 2rem; }
    }
  `]
})
export class JogoComponent implements OnInit {
  route      = inject(ActivatedRoute);
  router     = inject(Router);
  toast      = inject(ToastService);
  gameSvc    = inject(GameIntegrationService);
  rewardSvc  = inject(RewardService);

  tipoJogo       = 'completar';
  tipoAtividade  = 'completar';
  indiceAtual    = 0;

  mostrarResultado  = signal(false);
  enviandoResultado = signal(false);
  resultadoJADE     = signal<PlayGameResponse | null>(null);

  /** Acumula resultado por palavra para enviar ao backend e exibir no relatório */
  private palavrasResultados: PalavraResultado[] = [];

  // Lista de atividades carregada do banco — usada para resolver o activityId correto
  private atividades: ActivityDto[] = [];

  // Mapa: tipo de jogo → ActivityType do backend
  private readonly TIPO_PARA_ACTIVITY: Record<string, ActivityType> = {
    'completar':        'SILABAS',
    'multipla-escolha': 'FONETICA',
    'voz':              'LEITURA',
  };

  get pontos() { return this.rewardSvc.score(); }

  // Palavras padrão (fallback quando não há atividade criada no banco)
  private readonly PALAVRAS_PADRAO: PalavraCompletar[] = [
    { completa: 'bola', incompleta: 'BO__', silaba: 'LA', imagem: '/images/jogos/bola.png', emoji: '⚽' },
    { completa: 'casa', incompleta: 'CA__', silaba: 'SA', imagem: '/images/jogos/casa.png', emoji: '🏠' },
    { completa: 'gato', incompleta: 'GA__', silaba: 'TO', imagem: '/images/jogos/gato.png', emoji: '🐱' },
    { completa: 'pato', incompleta: 'PA__', silaba: 'TO', imagem: '/images/jogos/pato.png', emoji: '🐥' },
    { completa: 'sapo', incompleta: 'SA__', silaba: 'PO', imagem: '/images/jogos/sapo.png', emoji: '🐸' },
    { completa: 'bolo', incompleta: 'BO__', silaba: 'LO', imagem: '/images/jogos/bolo.png', emoji: '🎂' },
  ];

  // Signals — atualizados quando a atividade do banco é carregada
  palavrasCompletar = signal<PalavraCompletar[]>(this.PALAVRAS_PADRAO);
  palavrasVoz       = signal<PalavraVoz[]>(
    this.PALAVRAS_PADRAO.map(p => ({ completa: p.completa, imagem: p.imagem, emoji: p.emoji }))
  );

  // Computed — regenera as opções apenas quando palavrasCompletar mudar
  palavrasMultipla = computed<PalavraMultipla[]>(() =>
    this.palavrasCompletar().map(p => ({ ...p, opcoes: gerarOpcoes(p.silaba) }))
  );

  get total(): number {
    return this.tipoJogo === 'voz' ? this.palavrasVoz().length : this.palavrasCompletar().length;
  }

  get progresso(): number { return ((this.indiceAtual + 1) / this.total) * 100; }

  get titulo(): string {
    switch (this.tipoJogo) {
      case 'multipla-escolha': return 'Escolher Sílaba';
      case 'voz':              return 'Falar a Palavra';
      default:                 return 'Completar Sílabas';
    }
  }

  get tituloIcon(): string {
    switch (this.tipoJogo) {
      case 'multipla-escolha': return '🎯';
      case 'voz':              return '🎤';
      default:                 return '✏️';
    }
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.tipoAtividade = params['tipo'] || 'completar';
      this.tipoJogo      = this.tipoAtividade;
    });
    this.rewardSvc.iniciarSessao();

    // Carrega atividades: resolve o activityId E atualiza as palavras do jogo
    this.gameSvc.getActivities().subscribe({
      next: list => {
        this.atividades = list;
        this.carregarPalavrasDeAtividade(list);
      },
      error: () => { /* mantém palavras padrão */ }
    });
  }

  /** Carrega as palavras da atividade cadastrada no banco que bate com o tipo do jogo */
  private carregarPalavrasDeAtividade(atividades: ActivityDto[]) {
    const tipoBackend = this.TIPO_PARA_ACTIVITY[this.tipoJogo];
    // Pega a primeira atividade ativa do tipo correto (dificuldade mais alta = mais recente)
    const atividade = atividades
      .filter(a => a.tipo === tipoBackend && a.ativo)
      .sort((a, b) => b.dificuldade - a.dificuldade)[0];

    if (!atividade) return; // nenhuma atividade criada → mantém padrão

    const nomes = parsePalavrasAtividade(atividade.descricao);
    if (nomes.length < 2) return; // atividade vazia → mantém padrão

    const completar = nomes.map(palavraParaCompletar);
    this.palavrasCompletar.set(completar);
    this.palavrasVoz.set(completar.map(p => ({
      completa: p.completa,
      imagem:   p.imagem,
      emoji:    p.emoji,
    })));
  }

  /** Resolve o ID da atividade no banco a partir do tipo do jogo atual. */
  private resolverActivityId(): number {
    const tipoBackend = this.TIPO_PARA_ACTIVITY[this.tipoJogo];
    if (tipoBackend && this.atividades.length > 0) {
      const match = this.atividades.find(a => a.tipo === tipoBackend);
      if (match) return match.id;
    }
    return 1; // fallback seguro
  }

  voltar() {
    this.router.navigate(['/dashboard']);
  }

  proximaPalavra() { this.indiceAtual++; }

  adicionarPontos(pts: number) {
    // pontuação já gerenciada pelo RewardService via registrarAcerto/registrarErro nos componentes
  }

  /** Recebe o resultado de cada palavra individual dos componentes filhos */
  onPalavraResultado(resultado: PalavraResultado) {
    this.palavrasResultados.push(resultado);
  }

  finalizarJogo() {
    this.mostrarResultado.set(true);
    const student = this.rewardSvc.student();
    if (!student) { this.toast.show({ title: '🎉 Atividade concluída!', description: `Você fez ${this.pontos} pontos!`, variant: 'success' }); return; }

    this.enviandoResultado.set(true);
    this.gameSvc.playGame({
      studentId:  student.id,
      activityId: this.resolverActivityId(),
      acertos:    this.rewardSvc.acertos(),
      erros:      this.rewardSvc.erros(),
      tempoMs:    this.rewardSvc.getTempoMs(),
      palavras:   this.palavrasResultados,
    }).subscribe({
      next: res => {
        this.resultadoJADE.set(res);
        this.enviandoResultado.set(false);
      },
      error: () => {
        this.enviandoResultado.set(false);
        this.toast.show({ title: '⚠️ Resultado salvo localmente', description: 'Não foi possível conectar ao servidor.', variant: 'destructive' });
      }
    });
  }

  fecharResultado() {
    this.rewardSvc.reset();
    this.router.navigate(['/relatorios']);
  }
}
