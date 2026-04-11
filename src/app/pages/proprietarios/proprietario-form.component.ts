import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiService } from '../../core/services/api.service';
import { Proprietario } from '../../core/models';

@Component({
  selector: 'app-proprietario-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule,
    MatFormFieldModule, MatProgressSpinnerModule, MatSnackBarModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Novo' }} Proprietário</h2>
    <mat-dialog-content>
      <form class="form-grid">
        <mat-form-field appearance="outline" class="span2">
          <mat-label>Nome *</mat-label>
          <input matInput [(ngModel)]="item.nome" name="nome" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>CPF/CNPJ</mat-label>
          <input matInput [(ngModel)]="item.cpf_cnpj" name="cpf_cnpj">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Telefone</mat-label>
          <input matInput [(ngModel)]="item.telefone" name="telefone" type="tel">
        </mat-form-field>
        <mat-form-field appearance="outline" class="span2">
          <mat-label>E-mail</mat-label>
          <input matInput [(ngModel)]="item.email" name="email" type="email">
        </mat-form-field>
        <mat-form-field appearance="outline" class="span2">
          <mat-label>Endereço</mat-label>
          <input matInput [(ngModel)]="item.endereco" name="endereco">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Cidade</mat-label>
          <input matInput [(ngModel)]="item.cidade" name="cidade">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>UF</mat-label>
          <input matInput [(ngModel)]="item.uf" name="uf" maxlength="2" style="text-transform:uppercase">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>CEP</mat-label>
          <input matInput [(ngModel)]="item.cep" name="cep">
        </mat-form-field>
        @if (data) {
          <div class="toggles span2">
            <mat-slide-toggle [(ngModel)]="item.ativo" name="ativo" color="primary">Ativo</mat-slide-toggle>
            <mat-slide-toggle [(ngModel)]="item.bloqueado" name="bloqueado" color="warn">Bloqueado</mat-slide-toggle>
          </div>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">
        @if (saving()) { <mat-spinner diameter="18"></mat-spinner> } @else { Salvar }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; min-width: 500px; }
    .span2 { grid-column: 1 / -1; }
    .toggles { display: flex; gap: 24px; padding: 8px 0; }
    mat-dialog-content { max-height: 70vh; }
    @media (max-width: 599px) { .form-grid { grid-template-columns: 1fr; min-width: unset; } }
  `]
})
export class ProprietarioFormComponent {
  item: Partial<Proprietario> = { ativo: true, bloqueado: false };
  saving = signal(false);

  constructor(
    private dialogRef: MatDialogRef<ProprietarioFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Proprietario | null,
    private api: ApiService,
    private snackBar: MatSnackBar
  ) {
    if (data) this.item = { ...data };
  }

  save() {
    if (!this.item.nome) { this.snackBar.open('Nome é obrigatório', 'OK', { duration: 3000 }); return; }
    this.saving.set(true);
    const obs = this.data
      ? this.api.put<Proprietario>('proprietarios', this.data.id_proprietario, this.item)
      : this.api.post<Proprietario>('proprietarios', this.item);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: e => { this.saving.set(false); this.snackBar.open(e.error?.error || 'Erro ao salvar', 'OK', { duration: 3000 }); }
    });
  }
}
