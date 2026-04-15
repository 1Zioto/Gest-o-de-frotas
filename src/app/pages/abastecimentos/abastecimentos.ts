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
import { Abastecimento } from '../../core/models';
import { AbastecimentoFormComponent } from './abastecimento-form.component';

@Component({
  selector: 'app-abastecimentos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTooltipModule, MatDialogModule, MatSnackBarModule
  ],
  template: `
    <div class="page-header">
      <div class="page-title">
        <mat-icon>local_gas_station</mat-icon>
        <h1>Abastecimentos</h1>
        <span class="count-badge">{{ filtered().length }}</span>
      </div>
      <div class="header-actions">
        <input type="date" class="date-input" [(ngModel)]="filtroFrom" (change)="load()" title="De">
        <input type="date" class="date-input" [(ngModel)]="filtroTo" (change)="load()" title="Até">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar por placa ou combustível…" [(ngModel)]="search" />
          <button *ngIf="search" class="clear-btn" (click)="search=''"><mat-icon>close</mat-icon></button>
        </div>
        <button class="btn-novo" (click)="openForm()">
          <mat-icon>add</mat-icon>
          Novo Abastecimento
        </button>
      </div>
    </div>

    <mat-progress-bar *ngIf="loading()" mode="indeterminate" class="progress-bar"></mat-progress-bar>

    <!-- Cards de resumo -->
    <div class="summary-cards">
      <div class="summary-card blue">
        <mat-icon>local_gas_station</mat-icon>
        <div>
          <span class="summary-num">{{ filtered().length }}</span>
          <span class="summary-label">Registros</span>
        </div>
      </div>
      <div class="summary-card green">
        <mat-icon>water_drop</mat-icon>
        <div>
          <span class="summary-num">{{ fmtNum(totalLitros, 0) }} L</span>
          <span class="summary-label">Total Litros</span>
        </div>
      </div>
      <div class="summary-card orange">
        <mat-icon>attach_money</mat-icon>
        <div>
          <span class="summary-num">{{ fmtBRL(totalGasto) }}</span>
          <span class="summary-label">Total Gasto</span>
        </div>
      </div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Veículo</th>
            <th>Combustível</th>
            <th>Litros</th>
            <th>Vlr/L</th>
            <th>Total</th>
            <th>KM</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let a of filtered()">
            <td class="muted">{{ formatDate(a.data) }}</td>
            <td>
              <div class="veiculo-cell">
                <span class="placa-badge">{{ a.placa || '—' }}</span>
                <span *ngIf="a.modelo" class="sub">{{ a.modelo }}</span>
              </div>
            </td>
            <td>
              <span *ngIf="a.tipo_combustivel" class="fuel-badge"
                [style.background]="fuelBg(a.tipo_combustivel)"
                [style.color]="fuelColor(a.tipo_combustivel)">
                {{ a.tipo_combustivel }}
              </span>
              <span *ngIf="!a.tipo_combustivel" class="muted">—</span>
            </td>
            <td>{{ a.litros ? fmtNum(a.litros, 3) + ' L' : '—' }}</td>
            <td class="muted">{{ a.valor_litro ? fmtBRL(a.valor_litro, 4) : '—' }}</td>
            <td><strong>{{ a.valor_total ? fmtBRL(a.valor_total) : '—' }}</strong></td>
            <td class="muted">{{ asAny(a).km_atual ? (asAny(a).km_atual | number:'1.0-0':'pt-BR') + ' km' : '—' }}</td>
            <td class="actions-cell">
              <button class="icon-btn" (click)="openForm(a)" matTooltip="Editar">
                <mat-icon>edit</mat-icon>
              </button>
              <button class="icon-btn danger-btn" (click)="remover(a)" matTooltip="Remover">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </tr>
          <tr *ngIf="!loading() && filtered().length === 0">
            <td colspan="8" class="empty-row">
              <mat-icon>search_off</mat-icon>
              <span>Nenhum abastecimento encontrado.</span>
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
      font-size: 13px; color: #1e293b; background: white; font-family: inherit;
      outline: none; cursor: pointer;
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
      &.green mat-icon { color: #059669; }
      &.orange mat-icon { color: #d97706; }
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
    .fuel-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .muted { color: #94a3b8; }
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
      td:nth-child(5), td:nth-child(7), th:nth-child(5), th:nth-child(7) { display: none; }
    }
  `]
})
export class AbastecimentosComponent implements OnInit {
  abastecimentos = signal<Abastecimento[]>([]);
  loading = signal(false);
  search = '';
  filtroFrom = '';
  filtroTo = '';

  filtered = computed(() => {
    const q = this.search.toLowerCase();
    if (!q) return this.abastecimentos();
    return this.abastecimentos().filter(a =>
      a.placa?.toLowerCase().includes(q) ||
      a.tipo_combustivel?.toLowerCase().includes(q) ||
      a.modelo?.toLowerCase().includes(q)
    );
  });

  get totalLitros(): number {
    return this.filtered().reduce((s, a) => s + (Number(a.litros) || 0), 0);
  }
  get totalGasto(): number {
    return this.filtered().reduce((s, a) => s + (Number(a.valor_total) || 0), 0);
  }

  asAny(a: Abastecimento): any { return a; }

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // Filtro padrão: mês atual
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
    this.api.get<Abastecimento[]>('abastecimentos', params).subscribe({
      next: data => { this.abastecimentos.set(data); this.loading.set(false); },
      error: () => { this.abastecimentos.set([]); this.loading.set(false); }
    });
  }

  openForm(abastecimento?: Abastecimento) {
    const ref = this.dialog.open(AbastecimentoFormComponent, {
      data: abastecimento || null,
      width: '680px',
      maxWidth: '95vw'
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  remover(a: Abastecimento) {
    const label = a.placa ? `do veículo ${a.placa}` : '';
    if (!confirm(`Deseja remover o abastecimento ${label} de ${this.formatDate(a.data)}?`)) return;
    this.api.delete<Abastecimento>('abastecimentos', a.id_abastecimento).subscribe({
      next: () => { this.snackBar.open('Abastecimento removido.', 'OK', { duration: 3000 }); this.load(); },
      error: () => this.snackBar.open('Erro ao remover.', 'OK', { duration: 3000 })
    });
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    // Neon devolve datas como ISO completo ("2026-01-15T00:00:00.000Z") ou só data ("2026-01-15")
    const dateOnly = d.includes('T') ? d.slice(0, 10) : d;
    return new Date(dateOnly + 'T12:00:00').toLocaleDateString('pt-BR');
  }

  // Formata número sem depender do locale registrado no Angular
  fmtNum(value: any, decimals = 2): string {
    const n = Number(value);
    if (isNaN(n)) return '—';
    return n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  fmtBRL(value: any, decimals = 2): string {
    const n = Number(value);
    if (isNaN(n)) return '—';
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  fuelColor(tipo?: string): string {
    const map: Record<string, string> = {
      'Diesel S10': '#92400e', 'Diesel S500': '#78350f',
      'Gasolina': '#991b1b', 'Etanol': '#065f46', 'GNV': '#1e3a8a'
    };
    return map[tipo || ''] || '#374151';
  }

  fuelBg(tipo?: string): string {
    const map: Record<string, string> = {
      'Diesel S10': '#fef3c7', 'Diesel S500': '#fde68a',
      'Gasolina': '#fee2e2', 'Etanol': '#d1fae5', 'GNV': '#dbeafe'
    };
    return map[tipo || ''] || '#f1f5f9';
  }
}
