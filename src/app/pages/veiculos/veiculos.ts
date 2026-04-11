import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { ApiService } from '../../core/services/api.service';
import { Veiculo } from '../../core/models';
import { VeiculoFormComponent } from './veiculo-form.component';

@Component({
  selector: 'app-veiculos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule, MatCardModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatProgressBarModule,
    MatChipsModule, MatTooltipModule, MatDialogModule, MatSnackBarModule,
    MatSelectModule, MatMenuModule
  ],
  templateUrl: './veiculos.html',
  styleUrls: ['./veiculos.scss']
})
export class VeiculosComponent implements OnInit {
  veiculos = signal<Veiculo[]>([]);
  loading = signal(false);
  search = '';
  filtroStatus = 'todos';

  displayedColumns = ['placa', 'marca_modelo', 'ano', 'combustivel', 'proprietario_nome', 'odometro', 'ativo', 'acoes'];

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    const params: Record<string, string> = {};
    if (this.search) params['search'] = this.search;
    if (this.filtroStatus !== 'todos') params['ativo'] = this.filtroStatus;

    this.api.get<Veiculo[]>('veiculos', params).subscribe({
      next: (data) => { this.veiculos.set(data); this.loading.set(false); },
      error: () => { this.veiculos.set([]); this.loading.set(false); }
    });
  }

  openForm(veiculo?: Veiculo) {
    const dialogRef = this.dialog.open(VeiculoFormComponent, {
      data: veiculo || null,
      width: '680px',
      maxWidth: '95vw',
      panelClass: 'veiculo-dialog'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.load();
    });
  }

  toggleAtivo(v: Veiculo) {
    const acao = v.ativo ? 'desativar' : 'ativar';
    if (!confirm(`Deseja ${acao} o veículo ${v.placa}?`)) return;
    this.api.put<Veiculo>('veiculos', v.id_veiculo, { ativo: !v.ativo }).subscribe({
      next: () => {
        this.snackBar.open(`Veículo ${v.ativo ? 'desativado' : 'ativado'} com sucesso!`, 'OK', { duration: 3000 });
        this.load();
      },
      error: () => this.snackBar.open('Erro ao alterar status', 'OK', { duration: 3000 })
    });
  }

  get totalAtivos() { return this.veiculos().filter(v => v.ativo).length; }
  get totalInativos() { return this.veiculos().filter(v => !v.ativo).length; }

  combustivelColor(tipo?: string): string {
    const map: Record<string, string> = {
      'Diesel': '#f59e0b', 'Gasolina': '#ef4444',
      'Etanol': '#10b981', 'GNV': '#3b82f6', 'Elétrico': '#8b5cf6'
    };
    return map[tipo || ''] || '#94a3b8';
  }

  combustivelBg(tipo?: string): string {
    const map: Record<string, string> = {
      'Diesel': '#fef3c7', 'Gasolina': '#fee2e2',
      'Etanol': '#d1fae5', 'GNV': '#dbeafe', 'Elétrico': '#ede9fe'
    };
    return map[tipo || ''] || '#f1f5f9';
  }

  formatOdometro(km: string | undefined): string {
    if (!km) return '—';
    return Number(km).toLocaleString('pt-BR') + ' km';
  }
}
