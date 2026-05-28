import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../services/toast';
import { GameIntegrationService } from '../../services/game-integration.service';
import { RewardService } from '../../services/reward.service';
import { ActivityDto, ActivityType, PlayGameResponse } from '../../models/api.models';
import { JogoCompletarComponent } from '../../components/jogo-completar/jogo-completar';
import { JogoMultiplaEscolhaComponent } from '../../components/jogo-multipla-escolha/jogo-multipla-escolha';
import { JogoVozComponent } from '../../components/jogo-voz/jogo-voz';

export interface PalavraCompletar {
  completa: string; incompleta: string; silaba: string; imagem: string;
}
export interface PalavraMultipla extends PalavraCompletar { opcoes: string[]; }
export interface PalavraVoz { completa: string; imagem: string; }

const ALL_SILABAS = ['LA','ME','SA','TO','RA','TE','LO','NE','BA','GO'];

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

  // Lista de atividades carregada do banco — usada para resolver o activityId correto
  private atividades: ActivityDto[] = [];

  // Mapa: tipo de jogo → ActivityType do backend
  private readonly TIPO_PARA_ACTIVITY: Record<string, ActivityType> = {
    'completar':        'SILABAS',
    'multipla-escolha': 'FONETICA',
    'voz':              'LEITURA',
  };

  get pontos() { return this.rewardSvc.score(); }

  palavrasCompletar: PalavraCompletar[] = [
    { completa: 'bola', incompleta: 'BO__', silaba: 'LA', imagem: '🎾' },
    { completa: 'nome', incompleta: 'NO__', silaba: 'ME', imagem: '📝' },
    { completa: 'casa', incompleta: 'CA__', silaba: 'SA', imagem: '🏠' },
    { completa: 'gato', incompleta: 'GA__', silaba: 'TO', imagem: '🐱' },
  ];

  palavrasVoz: PalavraVoz[] = [
    { completa: 'bola', imagem: '🎾' },
    { completa: 'nome', imagem: '📝' },
    { completa: 'casa', imagem: '🏠' },
    { completa: 'gato', imagem: '🐱' },
  ];

  get palavrasMultipla(): PalavraMultipla[] {
    return this.palavrasCompletar.map(p => ({ ...p, opcoes: gerarOpcoes(p.silaba) }));
  }

  get total(): number {
    return this.tipoJogo === 'voz' ? this.palavrasVoz.length : this.palavrasCompletar.length;
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
    // Garante que o timer sempre começa ao entrar no jogo
    this.rewardSvc.iniciarSessao();
    // Carrega atividades para resolver o activityId correto por tipo
    this.gameSvc.getActivities().subscribe({
      next: list => { this.atividades = list; },
      error: ()  => { /* fallback para activityId 1 */ }
    });
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
