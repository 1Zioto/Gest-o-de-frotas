import { Component, signal, computed, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
}

interface NavGroup {
  label: string;
  icon: string;
  items: NavItem[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, MatIconModule, MatTooltipModule, MatRippleModule],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class LayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = signal(true);
  expandedGroups = signal<Set<string>>(new Set(['rotinas', 'gestao']));
  isMobile = signal(false);

  // PWA
  isOffline = signal(!navigator.onLine);
  canInstall = signal(false);
  private deferredPrompt: any = null;
  private onlineHandler  = () => this.isOffline.set(false);
  private offlineHandler = () => this.isOffline.set(true);
  private beforeInstallHandler = (e: any) => {
    e.preventDefault();
    this.deferredPrompt = e;
    this.canInstall.set(true);
  };

  navGroups: NavGroup[] = [
    {
      label: 'Principal',
      icon: 'home',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
      ]
    },
    {
      label: 'Rotinas Diárias',
      icon: 'today',
      items: [
        { label: 'Transportes', icon: 'local_shipping', route: '/transportes' },
        { label: 'Abastecimentos', icon: 'local_gas_station', route: '/abastecimentos' },
        { label: 'Manutenções', icon: 'build', route: '/manutencoes' },
        { label: 'Inspeções', icon: 'fact_check', route: '/inspecoes' },
        { label: 'Multas', icon: 'gavel', route: '/multas' },
        { label: 'Despesas', icon: 'receipt_long', route: '/despesas' },
        { label: 'Registros', icon: 'history', route: '/registros' },
      ]
    },
    {
      label: 'Gestão',
      icon: 'manage_accounts',
      items: [
        { label: 'Veículos', icon: 'directions_car', route: '/veiculos' },
        { label: 'Carretas', icon: 'fire_truck', route: '/carretas' },
        { label: 'Motoristas', icon: 'person', route: '/motoristas' },
        { label: 'Proprietários', icon: 'business', route: '/proprietarios' },
        { label: 'Pneus', icon: 'tire_repair', route: '/pneus' },
        { label: 'Oficinas', icon: 'home_repair_service', route: '/oficinas' },
        { label: 'Valores Combustível', icon: 'price_change', route: '/valores-combustivel' },
      ]
    },
    {
      label: 'Operacional',
      icon: 'inventory_2',
      items: [
        { label: 'Embarques',  icon: 'inventory_2',  route: '/embarques' },
        { label: 'CT-es',      icon: 'description',  route: '/ctes' },
        { label: 'Tarefas',    icon: 'task_alt',     route: '/tarefas' },
        { label: 'Rastreio',   icon: 'location_on',  route: '/rastreio' },
      ]
    },
    {
      label: 'Configurações',
      icon: 'settings',
      items: [
        { label: 'Usuários', icon: 'group', route: '/usuarios' },
      ]
    }
  ];

  constructor(private authService: AuthService) {
    this.checkMobile();
  }

  ngOnInit() {
    window.addEventListener('online',  this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    window.addEventListener('beforeinstallprompt', this.beforeInstallHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('online',  this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
    window.removeEventListener('beforeinstallprompt', this.beforeInstallHandler);
  }

  async installPwa() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') this.canInstall.set(false);
    this.deferredPrompt = null;
  }

  @HostListener('window:resize')
  checkMobile() {
    this.isMobile.set(window.innerWidth < 768);
    if (this.isMobile()) {
      this.sidebarOpen.set(false);
    }
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebarOnMobile() {
    if (this.isMobile()) {
      this.sidebarOpen.set(false);
    }
  }

  toggleGroup(label: string) {
    this.expandedGroups.update(groups => {
      const newGroups = new Set(groups);
      if (newGroups.has(label)) {
        newGroups.delete(label);
      } else {
        newGroups.add(label);
      }
      return newGroups;
    });
  }

  isGroupExpanded(label: string): boolean {
    return this.expandedGroups().has(label);
  }

  groupKey(label: string): string {
    return label.toLowerCase().replace(/\s+/g, '');
  }

  get user() {
    return this.authService.getUser();
  }

  logout() {
    this.authService.logout();
  }
}
