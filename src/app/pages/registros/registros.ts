import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-registros',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="page-header">
      <div class="page-title">
        <mat-icon>history</mat-icon>
        <h1>Registros</h1>
      </div>
    </div>
    <div class="page-placeholder">
      <mat-icon>history</mat-icon>
      <p>Módulo <strong>Registros</strong> em construção.</p>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-title { display: flex; align-items: center; gap: 12px; }
    .page-title mat-icon { color: #3b82f6; font-size: 28px; width: 28px; height: 28px; }
    h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0; }
    .page-placeholder { background: white; border-radius: 16px; padding: 60px 40px; display: flex; flex-direction: column; align-items: center; gap: 16px; border: 1px solid #e2e8f0; }
    .page-placeholder mat-icon { font-size: 56px; width: 56px; height: 56px; color: #cbd5e1; }
    p { color: #64748b; font-size: 16px; margin: 0; }
    strong { color: #1e293b; }
  `]
})
export class RegistrosComponent {}
