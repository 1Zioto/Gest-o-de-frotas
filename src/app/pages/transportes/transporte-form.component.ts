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
import { Carreta, Motorista, Transporte, Veiculo } from '../../core/models';

@Component({
  selector: 'app-transporte-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatSelectModule, MatFormFieldModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Novo' }} Transporte</h2>
    <mat-dialog-content>
      <form class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Data *</mat-label><input matInput type="date" [(ngModel)]="item.data" name="data" required></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Contrato / Frete</mat-label><input matInput [(ngModel)]="item.contrato_frete" name="contrato_frete"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Veículo</mat-label><mat-select [(ngModel)]="item.veiculo_id" name="veiculo_id">@for (veiculo of veiculos(); track veiculo.id_veiculo) { <mat-option [value]="veiculo.id_veiculo">{{ veiculo.placa }} - {{ veiculo.modelo }}</mat-option> }</mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Motorista</mat-label><mat-select [(ngModel)]="item.motorista_id" name="motorista_id">@for (motorista of motoristas(); track motorista.id_motorista) { <mat-option [value]="motorista.id_motorista">{{ motorista.nome }}</mat-option> }</mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Carreta</mat-label><mat-select [(ngModel)]="item.carreta_id" name="carreta_id">@for (carreta of carretas(); track carreta.id_carreta) { <mat-option [value]="carreta.id_carreta">{{ carreta.placa }}</mat-option> }</mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Tipo de Veículo</mat-label><input matInput [(ngModel)]="item.tipo_veiculo" name="tipo_veiculo"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Origem</mat-label><input matInput [(ngModel)]="item.origem" name="origem"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Destino</mat-label><input matInput [(ngModel)]="item.destino" name="destino"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Tonelada</mat-label><input matInput type="number" [(ngModel)]="item.tonelada" name="tonelada" step="0.01"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>KM Inicial</mat-label><input matInput type="number" [(ngModel)]="item.km_inicial" name="km_inicial"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>KM Final</mat-label><input matInput type="number" [(ngModel)]="item.km_final" name="km_final"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Frete Total</mat-label><input matInput type="number" [(ngModel)]="item.frete_total" name="frete_total" step="0.01" (input)="recalculate()"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Adiantamento</mat-label><input matInput type="number" [(ngModel)]="item.adiantamento_frete" name="adiantamento_frete" step="0.01" (input)="recalculate()"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Descontos</mat-label><input matInput type="number" [(ngModel)]="item.descontos" name="descontos" step="0.01" (input)="recalculate()"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Valor Pedágio</mat-label><input matInput type="number" [(ngModel)]="item.valor_pedagio" name="valor_pedagio" step="0.01" (input)="recalculate()"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Diária</mat-label><input matInput type="number" [(ngModel)]="item.valor_diaria" name="valor_diaria" step="0.01" (input)="recalculate()"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Qtd. Diárias</mat-label><input matInput type="number" [(ngModel)]="item.quantidade_diarias" name="quantidade_diarias" (input)="recalculate()"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Valor Total Diárias</mat-label><input matInput type="number" [(ngModel)]="item.valor_total_diarias" name="valor_total_diarias" step="0.01"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Frete Líquido</mat-label><input matInput type="number" [(ngModel)]="item.frete_liquido" name="frete_liquido" step="0.01"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Resultado Líquido</mat-label><input matInput type="number" [(ngModel)]="item.resultado_liquido" name="resultado_liquido" step="0.01"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Média Km/L</mat-label><input matInput type="number" [(ngModel)]="item.media_km_l" name="media_km_l" step="0.01"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Margem de Lucro (%)</mat-label><input matInput type="number" [(ngModel)]="item.margem_lucro" name="margem_lucro" step="0.01"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Status</mat-label><input matInput [(ngModel)]="item.status" name="status"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Viagem</mat-label><input matInput [(ngModel)]="item.viagem" name="viagem"></mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">@if (saving()) { <mat-spinner diameter="18"></mat-spinner> } @else { Salvar }</button>
    </mat-dialog-actions>
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;min-width:780px}@media(max-width:599px){.form-grid{grid-template-columns:1fr;min-width:unset}}`]
})
export class TransporteFormComponent implements OnInit {
  item: Partial<Transporte> = { data: new Date().toISOString().substring(0, 10), status: 'Em andamento' };
  veiculos = signal<Veiculo[]>([]);
  motoristas = signal<Motorista[]>([]);
  carretas = signal<Carreta[]>([]);
  saving = signal(false);

  constructor(private dialogRef: MatDialogRef<TransporteFormComponent>, @Inject(MAT_DIALOG_DATA) public data: Transporte | null, private api: ApiService, private snackBar: MatSnackBar) {
    if (data) this.item = { ...data };
  }

  ngOnInit() {
    this.api.get<Veiculo[]>('veiculos').subscribe(data => this.veiculos.set(data));
    this.api.get<Motorista[]>('motoristas').subscribe(data => this.motoristas.set(data));
    this.api.get<Carreta[]>('carretas').subscribe(data => this.carretas.set(data));
  }

  recalculate() {
    const freteTotal = Number(this.item.frete_total || 0);
    const adiantamento = Number(this.item.adiantamento_frete || 0);
    const descontos = Number(this.item.descontos || 0);
    const pedagio = Number(this.item.valor_pedagio || 0);
    const diaria = Number(this.item.valor_diaria || 0);
    const qtdDiarias = Number(this.item.quantidade_diarias || 0);

    this.item.valor_total_diarias = Math.round(diaria * qtdDiarias * 100) / 100;
    this.item.frete_liquido = Math.round((freteTotal - adiantamento - descontos) * 100) / 100;
    this.item.resultado_liquido = Math.round((Number(this.item.frete_liquido || 0) - pedagio - Number(this.item.valor_total_diarias || 0)) * 100) / 100;
  }

  save() {
    if (!this.item.data) { this.snackBar.open('Data é obrigatória', 'OK', { duration: 3000 }); return; }
    this.saving.set(true);
    const request = this.data ? this.api.put<Transporte>('transportes', this.data.id_transporte, this.item) : this.api.post<Transporte>('transportes', this.item);
    request.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (error) => { this.saving.set(false); this.snackBar.open(error.error?.error || 'Erro ao salvar transporte', 'OK', { duration: 3000 }); }
    });
  }
}
