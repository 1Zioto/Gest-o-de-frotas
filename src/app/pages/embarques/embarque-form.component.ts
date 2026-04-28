import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';

export interface Embarque {
  id_embarque?: string;
  codigo_embarque: string;
  origem_nome?: string; origem_cidade?: string; origem_uf?: string; origem_endereco?: string;
  destino_nome?: string; destino_cidade?: string; destino_uf?: string; destino_endereco?: string;
  data_recebimento_carregamento?: string; data_prevista_agendamento?: string;
  data_coleta?: string; data_previsao_entrega?: string; data_entrega_real?: string;
  id_veiculo?: string; id_motorista?: string;
  motorista_segue_viagem?: boolean;
  descricao_carga?: string; tipo_carga?: string; peso_kg?: number; volume_m3?: number; quantidade?: number;
  quantidade_containers?: number;
  valor_frete?: number; custo_estimado?: number; lucro_estimado?: number;
  status?: string; observacoes?: string; observacao_erro?: string;
  ordem_gerada?: boolean; containers_gerados?: number;
  placa?: string; veiculo_modelo?: string; motorista_nome?: string;
  created_at?: string;
}

interface EmbarqueVeiculo {
  id?: string;
  id_veiculo?: string;
  placa: string;
  modelo?: string;
  marca?: string;
  ativo?: boolean;
}

interface EmbarqueMotorista {
  id?: string;
  id_motorista?: string;
  nome: string;
  cnh?: string;
  cel?: string;
  email?: string;
  ativo?: boolean;
}

