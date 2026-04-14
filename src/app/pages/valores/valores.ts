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
import { ValorCombustivel } from '../../core/models';
import { ValorFormComponent } from './valor-form.component';

@Component({
  selector: 'app-valores',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTooltipModule, MatDialogModule, MatSnackBarModule
  ],
  template: `
    <div class="page-header">
      <div class="page-title">
        <mat-icon>price_change</mat-icon>
        <h1>Valores Combustível</h1>
        <span class="count-badge">{{ filtered().length }}</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar por tipo ou responsável…" [(ngModel)]="search" />
          <button *ngIf="search" class="clear-btn" (click)="search=''">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <button class="btn-novo" (click)="openForm()">
          <mat-icon>add</mat-icon>
          Novo Valor
        </button>
      </div>
    </div>

    <mat-progress-bar *ngIf="loading()" mode="indeterminate" class="progress-bar"></mat-progress-bar>

    <!-- Cards com preço mais recente por tipo -->
    <div class="summary-cards">
      <div class="summary-card" *ngFor="let c of ultimosPorTipo">
        <div class="fuel-icon" [style.background]="fuelBg(c.tipo_combustivel)">
          <mat-icon [style.color]="fuelColor(c.tipo_combustivel)">local_gas_station</mat-icon>
        </div>
        <div>
          <span class="fuel-label">{{ c.tipo_combustivel }}</span>
          <span class="fuel-valor">R$ {{ formatValor(c.valor) }}</span>
        </div>
      </div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Tipo de Combustível</th>
            <th>Valor (R$/L)</th>
            <th>Data / Hora</th>
            <th>Responsável</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let v of filtered()">
            <td>
              <span class="fuel-badge" [style.background]="fuelBg(v.tipo_combustivel)" [style.color]="fuelColor(v.tipo_combustivel)">
                {{ v.tipo_combustivel }}
              </span>
            </td>
            <td><span class="valor-text">R$ {{ formatValor(v.valor) }}</span></td>
            <td class="muted">{{ formatDate(v.data) }}</td>
            <td>{{ v.responsavel || '—' }}</td>
            <td class="actions-cell">
              <button class="icon-btn" (click)="openForm(v)" matTooltip="Editar">
                <mat-icon>edit</mat-icon>
              </button>
              <button class="icon-btn danger-btn" (click)="remover(v)" matTooltip="Remover">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </tr>
          <tr *ngIf="!loading() && filtered().length === 0">
            <td colspan="5" class="empty-row">
              <mat-icon>search_off</mat-icon>
              <span>Nenhum valor encontrado.</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 16px; margin-bottom: 20px;
    }
    .page-title { display: flex; align-items: center; gap: 10px; }
    .page-title mat-icon { color: #3b82f6; font-size: 28px; width: 28px; height: 28px; }
    h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0; }
    .count-badge { background: #e0e7ff; color: #3730a3; font-size: 12px; font-weight: 700; border-radius: 20px; padding: 2px 10px; }
    .header-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .search-box {
      display: flex; align-items: center; gap: 8px;
      background: white; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 0 12px; width: 260px;
      &:focus-within { border-color: #3b82f6; }
      mat-icon { color: #94a3b8; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
      input { border: none; outline: none; font-size: 14px; color: #1e293b; padding: 10px 0; background: transparent; font-family: inherit; flex: 1; }
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
      background: white; border-radius: 12px; padding: 14px 18px;
      display: flex; align-items: center; gap: 12px; border: 1px solid #e2e8f0; flex: 1; min-width: 140px;
    }
    .fuel-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .fuel-label { display: block; font-size: 12px; color: #64748b; font-weight: 500; }
    .fuel-valor { display: block; font-size: 18px; font-weight: 800; color: #0f172a; }
    .table-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
    .data-table {
      width: 100%; border-collapse: collapse;
      th { background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; }
      td { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: #f8fafc; }
    }
    .fuel-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .valor-text { font-size: 15px; font-weight: 700; color: #0f172a; }
    .muted { color: #94a3b8; font-size: 13px; }
    .actions-cell { display: flex; gap: 4px; }
    .icon-btn {
      background: none; border: none; cursor: pointer; width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; color: #64748b; transition: background 0.15s, color 0.15s;
      &:hover { background: #f1f5f9; color: #1e293b; }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .danger-btn:hover { background: #fee2e2 !important; color: #dc2626 !important; }
    .empty-row {
      text-align: center; padding: 48px 16px !important; color: #94a3b8;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    @media (max-width: 768px) { .search-box { width: 100%; } }
  `]
})
export class ValoresComponent implements OnInit {
  valores = signal<ValorCombustivel[]>([]);
  loading = signal(false);
  search = '';

  filtered = computed(() => {
    const q = this.search.toLowerCase();
    if (!q) return this.valores();
    return this.valores().filter(v =>
      v.tipo_combustivel?.toLowerCase().includes(q) ||
      v.responsavel?.toLowerCase().includes(q)
    );
  });

  // Último registro por tipo de combustível
  get ultimosPorTipo(): { tipo_combustivel: string; valor: number }[] {
    const mapa = new Map<string, ValorCombustivel>();
    for (const v of this.valores()) {
      if (!mapa.has(v.tipo_combustivel)) mapa.set(v.tipo_combustivel, v);
    }
    return Array.from(mapa.values());
  }

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<ValorCombustivel[]>('valores').subscribe({
      next: data => { this.valores.set(data); this.loading.set(false); },
      error: () => { this.valores.set([]); this.loading.set(false); }
    });
  }

  openForm(valor?: ValorCombustivel) {
    const ref = this.dialog.open(ValorFormComponent, {
      data: valor || null,
      width: '560px',
      maxWidth: '95vw'
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  remover(v: ValorCombustivel) {
    if (!confirm(`Deseja remover o registro de ${v.tipo_combustivel} (R$ ${this.formatValor(v.valor)})?`)) return;
    this.api.delete<ValorCombustivel>('valores', v.id_valor).subscribe({
      next: () => { this.snackBar.open('Registro removido.', 'OK', { duration: 3000 }); this.load(); },
      error: () => this.snackBar.open('Erro ao remover.', 'OK', { duration: 3000 })
    });
  }

  formatValor(v?: number): string {
    if (v == null) return '—';
    return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
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
