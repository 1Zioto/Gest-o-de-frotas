import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';

interface CadastroEmbarque {
  id_cadastro?: string;
  tipo: string;
  nome: string;
  codigo?: string;
  uf?: string;
  observacoes?: string;
  ativo?: boolean;
  source?: string;
}

const TIPOS = [
  { key: 'cliente', label: 'Cliente', icon: 'business' },
  { key: 'mercadoria', label: 'Mercadoria', icon: 'inventory_2' },
  { key: 'terminal', label: 'Terminal', icon: 'anchor' },
  { key: 'armazem_carregamento', label: 'Armazém Carreg.', icon: 'warehouse' },
  { key: 'municipio', label: 'Município', icon: 'location_city' },
  { key: 'uf', label: 'UF', icon: 'map' },
  { key: 'exportador', label: 'Exportador', icon: 'ios_share' },
  { key: 'navio_viagem', label: 'Navio/Viagem', icon: 'directions_boat' },
  { key: 'armador', label: 'Armador', icon: 'sailing' },
  { key: 'embalagem', label: 'Embalagem', icon: 'deployed_code' },
  { key: 'importador', label: 'Importador', icon: 'move_to_inbox' },
  { key: 'destino', label: 'Destino', icon: 'flag' },
  { key: 'descarga', label: 'Descarga', icon: 'local_shipping' },
];

