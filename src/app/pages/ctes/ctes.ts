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
import { Cte, CteFormComponent } from './cte-form.component';

const CTE_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  emitido:    { label: 'Emitido',    bg: '#fef9c3', color: '#854d0e' },
  autorizado: { label: 'Autorizado', bg: '#dcfce7', color: '#166534' },
  cancelado:  { label: 'Cancelado',  bg: '#fee2e2', color: '#991b1b' },
};

@Component({
  selector: 'app-ctes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTooltipModule, MatDialogModule, MatSnackBarModule],
  template: `
    <div class="page-header">
      <div class="page-title">
        <mat-icon>description</mat-icon>
        <h1>CT-es</h1>
        <span class="count-badge">{{ filtered().length }}</span>
      </div>
      <div class="header-actions">
        <div class="filter-pills">
          <button class="pill" [class.active]="filtroStatus===''" (click)="filtroStatus=''">Todos</button>
          <button class="pill emitido" [class.active]="filtroStatus==='emitido'" (click)="filtroStatus='emitido'">Emitido</button>
          <button class="pill autorizado" [class.active]="filtroStatus==='autorizado'" (click)="filtroStatus='autorizado'">Autorizado</button>
          <button class="pill cancelado" [class.active]="filtroStatus==='cancelado'" (click)="filtroStatus='cancelado'">Cancelado</button>
        </div>
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar número, remetente…" [(ngModel)]="search" />
        </div>
        <button class="btn-novo" (click)="openForm()">
          <mat-icon>add</mat-icon> Novo CT-e
        </button>
      </div>
    </div>

    <mat-progress-bar *ngIf="loading()" mode="indeterminate" class="progress-bar"></mat-progress-bar>

    <div class="summary-cards">
      @for (s of statusList; track s.key) {
        <div class="summary-card" [style.border-left-color]="s.color">
          <span class="summary-num" [style.color]="s.color">{{ countByStatus(s.key) }}</span>
          <span class="summary-label">{{ s.label }}</span>
        </div>
      }
      <div class="summary-card" style="border-left-color:#7c3aed">
        <span class="summary-num" style="color:#7c3aed">{{ fmtBRL(totalValor) }}</span>
        <span class="summary-label">Total Valor</span>
      </div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Número CT-e</th>
            <th>Embarque</th>
            <th>Remetente → Destinatário</th>
            <th>Emissão</th>
            <th>Valor Total</th>
            <th>Status</th>
            <th>Arquivos</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of filtered()">
            <td>
              <div class="cte-num">
                <span class="num-badge">{{ c.numero_cte }}</span>
                <span *ngIf="c.serie" class="serie">Série {{ c.serie }}</span>
              </div>
            </td>
            <td>
              <span *ngIf="c.codigo_embarque" class="emb-badge">{{ c.codigo_embarque }}</span>
              <span *ngIf="!c.codigo_embarque" class="muted">—</span>
            </td>
            <td>
              <div class="partes">
                <span class="parte">{{ c.remetente_nome || '—' }}</span>
                <mat-icon class="arrow">arrow_forward</mat-icon>
                <span class="parte">{{ c.destinatario_nome || '—' }}</span>
              </div>
            </td>
            <td class="muted">{{ fmtDate(c.data_emissao) }}</td>
            <td class="bold">{{ c.valor_total ? fmtBRL(c.valor_total) : '—' }}</td>
            <td>
              <span class="status-chip"
                [style.background]="getStatus(c.status).bg"
                [style.color]="getStatus(c.status).color">
                {{ getStatus(c.status).label }}
              </span>
            </td>
            <td class="files-cell">
              <a *ngIf="c.xml_url" [href]="c.xml_url" target="_blank" class="file-link" matTooltip="Abrir XML">
                <mat-icon>code</mat-icon>
              </a>
              <a *ngIf="c.pdf_url" [href]="c.pdf_url" target="_blank" class="file-link pdf" matTooltip="Abrir PDF">
                <mat-icon>picture_as_pdf</mat-icon>
              </a>
              <span *ngIf="!c.xml_url && !c.pdf_url" class="muted">—</span>
            </td>
            <td class="actions-cell">
              <button class="icon-btn" (click)="openForm(c)" matTooltip="Editar"><mat-icon>edit</mat-icon></button>
              <button class="icon-btn danger-btn" (click)="remover(c)" matTooltip="Remover"><mat-icon>delete</mat-icon></button>
            </td>
          </tr>
          <tr *ngIf="!loading() && filtered().length === 0">
            <td colspan="8" class="empty-row">
              <mat-icon>search_off</mat-icon><span>Nenhum CT-e encontrado.</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:20px; }
    .page-title { display:flex; align-items:center; gap:10px; }
    .page-title mat-icon { color:#8b5cf6; font-size:28px; width:28px; height:28px; }
    h1 { font-size:22px; font-weight:700; color:#0f172a; margin:0; }
    .count-badge { background:#ede9fe; color:#6d28d9; font-size:12px; font-weight:700; border-radius:20px; padding:2px 10px; }
    .header-actions { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    .filter-pills { display:flex; gap:4px; background:#f1f5f9; border-radius:10px; padding:3px; }
    .pill { background:none; border:none; border-radius:7px; padding:5px 12px; font-size:12px; font-weight:600; color:#64748b; cursor:pointer; transition:all 0.15s; &.active { background:white; color:#0f172a; box-shadow:0 1px 3px rgba(0,0,0,.1); } &.emitido.active { color:#854d0e; } &.autorizado.active { color:#166534; } &.cancelado.active { color:#991b1b; } }
    .search-box { display:flex; align-items:center; gap:8px; background:white; border:1.5px solid #e2e8f0; border-radius:10px; padding:0 12px; width:220px; &:focus-within { border-color:#8b5cf6; } mat-icon { color:#94a3b8; font-size:18px; width:18px; height:18px; flex-shrink:0; } input { border:none; outline:none; font-size:13px; color:#1e293b; padding:9px 0; background:transparent; font-family:inherit; flex:1; } }
    .btn-novo { display:flex; align-items:center; gap:6px; background:linear-gradient(135deg,#8b5cf6,#6d28d9); color:white; border:none; border-radius:10px; padding:10px 18px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap; &:hover { opacity:0.9; } mat-icon { font-size:18px; width:18px; height:18px; } }
    .progress-bar { margin-bottom:16px; border-radius:4px; }
    .summary-cards { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
    .summary-card { background:white; border-radius:12px; padding:14px 18px; display:flex; flex-direction:column; gap:2px; border:1px solid #e2e8f0; border-left:4px solid; flex:1; min-width:110px; }
    .summary-num { font-size:20px; font-weight:800; }
    .summary-label { font-size:11px; color:#64748b; }
    .table-card { background:white; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; }
    .data-table { width:100%; border-collapse:collapse; th { background:#f8fafc; color:#64748b; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; padding:11px 14px; text-align:left; border-bottom:1px solid #e2e8f0; white-space:nowrap; } td { padding:12px 14px; border-bottom:1px solid #f1f5f9; font-size:13px; color:#1e293b; } tr:last-child td { border-bottom:none; } tr:hover td { background:#f8fafc; } }
    .cte-num { display:flex; flex-direction:column; gap:2px; }
    .num-badge { font-family:monospace; font-weight:700; font-size:13px; }
    .serie { font-size:11px; color:#94a3b8; }
    .emb-badge { background:#e0f2fe; color:#0369a1; font-size:11px; font-weight:600; padding:2px 8px; border-radius:20px; white-space:nowrap; }
    .partes { display:flex; align-items:center; gap:6px; white-space:nowrap; overflow:hidden; }
    .parte { font-size:12px; max-width:120px; overflow:hidden; text-overflow:ellipsis; }
    .arrow { font-size:14px; width:14px; height:14px; color:#94a3b8; flex-shrink:0; }
    .muted { color:#94a3b8; }
    .bold { font-weight:700; }
    .status-chip { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
    .files-cell { display:flex; gap:4px; align-items:center; }
    .file-link { display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:6px; background:#f1f5f9; color:#64748b; text-decoration:none; &:hover { background:#e2e8f0; color:#1e293b; } &.pdf:hover { background:#fee2e2; color:#dc2626; } mat-icon { font-size:16px; width:16px; height:16px; } }
    .actions-cell { display:flex; gap:4px; }
    .icon-btn { background:none; border:none; cursor:pointer; width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#64748b; transition:background 0.15s; &:hover { background:#f1f5f9; color:#1e293b; } mat-icon { font-size:17px; width:17px; height:17px; } }
    .danger-btn:hover { background:#fee2e2 !important; color:#dc2626 !important; }
    .empty-row { text-align:center; padding:48px 16px !important; color:#94a3b8; display:flex; align-items:center; justify-content:center; gap:10px; mat-icon { font-size:22px; width:22px; height:22px; } }
  `]
})
export class CtesComponent implements OnInit {
  ctes = signal<Cte[]>([]);
  loading = signal(false);
  search = '';
  filtroStatus = '';

