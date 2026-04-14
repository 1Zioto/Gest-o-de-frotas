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
import { Proprietario } from '../../core/models';
import { ProprietarioFormComponent } from './proprietario-form.component';

@Component({
  selector: 'app-proprietarios',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTooltipModule, MatDialogModule, MatSnackBarModule
  ],
  template: `
    <div class="page-header">
      <div class="page-title">
        <mat-icon>business</mat-icon>
        <h1>Proprietários</h1>
        <span class="count-badge">{{ filtered().length }}</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar por nome ou CPF/CNPJ…" [(ngModel)]="search" />
          <button *ngIf="search" class="clear-btn" (click)="search=''">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <button class="btn-novo" (click)="openForm()">
          <mat-icon>add</mat-icon>
          Novo Proprietário
        </button>
      </div>
    </div>

    <mat-progress-bar *ngIf="loading()" mode="indeterminate" class="progress-bar"></mat-progress-bar>

    <!-- Cards de resumo -->
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
      <div class="summary-card blocked">
        <mat-icon>block</mat-icon>
        <div>
          <span class="summary-num">{{ totalBloqueados }}</span>
          <span class="summary-label">Bloqueados</span>
        </div>
      </div>
    </div>

    <!-- Tabela -->
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF / CNPJ</th>
            <th>Telefone</th>
            <th>Cidade / UF</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of filtered()" [class.inactive-row]="!p.ativo">
            <td>
              <div class="owner-name">
                <div class="avatar" [style.background]="avatarColor(p.nome)">
                  {{ p.nome?.charAt(0)?.toUpperCase() }}
                </div>
                <div>
                  <div class="name-text">{{ p.nome }}</div>
                  <div *ngIf="p.email" class="email-sub">{{ p.email }}</div>
                </div>
              </div>
            </td>
            <td class="mono">{{ p.cpf_cnpj || '—' }}</td>
            <td>{{ p.telefone || '—' }}</td>
            <td>
              <span *ngIf="p.cidade || p.uf">{{ p.cidade }}{{ p.cidade && p.uf ? ' / ' : '' }}{{ p.uf }}</span>
              <span *ngIf="!p.cidade && !p.uf" class="muted">—</span>
            </td>
            <td>
              <span *ngIf="p.bloqueado" class="status-chip blocked-chip">Bloqueado</span>
              <span *ngIf="!p.bloqueado" class="status-dot" [class.active]="p.ativo">
                {{ p.ativo ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="icon-btn" (click)="openForm(p)" matTooltip="Editar">
                <mat-icon>edit</mat-icon>
              </button>
              <button class="icon-btn" [class.danger]="p.ativo" (click)="toggleAtivo(p)"
                      [matTooltip]="p.ativo ? 'Desativar' : 'Reativar'">
                <mat-icon>{{ p.ativo ? 'person_off' : 'person' }}</mat-icon>
              </button>
            </td>
          </tr>
          <tr *ngIf="!loading() && filtered().length === 0">
            <td colspan="6" class="empty-row">
              <mat-icon>search_off</mat-icon>
              <span>Nenhum proprietário encontrado.</span>
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
    .count-badge {
      background: #e0e7ff; color: #3730a3; font-size: 12px;
      font-weight: 700; border-radius: 20px; padding: 2px 10px;
    }
    .header-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .search-box {
      display: flex; align-items: center; gap: 8px;
      background: white; border: 1.5px solid #e2e8f0;
      border-radius: 10px; padding: 0 12px; width: 280px;
      &:focus-within { border-color: #3b82f6; }
      mat-icon { color: #94a3b8; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
      input { border: none; outline: none; font-size: 14px; color: #1e293b; padding: 10px 0; background: transparent; font-family: inherit; flex: 1; }
    }
    .clear-btn { background: none; border: none; cursor: pointer; display: flex; padding: 0; color: #94a3b8; &:hover { color: #475569; } }
    .btn-novo {
      display: flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white; border: none; border-radius: 10px;
      padding: 10px 18px; font-size: 14px; font-weight: 600;
      cursor: pointer; font-family: inherit; white-space: nowrap;
      transition: opacity 0.2s;
      &:hover { opacity: 0.9; }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .progress-bar { margin-bottom: 16px; border-radius: 4px; }
    .summary-cards { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .summary-card {
      background: white; border-radius: 12px; padding: 16px 20px;
      display: flex; align-items: center; gap: 14px;
      border: 1px solid #e2e8f0; flex: 1; min-width: 130px;
      mat-icon { color: #3b82f6; font-size: 28px; width: 28px; height: 28px; }
      &.inactive mat-icon { color: #94a3b8; }
      &.blocked mat-icon { color: #dc2626; }
    }
    .summary-num { display: block; font-size: 22px; font-weight: 800; color: #0f172a; }
    .summary-label { font-size: 12px; color: #64748b; }
    .table-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
    .data-table {
      width: 100%; border-collapse: collapse;
      th {
        background: #f8fafc; color: #64748b; font-size: 12px;
        font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
        padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0;
      }
      td { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: #f8fafc; }
    }
    .inactive-row td { opacity: 0.5; }
    .owner-name { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 15px; font-weight: 700;
    }
    .name-text { font-weight: 500; color: #0f172a; }
    .email-sub { font-size: 12px; color: #94a3b8; margin-top: 1px; }
    .mono { font-family: monospace; letter-spacing: 0.03em; }
    .muted { color: #94a3b8; }
    .status-chip {
      display: inline-block; padding: 3px 10px; border-radius: 20px;
      font-size: 12px; font-weight: 600;
      &.blocked-chip { background: #fee2e2; color: #dc2626; }
    }
    .status-dot {
      display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #94a3b8;
      &::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: #cbd5e1; display: inline-block; }
      &.active { color: #15803d; &::before { background: #22c55e; } }
    }
    .actions-cell { display: flex; gap: 4px; }
    .icon-btn {
      background: none; border: none; cursor: pointer;
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: #64748b; transition: background 0.15s, color 0.15s;
      &:hover { background: #f1f5f9; color: #1e293b; }
      &.danger:hover { background: #fee2e2; color: #dc2626; }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .empty-row {
      text-align: center; padding: 48px 16px !important;
      color: #94a3b8; display: flex; align-items: center;
      justify-content: center; gap: 10px;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    @media (max-width: 768px) {
      .search-box { width: 100%; }
      td.mono { display: none; }
    }
  `]
})
export class ProprietariosComponent implements OnInit {
  proprietarios = signal<Proprietario[]>([]);
  loading = signal(false);
  search = '';

