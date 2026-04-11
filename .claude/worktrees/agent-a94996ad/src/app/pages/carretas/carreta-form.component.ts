import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { Carreta } from '../../core/models';

@Component({
  selector: 'app-carreta-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nova' }} Carreta</h2>
    <mat-dialog-content>
      <form class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Placa *</mat-label><input matInput [(ngModel)]="item.placa" name="placa" required></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Tipo de Carroceria</mat-label><input matInput [(ngModel)]="item.tipo_carroceria" name="tipo_carroceria"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Fabricante</mat-label><input matInput [(ngModel)]="item.fabricante" name="fabricante"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Ano</mat-label><input matInput [(ngModel)]="item.ano" name="ano"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Número do Chassi</mat-label><input matInput [(ngModel)]="item.numero_chassi" name="numero_chassi"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Cor</mat-label><input matInput [(ngModel)]="item.cor" name="cor"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Capacidade (t)</mat-label><input matInput type="number" [(ngModel)]="item.capacidade" name="capacidade" step="0.01"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Foto (URL/base64)</mat-label><input matInput [(ngModel)]="item.foto" name="foto"></mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">@if (saving()) { <mat-spinner diameter="18"></mat-spinner> } @else { Salvar }</button>
    </mat-dialog-actions>
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;min-width:560px}@media(max-width:599px){.form-grid{grid-template-columns:1fr;min-width:unset}}`]
})
export class CarretaFormComponent {
  item: Partial<Carreta> = {};
  saving = signal(false);

  constructor(private dialogRef: MatDialogRef<CarretaFormComponent>, @Inject(MAT_DIALOG_DATA) public data: Carreta | null, private api: ApiService, private snackBar: MatSnackBar) {
    if (data) this.item = { ...data };
  }

  save() {
    if (!this.item.placa) { this.snackBar.open('Placa é obrigatória', 'OK', { duration: 3000 }); return; }
    this.saving.set(true);
    const request = this.data ? this.api.put<Carreta>('carretas', this.data.id_carreta, this.item) : this.api.post<Carreta>('carretas', this.item);
    request.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (error) => { this.saving.set(false); this.snackBar.open(error.error?.error || 'Erro ao salvar carreta', 'OK', { duration: 3000 }); }
    });
  }
}
