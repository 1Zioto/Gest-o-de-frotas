import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { Abastecimento, Veiculo, Motorista } from '../../core/models';

@Component({
  selector: 'app-abastecimento-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule,
    MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatSnackBarModule, MatIconModule],
  template: `
    <!-- Cabeçalho -->
    <div class="dialog-header">
      <div class="dialog-title">
        <div class="title-icon"><mat-icon>local_gas_station</mat-icon></div>
        <div>
          <h2>{{ data ? 'Editar' : 'Novo' }} Abastecimento</h2>
          <p>{{ data ? 'Atualize os dados do abastecimento' : 'Preencha os dados do abastecimento' }}</p>
        </div>
      </div>
      <button class="close-btn" mat-dialog-close><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content>
      <form class="form-body">

        <!-- Seção: Identificação -->
        <div class="section-label">Identificação</div>
        <div class="form-row">
          <div class="field">
            <label>Data <span class="req">*</span></label>
            <input type="date" class="field-input" [(ngModel)]="item.data" name="data" required>
          </div>
          <div class="field">
            <label>Veículo <span class="req">*</span></label>
            <select class="field-input" [(ngModel)]="item.id_veiculo" name="id_veiculo" required>
              <option value="">Selecione o veículo</option>
              @for (v of veiculos(); track v.id_veiculo) {
                <option [value]="v.id_veiculo">{{ v.placa }}{{ v.modelo ? ' — ' + v.modelo : '' }}</option>
              }
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label>Motorista</label>
            <select class="field-input" [(ngModel)]="item.id_motorista" name="id_motorista">
              <option value="">Nenhum</option>
              @for (m of motoristas(); track m.id_motorista) {
                <option [value]="m.id_motorista">{{ m.nome }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label>Tipo de Combustível</label>
            <select class="field-input" [(ngModel)]="item.tipo_combustivel" name="tipo_combustivel">
              <option value="">Selecione</option>
              <option value="Diesel S10">Diesel S10</option>
              <option value="Diesel S500">Diesel S500</option>
              <option value="Gasolina">Gasolina</option>
              <option value="Etanol">Etanol</option>
              <option value="GNV">GNV</option>
            </select>
          </div>
        </div>

        <!-- Seção: Valores -->
        <div class="section-label">Valores</div>
        <div class="form-row three">
          <div class="field">
            <label>Litros</label>
            <div class="input-suffix">
              <input type="number" class="field-input" [(ngModel)]="item.litros" name="litros"
                     step="0.001" min="0" placeholder="0,000" (input)="calcTotal()">
              <span class="suffix">L</span>
            </div>
          </div>
          <div class="field">
            <label>Valor por Litro</label>
            <div class="input-prefix">
              <span class="prefix">R$</span>
              <input type="number" class="field-input" [(ngModel)]="item.valor_litro" name="valor_litro"
                     step="0.0001" min="0" placeholder="0,0000" (input)="calcTotal()">
            </div>
          </div>
          <div class="field">
            <label>Valor Total</label>
            <div class="input-prefix">
              <span class="prefix">R$</span>
              <input type="number" class="field-input total-field" [(ngModel)]="item.valor_total"
                     name="valor_total" step="0.01" min="0" placeholder="0,00">
            </div>
          </div>
        </div>

        <!-- Seção: Informações Adicionais -->
        <div class="section-label">Informações Adicionais</div>
        <div class="form-row">
          <div class="field">
            <label>Odômetro Atual</label>
            <div class="input-suffix">
              <input type="number" class="field-input" [(ngModel)]="item.odometro_atual"
                     name="odometro_atual" placeholder="0">
              <span class="suffix">km</span>
            </div>
          </div>
          <div class="field">
            <label>Local</label>
            <input type="text" class="field-input" [(ngModel)]="item.local" name="local" placeholder="Ex: Posto Shell">
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label>Nº Nota Fiscal</label>
            <input type="text" class="field-input" [(ngModel)]="item.numero_nf" name="numero_nf" placeholder="Opcional">
          </div>
          <div class="field">
            <label>Status</label>
            <select class="field-input" [(ngModel)]="item.status" name="status">
              <option value="Pendente">Pendente</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Rejeitado">Rejeitado</option>
            </select>
          </div>
        </div>

      </form>
    </mat-dialog-content>

    <!-- Rodapé -->
    <div class="dialog-footer">
      <button class="btn-cancel" mat-dialog-close>Cancelar</button>
      <button class="btn-save" (click)="save()" [disabled]="saving()">
        @if (saving()) {
          <mat-spinner diameter="18" color="accent"></mat-spinner>
          <span>Salvando…</span>
        } @else {
          <mat-icon>save</mat-icon>
          <span>Salvar</span>
        }
      </button>
    </div>
  `,
  styles: [`
    /* Cabeçalho */
    .dialog-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 24px 24px 0; gap: 16px;
    }
    .dialog-title { display: flex; align-items: center; gap: 14px; }
    .title-icon {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: white; font-size: 22px; width: 22px; height: 22px; }
    }
    h2 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
    p { font-size: 13px; color: #64748b; margin: 0; }
    .close-btn {
      background: none; border: none; cursor: pointer; padding: 4px;
      border-radius: 8px; display: flex; color: #94a3b8;
      &:hover { background: #f1f5f9; color: #475569; }
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    /* Conteúdo */
    mat-dialog-content { padding: 20px 24px !important; max-height: 65vh; }
    .form-body { display: flex; flex-direction: column; gap: 4px; }
    .section-label {
      font-size: 11px; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.08em;
      margin: 12px 0 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;
      &:first-child { margin-top: 0; }
    }
    .form-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 4px;
      &.three { grid-template-columns: 1fr 1fr 1fr; }
    }
    .field { display: flex; flex-direction: column; gap: 5px; }
    label {
      font-size: 12px; font-weight: 600; color: #475569;
    }
    .req { color: #ef4444; }
    .field-input {
      height: 40px; border: 1.5px solid #e2e8f0; border-radius: 8px;
      padding: 0 12px; font-size: 14px; color: #1e293b;
      font-family: inherit; background: white; outline: none; width: 100%;
      box-sizing: border-box; transition: border-color 0.15s;
      &:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
      &:disabled { background: #f8fafc; color: #94a3b8; }
    }
    select.field-input { appearance: auto; cursor: pointer; }
    .total-field { background: #f0fdf4; border-color: #bbf7d0; font-weight: 600; color: #15803d; }
    .input-prefix {
      display: flex; align-items: center;
      border: 1.5px solid #e2e8f0; border-radius: 8px; overflow: hidden;
      background: white; transition: border-color 0.15s;
      &:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
      .prefix {
        padding: 0 10px; font-size: 13px; font-weight: 600; color: #64748b;
        background: #f8fafc; border-right: 1px solid #e2e8f0;
        height: 40px; display: flex; align-items: center; white-space: nowrap; flex-shrink: 0;
      }
      input.field-input { border: none; border-radius: 0; box-shadow: none !important; height: 40px; }
    }
    .input-suffix {
      display: flex; align-items: center;
      border: 1.5px solid #e2e8f0; border-radius: 8px; overflow: hidden;
      background: white; transition: border-color 0.15s;
      &:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
      input.field-input { border: none; border-radius: 0; box-shadow: none !important; height: 40px; flex: 1; }
      .suffix {
        padding: 0 10px; font-size: 13px; font-weight: 600; color: #64748b;
        background: #f8fafc; border-left: 1px solid #e2e8f0;
        height: 40px; display: flex; align-items: center; white-space: nowrap; flex-shrink: 0;
      }
    }

    /* Rodapé */
    .dialog-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 16px 24px; border-top: 1px solid #f1f5f9;
    }
    .btn-cancel {
      background: white; border: 1.5px solid #e2e8f0; border-radius: 8px;
      padding: 0 20px; height: 40px; font-size: 14px; font-weight: 600;
      color: #475569; cursor: pointer; font-family: inherit;
      &:hover { background: #f8fafc; }
    }
    .btn-save {
      display: flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white;
      border: none; border-radius: 8px; padding: 0 22px; height: 40px;
      font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
      transition: opacity 0.2s;
      &:hover { opacity: 0.9; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    @media (max-width: 599px) {
      .form-row, .form-row.three { grid-template-columns: 1fr; }
      mat-dialog-content { padding: 16px !important; }
      .dialog-header { padding: 16px 16px 0; }
      .dialog-footer { padding: 12px 16px; }
    }
  `]
})
export class AbastecimentoFormComponent implements OnInit {
  item: Partial<Abastecimento> & { odometro_atual?: number } =
    { status: 'Pendente', data: new Date().toISOString().substring(0, 10) };
  veiculos = signal<Veiculo[]>([]);
  motoristas = signal<Motorista[]>([]);
  saving = signal(false);

  constructor(
    private dialogRef: MatDialogRef<AbastecimentoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Abastecimento | null,
    private api: ApiService,
    private snackBar: MatSnackBar
  ) {
    if (data) this.item = { ...data } as any;
  }

  ngOnInit() {
    this.api.get<Veiculo[]>('veiculos').subscribe(v => this.veiculos.set(v));
    this.api.get<Motorista[]>('motoristas').subscribe(m => this.motoristas.set(m));
  }

  calcTotal() {
    if (this.item.litros && this.item.valor_litro) {
      this.item.valor_total = Math.round(+this.item.litros * +this.item.valor_litro * 100) / 100;
    }
  }

  save() {
    if (!this.item.id_veiculo || !this.item.data) {
      this.snackBar.open('Veículo e data são obrigatórios', 'OK', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    const obs = this.data
      ? this.api.put<Abastecimento>('abastecimentos', this.data.id_abastecimento, this.item)
      : this.api.post<Abastecimento>('abastecimentos', this.item);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (e) => { this.saving.set(false); this.snackBar.open(e.error?.error || 'Erro ao salvar', 'OK', { duration: 3000 }); }
    });
  }
}
