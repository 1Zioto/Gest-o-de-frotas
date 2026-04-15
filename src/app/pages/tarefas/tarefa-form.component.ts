import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { Veiculo } from '../../core/models';
import { Embarque } from '../embarques/embarque-form.component';

export interface Tarefa {
  id_tarefa?: string;
  titulo: string;
  descricao?: string;
  id_embarque?: string; id_veiculo?: string;
  data_prazo?: string; data_conclusao?: string;
  status?: string;
  prioridade?: string;
  observacoes?: string;
  codigo_embarque?: string;
  placa?: string;
  data_criacao?: string;
}

@Component({
  selector: 'app-tarefa-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatIconModule],
  template: `
    <div class="dialog-header">
      <div class="dialog-title">
        <div class="title-icon" [class]="'pri-' + (item.prioridade || 'media')">
          <mat-icon>{{ item.prioridade === 'alta' ? 'priority_high' : item.prioridade === 'baixa' ? 'low_priority' : 'task_alt' }}</mat-icon>
        </div>
        <div>
          <h2>{{ data ? 'Editar' : 'Nova' }} Tarefa</h2>
          <p>{{ data ? 'Atualize os dados da tarefa' : 'Preencha os dados da tarefa' }}</p>
        </div>
      </div>
      <button class="close-btn" mat-dialog-close><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content>
      <form class="form-body">

        <div class="section-label">Tarefa</div>
        <div class="field">
          <label>Título <span class="req">*</span></label>
          <input type="text" class="field-input" [(ngModel)]="item.titulo" name="titulo" placeholder="Descreva a tarefa" required>
        </div>
        <div class="field">
          <label>Descrição</label>
          <textarea class="field-input textarea" [(ngModel)]="item.descricao" name="descricao" rows="2" placeholder="Detalhes adicionais..."></textarea>
        </div>

        <div class="form-row">
          <div class="field">
            <label>Status</label>
            <select class="field-input" [(ngModel)]="item.status" name="status">
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
              <option value="atrasado">Atrasado</option>
            </select>
          </div>
          <div class="field">
            <label>Prioridade</label>
            <select class="field-input" [(ngModel)]="item.prioridade" name="prioridade">
              <option value="baixa">🟢 Baixa</option>
              <option value="media">🟡 Média</option>
              <option value="alta">🔴 Alta</option>
            </select>
          </div>
        </div>

        <div class="section-label">Prazo</div>
        <div class="form-row">
          <div class="field">
            <label>Data Limite</label>
            <input type="datetime-local" class="field-input" [(ngModel)]="item.data_prazo" name="data_prazo">
          </div>
          <div class="field" *ngIf="data">
            <label>Conclusão</label>
            <input type="datetime-local" class="field-input" [(ngModel)]="item.data_conclusao" name="data_conclusao">
          </div>
        </div>

        <div class="section-label">Vínculos (opcional)</div>
        <div class="form-row">
          <div class="field">
            <label>Embarque</label>
            <select class="field-input" [(ngModel)]="item.id_embarque" name="id_embarque">
              <option value="">Nenhum</option>
              @for (e of embarques(); track e.id_embarque) {
                <option [value]="e.id_embarque">{{ e.codigo_embarque }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label>Veículo</label>
            <select class="field-input" [(ngModel)]="item.id_veiculo" name="id_veiculo">
              <option value="">Nenhum</option>
              @for (v of veiculos(); track v.id_veiculo) {
                <option [value]="v.id_veiculo">{{ v.placa }}{{ v.modelo ? ' — ' + v.modelo : '' }}</option>
              }
            </select>
          </div>
        </div>

        <div class="section-label">Observações</div>
        <div class="field">
          <textarea class="field-input textarea" [(ngModel)]="item.observacoes" name="observacoes" rows="2" placeholder="Notas..."></textarea>
        </div>

      </form>
    </mat-dialog-content>

    <div class="dialog-footer">
      <button class="btn-cancel" mat-dialog-close>Cancelar</button>
      <button class="btn-save" [class]="'btn-save pri-' + (item.prioridade || 'media')" (click)="save()" [disabled]="saving()">
        @if (saving()) { <mat-spinner diameter="18"></mat-spinner><span>Salvando…</span> }
        @else { <mat-icon>save</mat-icon><span>Salvar</span> }
      </button>
    </div>
  `,
  styles: [`
    .dialog-header { display:flex; align-items:flex-start; justify-content:space-between; padding:24px 24px 0; gap:16px; }
    .dialog-title { display:flex; align-items:center; gap:14px; }
    .title-icon { width:44px; height:44px; border-radius:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center; &.pri-alta { background:linear-gradient(135deg,#ef4444,#dc2626); } &.pri-media { background:linear-gradient(135deg,#f59e0b,#d97706); } &.pri-baixa { background:linear-gradient(135deg,#22c55e,#16a34a); } mat-icon { color:white; font-size:22px; width:22px; height:22px; } }
    h2 { font-size:18px; font-weight:700; color:#0f172a; margin:0 0 2px; }
    p { font-size:13px; color:#64748b; margin:0; }
    .close-btn { background:none; border:none; cursor:pointer; padding:4px; border-radius:8px; display:flex; color:#94a3b8; &:hover { background:#f1f5f9; } mat-icon { font-size:20px; width:20px; height:20px; } }
    mat-dialog-content { padding:20px 24px !important; max-height:62vh; }
    .form-body { display:flex; flex-direction:column; gap:8px; }
    .section-label { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.08em; margin:8px 0 4px; border-bottom:1px solid #f1f5f9; padding-bottom:6px; &:first-child { margin-top:0; } }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .field { display:flex; flex-direction:column; gap:5px; }
    label { font-size:12px; font-weight:600; color:#475569; }
    .req { color:#ef4444; }
    .field-input { height:40px; border:1.5px solid #e2e8f0; border-radius:8px; padding:0 12px; font-size:14px; color:#1e293b; font-family:inherit; background:white; outline:none; width:100%; box-sizing:border-box; transition:border-color 0.15s; &:focus { border-color:#f59e0b; box-shadow:0 0 0 3px rgba(245,158,11,0.1); } }
    select.field-input { appearance:auto; cursor:pointer; }
    textarea.field-input { height:auto; padding:10px 12px; resize:vertical; }
    .dialog-footer { display:flex; justify-content:flex-end; gap:10px; padding:16px 24px; border-top:1px solid #f1f5f9; }
    .btn-cancel { background:white; border:1.5px solid #e2e8f0; border-radius:8px; padding:0 20px; height:40px; font-size:14px; font-weight:600; color:#475569; cursor:pointer; font-family:inherit; &:hover { background:#f8fafc; } }
    .btn-save { display:flex; align-items:center; gap:6px; color:white; border:none; border-radius:8px; padding:0 22px; height:40px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; transition:opacity 0.2s; &.pri-alta { background:linear-gradient(135deg,#ef4444,#dc2626); } &.pri-media { background:linear-gradient(135deg,#f59e0b,#d97706); } &.pri-baixa { background:linear-gradient(135deg,#22c55e,#16a34a); } &:hover { opacity:0.9; } &:disabled { opacity:0.6; cursor:not-allowed; } mat-icon { font-size:18px; width:18px; height:18px; } }
  `]
})
export class TarefaFormComponent implements OnInit {
  item: Partial<Tarefa> = { status: 'pendente', prioridade: 'media' };
  embarques = signal<Embarque[]>([]);
  veiculos  = signal<Veiculo[]>([]);
  saving = signal(false);

  constructor(
    private dialogRef: MatDialogRef<TarefaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Tarefa | null,
    private api: ApiService,
    private snackBar: MatSnackBar
  ) {
    if (data) this.item = { ...data };
  }

  ngOnInit() {
    this.api.get<Embarque[]>('embarques').subscribe(e => this.embarques.set(e));
    this.api.get<Veiculo[]>('veiculos').subscribe(v => this.veiculos.set(v));
  }

  save() {
    if (!this.item.titulo) {
      this.snackBar.open('Título é obrigatório', 'OK', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    const obs = this.data
      ? this.api.put<Tarefa>('tarefas', this.data.id_tarefa!, this.item)
      : this.api.post<Tarefa>('tarefas', this.item);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: e => { this.saving.set(false); this.snackBar.open(e.error?.error || 'Erro ao salvar', 'OK', { duration: 3000 }); }
    });
  }
}
