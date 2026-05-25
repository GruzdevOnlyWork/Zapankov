import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'portfolio',
    loadComponent: () => import('./pages/portfolio/portfolio.component').then(m => m.PortfolioComponent),
  },
  {
    path: 'order',
    loadComponent: () => import('./pages/order/order.component').then(m => m.OrderComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'orders', pathMatch: 'full' },
      {
        path: 'orders',
        loadComponent: () => import('./pages/admin/orders/orders.component').then(m => m.OrdersComponent),
      },
      {
        path: 'requests',
        loadComponent: () => import('./pages/admin/requests/requests.component').then(m => m.RequestsComponent),
      },
      {
        path: 'clients',
        loadComponent: () => import('./pages/admin/clients/clients.component').then(m => m.ClientsComponent),
      },
      {
        path: 'gallery',
        loadComponent: () => import('./pages/admin/gallery/gallery.component').then(m => m.GalleryComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/admin/reports/reports.component').then(m => m.ReportsComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
