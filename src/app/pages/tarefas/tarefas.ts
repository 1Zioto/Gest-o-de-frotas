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
import { Tarefa, TarefaFormComponent } from './tarefa-form.component';

const PRI: Record<string, { label: string; color: string; bg: string }> = {
  alta:  { label: 'Alta',  color: '#dc2626', bg: '#fee2e2' },
  media: { label: 'Média', color: '#d97706', bg: '#fef3c7' },
  baixa: { label: 'Baixa', color: '#16a34a', bg: '#dcfce7' },
};
const STA: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pendente:    { label: 'Pendente',    color: '#64748b', bg: '#f1f5f9', icon: 'schedule' },
  em_andamento:{ label: 'Em Andamento',color: '#1d4ed8', bg: '#dbeafe', icon: 'autorenew' },
  concluido:   { label: 'Concluído',   color: '#166534', bg: '#dcfce7', icon: 'check_circle' },
  atrasado:    { label: 'Atrasado',    color: '#991b1b', bg: '#fee2e2', icon: 'warning' },
};

@Component({
  selector: 'app-tarefas',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTooltipModule, MatDialogModule, MatSnackBarModule],
  template: `
    <div class="page-header">
      <div class="page-title">
        <mat-icon>task_alt</mat-icon>
        <h1>Tarefas</h1>
        <span class="count-badge">{{ pendentes }}</span>
        <span class="atrasados-badge" *ngIf="atrasados > 0">{{ atrasados }} atrasadas</span>
      </div>
      <div class="header-actions">
        <div class="filter-pills">
          <button class="pill" [class.active]="filtroStatus===''" (click)="filtroStatus=''">Todas</button>
          <button class="pill p" [class.active]="filtroStatus==='pendente'" (click)="filtroStatus='pendente'">Pendente</button>
          <button class="pill a" [class.active]="filtroStatus==='em_andamento'" (click)="filtroStatus='em_andamento'">Em Andamento</button>
          <button class="pill at" [class.active]="filtroStatus==='atrasado'" (click)="filtroStatus='atrasado'">Atrasada</button>
        </div>
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar tarefa…" [(ngModel)]="search" />
        </div>
        <button class="btn-novo" (click)="openForm()">
          <mat-icon>add</mat-icon> Nova Tarefa
        </button>
      </div>
    </div>

    <mat-progress-bar *ngIf="loading()" mode="indeterminate" class="progress-bar"></mat-progress-bar>

    <!-- Cards kanban-style -->
    <div class="kanban-cards">
      @for (s of statusList; track s.key) {
        <div class="kanban-card" [style.border-top-color]="s.color">
          <div class="kanban-header" [style.color]="s.color">
            <mat-icon>{{ s.icon }}</mat-icon>
            <span>{{ s.label }}</span>
            <span class="k-count">{{ countByStatus(s.key) }}</span>
          </div>
        </div>
      }
    </div>

    <!-- Lista de tarefas -->
    <div class="tasks-list">
      <div class="task-card" *ngFor="let t of filtered()"
           [class.concluida]="t.status === 'concluido'"
           [class.atrasada]="t.status === 'atrasado'">
        <div class="task-left">
          <div class="pri-dot" [style.background]="getPri(t.prioridade).color"
               [matTooltip]="'Prioridade: ' + getPri(t.prioridade).label"></div>
          <div class="task-info">
            <div class="task-title">{{ t.titulo }}</div>
            <div class="task-meta" *ngIf="t.descricao">{{ t.descricao }}</div>
            <div class="task-tags">
              <span *ngIf="t.codigo_embarque" class="tag emb">
                <mat-icon>inventory_2</mat-icon> {{ t.codigo_embarque }}
              </span>
              <span *ngIf="t.placa" class="tag vei">
                <mat-icon>directions_car</mat-icon> {{ t.placa }}
              </span>
              <span *ngIf="t.data_prazo" class="tag prazo" [class.vencido]="isPrazoVencido(t)">
                <mat-icon>schedule</mat-icon> {{ fmtDateTime(t.data_prazo) }}
              </span>
            </div>
          </div>
        </div>
        <div class="task-right">
          <span class="status-chip"
            [style.background]="getSta(t.status).bg"
            [style.color]="getSta(t.status).color">
            {{ getSta(t.status).label }}
          </span>
          <div class="task-actions">
            <button class="icon-btn" (click)="concluir(t)" *ngIf="t.status !== 'concluido'" matTooltip="Marcar como concluída">
              <mat-icon>check_circle</mat-icon>
            </button>
            <button class="icon-btn" (click)="openForm(t)" matTooltip="Editar">
              <mat-icon>edit</mat-icon>
            </button>
            <button class="icon-btn danger-btn" (click)="remover(t)" matTooltip="Remover">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!loading() && filtered().length === 0">
        <mat-icon>task_alt</mat-icon>
        <span>Nenhuma tarefa encontrada.</span>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:20px; }
    .page-title { display:flex; align-items:center; gap:10px; }
    .page-title mat-icon { color:#f59e0b; font-size:28px; width:28px; height:28px; }
    h1 { font-size:22px; font-weight:700; color:#0f172a; margin:0; }
    .count-badge { background:#fef9c3; color:#854d0e; font-size:12px; font-weight:700; border-radius:20px; padding:2px 10px; }
    .atrasados-badge { background:#fee2e2; color:#dc2626; font-size:12px; font-weight:700; border-radius:20px; padding:2px 10px; }
    .header-actions { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    .filter-pills { display:flex; gap:4px; background:#f1f5f9; border-radius:10px; padding:3px; }
    .pill { background:none; border:none; border-radius:7px; padding:5px 12px; font-size:12px; font-weight:600; color:#64748b; cursor:pointer; transition:all 0.15s; &.active { background:white; color:#0f172a; box-shadow:0 1px 3px rgba(0,0,0,.1); } &.a.active { color:#1d4ed8; } &.at.active { color:#991b1b; } }
    .search-box { display:flex; align-items:center; gap:8px; background:white; border:1.5px solid #e2e8f0; border-radius:10px; padding:0 12px; width:200px; &:focus-within { border-color:#f59e0b; } mat-icon { color:#94a3b8; font-size:18px; width:18px; height:18px; flex-shrink:0; } input { border:none; outline:none; font-size:13px; color:#1e293b; padding:9px 0; background:transparent; font-family:inherit; flex:1; } }
    .btn-novo { display:flex; align-items:center; gap:6px; background:linear-gradient(135deg,#f59e0b,#d97706); color:white; border:none; border-radius:10px; padding:10px 18px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap; &:hover { opacity:0.9; } mat-icon { font-size:18px; width:18px; height:18px; } }
    .progress-bar { margin-bottom:16px; border-radius:4px; }
    .kanban-cards { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
    .kanban-card { background:white; border-radius:12px; padding:14px 18px; border:1px solid #e2e8f0; border-top:4px solid; flex:1; min-width:120px; }
    .kanban-header { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:700; mat-icon { font-size:18px; width:18px; height:18px; } .k-count { margin-left:auto; font-size:20px; font-weight:800; color:#0f172a; } }
    .tasks-list { display:flex; flex-direction:column; gap:8px; }
    .task-card { background:white; border-radius:12px; padding:16px 18px; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; gap:16px; transition:box-shadow 0.15s; &:hover { box-shadow:0 2px 8px rgba(0,0,0,.07); } &.concluida { opacity:0.55; } &.atrasada { border-left:4px solid #dc2626; } }
    .task-left { display:flex; align-items:flex-start; gap:12px; flex:1; min-width:0; }
    .pri-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; margin-top:5px; cursor:default; }
    .task-info { min-width:0; }
    .task-title { font-size:14px; font-weight:600; color:#0f172a; }
    .task-meta { font-size:12px; color:#64748b; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .task-tags { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
    .tag { display:inline-flex; align-items:center; gap:3px; font-size:11px; font-weight:500; padding:2px 8px; border-radius:20px; mat-icon { font-size:12px; width:12px; height:12px; } &.emb { background:#e0f2fe; color:#0369a1; } &.vei { background:#f0fdf4; color:#166534; } &.prazo { background:#f1f5f9; color:#475569; } &.vencido { background:#fee2e2; color:#dc2626; } }
    .task-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }
    .status-chip { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; white-space:nowrap; }
    .task-actions { display:flex; gap:2px; }
    .icon-btn { background:none; border:none; cursor:pointer; width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#64748b; transition:background 0.15s; &:hover { background:#f1f5f9; color:#1e293b; } mat-icon { font-size:17px; width:17px; height:17px; } }
    .danger-btn:hover { background:#fee2e2 !important; color:#dc2626 !important; }
    .empty-state { text-align:center; padding:48px; color:#94a3b8; display:flex; align-items:center; justify-content:center; gap:10px; background:white; border-radius:16px; border:1px solid #e2e8f0; mat-icon { font-size:24px; width:24px; height:24px; } }
  `]
})
export class TarefasComponent implements OnInit {
  tarefas = signal<Tarefa[]>([]);
  loading = signal(false);
  search = '';
  filtroStatus = '';