  filtered = computed(() => {
    const q = this.search.toLowerCase();
    if (!q) return this.proprietarios();
    return this.proprietarios().filter(p =>
      p.nome?.toLowerCase().includes(q) ||
      p.cpf_cnpj?.toLowerCase().includes(q) ||
      p.cidade?.toLowerCase().includes(q)
    );
  });

  get totalAtivos()     { return this.proprietarios().filter(p => p.ativo !== false).length; }
  get totalInativos()   { return this.proprietarios().filter(p => p.ativo === false).length; }
  get totalBloqueados() { return this.proprietarios().filter(p => p.bloqueado).length; }

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<Proprietario[]>('proprietarios').subscribe({
      next: data => { this.proprietarios.set(data); this.loading.set(false); },
      error: () => { this.proprietarios.set([]); this.loading.set(false); }
    });
  }

  openForm(proprietario?: Proprietario) {
    const ref = this.dialog.open(ProprietarioFormComponent, {
      data: proprietario || null,
      width: '620px',
      maxWidth: '95vw'
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  toggleAtivo(p: Proprietario) {
    const acao = p.ativo !== false ? 'desativar' : 'reativar';
    if (!confirm(`Deseja ${acao} o proprietário ${p.nome}?`)) return;
    this.api.put<Proprietario>('proprietarios', p.id_proprietario, { ...p, ativo: p.ativo === false }).subscribe({
      next: () => {
        this.snackBar.open(`Proprietário ${p.ativo !== false ? 'desativado' : 'reativado'} com sucesso!`, 'OK', { duration: 3000 });
        this.load();
      },
      error: () => this.snackBar.open('Erro ao alterar status.', 'OK', { duration: 3000 })
    });
  }

  avatarColor(nome?: string): string {
    const colors = ['#3b82f6','#7c3aed','#059669','#dc2626','#d97706','#0891b2','#db2777'];
    const i = (nome?.charCodeAt(0) || 0) % colors.length;
    return colors[i];
  }
}
