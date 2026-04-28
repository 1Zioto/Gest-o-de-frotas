import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { Embarque, EmbarqueFormComponent } from './embarque-form.component';

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  pendente:      { label: 'Pendente',       bg: '#fef9c3', color: '#854d0e', icon: 'schedule' },
  em_transporte: { label: 'Em Transporte',  bg: '#dbeafe', color: '#1e40af', icon: 'local_shipping' },
  entregue:      { label: 'Entregue',       bg: '#dcfce7', color: '#166534', icon: 'check_circle' },
  cancelado:     { label: 'Cancelado',      bg: '#fee2e2', color: '#991b1b', icon: 'cancel' },
};

@Component({
  selector: 'app-embarques',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTooltipModule, MatDialogModule, MatSnackBarModule],
  template: `
    <div class="page-header">
      <div class="page-title">
        <mat-icon>inventory_2</mat-icon>
        <h1>Embarques</h1>
        <span class="count-badge">{{ filtered().length }}</span>
      </div>
      <div class="header-actions">
        <div class="filter-pills">
          <button class="pill" [class.active]="filtroStatus===''" (click)="setStatus('')">Todos</button>
          <button class="pill" [class.active]="filtroStatus==='pendente'" (click)="setStatus('pendente')">Pendente</button>
          <button class="pill em_transporte" [class.active]="filtroStatus==='em_transporte'" (click)="setStatus('em_transporte')">Em Transporte</button>
          <button class="pill entregue" [class.active]="filtroStatus==='entregue'" (click)="setStatus('entregue')">Entregue</button>
        </div>
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar código, origem, destino…" [(ngModel)]="search" />
        </div>
        <button class="btn-novo" (click)="openForm()">
          <mat-icon>add</mat-icon> Novo Embarque
        </button>
      </div>
    </div>

    <mat-progress-bar *ngIf="loading()" mode="indeterminate" class="progress-bar"></mat-progress-bar>

    <!-- Cards resumo -->
    <div class="summary-cards">
      @for (s of statusList; track s.key) {
        <div class="summary-card" [style.border-left-color]="s.color">
          <mat-icon [style.color]="s.color">{{ s.icon }}</mat-icon>
          <div>
            <span class="summary-num">{{ countByStatus(s.key) }}</span>
            <span class="summary-label">{{ s.label }}</span>
          </div>
        </div>
      }
      <div class="summary-card" style="border-left-color:#7c3aed">
        <mat-icon style="color:#7c3aed">payments</mat-icon>
        <div>
          <span class="summary-num">{{ fmtBRL(totalFrete) }}</span>
          <span class="summary-label">Total Frete</span>
        </div>
      </div>
    </div>

    <!-- Tabela -->
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Origem → Destino</th>
            <th>Coleta</th>
            <th>Previsão</th>
            <th>Veículo</th>
            <th>Containers</th>
            <th>Frete</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let e of filtered()">
            <td><span class="codigo-badge">{{ e.codigo_embarque }}</span></td>
            <td>
              <div class="rota">
                <span class="cidade">{{ e.origem_cidade || '—' }}{{ e.origem_uf ? '/' + e.origem_uf : '' }}</span>
                <mat-icon class="arrow">arrow_forward</mat-icon>
                <span class="cidade">{{ e.destino_cidade || '—' }}{{ e.destino_uf ? '/' + e.destino_uf : '' }}</span>
              </div>
            </td>
            <td class="muted">{{ fmtDate(e.data_coleta) }}</td>
            <td class="muted">{{ fmtDate(e.data_previsao_entrega) }}</td>
            <td>
              <span *ngIf="e.placa" class="placa-sm">{{ e.placa }}</span>
              <span *ngIf="!e.placa" class="muted">—</span>
            </td>
            <td>
              <div class="containers-cell">
                <span class="container-count">{{ e.containers_gerados || 0 }}/{{ e.quantidade_containers || 0 }}</span>
                <span *ngIf="e.ordem_gerada" class="ordem-chip">Gerada</span>
              </div>
            </td>
            <td class="bold">{{ e.valor_frete ? fmtBRL(e.valor_frete) : '—' }}</td>
            <td>
              <span class="status-chip"
                [style.background]="getStatus(e.status).bg"
                [style.color]="getStatus(e.status).color">
                {{ getStatus(e.status).label }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="icon-btn generate-btn" (click)="gerarOrdem(e)" matTooltip="Gerar ordem de carregamento"><mat-icon>playlist_add_check</mat-icon></button>
              <button class="icon-btn" (click)="openForm(e)" matTooltip="Editar"><mat-icon>edit</mat-icon></button>
              <button class="icon-btn danger-btn" (click)="remover(e)" matTooltip="Remover"><mat-icon>delete</mat-icon></button>
            </td>
          </tr>
          <tr *ngIf="!loading() && filtered().length === 0">
            <td colspan="9" class="empty-row">
              <mat-icon>search_off</mat-icon>
              <span>Nenhum embarque encontrado.</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:20px; }
    .page-title { display:flex; align-items:center; gap:10px; }
    .page-title mat-icon { color:#0ea5e9; font-size:28px; width:28px; height:28px; }
    h1 { font-size:22px; font-weight:700; color:#0f172a; margin:0; }
    .count-badge { background:#e0f2fe; color:#0369a1; font-size:12px; font-weight:700; border-radius:20px; padding:2px 10px; }
    .header-actions { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    .filter-pills { display:flex; gap:4px; background:#f1f5f9; border-radius:10px; padding:3px; }
    .pill { background:none; border:none; border-radius:7px; padding:5px 12px; font-size:12px; font-weight:600; color:#64748b; cursor:pointer; transition:all 0.15s; &.active { background:white; color:#0f172a; box-shadow:0 1px 3px rgba(0,0,0,.1); } &.em_transporte.active { color:#1e40af; } &.entregue.active { color:#166534; } }
    .search-box { display:flex; align-items:center; gap:8px; background:white; border:1.5px solid #e2e8f0; border-radius:10px; padding:0 12px; width:240px; &:focus-within { border-color:#3b82f6; } mat-icon { color:#94a3b8; font-size:18px; width:18px; height:18px; flex-shrink:0; } input { border:none; outline:none; font-size:13px; color:#1e293b; padding:9px 0; background:transparent; font-family:inherit; flex:1; } }
    .btn-novo { display:flex; align-items:center; gap:6px; background:linear-gradient(135deg,#0ea5e9,#0369a1); color:white; border:none; border-radius:10px; padding:10px 18px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap; transition:opacity 0.2s; &:hover { opacity:0.9; } mat-icon { font-size:18px; width:18px; height:18px; } }
    .progress-bar { margin-bottom:16px; border-radius:4px; }
    .summary-cards { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
    .summary-card { background:white; border-radius:12px; padding:14px 18px; display:flex; align-items:center; gap:12px; border:1px solid #e2e8f0; border-left:4px solid; flex:1; min-width:120px; mat-icon { font-size:24px; width:24px; height:24px; } }
    .summary-num { display:block; font-size:18px; font-weight:800; color:#0f172a; }
    .summary-label { font-size:11px; color:#64748b; }
    .table-card { background:white; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; }
    .data-table { width:100%; border-collapse:collapse; th { background:#f8fafc; color:#64748b; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; padding:11px 14px; text-align:left; border-bottom:1px solid #e2e8f0; white-space:nowrap; } td { padding:12px 14px; border-bottom:1px solid #f1f5f9; font-size:13px; color:#1e293b; } tr:last-child td { border-bottom:none; } tr:hover td { background:#f8fafc; } }
    .codigo-badge { background:#0f172a; color:#f8fafc; font-family:monospace; font-size:12px; font-weight:700; letter-spacing:0.05em; padding:3px 8px; border-radius:6px; white-space:nowrap; }
    .rota { display:flex; align-items:center; gap:6px; white-space:nowrap; }
    .cidade { font-size:13px; font-weight:500; }
    .arrow { font-size:14px; width:14px; height:14px; color:#94a3b8; }
    .placa-sm { background:#e2e8f0; color:#0f172a; font-family:monospace; font-size:11px; font-weight:700; padding:2px 7px; border-radius:5px; }
    .containers-cell { display:flex; align-items:center; gap:6px; white-space:nowrap; }
    .container-count { font-family:monospace; font-size:12px; font-weight:700; color:#0f172a; }
    .ordem-chip { background:#dcfce7; color:#166534; font-size:10px; font-weight:700; padding:2px 7px; border-radius:20px; text-transform:uppercase; }
    .muted { color:#94a3b8; }
    .bold { font-weight:700; }
    .status-chip { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; white-space:nowrap; }
    .actions-cell { display:flex; gap:4px; }
    .icon-btn { background:none; border:none; cursor:pointer; width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#64748b; transition:background 0.15s; &:hover { background:#f1f5f9; color:#1e293b; } mat-icon { font-size:17px; width:17px; height:17px; } }
    .generate-btn:hover { background:#e0f2fe !important; color:#0369a1 !important; }
    .danger-btn:hover { background:#fee2e2 !important; color:#dc2626 !important; }
    .empty-row { text-align:center; padding:48px 16px !important; color:#94a3b8; display:flex; align-items:center; justify-content:center; gap:10px; mat-icon { font-size:22px; width:22px; height:22px; } }
  `]
})
export class EmbarquesComponent implements OnInit {
  embarques = signal<Embarque[]>([]);
  loading = signal(false);
  search = '';
  filtroStatus = '';

