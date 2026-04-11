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
import { ApiService } from '../../core/services/api.service';
import { Veiculo, Proprietario } from '../../core/models';

@Component({
  selector: 'app-veiculo-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatSelectModule, MatFormFieldModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Novo' }} Veículo</h2>
    <mat-dialog-content>
      <form #f="ngForm" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Placa *</mat-label>
          <input matInput [(ngModel)]="veiculo.placa" name="placa" required maxlength="8" style="text-transform:uppercase">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Marca</mat-label>
          <input matInput [(ngModel)]="veiculo.marca" name="marca">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Modelo</mat-label>
          <input matInput [(ngModel)]="veiculo.modelo" name="modelo">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Ano</mat-label>
          <input matInput [(ngModel)]="veiculo.ano" name="ano" maxlength="4">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Tipo Combustível</mat-label>
          <mat-select [(ngModel)]="veiculo.tipo_combustivel" name="tipo_combustivel">
            <mat-option value="Diesel">Diesel</mat-option>
            <mat-option value="Gasolina">Gasolina</mat-option>
            <mat-option value="Etanol">Etanol</mat-option>
            <mat-option value="GNV">GNV</mat-option>
            <mat-option value="Elétrico">Elétrico</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Cor</mat-label>
          <input matInput [(ngModel)]="veiculo.cor" name="cor">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>RENAVAM</mat-label>
          <input matInput [(ngModel)]="veiculo.renavam" name="renavam">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Nº Chassi</mat-label>
          <input matInput [(ngModel)]="veiculo.numero_chassi" name="numero_chassi">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Proprietário</mat-label>
          <mat-select [(ngModel)]="veiculo.proprietario_id" name="proprietario_id">
            @for (p of proprietarios(); track p.id_proprietario) {
              <mat-option [value]="p.id_proprietario">{{ p.nome }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Odômetro Atual</mat-label>
          <input matInput [(ngModel)]="veiculo.odometro" name="odometro" type="number">
          <span matSuffix>km</span>
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
  styles: [`.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; min-width: 500px; @media (max-width: 599px) { grid-template-columns: 1fr; min-width: unset; } } mat-dialog-content { max-height: 70vh; }`]
})
export class VeiculoFormComponent implements OnInit {
  veiculo: Partial<Veiculo> = {};
  proprietarios = signal<Proprietario[]>([]);
  saving = signal(false);

  constructor(private dialogRef: MatDialogRef<VeiculoFormComponent>, @Inject(MAT_DIALOG_DATA) public data: Veiculo | null, private api: ApiService, private snackBar: MatSnackBar) {
    if (data) this.veiculo = { ...data };
  }

  ngOnInit() {
    this.api.get<Proprietario[]>('proprietarios').subscribe(p => this.proprietarios.set(p));
  }

  save() {
    if (!this.veiculo.placa) { this.snackBar.open('Placa é obrigatória', 'OK', { duration: 3000 }); return; }
    this.saving.set(true);
    const obs = this.data
      ? this.api.put<Veiculo>('veiculos', this.data.id_veiculo, this.veiculo)
      : this.api.post<Veiculo>('veiculos', this.veiculo);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); this.snackBar.open('Veículo salvo!', 'OK', { duration: 2000 }); },
      error: (e) => { this.saving.set(false); this.snackBar.open(e.error?.error || 'Erro ao salvar', 'OK', { duration: 3000 }); }
    });
  }
}
