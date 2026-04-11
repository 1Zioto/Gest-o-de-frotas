import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p class="subtitle">Visão geral da frota</p>
      </div>
      <div class="header-date">
        <mat-icon>calendar_today</mat-icon>
        <span>{{ today }}</span>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card" *ngFor="let s of stats" [style.--accent]="s.color" [style.--bg]="s.bg">
        <div class="stat-icon"><mat-icon>{{ s.icon }}</mat-icon></div>
        <div class="stat-body">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <div class="quick-links">
      <h2>Acesso Rápido</h2>
      <div class="links-grid">
        <a class="quick-link" *ngFor="let l of quickLinks" [routerLink]="l.route">
          <div class="ql-icon" [style.background]="l.color">
            <mat-icon>{{ l.icon }}</mat-icon>
          </div>
          <span>{{ l.label }}</span>
          <mat-icon class="ql-arrow">chevron_right</mat-icon>
        </a>
      </div>
    </div>
  `,
  styles: [` 
    .page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:12px}
    h1{font-size:24px;font-weight:800;color:#0f172a;margin:0 0 4px}
    .subtitle{color:#64748b;font-size:14px;margin:0}
    .header-date{display:flex;align-items:center;gap:8px;background:white;padding:10px 16px;border-radius:10px;border:1px solid #e2e8f0;color:#475569;font-size:14px;font-weight:500}
    .header-date mat-icon{font-size:18px;width:18px;height:18px;color:#3b82f6}
    .stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:28px}
    .stat-card{background:white;border-radius:16px;padding:20px;display:flex;align-items:center;gap:16px;border:1px solid #e2e8f0;border-left:4px solid var(--accent);transition:box-shadow .2s,transform .2s}
    .stat-card:hover{box-shadow:0 8px 24px rgba(0,0,0,.08);transform:translateY(-2px)}
    .stat-icon{width:44px;height:44px;border-radius:12px;background:var(--bg);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .stat-icon mat-icon{color:var(--accent);font-size:22px;width:22px;height:22px}
    .stat-value{font-size:26px;font-weight:800;color:#0f172a;line-height:1}
    .stat-label{font-size:12px;color:#64748b;margin-top:4px;font-weight:500}
    h2{font-size:17px;font-weight:700;color:#0f172a;margin:0 0 16px}
    .links-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
    .quick-link{display:flex;align-items:center;gap:12px;background:white;padding:14px 16px;border-radius:12px;border:1px solid #e2e8f0;text-decoration:none;color:#1e293b;font-size:14px;font-weight:500;transition:all .2s}
    .quick-link:hover{border-color:#3b82f6;box-shadow:0 4px 12px rgba(59,130,246,.12)}
    .ql-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .ql-icon mat-icon{color:white;font-size:18px;width:18px;height:18px}
    .ql-arrow{color:#cbd5e1;font-size:18px;width:18px;height:18px;margin-left:auto}
  `]
})
export class DashboardComponent {
  today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  stats = [
    { label: 'Veículos Ativos', value: '0', icon: 'directions_car', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Motoristas', value: '0', icon: 'person', color: '#10b981', bg: '#f0fdf4' },
    { label: 'Abastecimentos', value: '0', icon: 'local_gas_station', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Manutenções', value: '0', icon: 'build', color: '#ef4444', bg: '#fef2f2' },
    { label: 'Inspeções', value: '0', icon: 'fact_check', color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Multas', value: '0', icon: 'gavel', color: '#ec4899', bg: '#fdf4ff' },
  ];
  quickLinks = [
    { label: 'Transportes', icon: 'local_shipping', route: '/transportes', color: '#3b82f6' },
    { label: 'Abastecimentos', icon: 'local_gas_station', route: '/abastecimentos', color: '#f59e0b' },
    { label: 'Manutenções', icon: 'build', route: '/manutencoes', color: '#ef4444' },
    { label: 'Inspeções', icon: 'fact_check', route: '/inspecoes', color: '#8b5cf6' },
    { label: 'Veículos', icon: 'directions_car', route: '/veiculos', color: '#10b981' },
    { label: 'Motoristas', icon: 'person', route: '/motoristas', color: '#06b6d4' },
  ];
}