  statusList = Object.entries(STATUS_CONFIG).map(([key, v]) => ({ key, ...v }));

  filtered = computed(() => {
    let list = this.embarques();
    if (this.filtroStatus) list = list.filter(e => e.status === this.filtroStatus);
    const q = this.search.toLowerCase();
    if (!q) return list;
    return list.filter(e =>
      e.codigo_embarque?.toLowerCase().includes(q) ||
      e.origem_cidade?.toLowerCase().includes(q) ||
      e.destino_cidade?.toLowerCase().includes(q) ||
      e.descricao_carga?.toLowerCase().includes(q)
    );
  });

  get totalFrete() { return this.filtered().reduce((s, e) => s + (Number(e.valor_frete) || 0), 0); }
  countByStatus(s: string) { return this.embarques().filter(e => e.status === s).length; }
  getStatus(s?: string) { return STATUS_CONFIG[s || ''] ?? { label: s || '—', bg: '#f1f5f9', color: '#64748b', icon: 'help' }; }

  constructor(private api: ApiService, private dialog: MatDialog, private snackBar: MatSnackBar) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<Embarque[]>('embarques').subscribe({
      next: d => { this.embarques.set(d); this.loading.set(false); },
      error: () => { this.embarques.set([]); this.loading.set(false); }
    });
  }

  setStatus(s: string) { this.filtroStatus = s; }

  openForm(e?: Embarque) {
    this.dialog.open(EmbarqueFormComponent, { data: e || null, width: '760px', maxWidth: '95vw' })
      .afterClosed().subscribe(ok => { if (ok) this.load(); });
  }

  gerarOrdem(e: Embarque) {
    const total = Number(e.quantidade_containers) || 0;
    if (total <= 0) {
      this.snackBar.open('Informe a quantidade de containers no embarque antes de gerar a ordem.', 'OK', { duration: 3500 });
      return;
    }
    if (e.ordem_gerada && !confirm(`A ordem do embarque ${e.codigo_embarque} já foi gerada. Gerar novamente criará apenas viagens faltantes. Continuar?`)) return;

    this.api.post<{ created: number; total: number }>('containers', { action: 'gerar-ordem', id_embarque: e.id_embarque }).subscribe({
      next: r => {
        this.snackBar.open(`Ordem gerada: ${r.created} nova(s) viagem(ns), ${r.total} no total.`, 'OK', { duration: 4000 });
        this.load();
      },
      error: err => this.snackBar.open(err.error?.error || 'Erro ao gerar ordem.', 'OK', { duration: 4000 })
    });
  }

  remover(e: Embarque) {
    if (!confirm(`Remover embarque ${e.codigo_embarque}?`)) return;
    this.api.delete<Embarque>('embarques', e.id_embarque!).subscribe({
      next: () => { this.snackBar.open('Embarque removido.', 'OK', { duration: 3000 }); this.load(); },
      error: () => this.snackBar.open('Erro ao remover.', 'OK', { duration: 3000 })
    });
  }

  fmtDate(d?: string): string {
    if (!d) return '—';
    const s = d.includes('T') ? d.slice(0, 10) : d;
    return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR');
  }

  fmtBRL(v: any): string {
    const n = Number(v);
    return isNaN(n) ? '—' : 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
