import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'veiculos', loadComponent: () => import('./pages/veiculos/veiculos').then(m => m.VeiculosComponent) },
      { path: 'motoristas', loadComponent: () => import('./pages/motoristas/motoristas').then(m => m.MotoristasComponent) },
      { path: 'abastecimentos', loadComponent: () => import('./pages/abastecimentos/abastecimentos').then(m => m.AbastecimentosComponent) },
      { path: 'manutencoes', loadComponent: () => import('./pages/manutencoes/manutencoes').then(m => m.ManutencoesComponent) },
      { path: 'inspecoes', loadComponent: () => import('./pages/inspecoes/inspecoes').then(m => m.InspecoesComponent) },
      { path: 'multas', loadComponent: () => import('./pages/multas/multas').then(m => m.MultasComponent) },
      { path: 'proprietarios', loadComponent: () => import('./pages/proprietarios/proprietarios').then(m => m.ProprietariosComponent) },
      { path: 'usuarios', loadComponent: () => import('./pages/usuarios/usuarios').then(m => m.UsuariosComponent) },
      { path: 'carretas', loadComponent: () => import('./pages/carretas/carretas').then(m => m.CarretasComponent) },
      { path: 'oficinas', loadComponent: () => import('./pages/oficinas/oficinas').then(m => m.OficinasComponent) },
      { path: 'pneus', loadComponent: () => import('./pages/pneus/pneus').then(m => m.PneusComponent) },
      { path: 'transportes', loadComponent: () => import('./pages/transportes/transportes').then(m => m.TransportesComponent) },
      { path: 'despesas', loadComponent: () => import('./pages/despesas/despesas').then(m => m.DespesasComponent) },
      { path: 'registros', loadComponent: () => import('./pages/registros/registros').then(m => m.RegistrosComponent) },
      { path: 'valores-combustivel', loadComponent: () => import('./pages/valores/valores').then(m => m.ValoresComponent) },
      { path: 'embarques', loadComponent: () => import('./pages/embarques/embarques').then(m => m.EmbarquesComponent) },
      { path: 'containers', loadComponent: () => import('./pages/containers/containers').then(m => m.ContainersComponent) },
      { path: 'ctes', loadComponent: () => import('./pages/ctes/ctes').then(m => m.CtesComponent) },
      { path: 'tarefas', loadComponent: () => import('./pages/tarefas/tarefas').then(m => m.TarefasComponent) },
      { path: 'rastreio', loadComponent: () => import('./pages/rastreio/rastreio').then(m => m.RastreioComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
