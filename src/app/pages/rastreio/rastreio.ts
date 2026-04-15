import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-rastreio',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="page-header">
      <div class="page-title">
        <mat-icon>location_on</mat-icon>
        <h1>Rastreio</h1>
      </div>
    </div>
    <div class="page-placeholder">
      <div class="icon-wrap"><mat-icon>satellite_alt</mat-icon></div>
      <h2>Rastreamento em Tempo Real</h2>
      <p>Módulo em desenvolvimento. Em breve você poderá acompanhar a localização dos seus veículos e embarques em tempo real.</p>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-title { display: flex; align-items: center; gap: 12px; }
    .page-title mat-icon { color: #10b981; font-size: 28px; width: 28px; height: 28px; }
    h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0; }
    .page-placeholder {
      background: white; border-radius: 16px; padding: 80px 40px;
      display: flex; flex-direction: column; align-items: center; gap: 16px;
      border: 1px solid #e2e8f0; text-align: center;
    }
    .icon-wrap {
      width: 80px; height: 80px; border-radius: 50%;
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 42px; width: 42px; height: 42px; color: #059669; }
    }
    h2 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
    p { color: #64748b; font-size: 15px; margin: 0; max-width: 400px; line-height: 1.6; }
  `]
})
export class RastreioComponent {}