@Component({
  selector: 'app-embarque-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatIconModule],
  template: `
    <div class="dialog-header">
      <div class="dialog-title">
        <div class="title-icon"><mat-icon>inventory_2</mat-icon></div>
        <div>
          <h2>{{ data ? 'Editar' : 'Novo' }} Embarque</h2>
          <p>{{ data ? 'Atualize os dados do embarque' : 'Preencha os dados do embarque' }}</p>
        </div>
      </div>
      <button class="close-btn" mat-dialog-close><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content>
      <form class="form-body">

        <div class="section-label">Identificação</div>
        <div class="form-row three">
          <div class="field span2">
            <label>Código do Embarque <span class="req">*</span></label>
            <input type="text" class="field-input" [(ngModel)]="item.codigo_embarque" name="codigo_embarque" placeholder="Ex: EMB-2026-001" required>
          </div>
          <div class="field">
            <label>Status</label>
            <select class="field-input" [(ngModel)]="item.status" name="status">
              <option value="fazer_agendamento">Fazer agendamento</option>
              <option value="agendado">Agendado</option>
              <option value="ordem_retirada_enviada">Ordem de retirada enviada</option>
              <option value="enviar_ordem_carregamento">Enviar ordem de carregamento</option>
              <option value="aguardando_carregamento">Aguardando carregamento</option>
              <option value="viagem_finalizada">Viagem finalizada</option>
              <option value="erro_processo">Erro no processo</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label>Veículo</label>
            <select class="field-input" [(ngModel)]="item.id_veiculo" name="id_veiculo">
              <option value="">Nenhum</option>
              @for (v of veiculos(); track vehicleValue(v)) {
                <option [value]="vehicleValue(v)">{{ v.placa }}{{ v.modelo ? ' — ' + v.modelo : '' }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label>Motorista</label>
            <select class="field-input" [(ngModel)]="item.id_motorista" name="id_motorista">
              <option value="">Nenhum</option>
              @for (m of motoristas(); track motoristaValue(m)) {
                <option [value]="motoristaValue(m)">{{ m.nome }}</option>
              }
            </select>
          </div>
          <div class="field toggle-field">
            <label>Motorista segue viagem?</label>
            <label class="check-row">
              <input type="checkbox" [(ngModel)]="item.motorista_segue_viagem" name="motorista_segue_viagem">
              <span>Sim</span>
            </label>
          </div>
        </div>

        <div class="section-label">Origem</div>
        <div class="form-row">
          <div class="field span2">
            <label>Nome / Empresa</label>
            <input type="text" class="field-input" [(ngModel)]="item.origem_nome" name="origem_nome" placeholder="Remetente">
          </div>
        </div>
        <div class="form-row three">
          <div class="field span2">
            <label>Endereço</label>
            <input type="text" class="field-input" [(ngModel)]="item.origem_endereco" name="origem_endereco">
          </div>
          <div class="field">
            <label>Cidade</label>
            <input type="text" class="field-input" [(ngModel)]="item.origem_cidade" name="origem_cidade">
          </div>
        </div>

        <div class="section-label">Destino</div>
        <div class="form-row">
          <div class="field span2">
            <label>Nome / Empresa</label>
            <input type="text" class="field-input" [(ngModel)]="item.destino_nome" name="destino_nome" placeholder="Destinatário">
          </div>
        </div>
        <div class="form-row three">
          <div class="field span2">
            <label>Endereço</label>
            <input type="text" class="field-input" [(ngModel)]="item.destino_endereco" name="destino_endereco">
          </div>
          <div class="field">
            <label>Cidade</label>
            <input type="text" class="field-input" [(ngModel)]="item.destino_cidade" name="destino_cidade">
          </div>
        </div>

        <div class="section-label">Datas</div>
        <div class="form-row three">
          <div class="field">
            <label>Recebimento do carregamento</label>
            <input type="datetime-local" class="field-input" [(ngModel)]="item.data_recebimento_carregamento" name="data_recebimento_carregamento">
          </div>
          <div class="field">
            <label>Previsão de agendamento</label>
            <input type="datetime-local" class="field-input" [(ngModel)]="item.data_prevista_agendamento" name="data_prevista_agendamento">
          </div>
          <div class="field">
            <label>Data de Coleta</label>
            <input type="datetime-local" class="field-input" [(ngModel)]="item.data_coleta" name="data_coleta">
          </div>
        </div>
        <div class="form-row three">
          <div class="field">
            <label>Previsão de Entrega</label>
            <input type="datetime-local" class="field-input" [(ngModel)]="item.data_previsao_entrega" name="data_previsao_entrega">
          </div>
          <div class="field">
            <label>Entrega Real</label>
            <input type="datetime-local" class="field-input" [(ngModel)]="item.data_entrega_real" name="data_entrega_real">
          </div>
        </div>

        <div class="section-label">Carga</div>
        <div class="form-row">
          <div class="field span2">
            <label>Descrição da Carga</label>
            <input type="text" class="field-input" [(ngModel)]="item.descricao_carga" name="descricao_carga" placeholder="Ex: Eletrônicos, Alimentos...">
          </div>
        </div>
        <div class="form-row four">
          <div class="field">
            <label>Tipo</label>
            <input type="text" class="field-input" [(ngModel)]="item.tipo_carga" name="tipo_carga">
          </div>
          <div class="field">
            <label>Peso (kg)</label>
            <input type="number" class="field-input" [(ngModel)]="item.peso_kg" name="peso_kg" min="0">
          </div>
          <div class="field">
            <label>Volume (m³)</label>
            <input type="number" class="field-input" [(ngModel)]="item.volume_m3" name="volume_m3" min="0">
          </div>
          <div class="field">
            <label>Qtd.</label>
            <input type="number" class="field-input" [(ngModel)]="item.quantidade" name="quantidade" min="0">
          </div>
          <div class="field">
            <label>Containers</label>
            <input type="number" class="field-input" [(ngModel)]="item.quantidade_containers" name="quantidade_containers" min="0">
          </div>
        </div>

        <div class="section-label">Financeiro</div>
        <div class="form-row three">
          <div class="field">
            <label>Valor do Frete</label>
            <div class="input-prefix">
              <span class="prefix">R$</span>
              <input type="number" class="field-input" [(ngModel)]="item.valor_frete" name="valor_frete" step="0.01" min="0">
            </div>
          </div>
          <div class="field">
            <label>Custo Estimado</label>
            <div class="input-prefix">
              <span class="prefix">R$</span>
              <input type="number" class="field-input" [(ngModel)]="item.custo_estimado" name="custo_estimado" step="0.01" min="0">
            </div>
          </div>
          <div class="field">
            <label>Lucro Estimado</label>
            <div class="input-prefix">
              <span class="prefix">R$</span>
              <input type="number" class="field-input profit-field" [(ngModel)]="item.lucro_estimado" name="lucro_estimado" step="0.01">
            </div>
          </div>
        </div>

        <div class="section-label">Observações</div>
        <div class="field">
          <textarea class="field-input textarea" [(ngModel)]="item.observacoes" name="observacoes" rows="2" placeholder="Notas adicionais..."></textarea>
        </div>
        <div class="field" *ngIf="item.status === 'erro_processo'">
          <label>Motivo do erro no processo</label>
          <textarea class="field-input textarea" [(ngModel)]="item.observacao_erro" name="observacao_erro" rows="2" placeholder="Descreva o motivo do erro..."></textarea>
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
    .title-icon { width:44px; height:44px; border-radius:12px; flex-shrink:0; background:linear-gradient(135deg,#0ea5e9,#0369a1); display:flex; align-items:center; justify-content:center; mat-icon { color:white; font-size:22px; width:22px; height:22px; } }
    h2 { font-size:18px; font-weight:700; color:#0f172a; margin:0 0 2px; }
    p { font-size:13px; color:#64748b; margin:0; }
    .close-btn { background:none; border:none; cursor:pointer; padding:4px; border-radius:8px; display:flex; color:#94a3b8; &:hover { background:#f1f5f9; color:#475569; } mat-icon { font-size:20px; width:20px; height:20px; } }
    mat-dialog-content { padding:20px 24px !important; max-height:60vh; }
    .form-body { display:flex; flex-direction:column; gap:4px; }
    .section-label { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.08em; margin:12px 0 8px; border-bottom:1px solid #f1f5f9; padding-bottom:6px; &:first-child { margin-top:0; } }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:4px; &.three { grid-template-columns:1fr 1fr 1fr; } &.four { grid-template-columns:1fr 1fr 1fr 1fr; } }
    .span2 { grid-column:span 2; }
    .field { display:flex; flex-direction:column; gap:5px; }
    .toggle-field { justify-content:flex-end; }
    .check-row { height:40px; display:flex; align-items:center; gap:8px; font-size:13px; color:#1e293b; font-weight:600; }
    .check-row input { width:16px; height:16px; accent-color:#0369a1; }
    label { font-size:12px; font-weight:600; color:#475569; }
    .req { color:#ef4444; }
    .field-input { height:40px; border:1.5px solid #e2e8f0; border-radius:8px; padding:0 12px; font-size:14px; color:#1e293b; font-family:inherit; background:white; outline:none; width:100%; box-sizing:border-box; transition:border-color 0.15s; &:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1); } }
    select.field-input { appearance:auto; cursor:pointer; }
    textarea.field-input { height:auto; padding:10px 12px; resize:vertical; }
    .profit-field { background:#f0fdf4; border-color:#bbf7d0; }
    .input-prefix { display:flex; align-items:center; border:1.5px solid #e2e8f0; border-radius:8px; overflow:hidden; background:white; transition:border-color 0.15s; &:focus-within { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1); } .prefix { padding:0 10px; font-size:13px; font-weight:600; color:#64748b; background:#f8fafc; border-right:1px solid #e2e8f0; height:40px; display:flex; align-items:center; flex-shrink:0; } input.field-input { border:none; border-radius:0; box-shadow:none !important; height:40px; } }
    .dialog-footer { display:flex; justify-content:flex-end; gap:10px; padding:16px 24px; border-top:1px solid #f1f5f9; }
    .btn-cancel { background:white; border:1.5px solid #e2e8f0; border-radius:8px; padding:0 20px; height:40px; font-size:14px; font-weight:600; color:#475569; cursor:pointer; font-family:inherit; &:hover { background:#f8fafc; } }
    .btn-save { display:flex; align-items:center; gap:6px; background:linear-gradient(135deg,#3b82f6,#1d4ed8); color:white; border:none; border-radius:8px; padding:0 22px; height:40px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; transition:opacity 0.2s; &:hover { opacity:0.9; } &:disabled { opacity:0.6; cursor:not-allowed; } mat-icon { font-size:18px; width:18px; height:18px; } }
    @media(max-width:599px) { .form-row, .form-row.three, .form-row.four { grid-template-columns:1fr; } .span2 { grid-column:1; } }
  `]
})
export class EmbarqueFormComponent implements OnInit {
  item: Partial<Embarque> = { status: 'fazer_agendamento', motorista_segue_viagem: true };
  veiculos  = signal<EmbarqueVeiculo[]>([]);
  motoristas = signal<EmbarqueMotorista[]>([]);
  saving = signal(false);

