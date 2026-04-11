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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiService } from '../../core/services/api.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatSelectModule, MatFormFieldModule, MatSnackBarModule, MatProgressSpinnerModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Novo' }} Usuário</h2>
    <mat-dialog-content>
      <form class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Nome *</mat-label>
          <input matInput [(ngModel)]="item.nome" name="nome" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Login / E-mail *</mat-label>
          <input matInput [(ngModel)]="item.login" name="login" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Perfil *</mat-label>
          <mat-select [(ngModel)]="item.tipo" name="tipo" required>
            <mat-option value="admin">Admin</mat-option>
            <mat-option value="gestor">Gestor</mat-option>
            <mat-option value="operador">Operador</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ data ? 'Nova senha (opcional)' : 'Senha *' }}</mat-label>
          <input matInput [(ngModel)]="password" name="password" [required]="!data" type="password">
        </mat-form-field>
        <div class="toggle-line">
          <mat-slide-toggle [(ngModel)]="item.ativo" name="ativo">Usuário ativo</mat-slide-toggle>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">
        @if (saving()) { <mat-spinner diameter="18"></mat-spinner> } @else { Salvar }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;min-width:560px}@media(max-width:599px){.form-grid{grid-template-columns:1fr;min-width:unset}}.toggle-line{grid-column:1/-1;display:flex;align-items:center;padding-top:4px}`]
})
export class UsuarioFormComponent {
  item: Partial<User> = { tipo: 'operador', ativo: true };
  password = '';
  saving = signal(false);

  constructor(private dialogRef: MatDialogRef<UsuarioFormComponent>, @Inject(MAT_DIALOG_DATA) public data: User | null, private api: ApiService, private snackBar: MatSnackBar) {
    if (data) this.item = { ...data };
  }

  save() {
    if (!this.item.nome || !this.item.login || !this.item.tipo) {
      this.snackBar.open('Preencha os campos obrigatórios', 'OK', { duration: 3000 });
      return;
    }

    if (!this.data && !this.password) {
      this.snackBar.open('Senha é obrigatória para novo usuário', 'OK', { duration: 3000 });
      return;
    }

    const payload = {
      ...this.item,
      password: this.password || undefined
    };

    this.saving.set(true);
    const request = this.data
      ? this.api.put<User>('users', this.data.idUser, payload)
      : this.api.post<User>('users', payload);

    request.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (error) => {
        this.saving.set(false);
        this.snackBar.open(error.error?.error || 'Erro ao salvar usuário', 'OK', { duration: 3000 });
      }
    });
  }
}
