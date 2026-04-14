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
import { Transporte } from '../../core/models';
import { TransporteFormComponent } from './transporte-form.component';

@Component({
  selector: 'app-transportes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTooltipModule, MatDialogModule, MatSnackBarModule
  ],
  template: `
    <div class="page-header">
      <div class="page-title">
        <mat-icon>local_shipping</mat-icon>
        <h1>Transportes</h1>
        <span class="count-badge">{{ filtered().length }}</span>
      </div>
      <div class="header-actions">
        <input type="date" class="date-input" [(ngModel)]="filtroFrom" (change)="load()" title="De">
        <input type="date" class="date-input" [(ngModel)]="filtroTo"   (change)="load()" title="Até">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar por placa, motorista…" [(ngModel)]="search" />
          <button *ngIf="search" class="clear-btn" (click)="search=''"><mat-icon>close</mat-icon></button>
        </div>
        <button class="btn-novo" (click)="openForm()">
          <mat-icon>add</mat-icon>
          Novo Transporte
        </button>
      </div>
    </div>

    <mat-progress-bar *ngIf="loading()" mode="indeterminate" class="progress-bar"></mat-progress-bar>

    <!-- Cards de resumo -->
    <div class="summary-cards">
      <div class="summary-card blue">
        <mat-icon>local_shipping</mat-icon>
        <div>
          <span class="summary-num">{{ filtered().length }}</span>
          <span class="summary-label">Viagens</span>
        </div>
      </div>
      <div class="summary-card green">
        <mat-icon>attach_money</mat-icon>
        <div>
          <span class="summary-num">R$ {{ totalFrete | number:'1.2-2':'pt-BR' }}</span>
          <span class="summary-label">Frete Total</span>
        </div>
      </div>
      <div class="summary-card purple">
        <mat-icon>trending_up</mat-icon>
        <div>
          <span class="summary-num">R$ {{ totalResultado | number:'1.2-2':'pt-BR' }}</span>
          <span class="summary-label">Resultado Líquido</span>
        </div>
      </div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Veículo</th>
            <th>Motorista</th>
            <th>Origem → Destino</th>
            <th>Frete Total</th>
            <th>Resultado</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of filtered()">
            <td class="muted">{{ formatDate(t.data) }}</td>
            <td>
              <div class="veiculo-cell">
                <span class="placa-badge" *ngIf="t.placa">{{ t.placa }}</span>
                <span *ngIf="!t.placa" class="muted">—</span>
                <span *ngIf="t.carreta_placa" class="carreta-sub">+ {{ t.carreta_placa }}</span>
              </div>
            </td>
            <td>{{ t.motorista_nome || '—' }}</td>
            <td>
              <span *ngIf="t.origem || t.destino" class="rota">
                {{ t.origem || '?' }} → {{ t.destino || '?' }}
              </span>
              <span *ngIf="!t.origem && !t.destino" class="muted">—</span>
            </td>
            <td>
              <strong *ngIf="t.frete_total">R$ {{ t.frete_total | number:'1.2-2':'pt-BR' }}</strong>
              <span *ngIf="!t.frete_total" class="muted">—</span>
            </td>
            <td [class.positivo]="(t.resultado_liquido || 0) > 0" [class.negativo]="(t.resultado_liquido || 0) < 0">
              <strong *ngIf="t.resultado_liquido != null">R$ {{ t.resultado_liquido | number:'1.2-2':'pt-BR' }}</strong>
              <span *ngIf="t.resultado_liquido == null" class="muted">—</span>
            </td>
            <td>
              <span class="status-chip" [class]="'status-' + statusClass(t.status)">
                {{ t.status || 'Em andamento' }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="icon-btn" (click)="openForm(t)" matTooltip="Editar">
                <mat-icon>edit</mat-icon>
              </button>
              <button class="icon-btn danger-btn" (click)="remover(t)" matTooltip="Remover">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </tr>
          <tr *ngIf="!loading() && filtered().length === 0">
            <td colspan="8" class="empty-row">
              <mat-icon>search_off</mat-icon>
              <span>Nenhum transporte encontrado.</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 12px; margin-bottom: 20px;
    }
    .page-title { display: flex; align-items: center; gap: 10px; }
    .page-title mat-icon { color: #3b82f6; font-size: 28px; width: 28px; height: 28px; }
    h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0; }
    .count-badge { background: #e0e7ff; color: #3730a3; font-size: 12px; font-weight: 700; border-radius: 20px; padding: 2px 10px; }
    .header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .date-input {
      border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 8px 12px;
      font-size: 13px; color: #1e293b; background: white; font-family: inherit; outline: none; cursor: pointer;
      &:focus { border-color: #3b82f6; }
    }
    .search-box {
      display: flex; align-items: center; gap: 8px;
      background: white; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 0 12px; width: 220px;
      &:focus-within { border-color: #3b82f6; }
      mat-icon { color: #94a3b8; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
      input { border: none; outline: none; font-size: 14px; color: #1e293b; padding: 9px 0; background: transparent; font-family: inherit; flex: 1; }
    }
    .clear-btn { background: none; border: none; cursor: pointer; display: flex; padding: 0; color: #94a3b8; &:hover { color: #475569; } }
    .btn-novo {
      display: flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none;
      border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 600;
      cursor: pointer; font-family: inherit; white-space: nowrap; transition: opacity 0.2s;
      &:hover { opacity: 0.9; }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .progress-bar { margin-bottom: 16px; border-radius: 4px; }
    .summary-cards { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .summary-card {
      background: white; border-radius: 12px; padding: 16px 20px;
      display: flex; align-items: center; gap: 14px; border: 1px solid #e2e8f0; flex: 1; min-width: 140px;
      mat-icon { font-size: 28px; width: 28px; height: 28px; }
      &.blue   mat-icon { color: #3b82f6; }
      &.green  mat-icon { color: #059669; }
      &.purple mat-icon { color: #7c3aed; }
    }
    .summary-num { display: block; font-size: 17px; font-weight: 800; color: #0f172a; }
    .summary-label { font-size: 12px; color: #64748b; }
    .table-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
    .data-table {
      width: 100%; border-collapse: collapse;
      th { background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
      td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: #f8fafc; }
    }
    .veiculo-cell { display: flex; flex-direction: column; gap: 2px; }
    .placa-badge { background: #0f172a; color: #f8fafc; font-family: monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; padding: 2px 8px; border-radius: 5px; display: inline-block; }
    .carreta-sub { font-size: 11px; color: #94a3b8; font-family: monospace; }
    .rota { font-size: 13px; color: #374151; }
    .muted { color: #94a3b8; }
    .positivo strong { color: #15803d; }
    .negativo strong { color: #dc2626; }
    .status-chip {
      display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
      &.status-andamento  { background: #fef3c7; color: #92400e; }
      &.status-concluido  { background: #dcfce7; color: #15803d; }
      &.status-cancelado  { background: #fee2e2; color: #dc2626; }
    }
    .actions-cell { display: flex; gap: 4px; }
    .icon-btn {
      background: none; border: none; cursor: pointer; width: 30px; height: 30px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; color: #64748b; transition: background 0.15s, color 0.15s;
      &:hover { background: #f1f5f9; color: #1e293b; }
      mat-icon { font-size: 17px; width: 17px; height: 17px; }
    }
    .danger-btn:hover { background: #fee2e2 !important; color: #dc2626 !important; }
    .empty-row {
      text-align: center; padding: 48px 16px !important; color: #94a3b8;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    @media (max-width: 900px) {
      .search-box { width: 100%; }
      td:nth-child(4), th:nth-child(4) { display: none; }
    }
  `]
})
export class TransportesComponent implements OnInit {
  transportes = signal<Transporte[]>([]);
  loading = signal(false);
  search = '';
  filtroFrom = '';
  filtroTo = '';

