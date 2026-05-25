import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [DatePipe],
  template: `
    <header class="page-header">
      <h1>Заявки</h1>
    </header>

    <div class="tabs">
      @for (tab of tabs; track tab.key) {
        <button
          class="tab"
          [class.active]="activeTab() === tab.key"
          (click)="setTab(tab.key)"
        >{{ tab.label }}</button>
      }
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Имя</th>
            <th>Телефон</th>
            <th>Тип услуги</th>
            <th>Описание</th>
            <th>Статус</th>
            <th>Дата</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (req of filteredRequests(); track req.id) {
            <tr (click)="openDetail(req)">
              <td class="req-name">{{ req.name }}</td>
              <td class="req-phone">{{ req.phone }}</td>
              <td>{{ getServiceName(req.serviceType) }}</td>
              <td class="req-desc">{{ truncate(req.description, 50) }}</td>
              <td><span class="status-badge" [class]="getStatusClass(req.status)">{{ getStatusLabel(req.status) }}</span></td>
              <td class="date">{{ req.createdAt | date: 'dd.MM.yy' }}</td>
              <td>
                <div class="row-actions">
                  <button class="row-action" title="Просмотреть" (click)="openDetail(req); $event.stopPropagation()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  @if (req.status !== 'converted') {
                    <button class="row-action" title="Конвертировать в заказ" (click)="convertToOrder(req); $event.stopPropagation()">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6M9 15l3 3 3-3"/></svg>
                    </button>
                  }
                  <button class="row-action" title="Удалить" (click)="deleteRequest(req); $event.stopPropagation()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="7">
                <div class="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  <h3>Нет заявок</h3>
                  <p>Заявки с сайта появятся здесь</p>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <div class="overlay" [class.open]="detailOpen()" (click)="closeDetail()"></div>

    <div class="detail-panel" [class.open]="detailOpen()">
      @if (selectedRequest(); as req) {
        <div class="detail-panel-header">
          <h2>Заявка</h2>
          <button class="detail-panel-close" (click)="closeDetail()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="detail-panel-content">
          <div class="detail-section">
            <div class="detail-section-title">Контактные данные</div>
            <div class="detail-row">
              <span class="detail-row-label">Имя</span>
              <span class="detail-row-value">{{ req.name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-row-label">Телефон</span>
              <span class="detail-row-value">{{ req.phone }}</span>
            </div>
            @if (req.email) {
              <div class="detail-row">
                <span class="detail-row-label">E-mail</span>
                <span class="detail-row-value">{{ req.email }}</span>
              </div>
            }
          </div>

          <div class="detail-section">
            <div class="detail-section-title">Детали заявки</div>
            <div class="detail-row">
              <span class="detail-row-label">Тип услуги</span>
              <span class="detail-row-value">{{ getServiceName(req.serviceType) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-row-label">Дата</span>
              <span class="detail-row-value">{{ req.createdAt | date: 'd MMMM yyyy' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-row-label">Статус</span>
              <span class="detail-row-value">
                <span class="status-badge" [class]="getStatusClass(req.status)">{{ getStatusLabel(req.status) }}</span>
              </span>
            </div>
          </div>

          @if (req.description) {
            <div class="detail-section">
              <div class="detail-section-title">Описание</div>
              <p class="detail-description">{{ req.description }}</p>
            </div>
          }
        </div>
        <div class="detail-panel-footer">
          @if (req.status !== 'converted') {
            <button class="btn-ghost btn-primary" (click)="convertToOrder(req)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Конвертировать в заказ
            </button>
          }
          <button class="btn-ghost" (click)="closeDetail()">
            Закрыть
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
      flex-wrap: wrap;
      gap: var(--space-4);
    }
    .page-header h1 {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      text-transform: uppercase;
      letter-spacing: 0.02em;
      line-height: 1;
      margin: 0;
    }

    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: var(--border-soft);
      border: 1px solid var(--border);
      border-radius: var(--radius-pill);
      color: var(--fg);
      font-size: var(--text-sm);
      letter-spacing: 1px;
      text-transform: uppercase;
      transition: all 0.2s ease;
      cursor: pointer;
      font-family: inherit;
    }
    .btn-ghost:hover { background: rgba(240, 240, 250, 0.2); }
    .btn-ghost svg { width: 16px; height: 16px; }
    .btn-ghost.btn-primary {
      background: var(--fg);
      border-color: var(--fg);
      color: var(--bg);
    }
    .btn-ghost.btn-primary:hover { background: var(--accent-hover); }

    .tabs {
      display: flex;
      gap: var(--space-1);
      margin-bottom: var(--space-5);
      border-bottom: 1px solid var(--border-soft);
      padding-bottom: var(--space-3);
      overflow-x: auto;
    }
    .tab {
      padding: var(--space-2) var(--space-4);
      color: var(--muted);
      font-size: var(--text-sm);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      white-space: nowrap;
      transition: color 0.15s ease;
      background: none;
      border: none;
      cursor: pointer;
      font-family: inherit;
    }
    .tab:hover { color: var(--fg); }
    .tab.active {
      color: var(--fg);
      border-bottom: 2px solid var(--fg);
      margin-bottom: -13px;
      padding-bottom: 11px;
    }

    .table-container { overflow-x: auto; }
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table th,
    .data-table td {
      padding: var(--space-4);
      text-align: left;
      border-bottom: 1px solid var(--border-soft);
    }
    .data-table th {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--muted);
      font-weight: 400;
      white-space: nowrap;
    }
    .data-table tbody tr {
      transition: background 0.15s ease;
      cursor: pointer;
    }
    .data-table tbody tr:hover { background: var(--border-soft); }
    .data-table td { font-size: 14px; }

    .req-name { font-weight: 500; }
    .req-phone {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
    }
    .req-desc {
      color: var(--muted);
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: var(--text-xs);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .status-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .status-new {
      background: rgba(59, 130, 246, 0.15);
      color: var(--status-new);
    }
    .status-new::before { background: var(--status-new); }
    .status-processed {
      background: rgba(245, 158, 11, 0.15);
      color: var(--status-progress);
    }
    .status-processed::before { background: var(--status-progress); }
    .status-converted {
      background: rgba(34, 197, 94, 0.15);
      color: var(--status-done);
    }
    .status-converted::before { background: var(--status-done); }

    .date {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--muted);
    }

    .row-actions { display: flex; gap: var(--space-2); }
    .row-action {
      padding: var(--space-2);
      color: var(--muted);
      border-radius: var(--radius-sm);
      transition: all 0.15s ease;
      background: none;
      border: none;
      cursor: pointer;
    }
    .row-action:hover {
      background: var(--border-soft);
      color: var(--fg);
    }
    .row-action svg { width: 16px; height: 16px; }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 150;
    }
    .overlay.open { opacity: 1; visibility: visible; }

    .detail-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 480px;
      max-width: 100vw;
      height: 100vh;
      background: var(--bg);
      border-left: 1px solid var(--border-soft);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      z-index: 200;
      display: flex;
      flex-direction: column;
    }
    .detail-panel.open { transform: translateX(0); }
    .detail-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-5);
      border-bottom: 1px solid var(--border-soft);
    }
    .detail-panel-header h2 {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      text-transform: uppercase;
      letter-spacing: 0.02em;
      line-height: 1;
      margin: 0;
    }
    .detail-panel-close {
      padding: var(--space-2);
      color: var(--muted);
      background: none;
      border: none;
      cursor: pointer;
    }
    .detail-panel-close:hover { color: var(--fg); }
    .detail-panel-close svg { width: 20px; height: 20px; }
    .detail-panel-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-5);
    }
    .detail-section { margin-bottom: var(--space-6); }
    .detail-section-title {
      font-size: var(--text-xs);
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: var(--space-4);
      padding-bottom: var(--space-2);
      border-bottom: 1px solid var(--border-soft);
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--space-3);
      font-size: 14px;
    }
    .detail-row-label { color: var(--muted); }
    .detail-row-value { text-align: right; }
    .detail-description {
      font-size: 14px;
      color: var(--muted);
      line-height: 1.6;
      margin: 0;
    }
    .detail-panel-footer {
      padding: var(--space-5);
      border-top: 1px solid var(--border-soft);
      display: flex;
      gap: var(--space-3);
    }
    .detail-panel-footer .btn-ghost {
      flex: 1;
      justify-content: center;
    }

    .empty-state {
      text-align: center;
      padding: var(--space-8) var(--space-4);
      color: var(--muted);
    }
    .empty-state svg {
      width: 48px;
      height: 48px;
      margin: 0 auto var(--space-4);
      opacity: 0.5;
      display: block;
    }
    .empty-state h3 {
      font-family: var(--font-display);
      font-size: var(--text-base);
      margin: 0 0 var(--space-2);
      color: var(--fg);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .empty-state p { margin: 0; }
  `],
})
export class RequestsComponent implements OnInit {
  private api = inject(ApiService);

