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
import { Motorista, Proprietario } from '../../core/models';

@Component({
  selector: 'app-motorista-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Novo' }} Motorista</h2>
    <mat-dialog-content>
      <form class="form-col">
        <mat-form-field appearance="outline">
          <mat-label>Nome *</mat-label>
          <input matInput [(ngModel)]="motorista.nome" name="nome" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Celular</mat-label>
          <input matInput [(ngModel)]="motorista.cel" name="cel" type="tel">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>E-mail</mat-label>
          <input matInput [(ngModel)]="motorista.email" name="email" type="email">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>CNH</mat-label>
          <input matInput [(ngModel)]="motorista.cnh" name="cnh">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Proprietário</mat-label>
          <mat-select [(ngModel)]="motorista.proprietario_id" name="proprietario_id">
            @for (p of proprietarios(); track p.id_proprietario) {
              <mat-option [value]="p.id_proprietario">{{ p.nome }}</mat-option>
            }
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
  styles: [`.form-col { display: flex; flex-direction: column; gap: 8px; min-width: 400px; @media(max-width:599px){ min-width: unset; } }`]
})
export class MotoristaFormComponent implements OnInit {
  motorista: Partial<Motorista> = {};
  proprietarios = signal<Proprietario[]>([]);
  saving = signal(false);

  constructor(private dialogRef: MatDialogRef<MotoristaFormComponent>, @Inject(MAT_DIALOG_DATA) public data: Motorista | null, private api: ApiService, private snackBar: MatSnackBar) {
    if (data) this.motorista = { ...data };
  }

  ngOnInit() { this.api.get<Proprietario[]>('proprietarios').subscribe(p => this.proprietarios.set(p)); }

  save() {
    if (!this.motorista.nome) { this.snackBar.open('Nome é obrigatório', 'OK', { duration: 3000 }); return; }
    this.saving.set(true);
    const obs = this.data
      ? this.api.put<Motorista>('motoristas', this.data.id_motorista, this.motorista)
      : this.api.post<Motorista>('motoristas', this.motorista);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (e) => { this.saving.set(false); this.snackBar.open(e.error?.error || 'Erro', 'OK', { duration: 3000 }); }
    });
  }
}
