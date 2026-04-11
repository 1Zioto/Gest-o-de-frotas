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
import { DespesaAdministrativa, Motorista, Veiculo } from '../../core/models';

@Component({
  selector: 'app-despesa-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatSelectModule, MatFormFieldModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nova' }} Despesa</h2>
    <mat-dialog-content>
      <form class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Data do Registro</mat-label><input matInput [(ngModel)]="item.data_registro" name="data_registro"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Receita</mat-label><input matInput [(ngModel)]="item.receita" name="receita"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Veículo</mat-label><mat-select [(ngModel)]="item.veiculo_id" name="veiculo_id">@for (veiculo of veiculos(); track veiculo.id_veiculo) { <mat-option [value]="veiculo.id_veiculo">{{ veiculo.placa }} - {{ veiculo.modelo }}</mat-option> }</mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Motorista</mat-label><mat-select [(ngModel)]="item.motorista_id" name="motorista_id">@for (motorista of motoristas(); track motorista.id_motorista) { <mat-option [value]="motorista.id_motorista">{{ motorista.nome }}</mat-option> }</mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Pagamento</mat-label><input matInput [(ngModel)]="item.pagamento" name="pagamento"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Data *</mat-label><input matInput type="date" [(ngModel)]="item.data" name="data" required></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Classificação</mat-label><input matInput [(ngModel)]="item.classificacao" name="classificacao"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Valor</mat-label><input matInput type="number" [(ngModel)]="item.valor" name="valor" step="0.01"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Nº Doc</mat-label><input matInput [(ngModel)]="item.numero_doc" name="numero_doc"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Imagem (URL/base64)</mat-label><input matInput [(ngModel)]="item.imagem" name="imagem"></mat-form-field>
        <mat-form-field appearance="outline" style="grid-column:1/-1"><mat-label>Detalhamento</mat-label><textarea matInput rows="3" [(ngModel)]="item.detalhamento" name="detalhamento"></textarea></mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">@if (saving()) { <mat-spinner diameter="18"></mat-spinner> } @else { Salvar }</button>
    </mat-dialog-actions>
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;min-width:660px}@media(max-width:599px){.form-grid{grid-template-columns:1fr;min-width:unset}}`]
})
export class DespesaFormComponent implements OnInit {
  item: Partial<DespesaAdministrativa> = { data: new Date().toISOString().substring(0, 10) };
  veiculos = signal<Veiculo[]>([]);
  motoristas = signal<Motorista[]>([]);
  saving = signal(false);

  constructor(private dialogRef: MatDialogRef<DespesaFormComponent>, @Inject(MAT_DIALOG_DATA) public data: DespesaAdministrativa | null, private api: ApiService, private snackBar: MatSnackBar) {
    if (data) this.item = { ...data };
  }

  ngOnInit() {
    this.api.get<Veiculo[]>('veiculos').subscribe(data => this.veiculos.set(data));
    this.api.get<Motorista[]>('motoristas').subscribe(data => this.motoristas.set(data));
  }

  save() {
    if (!this.item.data) { this.snackBar.open('Data é obrigatória', 'OK', { duration: 3000 }); return; }
    this.saving.set(true);
    const request = this.data ? this.api.put<DespesaAdministrativa>('despesas', this.data.id_despesa, this.item) : this.api.post<DespesaAdministrativa>('despesas', this.item);
    request.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (error) => { this.saving.set(false); this.snackBar.open(error.error?.error || 'Erro ao salvar despesa', 'OK', { duration: 3000 }); }
    });
  }
}
