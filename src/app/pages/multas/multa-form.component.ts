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
import { Multa, Veiculo, Motorista } from '../../core/models';

@Component({
  selector: 'app-multa-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule,
    MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nova' }} Multa</h2>
    <mat-dialog-content>
      <form class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Placa *</mat-label>
          <mat-select [(ngModel)]="item.placa" name="placa" required>
            @for (v of veiculos(); track v.placa) {
              <mat-option [value]="v.placa">{{ v.placa }} - {{ v.modelo }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>RENAVAM</mat-label>
          <input matInput [(ngModel)]="item.renavam" name="renavam">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>UF</mat-label>
          <input matInput [(ngModel)]="item.uf" name="uf" maxlength="2" style="text-transform:uppercase">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Nº AIT</mat-label>
          <input matInput [(ngModel)]="item.ait" name="ait">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Data Emissão</mat-label>
          <input matInput type="date" [(ngModel)]="item.data_emissao" name="data_emissao">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Data Vencimento</mat-label>
          <input matInput type="date" [(ngModel)]="item.data_vencimento" name="data_vencimento">
        </mat-form-field>
        <mat-form-field appearance="outline" class="span2">
          <mat-label>Enquadramento / Infração</mat-label>
          <input matInput [(ngModel)]="item.enquadramento" name="enquadramento">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Local da Infração</mat-label>
          <input matInput [(ngModel)]="item.local_infracao" name="local_infracao">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Valor (R$)</mat-label>
          <input matInput type="number" [(ngModel)]="item.valor" name="valor" step="0.01">
          <span matPrefix>R$ </span>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Motorista Infrator</mat-label>
          <mat-select [(ngModel)]="item.motorista_id" name="motorista_id">
            <mat-option value="">Não informado</mat-option>
            @for (m of motoristas(); track m.id_motorista) {
              <mat-option [value]="m.id_motorista">{{ m.nome }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="item.status" name="status">
            <mat-option value="Pendente">Pendente</mat-option>
            <mat-option value="Paga">Paga</mat-option>
            <mat-option value="Contestada">Contestada</mat-option>
            <mat-option value="Cancelada">Cancelada</mat-option>
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
  styles: [`
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; min-width: 500px; }
    .span2 { grid-column: 1 / -1; }
    mat-dialog-content { max-height: 70vh; }
    @media (max-width: 599px) { .form-grid { grid-template-columns: 1fr; min-width: unset; } }
  `]
})
export class MultaFormComponent implements OnInit {
  item: Partial<Multa> = { status: 'Pendente' };
  veiculos = signal<Veiculo[]>([]);
  motoristas = signal<Motorista[]>([]);
  saving = signal(false);

  constructor(
    private dialogRef: MatDialogRef<MultaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Multa | null,
    private api: ApiService,
    private snackBar: MatSnackBar
  ) {
    if (data) this.item = { ...data };
  }

  ngOnInit() {
    this.api.get<Veiculo[]>('veiculos').subscribe(v => this.veiculos.set(v));
    this.api.get<Motorista[]>('motoristas').subscribe(m => this.motoristas.set(m));
  }

  save() {
    if (!this.item.placa) { this.snackBar.open('Placa é obrigatória', 'OK', { duration: 3000 }); return; }
    this.saving.set(true);
    const obs = this.data
      ? this.api.put<Multa>('multas', this.data.id_multa, this.item)
      : this.api.post<Multa>('multas', this.item);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: e => { this.saving.set(false); this.snackBar.open(e.error?.error || 'Erro ao salvar', 'OK', { duration: 3000 }); }
    });
  }
}
