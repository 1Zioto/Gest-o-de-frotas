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
import { Pneu } from '../../core/models';
import { PneuFormComponent } from './pneu-form.component';

@Component({
  selector: 'app-pneus',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTooltipModule, MatDialogModule, MatSnackBarModule
  ],
  template: `
    <div class="page-header">
      <div class="page-title">
        <mat-icon>tire_repair</mat-icon>
        <h1>Pneus</h1>
        <span class="count-badge">{{ filtered().length }}</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar por placa, marca ou medida…" [(ngModel)]="search" />
          <button *ngIf="search" class="clear-btn" (click)="search=''">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <button class="btn-novo" (click)="openForm()">
          <mat-icon>add</mat-icon>
          Novo Pneu
        </button>
      </div>
    </div>

    <mat-progress-bar *ngIf="loading()" mode="indeterminate" class="progress-bar"></mat-progress-bar>

    <div class="summary-cards">
      <div class="summary-card">
        <mat-icon>check_circle</mat-icon>
        <div>
          <span class="summary-num">{{ totalAtivos }}</span>
          <span class="summary-label">Ativos</span>
        </div>
      </div>
      <div class="summary-card inactive">
        <mat-icon>cancel</mat-icon>
        <div>
          <span class="summary-num">{{ totalInativos }}</span>
          <span class="summary-label">Inativos</span>
        </div>
      </div>
      <div class="summary-card total">
        <mat-icon>tire_repair</mat-icon>
        <div>
          <span class="summary-num">{{ pneus().length }}</span>
          <span class="summary-label">Total</span>
        </div>
      </div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nº</th>
            <th>Marca / Modelo</th>
            <th>Medida</th>
            <th>Veículo</th>
            <th>Posição</th>
            <th>Instalação</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of filtered()" [class.inactive-row]="!isAtivo(p)">
            <td><span class="num-badge">{{ p.numero ?? '—' }}</span></td>
            <td>
              <div class="marca-modelo">
                <span class="marca">{{ p.marca || '—' }}</span>
                <span *ngIf="p.modelo" class="sub">{{ p.modelo }}</span>
              </div>
            </td>
            <td><span class="medida">{{ p.medida || '—' }}</span></td>
            <td>
              <span *ngIf="p.placa" class="placa-badge">{{ p.placa }}</span>
              <span *ngIf="!p.placa" class="muted">—</span>
            </td>
            <td>{{ p.posicao || '—' }}</td>
            <td class="muted">{{ formatDate(p.data_instalacao) }}</td>
            <td>
              <span class="status-chip" [class]="statusClass(p)">{{ p.status || 'Ativo' }}</span>
            </td>
            <td class="actions-cell">
              <button class="icon-btn" (click)="openForm(p)" matTooltip="Editar">
                <mat-icon>edit</mat-icon>
              </button>
              <button class="icon-btn danger-btn" (click)="remover(p)" matTooltip="Remover">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </tr>
          <tr *ngIf="!loading() && filtered().length === 0">
            <td colspan="8" class="empty-row">
              <mat-icon>search_off</mat-icon>
              <span>Nenhum pneu encontrado.</span>
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
      background: white; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 0 12px; width: 280px;
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
      background: white; border-radius: 12px; padding: 16px 20px;
      display: flex; align-items: center; gap: 14px; border: 1px solid #e2e8f0; flex: 1; min-width: 130px;
      mat-icon { color: #3b82f6; font-size: 28px; width: 28px; height: 28px; }
      &.inactive mat-icon { color: #94a3b8; }
      &.total mat-icon { color: #f59e0b; }
    }
    .summary-num { display: block; font-size: 22px; font-weight: 800; color: #0f172a; }
    .summary-label { font-size: 12px; color: #64748b; }
    .table-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
    .data-table {
      width: 100%; border-collapse: collapse;
      th { background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; }
      td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: #f8fafc; }
    }
    .inactive-row td { opacity: 0.5; }
    .num-badge { background: #f1f5f9; color: #475569; font-weight: 700; font-size: 13px; border-radius: 6px; padding: 3px 8px; }
    .marca-modelo { display: flex; flex-direction: column; gap: 2px; }
    .marca { font-weight: 500; }
    .sub { font-size: 12px; color: #64748b; }
    .medida { font-family: monospace; font-size: 13px; color: #475569; }
    .placa-badge { background: #0f172a; color: #f8fafc; font-family: monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; padding: 3px 8px; border-radius: 5px; }
    .muted { color: #94a3b8; font-size: 13px; }
    .status-chip {
      display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
      background: #dcfce7; color: #15803d;
      &.inativo { background: #f1f5f9; color: #64748b; }
      &.substituido { background: #fef3c7; color: #92400e; }
    }
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
export class PneusComponent implements OnInit {
  pneus = signal<Pneu[]>([]);
  loading = signal(false);
  search = '';

  filtered = computed(() => {
    const q = this.search.toLowerCase();
    if (!q) return this.pneus();
    return this.pneus().filter(p =>
      p.placa?.toLowerCase().includes(q) ||
      p.marca?.toLowerCase().includes(q) ||
      p.medida?.toLowerCase().includes(q) ||
      p.posicao?.toLowerCase().includes(q) ||
      p.modelo?.toLowerCase().includes(q)
    );
  });

  isAtivo(p: Pneu): boolean {
    return (p.status || 'Ativo').toLowerCase() !== 'inativo';
  }

  statusClass(p: Pneu): string {
    const s = (p.status || 'Ativo').toLowerCase();
    if (s === 'inativo') return 'inativo';
    if (s === 'substituído' || s === 'substituido') return 'substituido';
    return '';
  }

  get totalAtivos()  { return this.pneus().filter(p => this.isAtivo(p)).length; }
  get totalInativos(){ return this.pneus().filter(p => !this.isAtivo(p)).length; }

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<Pneu[]>('pneus').subscribe({
      next: data => { this.pneus.set(data); this.loading.set(false); },
      error: () => { this.pneus.set([]); this.loading.set(false); }
    });
  }

  openForm(pneu?: Pneu) {
    const ref = this.dialog.open(PneuFormComponent, {
      data: pneu || null,
      width: '700px',
      maxWidth: '95vw'
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  remover(p: Pneu) {
    if (!confirm(`Deseja remover o pneu nº ${p.numero ?? p.id_pneu}?`)) return;
    this.api.delete<Pneu>('pneus', p.id_pneu).subscribe({
      next: () => { this.snackBar.open('Pneu removido.', 'OK', { duration: 3000 }); this.load(); },
      error: () => this.snackBar.open('Erro ao remover pneu.', 'OK', { duration: 3000 })
    });
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR');
  }
}
