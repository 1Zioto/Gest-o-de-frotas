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
import { Manutencao } from '../../core/models';
import { ManutencaoFormComponent } from './manutencao-form.component';

@Component({
  selector: 'app-manutencoes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTooltipModule, MatDialogModule, MatSnackBarModule
  ],
  template: `
    <div class="page-header">
      <div class="page-title">
        <mat-icon>build</mat-icon>
        <h1>Manutenções</h1>
        <span class="count-badge">{{ filtered().length }}</span>
      </div>
      <div class="header-actions">
        <input type="date" class="date-input" [(ngModel)]="filtroFrom" (change)="load()" title="De">
        <input type="date" class="date-input" [(ngModel)]="filtroTo"   (change)="load()" title="Até">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar por placa ou descrição…" [(ngModel)]="search" />
          <button *ngIf="search" class="clear-btn" (click)="search=''"><mat-icon>close</mat-icon></button>
        </div>
        <button class="btn-novo" (click)="openForm()">
          <mat-icon>add</mat-icon>
          Nova Manutenção
        </button>
      </div>
    </div>

    <mat-progress-bar *ngIf="loading()" mode="indeterminate" class="progress-bar"></mat-progress-bar>

    <!-- Cards de resumo -->
    <div class="summary-cards">
      <div class="summary-card blue">
        <mat-icon>build</mat-icon>
        <div>
          <span class="summary-num">{{ filtered().length }}</span>
          <span class="summary-label">Registros</span>
        </div>
      </div>
      <div class="summary-card orange">
        <mat-icon>attach_money</mat-icon>
        <div>
          <span class="summary-num">R$ {{ totalGasto | number:'1.2-2':'pt-BR' }}</span>
          <span class="summary-label">Total Gasto</span>
        </div>
      </div>
      <div class="summary-card yellow">
        <mat-icon>pending</mat-icon>
        <div>
          <span class="summary-num">{{ totalEmAndamento }}</span>
          <span class="summary-label">Em Andamento</span>
        </div>
      </div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Veículo</th>
            <th>Tipo</th>
            <th>Descrição</th>
            <th>Oficina</th>
            <th>Total</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let m of filtered()">
            <td class="muted">{{ formatDate(asAny(m).data_abertura || m.data_manutencao) }}</td>
            <td>
              <div class="veiculo-cell">
                <span class="placa-badge">{{ m.placa || '—' }}</span>
                <span *ngIf="m.modelo" class="sub">{{ m.modelo }}</span>
              </div>
            </td>
            <td>
              <span *ngIf="asAny(m).tipo || m.tipo_manutencao" class="tipo-badge"
                [class]="'tipo-' + tipoClass(asAny(m).tipo || m.tipo_manutencao)">
                {{ asAny(m).tipo || m.tipo_manutencao }}
              </span>
              <span *ngIf="!asAny(m).tipo && !m.tipo_manutencao" class="muted">—</span>
            </td>
            <td class="desc-cell">{{ truncate(asAny(m).descricao || m.descricao_servico) }}</td>
            <td class="muted">{{ asAny(m).oficina || m.oficina_nome || '—' }}</td>
            <td>
              <strong *ngIf="asAny(m).valor_total || m.custo_total">
                R$ {{ ((asAny(m).valor_total || m.custo_total) | number:'1.2-2':'pt-BR') }}
              </strong>
              <span *ngIf="!asAny(m).valor_total && !m.custo_total" class="muted">—</span>
            </td>
            <td>
              <span class="status-chip" [class]="'status-' + statusClass(m.status)">
                {{ m.status || 'Concluída' }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="icon-btn" (click)="openForm(m)" matTooltip="Editar">
                <mat-icon>edit</mat-icon>
              </button>
              <button class="icon-btn danger-btn" (click)="remover(m)" matTooltip="Remover">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </tr>
          <tr *ngIf="!loading() && filtered().length === 0">
            <td colspan="8" class="empty-row">
              <mat-icon>search_off</mat-icon>
              <span>Nenhuma manutenção encontrada.</span>
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
      background: white; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 0 12px; width: 230px;
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
      &.blue mat-icon { color: #3b82f6; }
      &.orange mat-icon { color: #d97706; }
      &.yellow mat-icon { color: #ca8a04; }
    }
    .summary-num { display: block; font-size: 18px; font-weight: 800; color: #0f172a; }
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
    .sub { font-size: 11px; color: #94a3b8; }
    .tipo-badge {
      display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
      &.tipo-preventiva { background: #dbeafe; color: #1d4ed8; }
      &.tipo-corretiva  { background: #fee2e2; color: #dc2626; }
      &.tipo-preditiva  { background: #ede9fe; color: #7c3aed; }
    }
    .desc-cell { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .muted { color: #94a3b8; }
    .status-chip {
      display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
      &.status-concluida   { background: #dcfce7; color: #15803d; }
      &.status-andamento   { background: #fef3c7; color: #92400e; }
      &.status-agendada    { background: #dbeafe; color: #1d4ed8; }
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
      td.desc-cell, th:nth-child(4), td:nth-child(5), th:nth-child(5) { display: none; }
    }
  `]
})
export class ManutencoesComponent implements OnInit {
  manutencoes = signal<Manutencao[]>([]);
  loading = signal(false);
  search = '';
  filtroFrom = '';
  filtroTo = '';

  filtered = computed(() => {
    const q = this.search.toLowerCase();
    if (!q) return this.manutencoes();
    return this.manutencoes().filter(m => {
      const a = m as any;
      return m.placa?.toLowerCase().includes(q) ||
        (a.descricao || m.descricao_servico || '').toLowerCase().includes(q) ||
        (a.tipo || m.tipo_manutencao || '').toLowerCase().includes(q) ||
        (a.oficina || '').toLowerCase().includes(q);
    });
  });

  get totalGasto(): number {
    return this.filtered().reduce((s, m) => s + (Number((m as any).valor_total || m.custo_total) || 0), 0);
  }
  get totalEmAndamento(): number {
    return this.filtered().filter(m => (m.status || '').toLowerCase().includes('andamento')).length;
  }

  asAny(m: Manutencao): any { return m; }

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
    this.api.get<Manutencao[]>('manutencoes', params).subscribe({
      next: data => { this.manutencoes.set(data); this.loading.set(false); },
      error: () => { this.manutencoes.set([]); this.loading.set(false); }
    });
  }

  openForm(manutencao?: Manutencao) {
    const ref = this.dialog.open(ManutencaoFormComponent, {
      data: manutencao || null,
      width: '660px',
      maxWidth: '95vw'
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  remover(m: Manutencao) {
    if (!confirm(`Deseja remover esta manutenção?`)) return;
    this.api.delete<Manutencao>('manutencoes', m.id_manutencao).subscribe({
      next: () => { this.snackBar.open('Manutenção removida.', 'OK', { duration: 3000 }); this.load(); },
      error: () => this.snackBar.open('Erro ao remover.', 'OK', { duration: 3000 })
    });
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
  }

  truncate(s?: string, max = 40): string {
    if (!s) return '—';
    return s.length > max ? s.slice(0, max) + '…' : s;
  }

  tipoClass(tipo?: string): string {
    const t = (tipo || '').toLowerCase();
    if (t.includes('preventiva')) return 'preventiva';
    if (t.includes('corretiva'))  return 'corretiva';
    if (t.includes('preditiva'))  return 'preditiva';
    return '';
  }

  statusClass(status?: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('andamento')) return 'andamento';
    if (s.includes('agendada'))  return 'agendada';
    return 'concluida';
  }
}
