import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/services/api.service';

interface BalanceteRow {
  id: number;
  cte?: string;
  data?: string;
  cliente?: string;
  remetente?: string;
  destinatario?: string;
  motorista?: string;
  placa_cavalo?: string;
  frete_emp?: number;
  valor_mercadoria?: number;
  lucro?: number;
  vgm?: string;
  vipe?: string;
  despesa?: string;
  check_status?: string;
  cidade_remetente?: string;
  cidade_destinatario?: string;
}

interface BalanceteResponse {
  rows: BalanceteRow[];
  stats: {
    total: number;
    finalizados: number;
    pendentes: number;
    total_frete: number;
  };
}

@Component({
  selector: 'app-balancete',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="page-header">
      <div class="page-title">
        <mat-icon>balance</mat-icon>
        <h1>Balancete</h1>
        <span class="count-badge">{{ stats().total || filtered().length }}</span>
      </div>
      <div class="search-box">
        <mat-icon>search</mat-icon>
        <input type="text" placeholder="Buscar CTE, cliente, motorista, placa ou VGM..." [(ngModel)]="search" (keyup.enter)="load()" />
        <button type="button" (click)="load()">Buscar</button>
      </div>
    </div>

    <mat-progress-bar *ngIf="loading()" mode="indeterminate" class="progress-bar"></mat-progress-bar>

    <div class="summary-cards">
      <div class="summary-card yellow"><mat-icon>pending_actions</mat-icon><div><strong>{{ stats().pendentes || 0 }}</strong><span>Pendente</span></div></div>
      <div class="summary-card green"><mat-icon>check_circle</mat-icon><div><strong>{{ stats().finalizados || 0 }}</strong><span>Finalizado</span></div></div>
      <div class="summary-card blue"><mat-icon>payments</mat-icon><div><strong>{{ fmtBRL(stats().total_frete) }}</strong><span>Total Frete</span></div></div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Balancete</th>
            <th>Data</th>
            <th>Cliente</th>
            <th>Rota</th>
            <th>Motorista</th>
            <th>Placa</th>
            <th>VGM</th>
            <th>Frete</th>
            <th>Lucro</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of filtered()">
            <td><span class="status" [class.done]="isDone(row)">{{ isDone(row) ? 'Finalizado' : 'Pendente' }}</span></td>
            <td class="strong">{{ row.cte }} - {{ row.cliente || row.remetente }}</td>
            <td>{{ fmtDate(row.data) }}</td>
            <td>{{ row.cliente || '—' }}</td>
            <td>{{ row.cidade_remetente || '—' }} → {{ row.cidade_destinatario || '—' }}</td>
            <td>{{ row.motorista || '—' }}</td>
            <td><span class="plate">{{ row.placa_cavalo || '—' }}</span></td>
            <td>{{ row.vgm || '—' }}</td>
            <td class="money">{{ fmtBRL(row.frete_emp) }}</td>
            <td class="money">{{ fmtBRL(row.lucro) }}</td>
          </tr>
          <tr *ngIf="!loading() && filtered().length === 0">
            <td colspan="10" class="empty">Nenhum registro encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:18px; flex-wrap:wrap; }
    .page-title { display:flex; align-items:center; gap:10px; }
    .page-title mat-icon { color:#f59e0b; font-size:28px; width:28px; height:28px; }
    h1 { margin:0; font-size:22px; font-weight:700; color:#0f172a; }
    .count-badge { background:#fff7ed; color:#c2410c; border-radius:20px; padding:2px 10px; font-size:12px; font-weight:800; }
    .search-box { display:flex; align-items:center; gap:8px; background:white; border:1px solid #e2e8f0; border-radius:10px; padding:0 10px; min-width:360px; }
    .search-box mat-icon { color:#94a3b8; font-size:18px; width:18px; height:18px; }
    .search-box input { border:0; outline:0; padding:10px 0; flex:1; font-family:inherit; font-size:13px; }
    .search-box button { border:0; background:#ffc400; color:#111827; border-radius:7px; padding:6px 12px; font-weight:700; cursor:pointer; }
    .progress-bar { margin-bottom:16px; }
    .summary-cards { display:grid; grid-template-columns:repeat(3, minmax(180px, 1fr)); gap:12px; margin-bottom:18px; }
    .summary-card { background:white; border:1px solid #e2e8f0; border-left:4px solid; border-radius:12px; padding:14px; display:flex; align-items:center; gap:12px; }
    .summary-card mat-icon { font-size:24px; width:24px; height:24px; }
    .summary-card strong { display:block; font-size:18px; color:#0f172a; }
    .summary-card span { color:#64748b; font-size:12px; }
    .yellow { border-left-color:#f59e0b; } .yellow mat-icon { color:#f59e0b; }
    .green { border-left-color:#16a34a; } .green mat-icon { color:#16a34a; }
    .blue { border-left-color:#2563eb; } .blue mat-icon { color:#2563eb; }
    .table-card { background:white; border:1px solid #e2e8f0; border-radius:12px; overflow:auto; }
    .data-table { width:100%; border-collapse:collapse; min-width:1120px; }
    th { background:#f8fafc; color:#64748b; font-size:11px; text-transform:uppercase; letter-spacing:.04em; padding:11px 12px; text-align:left; border-bottom:1px solid #e2e8f0; }
    td { padding:11px 12px; font-size:13px; color:#1e293b; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
    tr:hover td { background:#f8fafc; }
    .strong { font-weight:700; }
    .money { font-weight:700; text-align:right; }
    .plate { font-family:monospace; background:#e2e8f0; border-radius:5px; padding:2px 7px; font-weight:700; }
    .status { display:inline-block; border-radius:20px; padding:3px 9px; background:#fffbeb; color:#d97706; font-size:11px; font-weight:700; }
    .status.done { background:#ecfdf5; color:#059669; }
    .empty { text-align:center; color:#94a3b8; padding:36px !important; }
    @media(max-width:720px) { .search-box { min-width:100%; } .summary-cards { grid-template-columns:1fr; } }
  `]
})
export class BalanceteComponent implements OnInit {
  rows = signal<BalanceteRow[]>([]);
  stats = signal<BalanceteResponse['stats']>({ total: 0, finalizados: 0, pendentes: 0, total_frete: 0 });
  loading = signal(false);
  search = '';

  filtered = computed(() => this.rows());

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params = this.search.trim() ? { q: this.search.trim() } : undefined;
    this.api.get<BalanceteResponse>('balancete', params).subscribe({
      next: response => {
        this.rows.set(response.rows || []);
        this.stats.set(response.stats || { total: 0, finalizados: 0, pendentes: 0, total_frete: 0 });
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
      }
    });
  }

  isDone(row: BalanceteRow): boolean {
    return String(row.check_status || '').toLowerCase() === 'ok' || String(row.vipe || '').toLowerCase() === 'sim';
  }

  fmtDate(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
  }

  fmtBRL(value?: number): string {
    const n = Number(value || 0);
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
