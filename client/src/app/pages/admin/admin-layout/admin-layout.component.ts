import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="mobile-header">
      <div class="mobile-header-logo">Панель</div>
      <button class="burger" [class.open]="sidebarOpen()" (click)="toggleSidebar()">
        <span></span><span></span><span></span>
      </button>
    </div>

    <div class="admin-layout">
      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="sidebar-logo">Панель</div>

        <nav class="sidebar-nav">
          <a routerLink="/admin/orders" routerLinkActive="active" class="sidebar-link" (click)="closeSidebar()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h6"/></svg>
            Заказы
            @if (orderCount() > 0) {
              <span class="sidebar-badge">{{ orderCount() }}</span>
            }
          </a>
          <a routerLink="/admin/requests" routerLinkActive="active" class="sidebar-link" (click)="closeSidebar()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Заявки
            @if (requestCount() > 0) {
              <span class="sidebar-badge">{{ requestCount() }}</span>
            }
          </a>
          <a routerLink="/admin/clients" routerLinkActive="active" class="sidebar-link" (click)="closeSidebar()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            Клиенты
          </a>
          <a routerLink="/admin/gallery" routerLinkActive="active" class="sidebar-link" (click)="closeSidebar()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            Галерея
          </a>
          <a routerLink="/admin/reports" routerLinkActive="active" class="sidebar-link" (click)="closeSidebar()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Отчёты
          </a>
        </nav>

        <div class="sidebar-section">
          <div class="sidebar-section-title">Быстрые действия</div>
          <nav class="sidebar-nav">
            <a routerLink="/admin/orders" fragment="new" class="sidebar-link" (click)="closeSidebar()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
              Новый заказ
            </a>
            <a routerLink="/admin/gallery" fragment="upload" class="sidebar-link" (click)="closeSidebar()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              Загрузить фото
            </a>
          </nav>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-section-title">Сайт</div>
          <nav class="sidebar-nav">
            <a href="/" target="_blank" class="sidebar-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
              Открыть сайт
            </a>
          </nav>
        </div>
      </aside>

      @if (sidebarOpen()) {
        <div class="sidebar-overlay" (click)="closeSidebar()"></div>
      }

      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--bg);
    }

    .admin-layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      min-height: 100vh;
    }

    .sidebar {
      background: var(--bg);
      border-right: 1px solid var(--border-soft);
      padding: var(--space-6);
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }
    .sidebar-logo {
      font-family: var(--font-display);
      font-size: 13px;
      letter-spacing: 1.17px;
      text-transform: uppercase;
      margin-bottom: var(--space-8);
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-sm);
      color: var(--muted);
      font-size: 14px;
      transition: all 0.15s ease;
      text-decoration: none;
    }
    .sidebar-link:hover {
      background: var(--border-soft);
      color: var(--fg);
    }
    .sidebar-link.active {
      background: var(--border-soft);
      color: var(--fg);
    }
    .sidebar-link svg {
      width: 18px;
      height: 18px;
      opacity: 0.7;
      flex-shrink: 0;
    }
    .sidebar-link.active svg {
      opacity: 1;
    }
    .sidebar-badge {
      margin-left: auto;
      padding: 2px 8px;
      background: var(--status-new);
      color: var(--bg);
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      border-radius: 999px;
    }
    .sidebar-section {
      margin-top: var(--space-8);
      padding-top: var(--space-6);
      border-top: 1px solid var(--border-soft);
    }
    .sidebar-section-title {
      font-size: var(--text-xs);
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: var(--space-4);
    }

    .main-content {
      padding: var(--space-6);
      overflow-x: hidden;
      min-width: 0;
    }

    .mobile-header {
      display: none;
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-soft);
      padding: var(--space-4) var(--space-5);
      align-items: center;
      justify-content: space-between;
    }
    .mobile-header-logo {
      font-family: var(--font-display);
      font-size: 13px;
      letter-spacing: 1.17px;
      text-transform: uppercase;
      color: var(--fg);
    }

    .burger {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 32px;
      height: 32px;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
    }
    .burger span {
      display: block;
      width: 100%;
      height: 2px;
      background: var(--fg);
      border-radius: 1px;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    .burger.open span:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }
    .burger.open span:nth-child(2) {
      opacity: 0;
    }
    .burger.open span:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }

    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 90;
    }

    @media (max-width: 1024px) {
      .admin-layout {
        grid-template-columns: 1fr;
      }
      .sidebar {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        width: 260px;
        z-index: 100;
        border-right: 1px solid var(--border-soft);
      }
      .sidebar.open {
        display: block;
      }
      .mobile-header {
        display: flex;
      }
      .sidebar-overlay {
        display: block;
      }
    }
  `],
})
export class AdminLayoutComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  sidebarOpen = signal(false);
  orderCount = signal(0);
  requestCount = signal(0);

  ngOnInit(): void {
    this.loadBadgeCounts();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  private loadBadgeCounts(): void {
    this.api.getOrderStats().subscribe({
      next: (stats) => {
        this.orderCount.set(stats.new || 0);
      },
      error: () => {},
    });
    this.api.getRequests({ status: 'new' }).subscribe({
      next: (requests) => {
        this.requestCount.set(requests.length);
      },
      error: () => {},
    });
  }
}
