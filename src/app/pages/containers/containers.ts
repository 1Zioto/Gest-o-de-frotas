import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { Cte } from '../ctes/cte-form.component';

export interface ContainerViagem {
  id_container: string;
  codigo_viagem: string;
  id_embarque: string;
  codigo_embarque?: string;
  numero_container?: string;
  id_cte?: string;
  numero_cte?: string;
  origem_cidade?: string;
  origem_uf?: string;
  destino_cidade?: string;
  destino_uf?: string;
  status?: string;
  created_at?: string;
}

@Component({
  selector: 'app-containers',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressBarModule, MatSnackBarModule],
  template: `
    <div class="page-header">
      <div class="page-title">
        <mat-icon>view_in_ar</mat-icon>
        <h1>Containers</h1>
        <span class="count-badge">{{ filtered().length }}</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar VIPE, container, CT-e…" [(ngModel)]="search" />
        </div>
      </div>
    </div>

    <mat-progress-bar *ngIf="loading()" mode="indeterminate" class="progress-bar"></mat-progress-bar>

    <div class="summary-cards">
      <div class="summary-card" style="border-left-color:#0369a1">
        <span class="summary-num">{{ containers().length }}</span>
        <span class="summary-label">Viagens criadas</span>
      </div>
      <div class="summary-card" style="border-left-color:#166534">
        <span class="summary-num">{{ comContainer }}</span>
        <span class="summary-label">Com container</span>
      </div>
      <div class="summary-card" style="border-left-color:#7c3aed">
        <span class="summary-num">{{ comCte }}</span>
        <span class="summary-label">Com CT-e</span>
      </div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Viagem</th>
            <th>Embarque</th>
            <th>Rota</th>
            <th>Número do Container</th>
            <th>CT-e Vinculado</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of filtered()">
            <td><span class="vipe-badge">{{ c.codigo_viagem }}</span></td>
            <td><span class="emb-badge">{{ c.codigo_embarque || '—' }}</span></td>
            <td>
              <div class="rota">
                <span>{{ c.origem_cidade || '—' }}{{ c.origem_uf ? '/' + c.origem_uf : '' }}</span>
                <mat-icon>arrow_forward</mat-icon>
                <span>{{ c.destino_cidade || '—' }}{{ c.destino_uf ? '/' + c.destino_uf : '' }}</span>
              </div>
            </td>
            <td>
              <input class="field-input mono" [(ngModel)]="c.numero_container" placeholder="Digite o número" />
            </td>
            <td>
              <select class="field-input" [(ngModel)]="c.id_cte">
                <option value="">Nenhum</option>
                @for (cte of ctes(); track cte.id_cte) {
                  <option [value]="cte.id_cte">{{ cte.numero_cte }}{{ cte.codigo_embarque ? ' - ' + cte.codigo_embarque : '' }}</option>
                }
              </select>
            </td>
            <td><span class="status-chip">{{ c.status || 'pendente' }}</span></td>
            <td>
              <button class="btn-save-row" (click)="salvar(c)">
                <mat-icon>save</mat-icon>
                Salvar
              </button>
            </td>
          </tr>
          <tr *ngIf="!loading() && filtered().length === 0">
            <td colspan="7" class="empty-row">
              <mat-icon>inventory_2</mat-icon>
              <span>Nenhuma viagem/container gerada.</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:20px; }
    .page-title { display:flex; align-items:center; gap:10px; }
    .page-title mat-icon { color:#0369a1; font-size:28px; width:28px; height:28px; }
    h1 { font-size:22px; font-weight:700; color:#0f172a; margin:0; }
    .count-badge { background:#e0f2fe; color:#0369a1; font-size:12px; font-weight:700; border-radius:20px; padding:2px 10px; }
    .header-actions { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    .search-box { display:flex; align-items:center; gap:8px; background:white; border:1.5px solid #e2e8f0; border-radius:10px; padding:0 12px; width:280px; }
    .search-box:focus-within { border-color:#0ea5e9; }
    .search-box mat-icon { color:#94a3b8; font-size:18px; width:18px; height:18px; flex-shrink:0; }
    .search-box input { border:none; outline:none; font-size:13px; color:#1e293b; padding:9px 0; background:transparent; font-family:inherit; flex:1; }
    .progress-bar { margin-bottom:16px; border-radius:4px; }
    .summary-cards { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
    .summary-card { background:white; border-radius:12px; padding:14px 18px; display:flex; flex-direction:column; gap:2px; border:1px solid #e2e8f0; border-left:4px solid; flex:1; min-width:130px; }
    .summary-num { font-size:20px; font-weight:800; color:#0f172a; }
    .summary-label { font-size:11px; color:#64748b; }
    .table-card { background:white; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { background:#f8fafc; color:#64748b; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; padding:11px 14px; text-align:left; border-bottom:1px solid #e2e8f0; white-space:nowrap; }
    .data-table td { padding:12px 14px; border-bottom:1px solid #f1f5f9; font-size:13px; color:#1e293b; }
    .vipe-badge { background:#0f172a; color:#f8fafc; font-family:monospace; font-size:12px; font-weight:700; letter-spacing:0.05em; padding:3px 8px; border-radius:6px; white-space:nowrap; }
    .emb-badge { background:#e0f2fe; color:#0369a1; font-size:11px; font-weight:700; padding:2px 8px; border-radius:20px; white-space:nowrap; }
    .rota { display:flex; align-items:center; gap:6px; white-space:nowrap; }
    .rota mat-icon { font-size:14px; width:14px; height:14px; color:#94a3b8; }
    .field-input { height:36px; border:1.5px solid #e2e8f0; border-radius:8px; padding:0 10px; font-size:13px; color:#1e293b; font-family:inherit; background:white; outline:none; width:100%; box-sizing:border-box; }
    .field-input:focus { border-color:#0ea5e9; box-shadow:0 0 0 3px rgba(14,165,233,0.1); }
    .mono { font-family:monospace; font-weight:700; }
    .status-chip { background:#fef9c3; color:#854d0e; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; white-space:nowrap; }
    .btn-save-row { display:flex; align-items:center; gap:6px; background:#0369a1; color:white; border:none; border-radius:8px; padding:8px 12px; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; white-space:nowrap; }
    .btn-save-row:hover { background:#075985; }
    .btn-save-row mat-icon { font-size:16px; width:16px; height:16px; }
    .empty-row { text-align:center; padding:48px 16px !important; color:#94a3b8; }
  `]
})
export class ContainersComponent implements OnInit {
  containers = signal<ContainerViagem[]>([]);
  ctes = signal<Cte[]>([]);
  loading = signal(false);
  search = '';

