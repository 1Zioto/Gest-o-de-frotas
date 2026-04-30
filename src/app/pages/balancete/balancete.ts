import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/services/api.service';

interface BalanceteRow {
  id: number;
  emissor?: string;
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
  tipo_operacao?: 'mercado_interno' | 'exportacao';
}

interface BalanceteResponse {
  rows: BalanceteRow[];
  stats: {
    total: number;
    finalizados: number;
    pendentes: number;
    mercado_interno: number;
    exportacao: number;
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
      <button class="primary-btn" type="button" (click)="newItem()"><mat-icon>add</mat-icon>Novo</button>
    </div>

    <mat-progress-bar *ngIf="loading()" mode="indeterminate" class="progress-bar"></mat-progress-bar>

    <div class="filter-pills">
      <button type="button" [class.active]="tipoFiltro === 'mercado_interno'" (click)="setTipo('mercado_interno')">Mercado Interno</button>
      <button type="button" [class.active]="tipoFiltro === 'exportacao'" (click)="setTipo('exportacao')">Exportação</button>
      <button type="button" [class.active]="tipoFiltro === ''" (click)="setTipo('')">Todos</button>
    </div>

    <div class="form-card" *ngIf="editing() as item">
      <div class="form-title">
        <strong>{{ item.id ? 'Editar Balancete' : 'Novo Balancete' }}</strong>
        <button type="button" (click)="cancelEdit()"><mat-icon>close</mat-icon></button>
      </div>
      <div class="form-grid">
        <label>Emissor<input [(ngModel)]="item.emissor" placeholder="Ex: 2456 - IVAN C" /></label>
        <label>CTE<input [(ngModel)]="item.cte" /></label>
        <label>Data<input type="datetime-local" [(ngModel)]="item.data" /></label>
        <label>Cliente<input [(ngModel)]="item.cliente" /></label>
        <label>Remetente<input [(ngModel)]="item.remetente" /></label>
        <label>Destinatário<input [(ngModel)]="item.destinatario" /></label>
        <label>Motorista<input [(ngModel)]="item.motorista" /></label>
        <label>Placa<input [(ngModel)]="item.placa_cavalo" /></label>
        <label>VGM<input [(ngModel)]="item.vgm" /></label>
        <label>Vipe<input [(ngModel)]="item.vipe" /></label>
        <label>Check<input [(ngModel)]="item.check_status" /></label>
        <label>Cidade Remetente<input [(ngModel)]="item.cidade_remetente" /></label>
        <label>Cidade Destinatário<input [(ngModel)]="item.cidade_destinatario" /></label>
        <label>Frete<input type="number" [(ngModel)]="item.frete_emp" /></label>
        <label>Mercadoria<input type="number" [(ngModel)]="item.valor_mercadoria" /></label>
        <label>Lucro<input type="number" [(ngModel)]="item.lucro" /></label>
      </div>
      <div class="form-actions">
        <button type="button" class="secondary-btn" (click)="cancelEdit()">Cancelar</button>
        <button type="button" class="primary-btn" (click)="save(item)">Salvar</button>
      </div>
    </div>

    <div class="summary-cards">
      <div class="summary-card orange"><mat-icon>local_shipping</mat-icon><div><strong>{{ stats().mercado_interno || 0 }}</strong><span>Mercado Interno</span></div></div>
      <div class="summary-card purple"><mat-icon>inventory_2</mat-icon><div><strong>{{ stats().exportacao || 0 }}</strong><span>Exportação</span></div></div>
      <div class="summary-card yellow"><mat-icon>pending_actions</mat-icon><div><strong>{{ stats().pendentes || 0 }}</strong><span>Pendente</span></div></div>
      <div class="summary-card green"><mat-icon>check_circle</mat-icon><div><strong>{{ stats().finalizados || 0 }}</strong><span>Finalizado</span></div></div>
      <div class="summary-card blue"><mat-icon>payments</mat-icon><div><strong>{{ fmtBRL(stats().total_frete) }}</strong><span>Total Frete</span></div></div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Tipo</th>
            <th>Balancete</th>
            <th>Emissor</th>
            <th>Data</th>
            <th>Cliente</th>
            <th>Rota</th>
            <th>Motorista</th>
            <th>Placa</th>
            <th>VGM</th>
            <th>Frete</th>
            <th>Lucro</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of filtered()">
            <td><span class="status" [class.done]="isDone(row)">{{ isDone(row) ? 'Finalizado' : 'Pendente' }}</span></td>
            <td><span class="tipo" [class.export]="isExportacao(row)">{{ isExportacao(row) ? 'Exportação' : 'Mercado Interno' }}</span></td>
            <td class="strong">{{ row.cte }} - {{ row.cliente || row.remetente }}</td>
            <td>{{ row.emissor || '—' }}</td>
            <td>{{ fmtDate(row.data) }}</td>
            <td>{{ row.cliente || '—' }}</td>
            <td>{{ row.cidade_remetente || '—' }} → {{ row.cidade_destinatario || '—' }}</td>
            <td>{{ row.motorista || '—' }}</td>
            <td><span class="plate">{{ row.placa_cavalo || '—' }}</span></td>
            <td>{{ row.vgm || '—' }}</td>
            <td class="money">{{ fmtBRL(row.frete_emp) }}</td>
            <td class="money">{{ fmtBRL(row.lucro) }}</td>
            <td class="actions">
              <button type="button" (click)="edit(row)" title="Editar"><mat-icon>edit</mat-icon></button>
              <button type="button" class="danger" (click)="remove(row)" title="Excluir"><mat-icon>delete</mat-icon></button>
            </td>
          </tr>
          <tr *ngIf="!loading() && filtered().length === 0">
            <td colspan="13" class="empty">Nenhum registro encontrado.</td>
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
    .primary-btn { display:flex; align-items:center; gap:6px; border:0; border-radius:10px; background:#ffc400; color:#111827; padding:10px 14px; font-weight:800; cursor:pointer; }
    .primary-btn mat-icon { font-size:18px; width:18px; height:18px; }
    .secondary-btn { border:1px solid #e2e8f0; border-radius:10px; background:white; color:#475569; padding:10px 14px; font-weight:700; cursor:pointer; }
    .progress-bar { margin-bottom:16px; }
    .filter-pills { display:flex; gap:6px; margin-bottom:16px; flex-wrap:wrap; }
    .filter-pills button { border:1px solid #e2e8f0; background:white; color:#475569; border-radius:999px; padding:7px 14px; font-weight:800; cursor:pointer; }
    .filter-pills button.active { background:#111827; color:white; border-color:#111827; }
    .form-card { background:white; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:18px; }
    .form-title { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; color:#0f172a; }
    .form-title button { border:0; background:#f1f5f9; border-radius:8px; cursor:pointer; width:32px; height:32px; display:flex; align-items:center; justify-content:center; }
    .form-grid { display:grid; grid-template-columns:repeat(5, minmax(150px, 1fr)); gap:10px; }
    .form-grid label { display:flex; flex-direction:column; gap:5px; font-size:12px; font-weight:700; color:#475569; }
    .form-grid input { height:36px; border:1px solid #e2e8f0; border-radius:8px; padding:0 10px; font-family:inherit; font-size:13px; }
    .form-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:12px; }
    .summary-cards { display:grid; grid-template-columns:repeat(5, minmax(150px, 1fr)); gap:12px; margin-bottom:18px; }
    .summary-card { background:white; border:1px solid #e2e8f0; border-left:4px solid; border-radius:12px; padding:14px; display:flex; align-items:center; gap:12px; }
    .summary-card mat-icon { font-size:24px; width:24px; height:24px; }
    .summary-card strong { display:block; font-size:18px; color:#0f172a; }
    .summary-card span { color:#64748b; font-size:12px; }
    .yellow { border-left-color:#f59e0b; } .yellow mat-icon { color:#f59e0b; }
    .orange { border-left-color:#ea580c; } .orange mat-icon { color:#ea580c; }
    .purple { border-left-color:#7c3aed; } .purple mat-icon { color:#7c3aed; }
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
    .tipo { display:inline-block; border-radius:20px; padding:3px 9px; background:#fff7ed; color:#c2410c; font-size:11px; font-weight:800; }
    .tipo.export { background:#f3e8ff; color:#7c3aed; }
    .actions { display:flex; gap:4px; }
    .actions button { border:0; background:#f1f5f9; border-radius:8px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#475569; }
    .actions button.danger { color:#dc2626; background:#fee2e2; }
    .actions mat-icon { font-size:17px; width:17px; height:17px; }
    .empty { text-align:center; color:#94a3b8; padding:36px !important; }
    @media(max-width:1100px) { .form-grid { grid-template-columns:repeat(2, minmax(150px, 1fr)); } }
    @media(max-width:720px) { .search-box { min-width:100%; } .summary-cards { grid-template-columns:1fr; } .form-grid { grid-template-columns:1fr; } }
  `]
})
export class BalanceteComponent implements OnInit {
  rows = signal<BalanceteRow[]>([]);
  stats = signal<BalanceteResponse['stats']>({ total: 0, finalizados: 0, pendentes: 0, mercado_interno: 0, exportacao: 0, total_frete: 0 });
  loading = signal(false);
  editing = signal<Partial<BalanceteRow> | null>(null);
  search = '';
  tipoFiltro: '' | 'mercado_interno' | 'exportacao' = 'mercado_interno';

  filtered = computed(() => this.rows());

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params: Record<string, string> = {};
    if (this.search.trim()) params['q'] = this.search.trim();
    if (this.tipoFiltro) params['tipo'] = this.tipoFiltro;
    this.api.get<BalanceteResponse>('balancete', params).subscribe({
      next: response => {
        this.rows.set(response.rows || []);
        this.stats.set(response.stats || { total: 0, finalizados: 0, pendentes: 0, mercado_interno: 0, exportacao: 0, total_frete: 0 });
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

  isExportacao(row: Partial<BalanceteRow>): boolean {
    const emissor = String(row.emissor || '').toLowerCase();
    return row.tipo_operacao === 'exportacao' || emissor === '2456 - ivan c' || emissor === '2451 - sthefany';
  }

  setTipo(tipo: '' | 'mercado_interno' | 'exportacao') {
    this.tipoFiltro = tipo;
    this.load();
  }

  newItem() {
    this.editing.set({
      cte: '',
      data: this.toInputDate(new Date()),
      cliente: '',
      vipe: 'Não',
      check_status: 'Pendente',
    });
  }

  edit(row: BalanceteRow) {
    this.editing.set({ ...row, data: this.toInputDate(row.data) });
  }

  cancelEdit() {
    this.editing.set(null);
  }

  save(item: Partial<BalanceteRow>) {
    const request = item.id
      ? this.api.put<BalanceteRow>('balancete', String(item.id), item)
      : this.api.post<BalanceteRow>('balancete', item);

    request.subscribe({
      next: () => {
        this.editing.set(null);
        this.load();
      },
      error: error => alert(error.error?.error || 'Erro ao salvar Balancete.')
    });
  }

  remove(row: BalanceteRow) {
    if (!confirm(`Excluir o balancete ${row.cte || row.id}?`)) return;
    this.api.delete('balancete', String(row.id)).subscribe({
      next: () => this.load(),
      error: error => alert(error.error?.error || 'Erro ao excluir Balancete.')
    });
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

  private toInputDate(value?: string | Date): string {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
