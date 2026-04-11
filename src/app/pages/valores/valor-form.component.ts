import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { ValorCombustivel } from '../../core/models';

@Component({
  selector: 'app-valor-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatSelectModule, MatFormFieldModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Novo' }} Valor de Combustível</h2>
    <mat-dialog-content>
      <form class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Tipo de Combustível *</mat-label>
          <mat-select [(ngModel)]="item.tipo_combustivel" name="tipo_combustivel" required>
            <mat-option value="Diesel S10">Diesel S10</mat-option>
            <mat-option value="Diesel S500">Diesel S500</mat-option>
            <mat-option value="Gasolina">Gasolina</mat-option>
            <mat-option value="Etanol">Etanol</mat-option>
            <mat-option value="GNV">GNV</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Valor *</mat-label><input matInput type="number" [(ngModel)]="item.valor" name="valor" step="0.0001" required></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Data</mat-label><input matInput type="datetime-local" [(ngModel)]="item.data" name="data"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Responsável</mat-label><input matInput [(ngModel)]="item.responsavel" name="responsavel"></mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">@if (saving()) { <mat-spinner diameter="18"></mat-spinner> } @else { Salvar }</button>
    </mat-dialog-actions>
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;min-width:520px}@media(max-width:599px){.form-grid{grid-template-columns:1fr;min-width:unset}}`]
})
export class ValorFormComponent {
  item: Partial<ValorCombustivel> = { data: new Date().toISOString().slice(0, 16) };
  saving = signal(false);

  constructor(private dialogRef: MatDialogRef<ValorFormComponent>, @Inject(MAT_DIALOG_DATA) public data: ValorCombustivel | null, private api: ApiService, private snackBar: MatSnackBar) {
    if (data) this.item = { ...data, data: data.data ? data.data.substring(0, 16) : undefined };
  }

  save() {
    if (!this.item.tipo_combustivel || this.item.valor == null) { this.snackBar.open('Preencha os campos obrigatórios', 'OK', { duration: 3000 }); return; }
    this.saving.set(true);
    const request = this.data ? this.api.put<ValorCombustivel>('valores', this.data.id_valor, this.item) : this.api.post<ValorCombustivel>('valores', this.item);
    request.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (error) => { this.saving.set(false); this.snackBar.open(error.error?.error || 'Erro ao salvar valor', 'OK', { duration: 3000 }); }
    });
  }
}
