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
import { Manutencao, Veiculo } from '../../core/models';

@Component({
  selector: 'app-manutencao-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nova' }} Manutenção</h2>
    <mat-dialog-content>
      <form class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Veículo *</mat-label>
          <mat-select [(ngModel)]="item.id_veiculo" name="id_veiculo" required>
            @for (v of veiculos(); track v.id_veiculo) { <mat-option [value]="v.id_veiculo">{{ v.placa }} - {{ v.modelo }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Data *</mat-label>
          <input matInput type="date" [(ngModel)]="item.data_manutencao" name="data_manutencao" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Tipo Manutenção</mat-label>
          <mat-select [(ngModel)]="item.tipo_manutencao" name="tipo_manutencao">
            <mat-option value="Preventiva">Preventiva</mat-option>
            <mat-option value="Corretiva">Corretiva</mat-option>
            <mat-option value="Preditiva">Preditiva</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Descrição do Serviço</mat-label>
          <input matInput [(ngModel)]="item.descricao_servico" name="descricao_servico">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Odômetro</mat-label>
          <input matInput [(ngModel)]="item.odometro_manutencao" name="odometro" type="number">
          <span matSuffix>km</span>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Custo Total</mat-label>
          <input matInput type="number" [(ngModel)]="item.custo_total" name="custo_total" step="0.01">
          <span matPrefix>R$ </span>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Nº Nota Fiscal</mat-label>
          <input matInput [(ngModel)]="item.numero_nf" name="numero_nf">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="item.status" name="status">
            <mat-option value="Concluída">Concluída</mat-option>
            <mat-option value="Em andamento">Em andamento</mat-option>
            <mat-option value="Agendada">Agendada</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" style="grid-column:1/-1">
          <mat-label>Observações</mat-label>
          <textarea matInput [(ngModel)]="item.observacoes" name="observacoes" rows="3"></textarea>
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
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;min-width:500px;@media(max-width:599px){grid-template-columns:1fr;min-width:unset}} mat-dialog-content{max-height:70vh}`]
})
export class ManutencaoFormComponent implements OnInit {
  item: Partial<Manutencao> = { status: 'Concluída', data_manutencao: new Date().toISOString().substring(0, 10) };
  veiculos = signal<Veiculo[]>([]);
  saving = signal(false);

  constructor(private dialogRef: MatDialogRef<ManutencaoFormComponent>, @Inject(MAT_DIALOG_DATA) public data: Manutencao | null, private api: ApiService, private snackBar: MatSnackBar) {
    if (data) this.item = { ...data };
  }

  ngOnInit() { this.api.get<Veiculo[]>('veiculos').subscribe(v => this.veiculos.set(v)); }

  save() {
    if (!this.item.id_veiculo || !this.item.data_manutencao) { this.snackBar.open('Preencha os campos obrigatórios', 'OK', { duration: 3000 }); return; }
    this.saving.set(true);
    const obs = this.data
      ? this.api.put<Manutencao>('manutencoes', this.data.id_manutencao, this.item)
      : this.api.post<Manutencao>('manutencoes', this.item);
    obs.subscribe({ next: () => { this.saving.set(false); this.dialogRef.close(true); }, error: (e) => { this.saving.set(false); this.snackBar.open(e.error?.error || 'Erro', 'OK', { duration: 3000 }); } });
  }
}
