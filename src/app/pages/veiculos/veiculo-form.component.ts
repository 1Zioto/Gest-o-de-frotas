import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiService } from '../../core/services/api.service';
import { Veiculo, Proprietario } from '../../core/models';

@Component({
  selector: 'app-veiculo-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule,
    MatSelectModule, MatFormFieldModule, MatIconModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatDividerModule, MatSlideToggleModule
  ],
  template: `
    <div class="dialog-container">
      <!-- Header -->
      <div class="dialog-header">
        <div class="dialog-title-area">
          <div class="dialog-icon">
            <mat-icon>{{ data ? 'edit' : 'directions_car' }}</mat-icon>
          </div>
          <div>
            <h2>{{ data ? 'Editar Veículo' : 'Novo Veículo' }}</h2>
            <p>{{ data ? 'Atualize os dados do veículo' : 'Preencha os dados para cadastrar' }}</p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <form #f="ngForm" class="form-content">

          <!-- Seção: Identificação -->
          <div class="section-label">
            <mat-icon>badge</mat-icon> Identificação
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="field-placa">
              <mat-label>Placa *</mat-label>
              <input matInput [(ngModel)]="veiculo.placa" name="placa" required
                maxlength="8" style="text-transform:uppercase;font-family:'JetBrains Mono',monospace;font-weight:700;letter-spacing:0.08em">
              <mat-icon matSuffix>pin</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="field-ano">
              <mat-label>Ano</mat-label>
              <input matInput [(ngModel)]="veiculo.ano" name="ano" maxlength="4" placeholder="2024">
              <mat-icon matSuffix>calendar_today</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="field-cor">
              <mat-label>Cor</mat-label>
              <input matInput [(ngModel)]="veiculo.cor" name="cor">
              <mat-icon matSuffix>palette</mat-icon>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="field-half">
              <mat-label>Marca</mat-label>
              <input matInput [(ngModel)]="veiculo.marca" name="marca" placeholder="Ex: Mercedes-Benz">
            </mat-form-field>

            <mat-form-field appearance="outline" class="field-half">
              <mat-label>Modelo</mat-label>
              <input matInput [(ngModel)]="veiculo.modelo" name="modelo" placeholder="Ex: Actros 2651">
            </mat-form-field>
          </div>

          <!-- Seção: Dados Técnicos -->
          <div class="section-label" style="margin-top: 8px;">
            <mat-icon>settings</mat-icon> Dados Técnicos
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="field-half">
              <mat-label>Tipo de Combustível</mat-label>
              <mat-select [(ngModel)]="veiculo.tipo_combustivel" name="tipo_combustivel">
                <mat-option value="Diesel">
                  <mat-icon style="color:#f59e0b;vertical-align:middle;margin-right:6px">local_gas_station</mat-icon>Diesel
                </mat-option>
                <mat-option value="Gasolina">
                  <mat-icon style="color:#ef4444;vertical-align:middle;margin-right:6px">local_gas_station</mat-icon>Gasolina
                </mat-option>
                <mat-option value="Etanol">
                  <mat-icon style="color:#10b981;vertical-align:middle;margin-right:6px">eco</mat-icon>Etanol
                </mat-option>
                <mat-option value="GNV">
                  <mat-icon style="color:#3b82f6;vertical-align:middle;margin-right:6px">gas_meter</mat-icon>GNV
                </mat-option>
                <mat-option value="Elétrico">
                  <mat-icon style="color:#8b5cf6;vertical-align:middle;margin-right:6px">bolt</mat-icon>Elétrico
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="field-half">
              <mat-label>Odômetro Atual</mat-label>
              <input matInput [(ngModel)]="veiculo.odometro" name="odometro" type="number" placeholder="0">
              <span matSuffix class="suffix-text">km</span>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="field-half">
              <mat-label>RENAVAM</mat-label>
              <input matInput [(ngModel)]="veiculo.renavam" name="renavam" maxlength="11">
              <mat-icon matSuffix>article</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="field-half">
              <mat-label>Nº Chassi</mat-label>
              <input matInput [(ngModel)]="veiculo.numero_chassi" name="numero_chassi"
                style="font-family:'JetBrains Mono',monospace" maxlength="17" placeholder="17 dígitos">
            </mat-form-field>
          </div>

          <!-- Seção: Proprietário -->
          <div class="section-label" style="margin-top: 8px;">
            <mat-icon>person</mat-icon> Vínculo
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Proprietário</mat-label>
              <mat-select [(ngModel)]="veiculo.proprietario_id" name="proprietario_id">
                <mat-option value="">Sem proprietário</mat-option>
                @for (p of proprietarios(); track p.id_proprietario) {
                  <mat-option [value]="p.id_proprietario">{{ p.nome }}</mat-option>
                }
              </mat-select>
              <mat-icon matSuffix>business</mat-icon>
            </mat-form-field>
          </div>

          @if (data) {
            <div class="form-row" style="margin-top: 4px;">
              <div class="toggle-row">
                <span class="toggle-label">Veículo Ativo</span>
                <mat-slide-toggle [(ngModel)]="veiculo.ativo" name="ativo" color="primary"></mat-slide-toggle>
              </div>
            </div>
          }

        </form>
      </mat-dialog-content>

      <!-- Footer -->
      <div class="dialog-footer">
        <button mat-button mat-dialog-close class="btn-cancel">
          <mat-icon>close</mat-icon> Cancelar
        </button>
        <button mat-raised-button class="btn-save" (click)="save()" [disabled]="saving()">
          @if (saving()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <mat-icon>save</mat-icon> {{ data ? 'Atualizar' : 'Cadastrar' }}
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      background: white;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #f1f5f9;

      .dialog-title-area {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .dialog-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        display: flex;
        align-items: center;
        justify-content: center;
        mat-icon { color: white; font-size: 22px; width: 22px; height: 22px; }
      }

      h2 { margin: 0; font-size: 1.1rem; font-weight: 800; color: #0f172a; }
      p { margin: 2px 0 0; font-size: 0.8rem; color: #64748b; font-weight: 500; }
    }

    .close-btn { color: #94a3b8 !important; }

    mat-dialog-content {
      padding: 20px 24px !important;
      overflow-y: auto;
      flex: 1;
    }

    .form-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: -4px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #6366f1; }
    }

    .form-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .field-half { flex: 1; min-width: 180px; }
    .field-full { flex: 1; width: 100%; }
    .field-placa { flex: 1.5; min-width: 120px; }
    .field-ano { flex: 1; min-width: 90px; }
    .field-cor { flex: 1; min-width: 100px; }

    .suffix-text {
      font-size: 0.8rem;
      color: #94a3b8;
      font-weight: 600;
      margin-right: 4px;
    }

    .toggle-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      width: 100%;

      .toggle-label {
        flex: 1;
        font-size: 0.875rem;
        font-weight: 600;
        color: #334155;
      }
    }

    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px 20px;
      border-top: 1px solid #f1f5f9;
    }

    .btn-cancel {
      color: #64748b !important;
      border-radius: 10px !important;
      height: 40px;
    }

    .btn-save {
      height: 42px;
      padding: 0 24px;
      background: linear-gradient(135deg, #6366f1, #4f46e5) !important;
      color: white !important;
      box-shadow: 0 4px 12px rgba(99,102,241,0.3) !important;
      border-radius: 10px !important;
      font-weight: 700 !important;
      display: flex;
      align-items: center;
      gap: 6px;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      mat-spinner { --mdc-circular-progress-active-indicator-color: white; }
    }

    mat-form-field { font-size: 0.875rem; }

    @media (max-width: 540px) {
      .dialog-header { padding: 16px; }
      mat-dialog-content { padding: 16px !important; }
      .dialog-footer { padding: 12px 16px 16px; }
    }
  `]
})
export class VeiculoFormComponent implements OnInit {
  veiculo: Partial<Veiculo> = { ativo: true };
  proprietarios = signal<Proprietario[]>([]);
  saving = signal(false);

  constructor(
    private dialogRef: MatDialogRef<VeiculoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Veiculo | null,
    private api: ApiService,
    private snackBar: MatSnackBar
  ) {
    if (data) this.veiculo = { ...data };
  }

  ngOnInit() {
    this.api.get<Proprietario[]>('proprietarios').subscribe({
      next: (p) => this.proprietarios.set(p),
      error: () => {}
    });
  }

  save() {
    if (!this.veiculo.placa?.trim()) {
      this.snackBar.open('A placa é obrigatória', 'OK', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    const obs = this.data
      ? this.api.put<Veiculo>('veiculos', this.data.id_veiculo, this.veiculo)
      : this.api.post<Veiculo>('veiculos', this.veiculo);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
        this.snackBar.open(
          this.data ? 'Veículo atualizado com sucesso!' : 'Veículo cadastrado com sucesso!',
          'OK', { duration: 3000 }
        );
      },
      error: (e) => {
        this.saving.set(false);
        this.snackBar.open(e.error?.error || 'Erro ao salvar veículo', 'OK', { duration: 4000 });
      }
    });
  }
}
