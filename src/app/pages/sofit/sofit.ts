import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/services/api.service';

interface SofitRow {
  id: number;
  external_id?: string;
  vehicle_id?: string;
  data?: string;
  foreseen_start_date?: string;
  foreseen_finish_date?: string;
  status?: string;
  route_id?: string;
  observation?: string;
  employee_id?: string;
  id_interno?: string;
  trip_id?: number;
  id_novo?: string;
  percentual?: number;
  quantidade?: number;
  beneficio?: number;
}

interface SofitResponse {
  rows: SofitRow[];
  stats: {
    total: number;
    finalizados: number;
    veiculos: number;
    total_beneficio: number;
  };
}

@Component({
  selector: 'app-sofit',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="page-header">
      <div class="page-title">
        <mat-icon>route</mat-icon>
        <h1>Sofit</h1>
        <span class="count-badge">{{ stats().total || rows().length }}</span>
      </div>
      <div class="search-box">
        <mat-icon>search</mat-icon>
        <input type="text" placeholder="Buscar placa, motorista, VGM ou status..." [(ngModel)]="search" (keyup.enter)="load()" />
        <button type="button" (click)="load()">Buscar</button>
      </div>
      <button class="primary-btn" type="button" (click)="newItem()"><mat-icon>add</mat-icon>Novo</button>
    </div>

    <mat-progress-bar *ngIf="loading()" mode="indeterminate" class="progress-bar"></mat-progress-bar>

    <div class="form-card" *ngIf="editing() as item">
      <div class="form-title">
        <strong>{{ item.id ? 'Editar Sofit' : 'Novo Sofit' }}</strong>
        <button type="button" (click)="cancelEdit()"><mat-icon>close</mat-icon></button>
      </div>
      <div class="form-grid">
        <label>External ID<input [(ngModel)]="item.external_id" /></label>
        <label>VGM<input [(ngModel)]="item.id_novo" /></label>
        <label>Veículo<input [(ngModel)]="item.vehicle_id" /></label>
        <label>Data<input type="datetime-local" [(ngModel)]="item.data" /></label>
        <label>Início Previsto<input type="datetime-local" [(ngModel)]="item.foreseen_start_date" /></label>
        <label>Fim Previsto<input type="datetime-local" [(ngModel)]="item.foreseen_finish_date" /></label>
        <label>Status<input [(ngModel)]="item.status" /></label>
        <label>Rota<input [(ngModel)]="item.route_id" /></label>
        <label>Motorista<input [(ngModel)]="item.employee_id" /></label>
        <label>ID Interno<input [(ngModel)]="item.id_interno" /></label>
        <label>Trip<input type="number" [(ngModel)]="item.trip_id" /></label>
        <label>Percentual<input type="number" step="0.01" [(ngModel)]="item.percentual" /></label>
        <label>Quantidade<input type="number" [(ngModel)]="item.quantidade" /></label>
        <label>Benefício<input type="number" [(ngModel)]="item.beneficio" /></label>
        <label class="span2">Observação<input [(ngModel)]="item.observation" /></label>
      </div>
      <div class="form-actions">
        <button type="button" class="secondary-btn" (click)="cancelEdit()">Cancelar</button>
        <button type="button" class="primary-btn" (click)="save(item)">Salvar</button>
      </div>
    </div>

    <div class="summary-cards">
      <div class="summary-card green"><mat-icon>check_circle</mat-icon><div><strong>{{ stats().finalizados || 0 }}</strong><span>Finalizados</span></div></div>
      <div class="summary-card blue"><mat-icon>directions_car</mat-icon><div><strong>{{ stats().veiculos || 0 }}</strong><span>Veículos</span></div></div>
      <div class="summary-card yellow"><mat-icon>redeem</mat-icon><div><strong>{{ fmtBRL(stats().total_beneficio) }}</strong><span>Benefício</span></div></div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>VGM</th>
            <th>Data</th>
            <th>Veículo</th>
            <th>Motorista</th>
            <th>Rota</th>
            <th>ID Interno</th>
            <th>Trip</th>
            <th>Percentual</th>
            <th>Qtd.</th>
            <th>Benefício</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of filtered()">
            <td><span class="status" [class.done]="isDone(row)">{{ row.status || '—' }}</span></td>
            <td class="strong">{{ row.id_novo || row.external_id || '—' }}</td>
            <td>{{ fmtDate(row.data) }}</td>
            <td><span class="plate">{{ row.vehicle_id || '—' }}</span></td>
            <td>{{ row.employee_id || '—' }}</td>
            <td>{{ row.route_id || '—' }}</td>
            <td>{{ row.id_interno || '—' }}</td>
            <td>{{ row.trip_id || '—' }}</td>
            <td>{{ fmtPct(row.percentual) }}</td>
            <td>{{ row.quantidade || '—' }}</td>
            <td class="money">{{ fmtBRL(row.beneficio) }}</td>
            <td class="actions">
              <button type="button" (click)="edit(row)" title="Editar"><mat-icon>edit</mat-icon></button>
              <button type="button" class="danger" (click)="remove(row)" title="Excluir"><mat-icon>delete</mat-icon></button>
            </td>
          </tr>
          <tr *ngIf="!loading() && filtered().length === 0">
            <td colspan="12" class="empty">Nenhum registro encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:18px; flex-wrap:wrap; }
    .page-title { display:flex; align-items:center; gap:10px; }
    .page-title mat-icon { color:#2563eb; font-size:28px; width:28px; height:28px; }
    h1 { margin:0; font-size:22px; font-weight:700; color:#0f172a; }
    .count-badge { background:#dbeafe; color:#1d4ed8; border-radius:20px; padding:2px 10px; font-size:12px; font-weight:800; }
    .search-box { display:flex; align-items:center; gap:8px; background:white; border:1px solid #e2e8f0; border-radius:10px; padding:0 10px; min-width:340px; }
    .search-box mat-icon { color:#94a3b8; font-size:18px; width:18px; height:18px; }
    .search-box input { border:0; outline:0; padding:10px 0; flex:1; font-family:inherit; font-size:13px; }
    .search-box button { border:0; background:#2563eb; color:white; border-radius:7px; padding:6px 12px; font-weight:700; cursor:pointer; }
    .primary-btn { display:flex; align-items:center; gap:6px; border:0; border-radius:10px; background:#2563eb; color:white; padding:10px 14px; font-weight:800; cursor:pointer; }
    .primary-btn mat-icon { font-size:18px; width:18px; height:18px; }
    .secondary-btn { border:1px solid #e2e8f0; border-radius:10px; background:white; color:#475569; padding:10px 14px; font-weight:700; cursor:pointer; }
    .progress-bar { margin-bottom:16px; }
    .form-card { background:white; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:18px; }
    .form-title { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; color:#0f172a; }
    .form-title button { border:0; background:#f1f5f9; border-radius:8px; cursor:pointer; width:32px; height:32px; display:flex; align-items:center; justify-content:center; }
    .form-grid { display:grid; grid-template-columns:repeat(5, minmax(150px, 1fr)); gap:10px; }
    .form-grid label { display:flex; flex-direction:column; gap:5px; font-size:12px; font-weight:700; color:#475569; }
    .form-grid input { height:36px; border:1px solid #e2e8f0; border-radius:8px; padding:0 10px; font-family:inherit; font-size:13px; }
    .span2 { grid-column:span 2; }
    .form-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:12px; }
    .summary-cards { display:grid; grid-template-columns:repeat(3, minmax(180px, 1fr)); gap:12px; margin-bottom:18px; }
    .summary-card { background:white; border:1px solid #e2e8f0; border-left:4px solid; border-radius:12px; padding:14px; display:flex; align-items:center; gap:12px; }
    .summary-card mat-icon { font-size:24px; width:24px; height:24px; }
    .summary-card strong { display:block; font-size:18px; color:#0f172a; }
    .summary-card span { color:#64748b; font-size:12px; }
    .green { border-left-color:#16a34a; } .green mat-icon { color:#16a34a; }
    .blue { border-left-color:#2563eb; } .blue mat-icon { color:#2563eb; }
    .yellow { border-left-color:#f59e0b; } .yellow mat-icon { color:#f59e0b; }
    .table-card { background:white; border:1px solid #e2e8f0; border-radius:12px; overflow:auto; }
    .data-table { width:100%; border-collapse:collapse; min-width:1100px; }
    th { background:#f8fafc; color:#64748b; font-size:11px; text-transform:uppercase; letter-spacing:.04em; padding:11px 12px; text-align:left; border-bottom:1px solid #e2e8f0; }
    td { padding:11px 12px; font-size:13px; color:#1e293b; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
    tr:hover td { background:#f8fafc; }
    .strong { font-weight:700; }
    .money { font-weight:700; text-align:right; }
    .plate { font-family:monospace; background:#e2e8f0; border-radius:5px; padding:2px 7px; font-weight:700; }
    .status { display:inline-block; border-radius:20px; padding:3px 9px; background:#f1f5f9; color:#475569; font-size:11px; font-weight:700; }
    .status.done { background:#ecfdf5; color:#059669; }
    .actions { display:flex; gap:4px; }
    .actions button { border:0; background:#f1f5f9; border-radius:8px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#475569; }
    .actions button.danger { color:#dc2626; background:#fee2e2; }
    .actions mat-icon { font-size:17px; width:17px; height:17px; }
    .empty { text-align:center; color:#94a3b8; padding:36px !important; }
    @media(max-width:1100px) { .form-grid { grid-template-columns:repeat(2, minmax(150px, 1fr)); } }
    @media(max-width:720px) { .search-box { min-width:100%; } .summary-cards { grid-template-columns:1fr; } .form-grid { grid-template-columns:1fr; } .span2 { grid-column:span 1; } }
  `]
})
export class SofitComponent implements OnInit {
  rows = signal<SofitRow[]>([]);
  stats = signal<SofitResponse['stats']>({ total: 0, finalizados: 0, veiculos: 0, total_beneficio: 0 });
  loading = signal(false);
  editing = signal<Partial<SofitRow> | null>(null);
  search = '';

  filtered = computed(() => this.rows());

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params = this.search.trim() ? { q: this.search.trim() } : undefined;
    this.api.get<SofitResponse>('sofit', params).subscribe({
      next: response => {
        this.rows.set(response.rows || []);
        this.stats.set(response.stats || { total: 0, finalizados: 0, veiculos: 0, total_beneficio: 0 });
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
      }
    });
  }

  isDone(row: SofitRow): boolean {
    return String(row.status || '').toLowerCase() === 'finalizado';
  }

  newItem() {
    const now = this.toInputDate(new Date());
    this.editing.set({
      vehicle_id: '',
      data: now,
      foreseen_start_date: now,
      status: 'Finalizado',
      route_id: 'Inicio de Viagem',
    });
  }

  edit(row: SofitRow) {
    this.editing.set({
      ...row,
      data: this.toInputDate(row.data),
      foreseen_start_date: this.toInputDate(row.foreseen_start_date),
      foreseen_finish_date: this.toInputDate(row.foreseen_finish_date),
    });
  }

  cancelEdit() {
    this.editing.set(null);
  }

  save(item: Partial<SofitRow>) {
    const request = item.id
      ? this.api.put<SofitRow>('sofit', String(item.id), item)
      : this.api.post<SofitRow>('sofit', item);

    request.subscribe({
      next: () => {
        this.editing.set(null);
        this.load();
      },
      error: error => alert(error.error?.error || 'Erro ao salvar Sofit.')
    });
  }

  remove(row: SofitRow) {
    if (!confirm(`Excluir o registro ${row.id_novo || row.external_id || row.id}?`)) return;
    this.api.delete('sofit', String(row.id)).subscribe({
      next: () => this.load(),
      error: error => alert(error.error?.error || 'Erro ao excluir Sofit.')
    });
  }

  fmtDate(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
  }

  fmtBRL(value?: number): string {
    const n = Number(value || 0);
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtPct(value?: number): string {
    const n = Number(value);
    return Number.isFinite(n) ? (n * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%' : '—';
  }

  private toInputDate(value?: string | Date): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