@Component({
  selector: 'app-cadastros-embarque',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressBarModule, MatSnackBarModule],
  template: `
    <div class="page-header">
      <div class="page-title">
        <mat-icon>fact_check</mat-icon>
        <h1>Cadastros Embarque</h1>
        <span class="count-badge">{{ filtered().length }}</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar cadastro…" [(ngModel)]="search" />
        </div>
      </div>
    </div>

    <mat-progress-bar *ngIf="loading()" mode="indeterminate" class="progress-bar"></mat-progress-bar>

    <div class="type-pills">
      <button class="pill" [class.active]="tipoFiltro === ''" (click)="tipoFiltro = ''">Todos</button>
      @for (t of tipos; track t.key) {
        <button class="pill" [class.active]="tipoFiltro === t.key" (click)="tipoFiltro = t.key">
          <mat-icon>{{ t.icon }}</mat-icon>
          {{ t.label }}
        </button>
      }
    </div>

    <div class="form-band">
      <div class="form-grid">
        <div class="field">
          <label>Tipo</label>
          <select class="field-input" [(ngModel)]="form.tipo">
            @for (t of tipos; track t.key) {
              <option [value]="t.key">{{ t.label }}</option>
            }
          </select>
        </div>
        <div class="field wide">
          <label>{{ nomeLabel }}</label>
          <input class="field-input" [(ngModel)]="form.nome" placeholder="Digite o nome do cadastro" />
        </div>
        <div class="field">
          <label>{{ codigoLabel }}</label>
          <input class="field-input" [(ngModel)]="form.codigo" [placeholder]="codigoPlaceholder" />
        </div>
        <div class="field uf">
          <label>UF</label>
          <input class="field-input" [(ngModel)]="form.uf" maxlength="2" placeholder="UF" />
        </div>
        <div class="field wide">
          <label>{{ observacoesLabel }}</label>
          <input class="field-input" [(ngModel)]="form.observacoes" [placeholder]="observacoesPlaceholder" />
        </div>
        <label class="active-toggle" [class.disabled]="usesOwnTable(form)">
          <input type="checkbox" [(ngModel)]="form.ativo" />
          {{ usesOwnTable(form) ? 'Tabela própria' : 'Ativo' }}
        </label>
        <div class="form-actions">
          <button class="btn-secondary" (click)="resetForm()">Limpar</button>
          <button class="btn-save" (click)="save()">
            <mat-icon>{{ form.id_cadastro ? 'save' : 'add' }}</mat-icon>
            {{ form.id_cadastro ? 'Salvar' : 'Adicionar' }}
          </button>
        </div>
      </div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Nome</th>
            <th>Código</th>
            <th>UF</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of filtered()" [class.inactive-row]="c.ativo === false">
            <td>
              <span class="type-chip">
                <mat-icon>{{ iconFor(c.tipo) }}</mat-icon>
                {{ labelFor(c.tipo) }}
              </span>
            </td>
            <td>
              <div class="name-cell">
                <strong>{{ c.nome }}</strong>
                <small *ngIf="c.observacoes">{{ c.observacoes }}</small>
              </div>
            </td>
            <td class="mono">{{ c.codigo || '-' }}</td>
            <td class="mono">{{ c.uf || '-' }}</td>
            <td>
              <span class="status-dot" [class.active]="c.ativo !== false">{{ c.source && c.source !== 'embarque_cadastros' ? 'Tabela própria' : (c.ativo !== false ? 'Ativo' : 'Inativo') }}</span>
            </td>
            <td class="actions-cell">
              <button class="icon-btn" (click)="edit(c)" title="Editar"><mat-icon>edit</mat-icon></button>
              <button class="icon-btn" *ngIf="!usesOwnTable(c)" (click)="toggleAtivo(c)" title="Ativar/desativar"><mat-icon>{{ c.ativo !== false ? 'cancel' : 'check_circle' }}</mat-icon></button>
              <button class="icon-btn danger" (click)="remove(c)" title="Remover"><mat-icon>delete</mat-icon></button>
            </td>
          </tr>
          <tr *ngIf="!loading() && filtered().length === 0">
            <td colspan="6" class="empty-row">
              <mat-icon>search_off</mat-icon>
              <span>Nenhum cadastro encontrado.</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:18px; }
    .page-title { display:flex; align-items:center; gap:10px; }
    .page-title mat-icon { color:#0369a1; font-size:28px; width:28px; height:28px; }
    h1 { margin:0; color:#0f172a; font-size:22px; font-weight:800; }
    .count-badge { background:#e0f2fe; color:#0369a1; font-size:12px; font-weight:800; border-radius:20px; padding:2px 10px; }
    .search-box { display:flex; align-items:center; gap:8px; background:white; border:1.5px solid #e2e8f0; border-radius:10px; padding:0 12px; width:280px; }
    .search-box:focus-within { border-color:#0ea5e9; }
    .search-box mat-icon { color:#94a3b8; font-size:18px; width:18px; height:18px; }
    .search-box input { border:0; outline:0; flex:1; height:40px; font-family:inherit; color:#1e293b; background:transparent; }
    .progress-bar { margin-bottom:16px; }
    .type-pills { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; }
    .pill { display:flex; align-items:center; gap:5px; border:1px solid #e2e8f0; background:white; color:#475569; border-radius:8px; padding:7px 10px; cursor:pointer; font-size:12px; font-weight:700; }
    .pill.active { background:#0f172a; color:white; border-color:#0f172a; }
    .pill mat-icon { font-size:15px; width:15px; height:15px; }
    .form-band { background:white; border:1px solid #e2e8f0; border-radius:12px; padding:14px; margin-bottom:16px; }
    .form-grid { display:grid; grid-template-columns:160px 1.4fr 140px 80px 1.2fr auto auto; gap:10px; align-items:end; }
    .field { display:flex; flex-direction:column; gap:5px; }
    .field label { font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; }
    .field-input { height:38px; border:1.5px solid #e2e8f0; border-radius:8px; padding:0 10px; outline:0; font-family:inherit; color:#1e293b; width:100%; box-sizing:border-box; }
    .field-input:focus { border-color:#0ea5e9; box-shadow:0 0 0 3px rgba(14,165,233,0.1); }
    .active-toggle { display:flex; align-items:center; gap:7px; height:38px; font-size:13px; font-weight:700; color:#334155; white-space:nowrap; }
    .active-toggle.disabled { color:#64748b; }
    .active-toggle input { width:16px; height:16px; accent-color:#0369a1; }
    .active-toggle.disabled input { display:none; }
    .form-actions { display:flex; gap:8px; }
    .btn-secondary, .btn-save { height:38px; border-radius:8px; padding:0 13px; font-weight:800; font-family:inherit; cursor:pointer; border:1.5px solid #e2e8f0; white-space:nowrap; }
    .btn-secondary { background:white; color:#475569; }
    .btn-save { display:flex; align-items:center; gap:6px; border-color:#0369a1; background:#0369a1; color:white; }
    .btn-save mat-icon { font-size:17px; width:17px; height:17px; }
    .table-card { background:white; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { background:#f8fafc; color:#64748b; font-size:11px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; padding:11px 14px; text-align:left; border-bottom:1px solid #e2e8f0; }
    .data-table td { padding:12px 14px; border-bottom:1px solid #f1f5f9; font-size:13px; color:#1e293b; }
    .inactive-row td { opacity:.55; }
    .type-chip { display:inline-flex; align-items:center; gap:6px; background:#e0f2fe; color:#0369a1; border-radius:20px; padding:3px 9px; font-weight:800; font-size:11px; white-space:nowrap; }
    .type-chip mat-icon { font-size:14px; width:14px; height:14px; }
    .name-cell { display:flex; flex-direction:column; gap:2px; }
    .name-cell small { color:#64748b; }
    .mono { font-family:monospace; color:#475569; }
    .status-dot { display:inline-flex; align-items:center; gap:6px; color:#94a3b8; font-weight:700; }
    .status-dot::before { content:''; width:7px; height:7px; border-radius:50%; background:#cbd5e1; }
    .status-dot.active { color:#15803d; }
    .status-dot.active::before { background:#22c55e; }
    .actions-cell { display:flex; gap:4px; }
    .icon-btn { border:0; background:transparent; color:#64748b; width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
    .icon-btn:hover { background:#f1f5f9; color:#0f172a; }
    .icon-btn.danger:hover { background:#fee2e2; color:#dc2626; }
    .icon-btn mat-icon { font-size:17px; width:17px; height:17px; }
    .empty-row { text-align:center; padding:44px 16px !important; color:#94a3b8; }
    @media(max-width:1100px) { .form-grid { grid-template-columns:1fr 1fr; } .form-actions { justify-content:flex-end; } }
    @media(max-width:640px) { .search-box { width:100%; } .form-grid { grid-template-columns:1fr; } .form-actions { justify-content:stretch; } .btn-secondary, .btn-save { flex:1; justify-content:center; } }
  `]
})
export class CadastrosEmbarqueComponent implements OnInit {
  tipos = TIPOS;
  cadastros = signal<CadastroEmbarque[]>([]);
  loading = signal(false);
  search = '';
  tipoFiltro = '';
  form: CadastroEmbarque = this.emptyForm();

