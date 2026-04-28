import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { Embarque } from '../embarques/embarque-form.component';
import { ContainerViagem } from '../containers/containers';

export interface Cte {
  id_cte?: string;
  numero_cte: string;
  serie?: string;
  chave_acesso?: string;
  id_embarque: string;
  id_container?: string;
  codigo_viagem?: string;
  numero_container?: string;
  codigo_embarque?: string;
  remetente_nome?: string; remetente_cnpj_cpf?: string;
  destinatario_nome?: string; destinatario_cnpj_cpf?: string;
  origem_cidade?: string; origem_uf?: string;
  destino_cidade?: string; destino_uf?: string;
  valor_total?: number; valor_frete?: number; valor_imposto?: number;
  data_emissao?: string; data_autorizacao?: string;
  status?: string;
  xml_url?: string; pdf_url?: string;
  created_at?: string;
}

@Component({
  selector: 'app-cte-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatIconModule],
  template: `
    <div class="dialog-header">
      <div class="dialog-title">
        <div class="title-icon"><mat-icon>description</mat-icon></div>
        <div>
          <h2>{{ data ? 'Editar' : 'Novo' }} CT-e</h2>
          <p>Conhecimento de Transporte Eletrônico</p>
        </div>
      </div>
      <button class="close-btn" mat-dialog-close><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content>
      <form class="form-body">

        <div class="section-label">Identificação</div>
        <div class="form-row three">
          <div class="field">
            <label>Número CT-e <span class="req">*</span></label>
            <input type="text" class="field-input" [(ngModel)]="item.numero_cte" name="numero_cte" required>
          </div>
          <div class="field">
            <label>Série</label>
            <input type="text" class="field-input" [(ngModel)]="item.serie" name="serie">
          </div>
          <div class="field">
            <label>Status</label>
            <select class="field-input" [(ngModel)]="item.status" name="status">
              <option value="emitido">Emitido</option>
              <option value="autorizado">Autorizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="field span2">
            <label>Viagem / Container</label>
            <select class="field-input" [(ngModel)]="item.id_container" name="id_container" (ngModelChange)="onContainerChange($event)">
              <option value="">Selecione a viagem</option>
              @for (c of containers(); track c.id_container) {
                <option [value]="c.id_container">{{ c.codigo_viagem }} — {{ c.codigo_embarque }}{{ c.numero_container ? ' — ' + c.numero_container : '' }}</option>
              }
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="field span2">
            <label>Embarque <span class="req">*</span></label>
            <select class="field-input" [(ngModel)]="item.id_embarque" name="id_embarque" required>
              <option value="">Selecione o embarque</option>
              @for (e of embarques(); track e.id_embarque) {
                <option [value]="e.id_embarque">{{ e.codigo_embarque }} — {{ e.origem_cidade }}/{{ e.origem_uf }} → {{ e.destino_cidade }}/{{ e.destino_uf }}</option>
              }
            </select>
          </div>
        </div>
        <div class="field">
          <label>Chave de Acesso</label>
          <input type="text" class="field-input" [(ngModel)]="item.chave_acesso" name="chave_acesso" placeholder="44 dígitos" maxlength="60">
        </div>

        <div class="section-label">Remetente</div>
        <div class="form-row">
          <div class="field span2">
            <label>Nome / Razão Social</label>
            <input type="text" class="field-input" [(ngModel)]="item.remetente_nome" name="remetente_nome">
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label>CPF / CNPJ</label>
            <input type="text" class="field-input" [(ngModel)]="item.remetente_cnpj_cpf" name="remetente_cnpj_cpf">
          </div>
          <div class="field">
            <label>Cidade Origem / UF</label>
            <div class="city-uf">
              <input type="text" class="field-input" [(ngModel)]="item.origem_cidade" name="origem_cidade" placeholder="Cidade">
              <input type="text" class="field-input uf-input" [(ngModel)]="item.origem_uf" name="origem_uf" placeholder="UF" maxlength="2">
            </div>
          </div>
        </div>

        <div class="section-label">Destinatário</div>
        <div class="form-row">
          <div class="field span2">
            <label>Nome / Razão Social</label>
            <input type="text" class="field-input" [(ngModel)]="item.destinatario_nome" name="destinatario_nome">
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label>CPF / CNPJ</label>
            <input type="text" class="field-input" [(ngModel)]="item.destinatario_cnpj_cpf" name="destinatario_cnpj_cpf">
          </div>
          <div class="field">
            <label>Cidade Destino / UF</label>
            <div class="city-uf">
              <input type="text" class="field-input" [(ngModel)]="item.destino_cidade" name="destino_cidade" placeholder="Cidade">
              <input type="text" class="field-input uf-input" [(ngModel)]="item.destino_uf" name="destino_uf" placeholder="UF" maxlength="2">
            </div>
          </div>
        </div>

        <div class="section-label">Valores e Datas</div>
        <div class="form-row three">
          <div class="field">
            <label>Valor Total</label>
            <div class="input-prefix">
              <span class="prefix">R$</span>
              <input type="number" class="field-input" [(ngModel)]="item.valor_total" name="valor_total" step="0.01">
            </div>
          </div>
          <div class="field">
            <label>Valor do Frete</label>
            <div class="input-prefix">
              <span class="prefix">R$</span>
              <input type="number" class="field-input" [(ngModel)]="item.valor_frete" name="valor_frete" step="0.01">
            </div>
          </div>
          <div class="field">
            <label>Impostos</label>
            <div class="input-prefix">
              <span class="prefix">R$</span>
              <input type="number" class="field-input" [(ngModel)]="item.valor_imposto" name="valor_imposto" step="0.01">
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label>Data de Emissão</label>
            <input type="datetime-local" class="field-input" [(ngModel)]="item.data_emissao" name="data_emissao">
          </div>
          <div class="field">
            <label>Data de Autorização</label>
            <input type="datetime-local" class="field-input" [(ngModel)]="item.data_autorizacao" name="data_autorizacao">
          </div>
        </div>

        <div class="section-label">Arquivos (URLs)</div>
        <div class="form-row">
          <div class="field">
            <label>URL do XML</label>
            <input type="url" class="field-input" [(ngModel)]="item.xml_url" name="xml_url" placeholder="https://...">
          </div>
          <div class="field">
            <label>URL do PDF</label>
            <input type="url" class="field-input" [(ngModel)]="item.pdf_url" name="pdf_url" placeholder="https://...">
          </div>
        </div>

      </form>
    </mat-dialog-content>

    <div class="dialog-footer">
      <button class="btn-cancel" mat-dialog-close>Cancelar</button>
      <button class="btn-save" (click)="save()" [disabled]="saving()">
        @if (saving()) { <mat-spinner diameter="18"></mat-spinner><span>Salvando…</span> }
        @else { <mat-icon>save</mat-icon><span>Salvar</span> }
      </button>
    </div>
  `,
  styles: [`
    .dialog-header { display:flex; align-items:flex-start; justify-content:space-between; padding:24px 24px 0; gap:16px; }
    .dialog-title { display:flex; align-items:center; gap:14px; }
    .title-icon { width:44px; height:44px; border-radius:12px; flex-shrink:0; background:linear-gradient(135deg,#8b5cf6,#6d28d9); display:flex; align-items:center; justify-content:center; mat-icon { color:white; font-size:22px; width:22px; height:22px; } }
    h2 { font-size:18px; font-weight:700; color:#0f172a; margin:0 0 2px; }
    p { font-size:13px; color:#64748b; margin:0; }
    .close-btn { background:none; border:none; cursor:pointer; padding:4px; border-radius:8px; display:flex; color:#94a3b8; &:hover { background:#f1f5f9; } mat-icon { font-size:20px; width:20px; height:20px; } }
    mat-dialog-content { padding:20px 24px !important; max-height:60vh; }
    .form-body { display:flex; flex-direction:column; gap:4px; }
    .section-label { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.08em; margin:12px 0 8px; border-bottom:1px solid #f1f5f9; padding-bottom:6px; &:first-child { margin-top:0; } }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:4px; &.three { grid-template-columns:1fr 1fr 1fr; } }
    .span2 { grid-column:span 2; }
    .field { display:flex; flex-direction:column; gap:5px; }
    label { font-size:12px; font-weight:600; color:#475569; }
    .req { color:#ef4444; }
    .field-input { height:40px; border:1.5px solid #e2e8f0; border-radius:8px; padding:0 12px; font-size:14px; color:#1e293b; font-family:inherit; background:white; outline:none; width:100%; box-sizing:border-box; transition:border-color 0.15s; &:focus { border-color:#8b5cf6; box-shadow:0 0 0 3px rgba(139,92,246,0.1); } }
    select.field-input { appearance:auto; cursor:pointer; }
    .city-uf { display:flex; gap:8px; .uf-input { width:60px; flex-shrink:0; } }
    .input-prefix { display:flex; align-items:center; border:1.5px solid #e2e8f0; border-radius:8px; overflow:hidden; background:white; &:focus-within { border-color:#8b5cf6; } .prefix { padding:0 10px; font-size:13px; font-weight:600; color:#64748b; background:#f8fafc; border-right:1px solid #e2e8f0; height:40px; display:flex; align-items:center; flex-shrink:0; } input.field-input { border:none; border-radius:0; box-shadow:none !important; height:40px; } }
    .dialog-footer { display:flex; justify-content:flex-end; gap:10px; padding:16px 24px; border-top:1px solid #f1f5f9; }
    .btn-cancel { background:white; border:1.5px solid #e2e8f0; border-radius:8px; padding:0 20px; height:40px; font-size:14px; font-weight:600; color:#475569; cursor:pointer; font-family:inherit; &:hover { background:#f8fafc; } }
    .btn-save { display:flex; align-items:center; gap:6px; background:linear-gradient(135deg,#8b5cf6,#6d28d9); color:white; border:none; border-radius:8px; padding:0 22px; height:40px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; &:hover { opacity:0.9; } &:disabled { opacity:0.6; cursor:not-allowed; } mat-icon { font-size:18px; width:18px; height:18px; } }
  `]
})
export class CteFormComponent implements OnInit {
  item: Partial<Cte> = { status: 'emitido' };
  embarques = signal<Embarque[]>([]);
  containers = signal<ContainerViagem[]>([]);
  saving = signal(false);

  constructor(
    private dialogRef: MatDialogRef<CteFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Cte | null,
    private api: ApiService,
    private snackBar: MatSnackBar
  ) {
    if (data) this.item = { ...data };
  }

  ngOnInit() {
    this.api.get<Embarque[]>('embarques').subscribe(e => this.embarques.set(e));
    this.api.get<ContainerViagem[]>('containers').subscribe(c => this.containers.set(c));
  }

  onContainerChange(id: string) {
    const container = this.containers().find(c => c.id_container === id);
    if (container) this.item.id_embarque = container.id_embarque;
  }

  save() {
    if (!this.item.numero_cte || !this.item.id_embarque) {
      this.snackBar.open('Número do CT-e e embarque são obrigatórios', 'OK', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    const obs = this.data
      ? this.api.put<Cte>('ctes', this.data.id_cte!, this.item)
      : this.api.post<Cte>('ctes', this.item);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: e => { this.saving.set(false); this.snackBar.open(e.error?.error || 'Erro ao salvar', 'OK', { duration: 3000 }); }
    });
  }
}