  filtered = computed(() => {
    const q = this.search.toLowerCase();
    if (!q) return this.transportes();
    return this.transportes().filter(t =>
      t.placa?.toLowerCase().includes(q) ||
      t.motorista_nome?.toLowerCase().includes(q) ||
      t.origem?.toLowerCase().includes(q) ||
      t.destino?.toLowerCase().includes(q) ||
      t.contrato_frete?.toLowerCase().includes(q)
    );
  });

  get totalFrete(): number {
    return this.filtered().reduce((s, t) => s + (Number(t.frete_total) || 0), 0);
  }
  get totalResultado(): number {
    return this.filtered().reduce((s, t) => s + (Number(t.resultado_liquido) || 0), 0);
  }

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    const now = new Date();
    this.filtroFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    this.filtroTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params: Record<string, string> = {};
    if (this.filtroFrom) params['from'] = this.filtroFrom;
    if (this.filtroTo)   params['to']   = this.filtroTo;
    this.api.get<Transporte[]>('transportes', params).subscribe({
      next: data => { this.transportes.set(data); this.loading.set(false); },
      error: () => { this.transportes.set([]); this.loading.set(false); }
    });
  }

  openForm(transporte?: Transporte) {
    const ref = this.dialog.open(TransporteFormComponent, {
      data: transporte || null,
      width: '860px',
      maxWidth: '95vw'
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  remover(t: Transporte) {
    const label = t.placa ? `do veículo ${t.placa}` : '';
    if (!confirm(`Deseja remover o transporte ${label} de ${this.formatDate(t.data)}?`)) return;
    this.api.delete<Transporte>('transportes', t.id_transporte).subscribe({
      next: () => { this.snackBar.open('Transporte removido.', 'OK', { duration: 3000 }); this.load(); },
      error: () => this.snackBar.open('Erro ao remover.', 'OK', { duration: 3000 })
    });
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
  }

  statusClass(status?: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('conclu')) return 'concluido';
    if (s.includes('cancel')) return 'cancelado';
    return 'andamento';
  }
}
