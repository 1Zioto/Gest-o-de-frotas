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
import { Pneu, Veiculo } from '../../core/models';

@Component({
  selector: 'app-pneu-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatSelectModule, MatFormFieldModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Novo' }} Pneu</h2>
    <mat-dialog-content>
      <form class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Veículo</mat-label><mat-select [(ngModel)]="item.veiculo_id" name="veiculo_id">@for (veiculo of veiculos(); track veiculo.id_veiculo) { <mat-option [value]="veiculo.id_veiculo">{{ veiculo.placa }} - {{ veiculo.modelo }}</mat-option> }</mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Número</mat-label><input matInput type="number" [(ngModel)]="item.numero" name="numero"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Número de Série</mat-label><input matInput [(ngModel)]="item.numero_serie" name="numero_serie"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Marca</mat-label><input matInput [(ngModel)]="item.marca" name="marca"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Modelo</mat-label><input matInput [(ngModel)]="item.modelo" name="modelo"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Medida</mat-label><input matInput [(ngModel)]="item.medida" name="medida"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Posição</mat-label><input matInput [(ngModel)]="item.posicao" name="posicao"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Quilometragem Inicial</mat-label><input matInput type="number" [(ngModel)]="item.km_inicial" name="km_inicial"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Data de Instalação</mat-label><input matInput type="date" [(ngModel)]="item.data_instalacao" name="data_instalacao"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Data de Substituição</mat-label><input matInput type="date" [(ngModel)]="item.data_substituicao" name="data_substituicao"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Status</mat-label><input matInput [(ngModel)]="item.status" name="status"></mat-form-field>
        <mat-form-field appearance="outline" style="grid-column:1/-1"><mat-label>Observações</mat-label><textarea matInput rows="3" [(ngModel)]="item.observacoes" name="observacoes"></textarea></mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">@if (saving()) { <mat-spinner diameter="18"></mat-spinner> } @else { Salvar }</button>
    </mat-dialog-actions>
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;min-width:620px}@media(max-width:599px){.form-grid{grid-template-columns:1fr;min-width:unset}}`]
})
export class PneuFormComponent implements OnInit {
  item: Partial<Pneu> = { status: 'Ativo' };
  veiculos = signal<Veiculo[]>([]);
  saving = signal(false);

  constructor(private dialogRef: MatDialogRef<PneuFormComponent>, @Inject(MAT_DIALOG_DATA) public data: Pneu | null, private api: ApiService, private snackBar: MatSnackBar) {
    if (data) this.item = { ...data };
  }

  ngOnInit() {
    this.api.get<Veiculo[]>('veiculos').subscribe(data => this.veiculos.set(data));
  }

  save() {
    this.saving.set(true);
    const request = this.data ? this.api.put<Pneu>('pneus', this.data.id_pneu, this.item) : this.api.post<Pneu>('pneus', this.item);
    request.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (error) => { this.saving.set(false); this.snackBar.open(error.error?.error || 'Erro ao salvar pneu', 'OK', { duration: 3000 }); }
    });
  }
}
