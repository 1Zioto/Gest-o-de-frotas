import { Component, Inject, OnInit, signal } from '@angular/core';
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
import { Motorista, Registro } from '../../core/models';

@Component({
  selector: 'app-registro-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatSelectModule, MatFormFieldModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Novo' }} Registro</h2>
    <mat-dialog-content>
      <form class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Motorista *</mat-label><mat-select [(ngModel)]="item.motorista_id" name="motorista_id" required>@for (motorista of motoristas(); track motorista.id_motorista) { <mat-option [value]="motorista.id_motorista">{{ motorista.nome }}</mat-option> }</mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Status</mat-label><input matInput [(ngModel)]="item.status" name="status"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Data *</mat-label><input matInput type="date" [(ngModel)]="item.data" name="data" required></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>1ª Entrada</mat-label><input matInput type="time" [(ngModel)]="item.hora_entrada1" name="hora_entrada1" (change)="calcTotal()"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>1ª Saída</mat-label><input matInput type="time" [(ngModel)]="item.hora_saida1" name="hora_saida1" (change)="calcTotal()"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>2ª Entrada</mat-label><input matInput type="time" [(ngModel)]="item.hora_entrada2" name="hora_entrada2" (change)="calcTotal()"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>2ª Saída</mat-label><input matInput type="time" [(ngModel)]="item.hora_saida2" name="hora_saida2" (change)="calcTotal()"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Total</mat-label><input matInput [(ngModel)]="item.total" name="total"></mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">@if (saving()) { <mat-spinner diameter="18"></mat-spinner> } @else { Salvar }</button>
    </mat-dialog-actions>
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;min-width:620px}@media(max-width:599px){.form-grid{grid-template-columns:1fr;min-width:unset}}`]
})
export class RegistroFormComponent implements OnInit {
  item: Partial<Registro> = { data: new Date().toISOString().substring(0, 10), status: 'Aberto' };
  motoristas = signal<Motorista[]>([]);
  saving = signal(false);

  constructor(private dialogRef: MatDialogRef<RegistroFormComponent>, @Inject(MAT_DIALOG_DATA) public data: Registro | null, private api: ApiService, private snackBar: MatSnackBar) {
    if (data) this.item = { ...data };
  }

  ngOnInit() {
    this.api.get<Motorista[]>('motoristas').subscribe(data => this.motoristas.set(data));
  }

  private toMinutes(value?: string) {
    if (!value) return 0;
    const [hours, minutes] = value.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }

  calcTotal() {
    const turno1 = Math.max(0, this.toMinutes(this.item.hora_saida1) - this.toMinutes(this.item.hora_entrada1));
    const turno2 = Math.max(0, this.toMinutes(this.item.hora_saida2) - this.toMinutes(this.item.hora_entrada2));
    const total = turno1 + turno2;
    const hours = Math.floor(total / 60).toString().padStart(2, '0');
    const minutes = (total % 60).toString().padStart(2, '0');
    this.item.total = `${hours}:${minutes}`;
  }

  save() {
    if (!this.item.motorista_id || !this.item.data) { this.snackBar.open('Preencha os campos obrigatórios', 'OK', { duration: 3000 }); return; }
    this.saving.set(true);
    const request = this.data ? this.api.put<Registro>('registros', this.data.id_registro, this.item) : this.api.post<Registro>('registros', this.item);
    request.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (error) => { this.saving.set(false); this.snackBar.open(error.error?.error || 'Erro ao salvar registro', 'OK', { duration: 3000 }); }
    });
  }
}