  statusList = Object.entries(STA).map(([key, v]) => ({ key, ...v }));

  filtered = computed(() => {
    let list = this.tarefas();
    if (this.filtroStatus) list = list.filter(t => t.status === this.filtroStatus);
    const q = this.search.toLowerCase();
    if (!q) return list;
    return list.filter(t => t.titulo?.toLowerCase().includes(q) || t.descricao?.toLowerCase().includes(q));
  });

  get pendentes()  { return this.tarefas().filter(t => t.status === 'pendente' || t.status === 'em_andamento').length; }
  get atrasados()  { return this.tarefas().filter(t => t.status === 'atrasado').length; }
  countByStatus(s: string) { return this.tarefas().filter(t => t.status === s).length; }
  getPri(p?: string) { return PRI[p || ''] ?? PRI['media']; }
  getSta(s?: string) { return STA[s || ''] ?? STA['pendente']; }

  isPrazoVencido(t: Tarefa): boolean {
    if (!t.data_prazo || t.status === 'concluido') return false;
    return new Date(t.data_prazo) < new Date();
  }

  constructor(private api: ApiService, private dialog: MatDialog, private snackBar: MatSnackBar) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<Tarefa[]>('tarefas').subscribe({
      next: d => { this.tarefas.set(d); this.loading.set(false); },
      error: () => { this.tarefas.set([]); this.loading.set(false); }
    });
  }

  openForm(t?: Tarefa) {
    this.dialog.open(TarefaFormComponent, { data: t || null, width: '560px', maxWidth: '95vw' })
      .afterClosed().subscribe(ok => { if (ok) this.load(); });
  }

  concluir(t: Tarefa) {
    this.api.put<Tarefa>('tarefas', t.id_tarefa!, { ...t, status: 'concluido' }).subscribe({
      next: () => { this.snackBar.open('Tarefa concluída!', 'OK', { duration: 2000 }); this.load(); },
      error: () => this.snackBar.open('Erro ao atualizar.', 'OK', { duration: 3000 })
    });
  }

  remover(t: Tarefa) {
    if (!confirm(`Remover tarefa "${t.titulo}"?`)) return;
    this.api.delete<Tarefa>('tarefas', t.id_tarefa!).subscribe({
      next: () => { this.snackBar.open('Tarefa removida.', 'OK', { duration: 3000 }); this.load(); },
      error: () => this.snackBar.open('Erro ao remover.', 'OK', { duration: 3000 })
    });
  }

  fmtDateTime(d?: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}