  filtered = computed(() => {
    const q = this.search.toLowerCase();
    return this.cadastros().filter(c => {
      const matchTipo = !this.tipoFiltro || c.tipo === this.tipoFiltro;
      const matchSearch = !q ||
        c.nome?.toLowerCase().includes(q) ||
        c.codigo?.toLowerCase().includes(q) ||
        c.uf?.toLowerCase().includes(q) ||
        this.labelFor(c.tipo).toLowerCase().includes(q);
      return matchTipo && matchSearch;
    });
  });

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  get nomeLabel(): string {
    if (this.form.tipo === 'mercadoria') return 'Descrição';
    if (this.form.tipo === 'destino') return 'Porto';
    if (this.form.tipo === 'exportador' || this.form.tipo === 'importador') return 'Razão social';
    return 'Nome';
  }

  get codigoLabel(): string {
    if (this.form.tipo === 'cliente' || this.form.tipo === 'exportador' || this.form.tipo === 'importador') return 'CNPJ';
    if (this.form.tipo === 'mercadoria') return 'NCM';
    if (this.form.tipo === 'armazem_carregamento') return 'Município';
    return 'Código';
  }

  get codigoPlaceholder(): string {
    if (this.form.tipo === 'armazem_carregamento') return 'Município';
    return 'Opcional';
  }

  get observacoesLabel(): string {
    if (this.form.tipo === 'cliente') return 'Contato';
    if (this.form.tipo === 'mercadoria') return 'Unidade';
    if (this.form.tipo === 'destino') return 'País';
    if (this.form.tipo === 'armazem_carregamento') return 'Endereço';
    if (this.form.tipo === 'exportador' || this.form.tipo === 'importador') return 'Cidade';
    return 'Observações';
  }

  get observacoesPlaceholder(): string {
    return this.observacoesLabel === 'Observações' ? 'Opcional' : this.observacoesLabel;
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<CadastroEmbarque[]>('cadastrosEmbarque').subscribe({
      next: data => { this.cadastros.set(data); this.loading.set(false); },
      error: () => { this.cadastros.set([]); this.loading.set(false); }
    });
  }

  save() {
    if (!this.form.nome?.trim()) {
      this.snackBar.open('Nome é obrigatório.', 'OK', { duration: 3000 });
      return;
    }
    const payload = { ...this.form, nome: this.form.nome.trim(), uf: this.form.uf?.toUpperCase() };
    const request = this.form.id_cadastro
      ? this.api.put<CadastroEmbarque>('cadastrosEmbarque', this.form.id_cadastro, payload)
      : this.api.post<CadastroEmbarque>('cadastrosEmbarque', payload);

    request.subscribe({
      next: () => {
        this.snackBar.open('Cadastro salvo.', 'OK', { duration: 2500 });
        this.resetForm();
        this.load();
      },
      error: err => this.snackBar.open(err.error?.error || 'Erro ao salvar cadastro.', 'OK', { duration: 3500 })
    });
  }

  edit(c: CadastroEmbarque) {
    this.form = { ...c };
  }

  toggleAtivo(c: CadastroEmbarque) {
    if (this.usesOwnTable(c)) {
      this.snackBar.open('Este cadastro usa tabela própria e não possui campo ativo/inativo.', 'OK', { duration: 3000 });
      return;
    }
    this.api.put<CadastroEmbarque>('cadastrosEmbarque', c.id_cadastro!, { ...c, ativo: c.ativo === false }).subscribe({
      next: () => this.load(),
      error: err => this.snackBar.open(err.error?.error || 'Erro ao alterar status.', 'OK', { duration: 3000 })
    });
  }

  remove(c: CadastroEmbarque) {
    if (!confirm(`Remover ${this.labelFor(c.tipo)}: ${c.nome}?`)) return;
    this.api.delete<CadastroEmbarque>('cadastrosEmbarque', c.id_cadastro!).subscribe({
      next: () => { this.snackBar.open('Cadastro removido.', 'OK', { duration: 2500 }); this.load(); },
      error: err => this.snackBar.open(err.error?.error || 'Erro ao remover cadastro.', 'OK', { duration: 3000 })
    });
  }

  resetForm() {
    this.form = this.emptyForm();
  }

  usesOwnTable(c: CadastroEmbarque): boolean {
    return !!c.source && c.source !== 'embarque_cadastros';
  }

  labelFor(tipo: string): string {
    return TIPOS.find(t => t.key === tipo)?.label || tipo;
  }

  iconFor(tipo: string): string {
    return TIPOS.find(t => t.key === tipo)?.icon || 'label';
  }

  private emptyForm(): CadastroEmbarque {
    return { tipo: 'cliente', nome: '', codigo: '', uf: '', observacoes: '', ativo: true };
  }
}
