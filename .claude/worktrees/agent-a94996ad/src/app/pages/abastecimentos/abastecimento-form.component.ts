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
import { ApiService } from '../../core/services/api.service';
import { Abastecimento, Veiculo, Motorista } from '../../core/models';

@Component({
  selector: 'app-abastecimento-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Novo' }} Abastecimento</h2>
    <mat-dialog-content>
      <form class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Data *</mat-label>
          <input matInput type="date" [(ngModel)]="item.data" name="data" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Veículo *</mat-label>
          <mat-select [(ngModel)]="item.id_veiculo" name="id_veiculo" required>
            @for (v of veiculos(); track v.id_veiculo) {
              <mat-option [value]="v.id_veiculo">{{ v.placa }} - {{ v.modelo }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Motorista</mat-label>
          <mat-select [(ngModel)]="item.id_motorista" name="id_motorista">
            @for (m of motoristas(); track m.id_motorista) {
              <mat-option [value]="m.id_motorista">{{ m.nome }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Tipo Combustível</mat-label>
          <mat-select [(ngModel)]="item.tipo_combustivel" name="tipo_combustivel">
            <mat-option value="Diesel S10">Diesel S10</mat-option>
            <mat-option value="Diesel S500">Diesel S500</mat-option>
            <mat-option value="Gasolina">Gasolina</mat-option>
            <mat-option value="Etanol">Etanol</mat-option>
            <mat-option value="GNV">GNV</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Litros</mat-label>
          <input matInput type="number" [(ngModel)]="item.litros" name="litros" step="0.001" (input)="calcTotal()">
          <span matSuffix>L</span>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Valor por Litro</mat-label>
          <input matInput type="number" [(ngModel)]="item.valor_litro" name="valor_litro" step="0.0001" (input)="calcTotal()">
          <span matPrefix>R$ </span>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Valor Total</mat-label>
          <input matInput type="number" [(ngModel)]="item.valor_total" name="valor_total" step="0.01">
          <span matPrefix>R$ </span>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Odômetro Atual</mat-label>
          <input matInput [(ngModel)]="item.odometro_atual" name="odometro_atual" type="number">
          <span matSuffix>km</span>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Local</mat-label>
          <input matInput [(ngModel)]="item.local" name="local">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Nº Nota Fiscal</mat-label>
          <input matInput [(ngModel)]="item.numero_nf" name="numero_nf">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="item.status" name="status">
            <mat-option value="Pendente">Pendente</mat-option>
            <mat-option value="Aprovado">Aprovado</mat-option>
            <mat-option value="Rejeitado">Rejeitado</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">
        @if (saving()) { <mat-spinner diameter="18"></mat-spinner> } @else { Salvar }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; min-width: 550px; @media(max-width:599px){ grid-template-columns:1fr; min-width:unset; } } mat-dialog-content { max-height: 70vh; }`]
})
export class AbastecimentoFormComponent implements OnInit {
  item: Partial<Abastecimento> = { status: 'Pendente', data: new Date().toISOString().substring(0, 10) };
  veiculos = signal<Veiculo[]>([]);
  motoristas = signal<Motorista[]>([]);
  saving = signal(false);

  constructor(private dialogRef: MatDialogRef<AbastecimentoFormComponent>, @Inject(MAT_DIALOG_DATA) public data: Abastecimento | null, private api: ApiService, private snackBar: MatSnackBar) {
    if (data) this.item = { ...data };
  }

  ngOnInit() {
    this.api.get<Veiculo[]>('veiculos').subscribe(v => this.veiculos.set(v));
    this.api.get<Motorista[]>('motoristas').subscribe(m => this.motoristas.set(m));
  }

  calcTotal() {
    if (this.item.litros && this.item.valor_litro) {
      this.item.valor_total = Math.round(this.item.litros * this.item.valor_litro * 100) / 100;
    }
  }

  save() {
    if (!this.item.id_veiculo || !this.item.data) { this.snackBar.open('Preencha os campos obrigatórios', 'OK', { duration: 3000 }); return; }
    this.saving.set(true);
    const obs = this.data
      ? this.api.put<Abastecimento>('abastecimentos', this.data.id_abastecimento, this.item)
      : this.api.post<Abastecimento>('abastecimentos', this.item);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (e) => { this.saving.set(false); this.snackBar.open(e.error?.error || 'Erro', 'OK', { duration: 3000 }); }
    });
  }
}
