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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../core/services/api.service';
import { Inspecao, Veiculo, Motorista } from '../../core/models';

const CHECKLIST_GROUPS = [
  { group: 'Documentação', items: ['CNH', 'CRLV', 'Seguro', 'Tacógrafo', 'EPI'] },
  { group: 'Motor', items: ['Óleo Motor', 'Óleo Hidráulico', 'Água do Radiador', 'Correia Alternador', 'Filtro de Ar'] },
  { group: 'Freios', items: ['Freio de Serviço', 'Freio de Estacionamento', 'Freio Motor', 'Lona/Pastilha'] },
  { group: 'Pneus', items: ['Calibragem Dianteiros', 'Calibragem Traseiros', 'Estepe', 'Estado dos Pneus'] },
  { group: 'Iluminação', items: ['Farol Dianteiro', 'Farol Traseiro', 'Pisca-alerta', 'Luz de Ré', 'Lanterna'] },
  { group: 'Carroceria', items: ['Espelhos', 'Para-choque', 'Cabine', 'Baú/Carroceria', 'Portas'] },
];

@Component({
  selector: 'app-inspecao-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule,
    MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatCheckboxModule, MatDividerModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Visualizar' : 'Nova' }} Inspeção Pré-viagem</h2>
    <mat-dialog-content>
      <form class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Veículo *</mat-label>
          <mat-select [(ngModel)]="item.veiculo_id" name="veiculo_id" required>
            @for (v of veiculos(); track v.id_veiculo) {
              <mat-option [value]="v.id_veiculo">{{ v.placa }} - {{ v.modelo }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Motorista *</mat-label>
          <mat-select [(ngModel)]="item.motorista_id" name="motorista_id" required>
            @for (m of motoristas(); track m.id_motorista) {
              <mat-option [value]="m.id_motorista">{{ m.nome }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Data</mat-label>
          <input matInput type="date" [(ngModel)]="item.data" name="data">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Odômetro</mat-label>
          <input matInput type="number" [(ngModel)]="item.odometro" name="odometro">
          <span matSuffix>km</span>
        </mat-form-field>
      </form>

      <mat-divider class="my-divider"></mat-divider>
      <h3 class="section-title">Checklist de Vistoria</h3>

      @for (grp of checklistGroups; track grp.group) {
        <div class="checklist-group">
          <h4>{{ grp.group }}</h4>
          <div class="checklist-items">
            @for (itm of grp.items; track itm) {
              <mat-checkbox [(ngModel)]="checklist[itm]" [name]="itm">{{ itm }}</mat-checkbox>
            }
          </div>
        </div>
        <mat-divider></mat-divider>
      }

      <mat-form-field appearance="outline" class="full-width obs-field">
        <mat-label>Observações Gerais</mat-label>
        <textarea matInput [(ngModel)]="item.observacoes_gerais" name="obs" rows="3"></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Resultado da Inspeção</mat-label>
        <mat-select [(ngModel)]="item.status" name="status">
          <mat-option value="Aprovado">✅ Aprovado</mat-option>
          <mat-option value="Aprovado com ressalvas">⚠️ Aprovado com Ressalvas</mat-option>
          <mat-option value="Reprovado">❌ Reprovado</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">
        @if (saving()) { <mat-spinner diameter="18"></mat-spinner> } @else { Salvar Inspeção }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    @media (max-width: 599px) { .form-grid { grid-template-columns: 1fr; } }
    mat-dialog-content { max-height: 75vh; }
    .my-divider { margin: 16px 0; }
    .section-title { font-size: 1rem; color: #1565c0; margin: 8px 0; }
    .checklist-group h4 { font-size: 0.875rem; font-weight: 600; color: #555; margin: 12px 0 8px; }
    .checklist-items { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 4px; margin-bottom: 8px; }
    .full-width { width: 100%; }
    .obs-field { margin-top: 16px; }
  `]
})
export class InspecaoFormComponent implements OnInit {
  item: Partial<Inspecao> = {
    status: 'Aprovado',
    data: new Date().toISOString().substring(0, 10)
  };
  veiculos = signal<Veiculo[]>([]);
  motoristas = signal<Motorista[]>([]);
  saving = signal(false);
  checklist: Record<string, boolean> = {};
  checklistGroups = CHECKLIST_GROUPS;

  constructor(
    private dialogRef: MatDialogRef<InspecaoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Inspecao | null,
    private api: ApiService,
    private snackBar: MatSnackBar
  ) {
    if (data) {
      this.item = { ...data };
      if (data.itens_checklist) this.checklist = { ...data.itens_checklist };
    }
  }

  ngOnInit() {
    this.api.get<Veiculo[]>('veiculos').subscribe(v => this.veiculos.set(v));
    this.api.get<Motorista[]>('motoristas').subscribe(m => this.motoristas.set(m));
  }

  save() {
    if (!this.item.veiculo_id || !this.item.motorista_id) {
      this.snackBar.open('Veículo e Motorista são obrigatórios', 'OK', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    this.item.itens_checklist = this.checklist;
    const obs = this.data
      ? this.api.put<Inspecao>('inspecoes', this.data.id_inspecao, this.item)
      : this.api.post<Inspecao>('inspecoes', this.item);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: e => { this.saving.set(false); this.snackBar.open(e.error?.error || 'Erro ao salvar', 'OK', { duration: 3000 }); }
    });
  }
}