  filtered = computed(() => {
    const q = this.search.toLowerCase();
    if (!q) return this.containers();
    return this.containers().filter(c =>
      c.codigo_viagem?.toLowerCase().includes(q) ||
      c.numero_container?.toLowerCase().includes(q) ||
      c.numero_cte?.toLowerCase().includes(q) ||
      c.codigo_embarque?.toLowerCase().includes(q)
    );
  });

  get comContainer() { return this.containers().filter(c => !!c.numero_container).length; }
  get comCte() { return this.containers().filter(c => !!c.id_cte).length; }

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.load();
    this.api.get<Cte[]>('ctes').subscribe(ctes => this.ctes.set(ctes));
  }

  load() {
    this.loading.set(true);
    this.api.get<ContainerViagem[]>('containers').subscribe({
      next: data => { this.containers.set(data); this.loading.set(false); },
      error: () => { this.containers.set([]); this.loading.set(false); }
    });
  }

  salvar(c: ContainerViagem) {
    this.api.put<ContainerViagem>('containers', c.id_container, {
      numero_container: c.numero_container || null,
      id_cte: c.id_cte || null
    }).subscribe({
      next: () => {
        this.snackBar.open('Container atualizado.', 'OK', { duration: 2500 });
        this.load();
      },
      error: err => this.snackBar.open(err.error?.error || 'Erro ao atualizar container.', 'OK', { duration: 3500 })
    });
  }
}