  requests = signal<any[]>([]);
  activeTab = signal('all');
  detailOpen = signal(false);
  selectedRequest = signal<any | null>(null);

  tabs = [
    { key: 'all', label: 'Все' },
    { key: 'new', label: 'Новые' },
    { key: 'processed', label: 'Обработанные' },
    { key: 'converted', label: 'Конвертированные' },
  ];

  private serviceMap: Record<string, string> = {
    gates: 'Ворота',
    stairs: 'Лестница',
    canopy: 'Навес',
    fence: 'Ограждение',
    frame: 'Каркас',
    other: 'Другое',
  };

  filteredRequests = computed(() => {
    const tab = this.activeTab();
    const list = this.requests();
    if (tab === 'all') return list;
    return list.filter(r => r.status === tab);
  });

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.api.getRequests().subscribe({
      next: (data) => this.requests.set(data),
      error: () => {},
    });
  }

  setTab(key: string): void {
    this.activeTab.set(key);
  }

  getServiceName(type: string): string {
    return this.serviceMap[type] || type || 'Другое';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      new: 'Новая',
      processed: 'Обработана',
      converted: 'Конвертирована',
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      new: 'status-new',
      processed: 'status-processed',
      converted: 'status-converted',
    };
    return map[status] || 'status-new';
  }

  truncate(text: string | undefined, max: number): string {
    if (!text) return '\u2014';
    return text.length > max ? text.substring(0, max) + '...' : text;
  }

  openDetail(req: any): void {
    this.selectedRequest.set(req);
    this.detailOpen.set(true);
  }

  closeDetail(): void {
    this.detailOpen.set(false);
  }

  convertToOrder(req: any): void {
    this.api.convertRequest(req.id).subscribe({
      next: () => {
        this.loadRequests();
        this.closeDetail();
      },
      error: () => {},
    });
  }

  deleteRequest(req: any): void {
    if (confirm('Удалить заявку?')) {
      this.api.deleteRequest(req.id).subscribe({
        next: () => this.loadRequests(),
        error: () => {},
      });
    }
  }
}