  constructor(
    private dialogRef: MatDialogRef<EmbarqueFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Embarque | null,
    private api: ApiService,
    private snackBar: MatSnackBar
  ) {
    if (data) this.item = { ...data };
  }

  ngOnInit() {
    this.api.get<EmbarqueVeiculo[]>('veiculosEmbarque').subscribe(v => this.veiculos.set(v));
    this.api.get<EmbarqueMotorista[]>('motoristasEmbarque').subscribe(m => this.motoristas.set(m));
  }

  vehicleValue(vehicle: EmbarqueVeiculo): string {
    return vehicle.id_veiculo || vehicle.id || '';
  }

  motoristaValue(motorista: EmbarqueMotorista): string {
    return motorista.id_motorista || motorista.id || '';
  }

  save() {
    if (!this.item.codigo_embarque) {
      this.snackBar.open('Código do embarque é obrigatório', 'OK', { duration: 3000 });
      return;
    }
    if (!this.isValidScheduleWindow()) {
      this.snackBar.open('A data prevista de agendamento deve ficar entre o recebimento do carregamento e D-1 da coleta.', 'OK', { duration: 4500 });
      return;
    }
    if (this.item.status === 'erro_processo' && !this.item.observacao_erro?.trim()) {
      this.snackBar.open('Informe o motivo do erro no processo.', 'OK', { duration: 3500 });
      return;
    }
    this.saving.set(true);
    const obs = this.data
      ? this.api.put<Embarque>('embarques', this.data.id_embarque!, this.item)
      : this.api.post<Embarque>('embarques', this.item);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: e => { this.saving.set(false); this.snackBar.open(e.error?.error || 'Erro ao salvar', 'OK', { duration: 3000 }); }
    });
  }

  private isValidScheduleWindow(): boolean {
    if (!this.item.data_prevista_agendamento || !this.item.data_recebimento_carregamento || !this.item.data_coleta) return true;
    const prevista = new Date(this.item.data_prevista_agendamento);
    const recebimento = new Date(this.item.data_recebimento_carregamento);
    const limite = new Date(this.item.data_coleta);
    limite.setDate(limite.getDate() - 1);
    limite.setHours(23, 59, 59, 999);
    return prevista >= recebimento && prevista <= limite;
  }
}
