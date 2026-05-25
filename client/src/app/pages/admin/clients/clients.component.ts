import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    <header class="page-header">
      <h1>Клиенты</h1>
      <div class="header-actions">
        <button class="btn-ghost" (click)="toggleSearch()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          Поиск
        </button>
        <button class="btn-ghost" (click)="showAddForm()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
          Новый клиент
        </button>
      </div>
    </header>

    @if (searchOpen()) {
      <div class="search-bar">
        <input
          type="text"
          class="form-input search-input"
          placeholder="Поиск по клиентам..."
          [value]="searchQuery()"
          (input)="onSearch($event)"
        />
      </div>
    }

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Имя</th>
            <th>Телефон</th>
            <th>Email</th>
            <th>Заказов</th>
            <th>Сумма заказов</th>
            <th>Дата регистрации</th>
          </tr>
        </thead>
        <tbody>
          @for (client of filteredClients(); track client.id) {
            <tr (click)="openDetail(client)">
              <td class="client-name">{{ client.name }}</td>
              <td class="client-phone">{{ client.phone }}</td>
              <td class="client-email">{{ client.email || '\u2014' }}</td>
              <td class="client-count">{{ client.ordersCount || 0 }}</td>
              <td class="amount">{{ client.totalAmount ? (client.totalAmount | number: '1.0-0') : '\u2014' }}</td>
              <td class="date">{{ client.createdAt | date: 'dd.MM.yy' }}</td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6">
                <div class="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  <h3>Нет клиентов</h3>
                  <p>Клиенты появятся здесь</p>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <div class="overlay" [class.open]="detailOpen()" (click)="closeDetail()"></div>

    <div class="detail-panel" [class.open]="detailOpen()">
      @if (selectedClient(); as client) {
        <div class="detail-panel-header">
          <h2>{{ editing() ? 'Редактировать' : client.name }}</h2>
          <button class="detail-panel-close" (click)="closeDetail()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="detail-panel-content">
          @if (editing()) {
            <div class="detail-section">
              <div class="detail-section-title">Данные клиента</div>
              <div class="form-group">
                <label class="form-label">Имя</label>
                <input type="text" class="form-input" [value]="editName()" (input)="editName.set(asValue($event))" />
              </div>
              <div class="form-group">
                <label class="form-label">Телефон</label>
                <input type="tel" class="form-input" [value]="editPhone()" (input)="editPhone.set(asValue($event))" />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" [value]="editEmail()" (input)="editEmail.set(asValue($event))" />
              </div>
            </div>
          } @else {
            <div class="detail-section">
              <div class="detail-section-title">Контактные данные</div>
              <div class="detail-row">
                <span class="detail-row-label">Имя</span>
                <span class="detail-row-value">{{ client.name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row-label">Телефон</span>
                <span class="detail-row-value">{{ client.phone }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row-label">E-mail</span>
                <span class="detail-row-value">{{ client.email || '\u2014' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row-label">Дата регистрации</span>
                <span class="detail-row-value">{{ client.createdAt | date: 'd MMMM yyyy' }}</span>
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-section-title">Статистика</div>
              <div class="detail-row">
                <span class="detail-row-label">Заказов</span>
                <span class="detail-row-value">{{ client.ordersCount || 0 }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row-label">Сумма заказов</span>
                <span class="detail-row-value amount">{{ client.totalAmount ? (client.totalAmount | number: '1.0-0') : '\u2014' }}</span>
              </div>
            </div>

            @if (clientOrders().length > 0) {
              <div class="detail-section">
                <div class="detail-section-title">История заказов</div>
                @for (order of clientOrders(); track order.id) {
                  <div class="order-history-item">
                    <div class="order-history-top">
                      <span class="order-id">ORD-{{ order.id }}</span>
                      <span class="date">{{ order.createdAt | date: 'dd.MM.yy' }}</span>
                    </div>
                    <div class="order-history-bottom">
                      <span>{{ order.type }}</span>
                      <span class="amount">{{ order.totalCost ? (order.totalCost | number: '1.0-0') : '\u2014' }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          }
        </div>
        <div class="detail-panel-footer">
          @if (editing()) {
            <button class="btn-ghost btn-primary" (click)="saveClient()">Сохранить</button>
            <button class="btn-ghost" (click)="cancelEdit()">Отмена</button>
          } @else {
            <button class="btn-ghost" (click)="startEdit(client)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Редактировать
            </button>
          }
        </div>
      }

      @if (addingNew()) {
        <div class="detail-panel-header">
          <h2>Новый клиент</h2>
          <button class="detail-panel-close" (click)="closeDetail()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="detail-panel-content">
          <div class="detail-section">
            <div class="detail-section-title">Данные клиента</div>
            <div class="form-group">
              <label class="form-label">Имя</label>
              <input type="text" class="form-input" [value]="editName()" (input)="editName.set(asValue($event))" />
            </div>
            <div class="form-group">
              <label class="form-label">Телефон</label>
              <input type="tel" class="form-input" [value]="editPhone()" (input)="editPhone.set(asValue($event))" />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" [value]="editEmail()" (input)="editEmail.set(asValue($event))" />
            </div>
          </div>
        </div>
        <div class="detail-panel-footer">
          <button class="btn-ghost btn-primary" (click)="createClient()">Создать</button>
          <button class="btn-ghost" (click)="closeDetail()">Отмена</button>
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
    .header-actions {
      display: flex;
      gap: var(--space-3);
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

    .search-bar { margin-bottom: var(--space-5); }
    .form-input {
      width: 100%;
      padding: var(--space-3) var(--space-4);
      background: var(--border-soft);
      border: 1px solid var(--border-soft);
      color: var(--fg);
      font-family: var(--font-body);
      font-size: 14px;
      transition: border-color 0.15s ease;
    }
    .form-input:focus {
      outline: none;
      border-color: var(--border);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }
    .form-label {
      font-size: var(--text-sm);
      color: var(--muted);
      letter-spacing: 0.5px;
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

    .client-name { font-weight: 500; }
    .client-phone {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
    }
    .client-email { color: var(--muted); }
    .client-count {
      font-family: var(--font-mono);
      text-align: center;
    }
    .amount {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
    }
    .date {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--muted);
    }

    .order-history-item {
      padding: var(--space-3);
      border: 1px solid var(--border-soft);
      margin-bottom: var(--space-2);
    }
    .order-history-top, .order-history-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .order-history-top { margin-bottom: var(--space-1); }
    .order-id {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--muted);
    }

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
export class ClientsComponent implements OnInit {
  private api = inject(ApiService);

  clients = signal<any[]>([]);
  searchOpen = signal(false);
  searchQuery = signal('');
  detailOpen = signal(false);
  selectedClient = signal<any | null>(null);
  clientOrders = signal<any[]>([]);
  editing = signal(false);
  addingNew = signal(false);

  editName = signal('');
  editPhone = signal('');
  editEmail = signal('');

  filteredClients = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.clients();
    return this.clients().filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.api.getClients().subscribe({
      next: (data) => this.clients.set(data),
      error: () => {},
    });
  }

  toggleSearch(): void {
    this.searchOpen.update(v => !v);
    if (!this.searchOpen()) this.searchQuery.set('');
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  openDetail(client: any): void {
    this.selectedClient.set(client);
    this.addingNew.set(false);
    this.editing.set(false);
    this.detailOpen.set(true);
    this.loadClientOrders(client.id);
  }

  closeDetail(): void {
    this.detailOpen.set(false);
    this.editing.set(false);
    this.addingNew.set(false);
    this.selectedClient.set(null);
  }

  showAddForm(): void {
    this.selectedClient.set(null);
    this.addingNew.set(true);
    this.editing.set(false);
    this.editName.set('');
    this.editPhone.set('');
    this.editEmail.set('');
    this.detailOpen.set(true);
  }

  startEdit(client: any): void {
    this.editName.set(client.name || '');
    this.editPhone.set(client.phone || '');
    this.editEmail.set(client.email || '');
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  saveClient(): void {
    const client = this.selectedClient();
    if (!client) return;
    this.api.updateClient(client.id, {
      name: this.editName(),
      phone: this.editPhone(),
      email: this.editEmail(),
    }).subscribe({
      next: (updated) => {
        this.editing.set(false);
        this.selectedClient.set(updated);
        this.loadClients();
      },
      error: () => {},
    });
  }

  createClient(): void {
    this.api.createClient({
      name: this.editName(),
      phone: this.editPhone(),
      email: this.editEmail(),
    }).subscribe({
      next: () => {
        this.closeDetail();
        this.loadClients();
      },
      error: () => {},
    });
  }

  asValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  private loadClientOrders(clientId: number): void {
    this.api.getOrders().subscribe({
      next: (orders) => {
        this.clientOrders.set(orders.filter((o: any) => o.clientId === clientId));
      },
      error: () => this.clientOrders.set([]),
    });
  }
}
