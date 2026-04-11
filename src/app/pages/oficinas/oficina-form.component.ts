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
import { Oficina } from '../../core/models';

@Component({
  selector: 'app-oficina-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nova' }} Oficina</h2>
    <mat-dialog-content>
      <form class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Nome *</mat-label><input matInput [(ngModel)]="item.nome" name="nome" required></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>CNPJ</mat-label><input matInput [(ngModel)]="item.cnpj" name="cnpj"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Celular / Telefone</mat-label><input matInput [(ngModel)]="item.cel" name="cel"></mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">@if (saving()) { <mat-spinner diameter="18"></mat-spinner> } @else { Salvar }</button>
    </mat-dialog-actions>
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;min-width:520px}@media(max-width:599px){.form-grid{grid-template-columns:1fr;min-width:unset}}`]
})
export class OficinaFormComponent {
  item: Partial<Oficina> = {};
  saving = signal(false);

  constructor(private dialogRef: MatDialogRef<OficinaFormComponent>, @Inject(MAT_DIALOG_DATA) public data: Oficina | null, private api: ApiService, private snackBar: MatSnackBar) {
    if (data) this.item = { ...data };
  }

  save() {
    if (!this.item.nome) { this.snackBar.open('Nome é obrigatório', 'OK', { duration: 3000 }); return; }
    this.saving.set(true);
    const request = this.data ? this.api.put<Oficina>('oficinas', this.data.id_oficina, this.item) : this.api.post<Oficina>('oficinas', this.item);
    request.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (error) => { this.saving.set(false); this.snackBar.open(error.error?.error || 'Erro ao salvar oficina', 'OK', { duration: 3000 }); }
    });
  }
}