  statusList = Object.entries(CTE_STATUS).map(([key, v]) => ({ key, ...v }));

  filtered = computed(() => {
    let list = this.ctes();
    if (this.filtroStatus) list = list.filter(c => c.status === this.filtroStatus);
    const q = this.search.toLowerCase();
    if (!q) return list;
    return list.filter(c =>
      c.numero_cte?.toLowerCase().includes(q) ||
      c.remetente_nome?.toLowerCase().includes(q) ||
      c.destinatario_nome?.toLowerCase().includes(q) ||
      c.codigo_embarque?.toLowerCase().includes(q)
    );
  });

  get totalValor() { return this.filtered().reduce((s, c) => s + (Number(c.valor_total) || 0), 0); }
  countByStatus(s: string) { return this.ctes().filter(c => c.status === s).length; }
  getStatus(s?: string) { return CTE_STATUS[s || ''] ?? { label: s || '—', bg: '#f1f5f9', color: '#64748b' }; }

  constructor(private api: ApiService, private dialog: MatDialog, private snackBar: MatSnackBar) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<Cte[]>('ctes').subscribe({
      next: d => { this.ctes.set(d); this.loading.set(false); },
      error: () => { this.ctes.set([]); this.loading.set(false); }
    });
  }

  openForm(c?: Cte) {
    this.dialog.open(CteFormComponent, { data: c || null, width: '700px', maxWidth: '95vw' })
      .afterClosed().subscribe(ok => { if (ok) this.load(); });
  }

  remover(c: Cte) {
    if (!confirm(`Remover CT-e ${c.numero_cte}?`)) return;
    this.api.delete<Cte>('ctes', c.id_cte!).subscribe({
      next: () => { this.snackBar.open('CT-e removido.', 'OK', { duration: 3000 }); this.load(); },
      error: () => this.snackBar.open('Erro ao remover.', 'OK', { duration: 3000 })
    });
  }

  fmtDate(d?: string): string {
    if (!d) return '—';
    const s = d.includes('T') ? d.slice(0, 10) : d;
    return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR');
  }
  fmtBRL(v: any): string {
    const n = Number(v);
    return isNaN(n) ? '—' : 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
