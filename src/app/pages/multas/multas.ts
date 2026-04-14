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
import { Multa } from '../../core/models';
import { MultaFormComponent } from './multa-form.component';

@Component({
  selector: 'app-multas',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTooltipModule, MatDialogModule, MatSnackBarModule
  ],
  template: `
    <div class="page-header">
      <div class="page-title">
        <mat-icon>gavel</mat-icon>
        <h1>Multas</h1>
        <span class="count-badge">{{ filtered().length }}</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar por placa ou infração…" [(ngModel)]="search" />
          <button *ngIf="search" class="clear-btn" (click)="search=''"><mat-icon>close</mat-icon></button>
        </div>
        <select class="select-filter" [(ngModel)]="filtroStatus" (change)="load()">
          <option value="">Todos os status</option>
          <option value="Pendente">Pendente</option>
          <option value="Paga">Paga</option>
          <option value="Contestada">Contestada</option>
          <option value="Cancelada">Cancelada</option>
        </select>
        <button class="btn-novo" (click)="openForm()">
          <mat-icon>add</mat-icon>
          Nova Multa
        </button>
      </div>
    </div>

    <mat-progress-bar *ngIf="loading()" mode="indeterminate" class="progress-bar"></mat-progress-bar>

    <div class="summary-cards">
      <div class="summary-card red">
        <mat-icon>warning</mat-icon>
        <div>
          <span class="summary-num">{{ totalPendentes }}</span>
          <span class="summary-label">Pendentes</span>
        </div>
      </div>
      <div class="summary-card orange">
        <mat-icon>attach_money</mat-icon>
        <div>
          <span class="summary-num">R$ {{ valorPendente | number:'1.2-2':'pt-BR' }}</span>
          <span class="summary-label">Valor Pendente</span>
        </div>
      </div>
      <div class="summary-card gray">
        <mat-icon>gavel</mat-icon>
        <div>
          <span class="summary-num">{{ multas().length }}</span>
          <span class="summary-label">Total Registros</span>
        </div>
      </div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Data Infração</th>
            <th>Veículo</th>
            <th>Descrição / Enquadramento</th>
            <th>Local</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let m of filtered()" [class.row-paga]="m.status === 'Paga'" [class.row-cancelada]="m.status === 'Cancelada'">
            <td class="muted">{{ formatDate(asAny(m).data_infracao || m.data_emissao) }}</td>
            <td>
              <span class="placa-badge" *ngIf="m.placa">{{ m.placa }}</span>
              <span *ngIf="!m.placa" class="muted">—</span>
            </td>
            <td class="desc-cell">{{ truncate(asAny(m).descricao || m.enquadramento) }}</td>
            <td class="muted">{{ m.local_infracao || '—' }}</td>
            <td>
              <strong *ngIf="m.valor" [class.valor-pendente]="m.status === 'Pendente'">
                R$ {{ m.valor | number:'1.2-2':'pt-BR' }}
              </strong>
              <span *ngIf="!m.valor" class="muted">—</span>
            </td>
            <td [class.vencido]="isVencido(m)">
              {{ formatDate(m.data_vencimento) }}
            </td>
            <td>
              <span class="status-chip" [class]="'status-' + statusClass(m.status)">
                {{ m.status || 'Pendente' }}
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
              <span>Nenhuma multa encontrada.</span>
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
    .search-box {
      display: flex; align-items: center; gap: 8px;
      background: white; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 0 12px; width: 240px;
      &:focus-within { border-color: #3b82f6; }
      mat-icon { color: #94a3b8; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
      input { border: none; outline: none; font-size: 14px; color: #1e293b; padding: 9px 0; background: transparent; font-family: inherit; flex: 1; }
    }
    .clear-btn { background: none; border: none; cursor: pointer; display: flex; padding: 0; color: #94a3b8; &:hover { color: #475569; } }
    .select-filter {
      border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 8px 12px;
      font-size: 13px; color: #1e293b; background: white; font-family: inherit; outline: none; cursor: pointer;
      &:focus { border-color: #3b82f6; }
    }
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
      &.red    mat-icon { color: #dc2626; }
      &.orange mat-icon { color: #d97706; }
      &.gray   mat-icon { color: #64748b; }
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
    .row-paga td { opacity: 0.6; }
    .row-cancelada td { opacity: 0.4; text-decoration: line-through; }
    .placa-badge { background: #0f172a; color: #f8fafc; font-family: monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; padding: 2px 8px; border-radius: 5px; }
    .desc-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .muted { color: #94a3b8; }
    .valor-pendente { color: #dc2626; }
    .vencido { color: #dc2626; font-weight: 600; }
    .status-chip {
      display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
      &.status-pendente   { background: #fee2e2; color: #dc2626; }
      &.status-paga       { background: #dcfce7; color: #15803d; }
      &.status-contestada { background: #fef3c7; color: #92400e; }
      &.status-cancelada  { background: #f1f5f9; color: #64748b; }
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
export class MultasComponent implements OnInit {
  multas = signal<Multa[]>([]);
  loading = signal(false);
  search = '';
  filtroStatus = '';

  filtered = computed(() => {
    const q = this.search.toLowerCase();
    return this.multas().filter(m => {
      const a = m as any;
      const matchSearch = !q ||
        m.placa?.toLowerCase().includes(q) ||
        (a.descricao || m.enquadramento || '').toLowerCase().includes(q) ||
        (m.local_infracao || '').toLowerCase().includes(q);
      const matchStatus = !this.filtroStatus || m.status === this.filtroStatus;
      return matchSearch && matchStatus;
    });
  });

  get totalPendentes(): number {
    return this.multas().filter(m => m.status === 'Pendente').length;
  }
  get valorPendente(): number {
    return this.multas().filter(m => m.status === 'Pendente').reduce((s, m) => s + (Number(m.valor) || 0), 0);
  }

  asAny(m: Multa): any { return m; }

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<Multa[]>('multas').subscribe({
      next: data => { this.multas.set(data); this.loading.set(false); },
      error: () => { this.multas.set([]); this.loading.set(false); }
    });
  }

  openForm(multa?: Multa) {
    const ref = this.dialog.open(MultaFormComponent, {
      data: multa || null,
      width: '660px',
      maxWidth: '95vw'
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  remover(m: Multa) {
    const label = m.placa ? `da placa ${m.placa}` : '';
    if (!confirm(`Deseja remover a multa ${label}?`)) return;
    this.api.delete<Multa>('multas', m.id_multa).subscribe({
      next: () => { this.snackBar.open('Multa removida.', 'OK', { duration: 3000 }); this.load(); },
      error: () => this.snackBar.open('Erro ao remover.', 'OK', { duration: 3000 })
    });
  }

  isVencido(m: Multa): boolean {
    if (!m.data_vencimento || m.status === 'Paga' || m.status === 'Cancelada') return false;
    return new Date(m.data_vencimento) < new Date();
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
  }

  truncate(s?: string, max = 45): string {
    if (!s) return '—';
    return s.length > max ? s.slice(0, max) + '…' : s;
  }

  statusClass(status?: string): string {
    return (status || 'pendente').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}
